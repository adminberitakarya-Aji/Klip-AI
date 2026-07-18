import { NextRequest, NextResponse } from "next/server";
import { audioService } from "@klipai/ai/services/audio-service";
import { SoundEffectsConfig } from "@klipai/ai/pipeline/types";
import { requireEnv } from "@klipai/config";

export async function POST(request: NextRequest) {
  try {
    // Validate required env vars
    requireEnv(["ELEVENLABS_API_KEY"]);

    const body = await request.json();
    const {
      prompt,
      provider = "elevenlabs",
      duration = 5,
      variations = 1,
      category = "ambient",
      intensity = 0.7,
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

    // Build Sound Effects config
    const config: SoundEffectsConfig = {
      provider: provider as SoundEffectsConfig["provider"],
      prompt,
      duration,
      variations,
      category: category as SoundEffectsConfig["category"],
      intensity,
      outputFormat: outputFormat as SoundEffectsConfig["outputFormat"],
      sampleRate,
    };

    // Submit job
    const { jobId, statusUrl } = await audioService.generateSoundEffects({
      config,
      webhookUrl,
      provider,
    });

    return NextResponse.json({
      jobId,
      statusUrl,
      status: "queued",
      message: "Sound effects generation job submitted successfully",
    });
  } catch (error) {
    console.error("Sound Effects API error:", error);
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
    const provider = searchParams.get("provider") || "elevenlabs";
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
    console.error("Sound Effects GET error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
