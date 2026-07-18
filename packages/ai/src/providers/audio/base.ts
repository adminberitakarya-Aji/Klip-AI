import {
  TTSConfig,
  SoundEffectsConfig,
  LipSyncConfig,
  BackgroundMusicConfig,
  AudioJobResult,
  AudioProvider,
} from "../../pipeline/types";

export abstract class BaseAudioProvider implements AudioProvider {
  abstract name: string;
  abstract supportedModels: string[];
  abstract maxDuration: number;
  maxTextLength?: number;

  protected apiKey: string;
  protected baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  abstract textToSpeech(input: {
    config: TTSConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  abstract generateSoundEffects(input: {
    config: SoundEffectsConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  abstract lipSync(input: {
    config: LipSyncConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  abstract generateMusic(input: {
    config: BackgroundMusicConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  abstract getStatus(jobId: string): Promise<AudioJobResult>;

  abstract cancel(jobId: string): Promise<void>;

  abstract getVoices(): Promise<
    Array<{
      id: string;
      name: string;
      language: string;
      gender: "male" | "female" | "neutral";
      previewUrl?: string;
      description?: string;
      category?: "tts" | "music" | "effects";
    }>
  >;

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  protected mapStatus(providerStatus: string): AudioJobResult["status"] {
    const statusMap: Record<string, AudioJobResult["status"]> = {
      pending: "queued",
      queued: "queued",
      processing: "processing",
      running: "processing",
      completed: "completed",
      succeeded: "completed",
      failed: "failed",
      error: "failed",
      cancelled: "failed",
    };
    return statusMap[providerStatus.toLowerCase()] || "failed";
  }
}
