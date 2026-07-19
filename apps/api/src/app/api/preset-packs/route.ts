import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@klipai/db/client";
import {
  createPresetPackSchema,
  type CreatePresetPackInput,
} from "@klipai/core/schemas/template";
import { z } from "zod";

// GET /api/preset-packs - List all preset packs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isOfficial = searchParams.get("isOfficial");

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (isOfficial !== null) where.isOfficial = isOfficial === "true";

    const packs = await prisma.presetPack.findMany({
      where,
      include: {
        templates: {
          where: { isPublished: true },
          select: {
            id: true,
            name: true,
            slug: true,
            previewThumbnailUrl: true,
            creditsCost: true,
            category: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: packs });
  } catch (error) {
    console.error("GET /api/preset-packs error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch preset packs",
        },
      },
      { status: 500 },
    );
  }
}

// POST /api/preset-packs - Create preset pack (ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser?.id || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Admin access required" },
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const input = createPresetPackSchema.parse(body) as CreatePresetPackInput;

    // Check slug uniqueness
    const existing = await prisma.presetPack.findUnique({
      where: { slug: input.slug },
    });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "Preset pack slug already exists",
          },
        },
        { status: 409 },
      );
    }

    const { templateIds, ...packData } = input;

    const pack = await prisma.presetPack.create({
      data: {
        ...packData,
        templates: templateIds?.length
          ? { connect: templateIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        templates: {
          where: { isPublished: true },
          select: {
            id: true,
            name: true,
            slug: true,
            previewThumbnailUrl: true,
            creditsCost: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: pack }, { status: 201 });
  } catch (error) {
    console.error("POST /api/preset-packs error:", error);

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
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create preset pack",
        },
      },
      { status: 500 },
    );
  }
}
