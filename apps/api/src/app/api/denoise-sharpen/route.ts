import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { upscalerService } from "@klipai/ai/services/upscaler-service";
import { DenoiseSharpenConfig } from "@klipai/ai";

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

    const body = await request.json();
    const { videoUrl, config, webhookUrl, provider, generationId } = body;

    if (!videoUrl || !config) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "videoUrl and config are required",
          },
        },
        { status: 400 },
      );
    }

    // Validate denoise config
    if (config.denoise) {
      if (config.denoise.strength < 0 || config.denoise.strength > 1) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Denoise strength must be between 0 and 1",
            },
          },
          { status: 400 },
        );
      }
    }

    // Validate sharpen config
    if (config.sharpen) {
      if (config.sharpen.strength < 0 || config.sharpen.strength > 1) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Sharpen strength must be between 0 and 1",
            },
          },
          { status: 400 },
        );
      }
      const validMethods = ["unsharp", "lanczos", "clahe", "ai"];
      if (!validMethods.includes(config.sharpen.method)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid sharpen method",
            },
          },
          { status: 400 },
        );
      }
    }

    const job = await upscalerService.denoiseSharpen({
      userId: sessionUser.id,
      generationId,
      videoUrl,
      config: config as DenoiseSharpenConfig,
      webhookUrl,
      provider,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
      },
    });
  } catch (error) {
    console.error("Denoise/Sharpen error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to start denoise/sharpen job",
        },
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("id");
    const status = searchParams.get("status");

    if (jobId) {
      const job = await upscalerService.getJobStatus(jobId);
      if (!job || job.userId !== sessionUser.id) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Job not found" },
          },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: job });
    }

    const jobs = await upscalerService.listJobs({
      userId: sessionUser.id,
      status: status || undefined,
    });
    return NextResponse.json({ success: true, data: jobs });
  } catch (error) {
    console.error("Get denoise/sharpen job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get denoise/sharpen job",
        },
      },
      { status: 500 },
    );
  }
}
