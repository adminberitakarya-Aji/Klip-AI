import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@klipai/db/client";
import {
  createReviewSchema,
  reviewQuerySchema,
  type CreateReviewInput,
} from "@klipai/core/schemas/template";
import { z } from "zod";
import { captureError } from "@/lib/error-capture";

// GET /api/templates/[slug]/reviews - Get reviews for a template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const query = reviewQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      sortBy: searchParams.get("sortBy"),
    });

    // Verify template exists
    const template = await prisma.storyboardTemplate.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Template not found" },
        },
        { status: 404 },
      );
    }

    // Build orderBy
    const orderBy: Record<string, string> = {};
    switch (query.sortBy) {
      case "newest":
        orderBy.createdAt = "desc";
        break;
      case "oldest":
        orderBy.createdAt = "asc";
        break;
      case "highest":
        orderBy.rating = "desc";
        break;
      case "lowest":
        orderBy.rating = "asc";
        break;
      default:
        orderBy.createdAt = "desc";
    }

    const [reviews, total] = await Promise.all([
      prisma.templateReview.findMany({
        where: { templateId: template.id },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.templateReview.count({ where: { templateId: template.id } }),
    ]);

    // Calculate stats
    const stats = await prisma.templateReview.groupBy({
      by: ["rating"],
      where: { templateId: template.id },
      _count: { rating: true },
    });

    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    stats.forEach((s: { rating: number; _count: { rating: number } }) => {
      ratingDistribution[s.rating] = s._count.rating;
    });

    const totalReviews = stats.reduce(
      (sum: number, s: { rating: number; _count: { rating: number } }) =>
        sum + s._count.rating,
      0,
    );
    const averageRating =
      totalReviews > 0
        ? stats.reduce(
            (sum: number, s: { rating: number; _count: { rating: number } }) =>
              sum + s.rating * s._count.rating,
            0,
          ) / totalReviews
        : null;

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      stats: {
        averageRating,
        totalReviews,
        ratingDistribution,
      },
    });
  } catch (error) {
    captureError("GET /api/templates/[slug]/reviews", error);

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
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch reviews" },
      },
      { status: 500 },
    );
  }
}

// POST /api/templates/[slug]/reviews - Create a review (authenticated user)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
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

    const { slug } = await params;
    const body = await request.json();
    const input = createReviewSchema.parse(body) as CreateReviewInput;

    // Verify template exists and is published
    const template = await prisma.storyboardTemplate.findUnique({
      where: { slug },
      select: { id: true, isPublished: true },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Template not found" },
        },
        { status: 404 },
      );
    }

    if (!template.isPublished) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Template is not published" },
        },
        { status: 403 },
      );
    }

    // Check if user already reviewed this template
    const existingReview = await prisma.templateReview.findUnique({
      where: {
        userId_templateId: {
          userId: sessionUser.id,
          templateId: template.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "You have already reviewed this template",
          },
        },
        { status: 409 },
      );
    }

    // Create review
    const review = await prisma.templateReview.create({
      data: {
        userId: sessionUser.id,
        templateId: template.id,
        rating: input.rating,
        title: input.title,
        content: input.content,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // Update template rating stats
    await updateTemplateRating(template.id);

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    captureError("POST /api/templates/[slug]/reviews", error);

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
        error: { code: "INTERNAL_ERROR", message: "Failed to create review" },
      },
      { status: 500 },
    );
  }
}

async function updateTemplateRating(templateId: string) {
  const stats = await prisma.templateReview.aggregate({
    where: { templateId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.storyboardTemplate.update({
    where: { id: templateId },
    data: {
      rating: stats._avg.rating,
      reviewCount: stats._count.rating,
    },
  });
}
