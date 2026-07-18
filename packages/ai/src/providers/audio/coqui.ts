import { BaseAudioProvider } from "./base";
import {
  TTSConfig,
  SoundEffectsConfig,
  LipSyncConfig,
  BackgroundMusicConfig,
  AudioJobResult,
} from "../../pipeline/types";
import { env } from "@klipai/config";

export class CoquiProvider extends BaseAudioProvider {
  name = "coqui" as const;
  supportedModels = [
    "xtts_v2",
    "xtts_v1",
    "tacotron2",
    "glow-tts",
    "fastpitch",
  ];
  maxDuration = 300; // 5 minutes for TTS
  maxTextLength = 10000;

  constructor() {
    super(
      env.COQUI_API_KEY || env.AI_PROVIDER_API_KEY || "",
      env.COQUI_BASE_URL || "https://api.coqui.ai/v1",
    );
  }

  async textToSpeech(input: {
    config: TTSConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    const { config } = input;

    const payload = {
      text: config.text,
      speaker_id: config.voiceId,
      language: config.language || "en",
      speed: config.speed ?? 1.0,
      pitch: config.pitch ?? 0,
      model:
        config.provider === "custom"
          ? config.modelPath
          : this.getModelId(config.provider),
      output_format: this.formatOutputFormat(
        config.outputFormat,
        config.sampleRate,
      ),
      ...(config.customVoiceId && { voice_clone_id: config.customVoiceId }),
      ...(config.emotion && { emotion: config.emotion }),
    };

    const result = await this.request<{
      job_id: string;
      status_url: string;
    }>("/tts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      jobId: result.job_id,
      statusUrl: result.status_url,
    };
  }

  async generateSoundEffects(input: {
    config: SoundEffectsConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    // Coqui doesn't natively support sound effects, but we can use TTS with sound prompts
    throw new Error(
      "Sound effects generation not natively supported by Coqui. Use ElevenLabs provider.",
    );
  }

  async lipSync(input: {
    config: LipSyncConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    throw new Error(
      "Lip sync not supported by Coqui provider. Use SadTalker or Wav2Lip provider.",
    );
  }

  async generateMusic(input: {
    config: BackgroundMusicConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    throw new Error(
      "Music generation not supported by Coqui provider. Use Suno or Udio provider.",
    );
  }

  async getStatus(jobId: string): Promise<AudioJobResult> {
    try {
      const result = await this.request<{
        job_id: string;
        status: string;
        progress: number;
        audio_url?: string;
        error?: string;
        duration_seconds?: number;
        sample_rate?: number;
        channels?: number;
        format?: string;
        file_size_bytes?: number;
        created_at: number;
        updated_at: number;
        completed_at?: number;
      }>(`/jobs/${jobId}/status`);

      return {
        id: result.job_id,
        status: this.mapStatus(result.status),
        progress: result.progress,
        outputUrl: result.audio_url,
        error: result.error,
        processingTime:
          result.completed_at && result.created_at
            ? (result.completed_at - result.created_at) * 1000
            : undefined,
        outputMetadata: result.audio_url
          ? {
              duration: result.duration_seconds || 0,
              sampleRate: result.sample_rate || 22050,
              channels: result.channels || 1,
              format: result.format || "wav",
              filesize: result.file_size_bytes || 0,
            }
          : undefined,
        createdAt: result.created_at * 1000,
        updatedAt: result.updated_at * 1000,
        completedAt: result.completed_at
          ? result.completed_at * 1000
          : undefined,
      };
    } catch (error) {
      return {
        id: jobId,
        status: "failed",
        progress: 100,
        error: error instanceof Error ? error.message : "Unknown error",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
  }

  async cancel(jobId: string): Promise<void> {
    await this.request(`/jobs/${jobId}/cancel`, { method: "POST" });
  }

  async getVoices(): Promise<
    Array<{
      id: string;
      name: string;
      language: string;
      gender: "male" | "female" | "neutral";
      previewUrl?: string;
      description?: string;
      category?: "tts" | "music" | "effects";
    }>
  > {
    try {
      const result = await this.request<{
        speakers: Array<{
          id: string;
          name: string;
          language: string;
          gender: string;
          preview_url?: string;
          description?: string;
        }>;
      }>("/speakers");

      return result.speakers.map((s) => ({
        id: s.id,
        name: s.name,
        language: s.language,
        gender: (s.gender as "male" | "female" | "neutral") || "neutral",
        previewUrl: s.preview_url,
        description: s.description,
        category: "tts" as const,
      }));
    } catch (error) {
      console.error("Failed to fetch Coqui voices:", error);
      return [];
    }
  }

  private getModelId(provider: string): string {
    const modelMap: Record<string, string> = {
      coqui: "xtts_v2",
      elevenlabs: "eleven_multilingual_v2",
      azure: "azure_neural",
      google: "google_chirp",
    };
    return modelMap[provider] || "xtts_v2";
  }

  private formatOutputFormat(format?: string, sampleRate?: number): string {
    if (!format) return "wav_22050";
    const rate = sampleRate || 22050;
    return `${format}_${rate}`;
  }
}
