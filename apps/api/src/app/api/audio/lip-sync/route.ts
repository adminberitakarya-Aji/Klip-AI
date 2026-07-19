import { NextRequest, NextResponse } from "next/server";
import { audioService } from "@klipai/ai/services/audio-service";
import { LipSyncConfig } from "@klipai/ai/pipeline/types";
import { requireEnv } from "@klipai/config";
import { captureError } from "@/lib/error-capture";

export async function POST(request: NextRequest) {
  try {
    // Validate required env vars
    requireEnv(["SADTALKER_API_KEY", "WAV2LIP_API_KEY"]);

    const body = await request.json();
    const {
      videoUrl,
      audioUrl,
      provider = "sadtalker",
      faceEnhance = false,
      stillMode = false,
      preprocess = "crop",
      expressionScale = 1.0,
      batchSize = 4,
      outputFormat = "mp4",
      outputQuality = "high",
      webhookUrl,
    } = body;

    // Validate required fields
    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json(
        { error: "Video URL is required" },
        { status: 400 },
      );
    }

    if (!audioUrl || typeof audioUrl !== "string") {
      return NextResponse.json(
        { error: "Audio URL is required" },
        { status: 400 },
      );
    }

    // Build Lip Sync config
    const config: LipSyncConfig = {
      provider: provider as LipSyncConfig["provider"],
      videoUrl,
      audioUrl,
      faceEnhance,
      stillMode,
      preprocess: preprocess as LipSyncConfig["preprocess"],
      expressionScale,
      batchSize,
      outputFormat: outputFormat as LipSyncConfig["outputFormat"],
      outputQuality: outputQuality as LipSyncConfig["outputQuality"],
    };

    // Submit job
    const { jobId, statusUrl } = await audioService.lipSync({
      config,
      webhookUrl,
      provider,
    });

    return NextResponse.json({
      jobId,
      statusUrl,
      status: "queued",
      message: "Lip sync job submitted successfully",
    });
  } catch (error) {
    captureError("POST /api/audio/lip-sync", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") || "sadtalker";
    const jobId = searchParams.get("jobId");

    if (jobId) {
      // Get job status
      const status = await audioService.getStatus(provider, jobId);
      return NextResponse.json(status);
    } else {
      return NextResponse.json({
        message: "Provide jobId query parameter to check status",
      });
    }
  } catch (error) {
    captureError("GET /api/audio/lip-sync", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
