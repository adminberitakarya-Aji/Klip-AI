import { NextRequest, NextResponse } from "next/server";
import { audioService } from "@klipai/ai/services/audio-service";
import { requireEnv } from "@klipai/config";
import { captureError } from "@/lib/error-capture";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");
    const language = searchParams.get("language");
    const indonesianOnly = searchParams.get("indonesianOnly") === "true";

    if (indonesianOnly) {
      const voices = await audioService.getIndonesianVoices();
      return NextResponse.json({ voices });
    }

    const allVoices = await audioService.getAllVoices();

    // Filter by provider if specified
    const filteredVoices = provider
      ? allVoices.filter((v) => v.provider === provider)
      : allVoices;

    // Filter by language if specified
    const finalVoices = language
      ? filteredVoices.map(({ provider, voices }) => ({
          provider,
          voices: voices.filter(
            (v) =>
              v.language === language ||
              v.language === `${language}-${language.toUpperCase()}`,
          ),
        }))
      : filteredVoices;

    return NextResponse.json({ voices: finalVoices });
  } catch (error) {
    captureError("GET /api/audio/voices", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
