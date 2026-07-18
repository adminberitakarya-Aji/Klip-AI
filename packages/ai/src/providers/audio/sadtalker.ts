import { BaseAudioProvider } from "./base";
import {
  TTSConfig,
  SoundEffectsConfig,
  LipSyncConfig,
  BackgroundMusicConfig,
  AudioJobResult,
} from "../../pipeline/types";
import { env } from "@klipai/config";

export class SadTalkerProvider extends BaseAudioProvider {
  name = "sadtalker" as const;
  supportedModels = ["sadtalker", "sadtalker-still", "sadtalker-full"];
  maxDuration = 300; // 5 minutes for lip sync

  constructor() {
    super(
      env.SADTALKER_API_KEY || env.AI_PROVIDER_API_KEY || "",
      env.SADTALKER_BASE_URL || "https://api.sadtalker.ai/v1",
    );
  }

  async textToSpeech(input: {
    config: TTSConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    throw new Error(
      "TTS not supported by SadTalker provider. Use ElevenLabs or Coqui provider.",
    );
  }

  async generateSoundEffects(input: {
    config: SoundEffectsConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    throw new Error(
      "Sound effects generation not supported by SadTalker provider. Use ElevenLabs provider.",
    );
  }

  async lipSync(input: {
    config: LipSyncConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    const { config } = input;

    const payload = {
      video_url: config.videoUrl,
      audio_url: config.audioUrl,
      face_enhance: config.faceEnhance ?? false,
      still_mode: config.stillMode ?? false,
      preprocess: config.preprocess || "crop",
      expression_scale: config.expressionScale ?? 1.0,
      batch_size: config.batchSize ?? 4,
      output_format: config.outputFormat || "mp4",
      quality: config.outputQuality || "high",
    };

    const result = await this.request<{
      job_id: string;
      status_url: string;
    }>("/lipsync", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      jobId: result.job_id,
      statusUrl: result.status_url,
    };
  }

  async generateMusic(input: {
    config: BackgroundMusicConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    throw new Error(
      "Music generation not supported by SadTalker provider. Use Suno or Udio provider.",
    );
  }

  async getStatus(jobId: string): Promise<AudioJobResult> {
    try {
      const result = await this.request<{
        job_id: string;
        status: string;
        progress: number;
        video_url?: string;
        error?: string;
        duration_seconds?: number;
        fps?: number;
        width?: number;
        height?: number;
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
        outputUrl: result.video_url,
        error: result.error,
        processingTime:
          result.completed_at && result.created_at
            ? (result.completed_at - result.created_at) * 1000
            : undefined,
        outputMetadata: result.video_url
          ? {
              duration: result.duration_seconds || 0,
              sampleRate: 44100,
              channels: 2,
              format: result.format || "mp4",
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
    // SadTalker doesn't have voices - it's a lip sync tool
    return [];
  }
}

export class Wav2LipProvider extends BaseAudioProvider {
  name = "wav2lip" as const;
  supportedModels = ["wav2lip", "wav2lip-gan"];
  maxDuration = 300; // 5 minutes for lip sync

  constructor() {
    super(
      env.WAV2LIP_API_KEY || env.AI_PROVIDER_API_KEY || "",
      env.WAV2LIP_BASE_URL || "https://api.wav2lip.ai/v1",
    );
  }

  async textToSpeech(input: {
    config: TTSConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    throw new Error(
      "TTS not supported by Wav2Lip provider. Use ElevenLabs or Coqui provider.",
    );
  }

  async generateSoundEffects(input: {
    config: SoundEffectsConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    throw new Error(
      "Sound effects generation not supported by Wav2Lip provider. Use ElevenLabs provider.",
    );
  }

  async lipSync(input: {
    config: LipSyncConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    const { config } = input;

    const payload = {
      video_url: config.videoUrl,
      audio_url: config.audioUrl,
      face_enhance: config.faceEnhance ?? false,
      static_mode: config.stillMode ?? false,
      batch_size: config.batchSize ?? 4,
      output_format: config.outputFormat || "mp4",
      quality: config.outputQuality || "high",
    };

    const result = await this.request<{
      job_id: string;
      status_url: string;
    }>("/lipsync", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      jobId: result.job_id,
      statusUrl: result.status_url,
    };
  }

  async generateMusic(input: {
    config: BackgroundMusicConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    throw new Error(
      "Music generation not supported by Wav2Lip provider. Use Suno or Udio provider.",
    );
  }

  async getStatus(jobId: string): Promise<AudioJobResult> {
    try {
      const result = await this.request<{
        job_id: string;
        status: string;
        progress: number;
        video_url?: string;
        error?: string;
        duration_seconds?: number;
        fps?: number;
        width?: number;
        height?: number;
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
        outputUrl: result.video_url,
        error: result.error,
        processingTime:
          result.completed_at && result.created_at
            ? (result.completed_at - result.created_at) * 1000
            : undefined,
        outputMetadata: result.video_url
          ? {
              duration: result.duration_seconds || 0,
              sampleRate: 44100,
              channels: 2,
              format: result.format || "mp4",
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
    // Wav2Lip doesn't have voices - it's a lip sync tool
    return [];
  }
}
