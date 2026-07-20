import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@klipai/db";
import {
  createTemplateSchema,
  templateQuerySchema,
  type CreateTemplateInput,
  type TemplateQuery,
  type TemplateShot,
} from "@klipai/core/schemas/template";
import { z } from "zod";
import { captureError } from "@/lib/error-capture";

/**
 * Calculate total credits cost from template shots
 * Uses pricing formula from @klipai/ai pricing.ts
 */
function calculateCreditsFromShots(shots: TemplateShot[]): number {
  const GenerationType = {
    TEXT_TO_VIDEO: "text-to-video",
    IMAGE_TO_VIDEO: "image-to-video",
    VIDEO_TO_VIDEO: "video-to-video",
    TEXT_TO_IMAGE: "text-to-image",
    IMAGE_TO_IMAGE: "image-to-image",
    MOTION_CONTROL: "motion-control",
  } as const;

  // Provider multipliers (relative to base)
  const PROVIDER_MULTIPLIERS: Record<string, number> = {
    "text-to-video": 1.0,
    "image-to-video": 1.2,
    "video-to-video": 1.5,
    "text-to-image": 0.5,
    "image-to-image": 0.6,
    "motion-control": 1.1,
  };

  // Resolution multipliers
  const RESOLUTION_MULTIPLIERS: Record<string, number> = {
    "720p": 1.0,
    "1080p": 1.5,
    "4k": 2.5,
  };

  const BASE_COST_PER_SHOT = 1;
  const RETRY_BUFFER_PERCENTAGE = 0.2;

  let totalCredits = 0;

  for (const shot of shots) {
    // Normalize generation type to lowercase string
    const genTypeString =
      GenerationType[shot.generationType as keyof typeof GenerationType] ||
      "text-to-video";

    const generationMultiplier = PROVIDER_MULTIPLIERS[genTypeString] || 1.0;
    const resolutionMultiplier = RESOLUTION_MULTIPLIERS[shot.resolution] || 1.0;

    const perShotCost =
      BASE_COST_PER_SHOT * generationMultiplier * resolutionMultiplier;
    const baseCost = Math.ceil(perShotCost);
    const retryBuffer = Math.ceil(baseCost * RETRY_BUFFER_PERCENTAGE);
    totalCredits += baseCost + retryBuffer;
  }

  return Math.max(1, totalCredits); // Minimum 1 credit
}

// GET /api/templates - List templates with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = templateQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      category: searchParams.get("category"),
      format: searchParams.get("format"),
      style: searchParams.get("style"),
      industry: searchParams.get("industry"),
      tags: searchParams.get("tags"),
      search: searchParams.get("search"),
      sortBy: searchParams.get("sortBy"),
      isOfficial: searchParams.get("isOfficial"),
    });

    const where: Record<string, unknown> = {
      isPublished: true,
    };

    if (query.category) where.category = query.category;
    if (query.format) where.format = query.format;
    if (query.style) where.style = query.style;
    if (query.industry) where.industry = query.industry;
    if (query.isOfficial !== undefined) where.isOfficial = query.isOfficial;
    if (query.tags) {
      where.tags = {
        hasSome: query.tags.split(",").map((t: string) => t.trim()),
      };
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { tags: { hasSome: [query.search] } },
      ];
    }

    // Sorting
    const orderBy: Record<string, string> = {};
    switch (query.sortBy) {
      case "newest":
        orderBy.createdAt = "desc";
        break;
      case "oldest":
        orderBy.createdAt = "asc";
        break;
      case "popular":
        orderBy.usageCount = "desc";
        break;
      case "rating":
        orderBy.rating = "desc";
        break;
      case "duration":
        orderBy.totalDuration = "asc";
        break;
      default:
        orderBy.createdAt = "desc";
    }

    const [templates, total] = await Promise.all([
      prisma.storyboardTemplate.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          shots: {
            orderBy: { index: "asc" },
            select: {
              id: true,
              index: true,
              timeRange: true,
              duration: true,
              description: true,
              prompt: true,
              camera: true,
              lighting: true,
              generationType: true,
              resolution: true,
              fps: true,
              cameraMotion: true,
              previewUrl: true,
            },
          },
        },
      }),
      prisma.storyboardTemplate.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: templates,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    captureError("GET /api/templates", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: error.errors[0].message },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch templates" },
      },
      { status: 500 },
    );
  }
}

// POST /api/templates - Create new template (ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 },
      );
    }

    // Check admin role
    if (sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Admin access required" },
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const input = createTemplateSchema.parse(body) as CreateTemplateInput;

    // Check slug uniqueness
    const existing = await prisma.storyboardTemplate.findUnique({
      where: { slug: input.slug },
    });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "CONFLICT", message: "Template slug already exists" },
        },
        { status: 409 },
      );
    }

    // Calculate credits cost from shots (auto-calculate)
    const calculatedCreditsCost = calculateCreditsFromShots(input.shots);

    // Create template with shots in transaction
    const template = await prisma.$transaction(async (tx: any) => {
      const created = await tx.storyboardTemplate.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          category: input.category,
          tags: input.tags,
          industry: input.industry,
          format: input.format,
          style: input.style,
          totalDuration: input.totalDuration,
          aspectRatio: input.aspectRatio,
          shotCount: input.shotCount,
          referenceStyleUrl: input.referenceStyleUrl,
          referenceStyleType: input.referenceStyleType,
          brandKitSlots: input.brandKitSlots,
          creditsCost: calculatedCreditsCost, // Auto-calculated from shots
          isPublished: false,
          isOfficial: true,
          authorId: sessionUser.id,
        },
      });

      // Create shots
      await Promise.all(
        input.shots.map((shot) =>
          tx.templateShot.create({
            data: {
              templateId: created.id,
              index: shot.index,
              timeRange: shot.timeRange,
              duration: shot.duration,
              description: shot.description,
              prompt: shot.prompt,
              negativePrompt: shot.negativePrompt,
              camera: shot.camera,
              lighting: shot.lighting,
              generationType: shot.generationType,
              resolution: shot.resolution,
              fps: shot.fps,
              cameraMotion: shot.cameraMotion,
              motionStrength: shot.motionStrength,
              seed: shot.seed,
              referenceImageUrl: shot.referenceImageUrl,
              referenceRole: shot.referenceRole,
              referenceWeight: shot.referenceWeight,
              brandKitOverlays: shot.brandKitOverlays,
            },
          }),
        ),
      );

      return created;
    });

    return NextResponse.json({
      success: true,
      data: { id: template.id, slug: template.slug },
    });
  } catch (error) {
    captureError("POST /api/templates", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: error.errors[0].message },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to create template" },
      },
      { status: 500 },
    );
  }
}
