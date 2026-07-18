import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { upscalerService } from "@klipai/ai/services/upscaler-service";
import { UpscalerConfig } from "@klipai/ai";

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

    // Validate config type
    const validModels = [
      "real-esrgan",
      "real-esrgan-anime",
      "topaz",
      "waifu2x",
      "custom",
    ];
    if (!validModels.includes(config.model)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid upscaler model",
          },
        },
        { status: 400 },
      );
    }

    if (![2, 4].includes(config.scale)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Scale must be 2 or 4" },
        },
        { status: 400 },
      );
    }

    const job = await upscalerService.upscale({
      userId: sessionUser.id,
      generationId,
      videoUrl,
      config: config as UpscalerConfig,
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
    console.error("Upscale error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to start upscaling job",
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
    console.error("Get upscale job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to get upscale job" },
      },
      { status: 500 },
    );
  }
}
