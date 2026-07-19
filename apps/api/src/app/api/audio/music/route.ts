import { NextRequest, NextResponse } from "next/server";
import { audioService } from "@klipai/ai/services/audio-service";
import { BackgroundMusicConfig } from "@klipai/ai/pipeline/types";
import { requireEnv } from "@klipai/config";
import { captureError } from "@/lib/error-capture";

export async function POST(request: NextRequest) {
  try {
    // Validate required env vars
    requireEnv(["SUNO_API_KEY", "UDIO_API_KEY"]);

    const body = await request.json();
    const {
      prompt,
      provider = "suno",
      duration = 30,
      genre,
      mood,
      tempo,
      key,
      instruments,
      structure,
      vocals = false,
      lyrics,
      outputFormat = "mp3",
      sampleRate = 44100,
      webhookUrl,
    } = body;

    // Validate required fields
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 },
      );
    }

    // Validate duration
    if (duration < 10 || duration > 300) {
      return NextResponse.json(
        { error: "Duration must be between 10 and 300 seconds" },
        { status: 400 },
      );
    }

    // Build Background Music config
    const config: BackgroundMusicConfig = {
      provider: provider as BackgroundMusicConfig["provider"],
      prompt,
      duration,
      genre,
      mood: mood as BackgroundMusicConfig["mood"],
      tempo,
      key,
      instruments,
      structure: structure as BackgroundMusicConfig["structure"],
      vocals,
      lyrics,
      outputFormat: outputFormat as BackgroundMusicConfig["outputFormat"],
      sampleRate,
    };

    // Submit job
    const { jobId, statusUrl } = await audioService.generateMusic({
      config,
      webhookUrl,
      provider,
    });

    return NextResponse.json({
      jobId,
      statusUrl,
      status: "queued",
      message: "Music generation job submitted successfully",
    });
  } catch (error) {
    captureError("POST /api/audio/music", error);
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
    const provider = searchParams.get("provider") || "suno";
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
    captureError("GET /api/audio/music", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
