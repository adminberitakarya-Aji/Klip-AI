import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@klipai/db/client";
import {
  updateTemplateSchema,
  type UpdateTemplateInput,
} from "@klipai/core/schemas/template";
import { z } from "zod";
import { captureError } from "@/lib/error-capture";

// Helper: require admin
async function requireAdmin(request: NextRequest) {
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
  return sessionUser;
}

// GET /api/templates/[slug] - Get template detail with all shots
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const template = await prisma.storyboardTemplate.findUnique({
      where: { slug },
      include: {
        shots: {
          orderBy: { index: "asc" },
        },
      },
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

    // Only published templates accessible to non-admins
    const sessionUser = await getSessionUser(request);
    const isAdmin = sessionUser?.role === "ADMIN";

    if (
      !template.isPublished &&
      !isAdmin &&
      template.authorId !== sessionUser?.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Template not published" },
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    captureError("GET /api/templates/[slug]", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch template" },
      },
      { status: 500 },
    );
  }
}

// PATCH /api/templates/[slug] - Update template (ADMIN or author)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
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

    const template = await prisma.storyboardTemplate.findUnique({
      where: { slug },
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

    // Check authorization: admin or author
    const isAdmin = sessionUser.role === "ADMIN";
    if (!isAdmin && template.authorId !== sessionUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Not authorized to update this template",
          },
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const input = updateTemplateSchema.parse(body) as UpdateTemplateInput;

    // If slug is being changed, check uniqueness
    if (input.slug && input.slug !== slug) {
      const existing = await prisma.storyboardTemplate.findUnique({
        where: { slug: input.slug },
      });
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CONFLICT",
              message: "Template slug already exists",
            },
          },
          { status: 409 },
        );
      }
    }

    // Update template
    const updated = await prisma.storyboardTemplate.update({
      where: { slug },
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
        creditsCost: input.creditsCost,
        isPublished: input.isPublished ?? undefined,
        isOfficial: isAdmin ? input.isOfficial : undefined, // Only admin can change isOfficial
        version: input.version ? { increment: 1 } : undefined,
      },
      include: {
        shots: { orderBy: { index: "asc" } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    captureError("PATCH /api/templates/[slug]", error);

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
        error: { code: "INTERNAL_ERROR", message: "Failed to update template" },
      },
      { status: 500 },
    );
  }
}

// DELETE /api/templates/[slug] - Delete template (ADMIN or author)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
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

    const template = await prisma.storyboardTemplate.findUnique({
      where: { slug },
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

    // Check authorization: admin or author
    const isAdmin = sessionUser.role === "ADMIN";
    if (!isAdmin && template.authorId !== sessionUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Not authorized to delete this template",
          },
        },
        { status: 403 },
      );
    }

    // Soft delete: unpublish instead of hard delete (preserve history)
    await prisma.storyboardTemplate.update({
      where: { slug },
      data: { isPublished: false },
    });

    return NextResponse.json({
      success: true,
      message: "Template unpublished",
    });
  } catch (error) {
    captureError("DELETE /api/templates/[slug]", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to delete template" },
      },
      { status: 500 },
    );
  }
}
