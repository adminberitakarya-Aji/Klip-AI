import { BaseAudioProvider } from "./base";
import {
  TTSConfig,
  SoundEffectsConfig,
  LipSyncConfig,
  BackgroundMusicConfig,
  AudioJobResult,
} from "../../pipeline/types";
import { env } from "@klipai/config";

export class SunoProvider extends BaseAudioProvider {
  name = "suno" as const;
  supportedModels = ["chirp-v3", "chirp-v3-5", "chirp-v2"];
  maxDuration = 300; // 5 minutes for music generation

  constructor() {
    super(
      env.SUNO_API_KEY || env.AI_PROVIDER_API_KEY || "",
      env.SUNO_BASE_URL || "https://api.suno.ai/v1",
    );
  }

  async textToSpeech(input: {
    config: TTSConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    throw new Error(
      "TTS not supported by Suno provider. Use ElevenLabs or Coqui provider.",
    );
  }

  async generateSoundEffects(input: {
    config: SoundEffectsConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    throw new Error(
      "Sound effects generation not supported by Suno provider. Use ElevenLabs provider.",
    );
  }

  async lipSync(input: {
    config: LipSyncConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    throw new Error(
      "Lip sync not supported by Suno provider. Use SadTalker or Wav2Lip provider.",
    );
  }

  async generateMusic(input: {
    config: BackgroundMusicConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    const { config } = input;

    const payload = {
      prompt: config.prompt,
      duration: config.duration,
      genre: config.genre,
      mood: config.mood,
      tempo: config.tempo,
      key: config.key,
      instruments: config.instruments,
      structure: config.structure,
      vocals: config.vocals ?? false,
      lyrics: config.lyrics,
      model:
        config.provider === "custom"
          ? config.modelPath
          : this.getModelId(config.provider),
      output_format: config.outputFormat || "mp3",
      sample_rate: config.sampleRate || 44100,
    };

    const result = await this.request<{
      job_id: string;
      status_url: string;
    }>("/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      jobId: result.job_id,
      statusUrl: result.status_url,
    };
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
        bpm?: number;
        key?: string;
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
              sampleRate: result.sample_rate || 44100,
              channels: result.channels || 2,
              format: result.format || "mp3",
              filesize: result.file_size_bytes || 0,
              bpm: result.bpm,
              key: result.key,
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
    // Suno doesn't have voices - it generates music
    return [];
  }

  private getModelId(provider: string): string {
    const modelMap: Record<string, string> = {
      suno: "chirp-v3-5",
      udio: "udio-v1",
    };
    return modelMap[provider] || "chirp-v3-5";
  }
}

export class UdioProvider extends BaseAudioProvider {
  name = "udio" as const;
  supportedModels = ["udio-v1", "udio-v1-5"];
  maxDuration = 300; // 5 minutes for music generation

  constructor() {
    super(
      env.UDIO_API_KEY || env.AI_PROVIDER_API_KEY || "",
      env.UDIO_BASE_URL || "https://api.udio.ai/v1",
    );
  }

  async textToSpeech(input: {
    config: TTSConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    throw new Error(
      "TTS not supported by Udio provider. Use ElevenLabs or Coqui provider.",
    );
  }

  async generateSoundEffects(input: {
    config: SoundEffectsConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    throw new Error(
      "Sound effects generation not supported by Udio provider. Use ElevenLabs provider.",
    );
  }

  async lipSync(input: {
    config: LipSyncConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    throw new Error(
      "Lip sync not supported by Udio provider. Use SadTalker or Wav2Lip provider.",
    );
  }

  async generateMusic(input: {
    config: BackgroundMusicConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    const { config } = input;

    const payload = {
      prompt: config.prompt,
      duration: config.duration,
      genre: config.genre,
      mood: config.mood,
      tempo: config.tempo,
      key: config.key,
      instruments: config.instruments,
      structure: config.structure,
      vocals: config.vocals ?? false,
      lyrics: config.lyrics,
      model: config.provider === "custom" ? config.modelPath : "udio-v1-5",
      output_format: config.outputFormat || "mp3",
      sample_rate: config.sampleRate || 48000,
    };

    const result = await this.request<{
      job_id: string;
      status_url: string;
    }>("/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      jobId: result.job_id,
      statusUrl: result.status_url,
    };
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
        bpm?: number;
        key?: string;
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
              sampleRate: result.sample_rate || 48000,
              channels: result.channels || 2,
              format: result.format || "mp3",
              filesize: result.file_size_bytes || 0,
              bpm: result.bpm,
              key: result.key,
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
    // Udio doesn't have voices - it generates music
    return [];
  }
}
