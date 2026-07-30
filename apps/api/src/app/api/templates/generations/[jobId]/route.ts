import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@klipai/db/client";

// GET /api/templates/generations/[jobId] - Get job status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
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

    const { jobId } = await params;

    const job = await prisma.templateGenerationJob.findUnique({
      where: { id: jobId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
            shots: {
              orderBy: { index: "asc" },
              select: {
                id: true,
                index: true,
                timeRange: true,
                duration: true,
                description: true,
                prompt: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Generation job not found" },
        },
        { status: 404 },
      );
    }

    // Authorization: owner or admin
    if (job.userId !== sessionUser.id && sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Not authorized to view this job",
          },
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, data: job });
  } catch (error) {
    console.error("GET /api/templates/generations/[jobId] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch job status",
        },
      },
      { status: 500 },
    );
  }
}
