import { NextRequest, NextResponse } from "next/server";
import { audioService } from "@klipai/ai/services/audio-service";
import { TTSConfig } from "@klipai/ai/pipeline/types";
import { requireEnv } from "@klipai/config";

export async function POST(request: NextRequest) {
  try {
    // Validate required env vars
    requireEnv(["ELEVENLABS_API_KEY"]);

    const body = await request.json();
    const {
      text,
      voiceId,
      provider = "elevenlabs",
      language = "id",
      stability = 0.5,
      similarityBoost = 0.75,
      style = 0,
      useSpeakerBoost = true,
      speed = 1.0,
      pitch = 0,
      outputFormat = "mp3",
      sampleRate = 44100,
      customVoiceId,
      emotion = "neutral",
      webhookUrl,
    } = body;

    // Validate required fields
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 },
      );
    }

    if (!voiceId || typeof voiceId !== "string") {
      return NextResponse.json(
        { error: "Voice ID is required" },
        { status: 400 },
      );
    }

    // Build TTS config
    const config: TTSConfig = {
      provider: provider as TTSConfig["provider"],
      text,
      voiceId,
      language,
      stability,
      similarityBoost,
      style,
      useSpeakerBoost,
      speed,
      pitch,
      outputFormat: outputFormat as TTSConfig["outputFormat"],
      sampleRate,
      customVoiceId,
      emotion: emotion as TTSConfig["emotion"],
    };

    // Submit job
    const { jobId, statusUrl } = await audioService.textToSpeech({
      config,
      webhookUrl,
      provider,
    });

    return NextResponse.json({
      jobId,
      statusUrl,
      status: "queued",
      message: "TTS job submitted successfully",
    });
  } catch (error) {
    console.error("TTS API error:", error);
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
      // Get available voices
      const voices = await audioService.getAllVoices();
      const providerVoices = voices.find((v) => v.provider === provider);
      return NextResponse.json({ voices: providerVoices?.voices || [] });
    }
  } catch (error) {
    console.error("TTS GET error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
