import { BaseAudioProvider } from "./base";
import {
  TTSConfig,
  SoundEffectsConfig,
  LipSyncConfig,
  BackgroundMusicConfig,
  AudioJobResult,
} from "../../pipeline/types";
import { env } from "@klipai/config";

export class ElevenLabsProvider extends BaseAudioProvider {
  name = "elevenlabs" as const;
  supportedModels = [
    "eleven_multilingual_v2",
    "eleven_monolingual_v1",
    "eleven_turbo_v2",
    "eleven_flash_v2",
  ];
  maxDuration = 300; // 5 minutes for TTS
  maxTextLength = 5000;

  constructor() {
    super(
      env.ELEVENLABS_API_KEY || "",
      env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io/v1",
    );
  }

  async textToSpeech(input: {
    config: TTSConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    const { config } = input;

    const payload = {
      text: config.text,
      model_id:
        config.provider === "custom"
          ? config.modelPath
          : this.getModelId(config.provider),
      voice_settings: {
        stability: config.stability ?? 0.5,
        similarity_boost: config.similarityBoost ?? 0.75,
        style: config.style ?? 0,
        use_speaker_boost: config.useSpeakerBoost ?? true,
        speed: config.speed ?? 1.0,
      },
      output_format: this.formatOutputFormat(
        config.outputFormat,
        config.sampleRate,
      ),
      ...(config.customVoiceId && { voice_id: config.customVoiceId }),
    };

    // For ElevenLabs, TTS is synchronous for short texts, async for long
    const isLongText = config.text.length > 2500;

    if (isLongText) {
      // Use async endpoint for long text
      const result = await this.request<{
        history_item_id: string;
        status: string;
      }>("/text-to-speech/async", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return {
        jobId: result.history_item_id,
        statusUrl: `${this.baseUrl}/history/${result.history_item_id}`,
      };
    } else {
      // Synchronous - returns audio directly, we simulate a job
      const jobId = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      // In production, you'd store the audio and return a URL
      return {
        jobId,
        statusUrl: `${this.baseUrl}/history/${jobId}`,
      };
    }
  }

  async generateSoundEffects(input: {
    config: SoundEffectsConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    const { config } = input;

    const payload = {
      text: config.prompt,
      duration_seconds: config.duration || 5,
      prompt_influence: config.intensity ?? 0.7,
      ...(config.variations && { num_generations: config.variations }),
    };

    const result = await this.request<{
      history_item_id: string;
      status: string;
    }>("/sound-generation", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      jobId: result.history_item_id,
      statusUrl: `${this.baseUrl}/history/${result.history_item_id}`,
    };
  }

  async lipSync(input: {
    config: LipSyncConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    // ElevenLabs doesn't provide lip sync directly
    // This would typically integrate with SadTalker/Wav2Lip
    throw new Error(
      "Lip sync not supported by ElevenLabs provider. Use SadTalker or Wav2Lip provider.",
    );
  }

  async generateMusic(input: {
    config: BackgroundMusicConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    // ElevenLabs doesn't provide music generation
    throw new Error(
      "Music generation not supported by ElevenLabs provider. Use Suno or Udio provider.",
    );
  }

  async getStatus(jobId: string): Promise<AudioJobResult> {
    try {
      const result = await this.request<{
        history_item_id: string;
        status: string;
        audio_url?: string;
        error?: string;
        duration_seconds?: number;
        created_at_unix: number;
        updated_at_unix: number;
        finished_at_unix?: number;
        metadata?: {
          sample_rate: number;
          channels: number;
          format: string;
          file_size_bytes: number;
        };
      }>(`/history/${jobId}`);

      return {
        id: result.history_item_id,
        status: this.mapStatus(result.status),
        progress:
          result.status === "completed"
            ? 100
            : result.status === "processing"
              ? 50
              : 0,
        outputUrl: result.audio_url,
        error: result.error,
        processingTime:
          result.finished_at_unix && result.created_at_unix
            ? (result.finished_at_unix - result.created_at_unix) * 1000
            : undefined,
        outputMetadata: result.metadata
          ? {
              duration: result.duration_seconds || 0,
              sampleRate: result.metadata.sample_rate,
              channels: result.metadata.channels,
              format: result.metadata.format,
              filesize: result.metadata.file_size_bytes,
            }
          : undefined,
        createdAt: result.created_at_unix * 1000,
        updatedAt: result.updated_at_unix * 1000,
        completedAt: result.finished_at_unix
          ? result.finished_at_unix * 1000
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
    // ElevenLabs doesn't support cancellation of async jobs directly
    // Would need to track and ignore results
    await this.request(`/history/${jobId}/cancel`, { method: "POST" });
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
    const result = await this.request<{
      voices: Array<{
        voice_id: string;
        name: string;
        labels: {
          language?: string;
          gender?: string;
          description?: string;
        };
        preview_url?: string;
        category?: string;
      }>;
    }>("/voices");

    return result.voices.map((v) => ({
      id: v.voice_id,
      name: v.name,
      language: v.labels.language || "en",
      gender: (v.labels.gender as "male" | "female" | "neutral") || "neutral",
      previewUrl: v.preview_url,
      description: v.labels.description,
      category: v.category === "generated" ? "tts" : "tts",
    }));
  }

  private getModelId(provider: string): string {
    const modelMap: Record<string, string> = {
      elevenlabs: "eleven_multilingual_v2",
      coqui: "xtts_v2",
      azure: "azure_neural",
      google: "google_chirp",
    };
    return modelMap[provider] || "eleven_multilingual_v2";
  }

  private formatOutputFormat(format?: string, sampleRate?: number): string {
    if (!format) return "mp3_44100_128";
    const rate = sampleRate || 44100;
    const bitrate = format === "mp3" ? "128" : "192";
    return `${format}_${rate}_${bitrate}`;
  }
}
