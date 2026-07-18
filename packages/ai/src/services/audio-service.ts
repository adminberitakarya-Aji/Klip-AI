import {
  TTSConfig,
  SoundEffectsConfig,
  LipSyncConfig,
  BackgroundMusicConfig,
  AudioJobResult,
  AudioProvider,
} from "../pipeline/types";
import { providerRouter } from "./provider-router";
import { logger } from "@klipai/core/logger";

export class AudioService {
  /**
   * Submit a Text-to-Speech job
   */
  async textToSpeech(input: {
    config: TTSConfig;
    webhookUrl?: string;
    provider?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    const { config, webhookUrl, provider: providerName } = input;

    let provider: AudioProvider | undefined;

    if (providerName) {
      provider = providerRouter.getAudioProvider(providerName);
      if (!provider) {
        throw new Error(`Audio provider not found: ${providerName}`);
      }
    } else {
      // Auto-select best provider for TTS
      provider = this.selectBestTTSProvider(config);
    }

    if (!provider) {
      throw new Error("No available TTS provider");
    }

    // Validate text length
    if (provider.maxTextLength && config.text.length > provider.maxTextLength) {
      throw new Error(
        `Text exceeds maximum length of ${provider.maxTextLength} characters`,
      );
    }

    // Validate duration
    if (config.text.length > 0) {
      const estimatedDuration = this.estimateTTSDuration(config.text);
      if (estimatedDuration > provider.maxDuration) {
        throw new Error(
          `Estimated duration (${estimatedDuration}s) exceeds provider max (${provider.maxDuration}s)`,
        );
      }
    }

    logger.info(`Submitting TTS job to ${provider.name}`, {
      textLength: config.text.length,
      voiceId: config.voiceId,
      language: config.language,
    });

    return provider.textToSpeech({ config, webhookUrl });
  }

  /**
   * Submit a Sound Effects generation job
   */
  async generateSoundEffects(input: {
    config: SoundEffectsConfig;
    webhookUrl?: string;
    provider?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    const { config, webhookUrl, provider: providerName } = input;

    let provider: AudioProvider | undefined;

    if (providerName) {
      provider = providerRouter.getAudioProvider(providerName);
      if (!provider) {
        throw new Error(`Audio provider not found: ${providerName}`);
      }
    } else {
      // Auto-select best provider for sound effects
      provider = this.selectBestSoundEffectsProvider();
    }

    if (!provider) {
      throw new Error("No available sound effects provider");
    }

    logger.info(`Submitting sound effects job to ${provider.name}`, {
      prompt: config.prompt,
      duration: config.duration,
      category: config.category,
    });

    return provider.generateSoundEffects({ config, webhookUrl });
  }

  /**
   * Submit a Lip Sync job
   */
  async lipSync(input: {
    config: LipSyncConfig;
    webhookUrl?: string;
    provider?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    const { config, webhookUrl, provider: providerName } = input;

    let provider: AudioProvider | undefined;

    if (providerName) {
      provider = providerRouter.getAudioProvider(providerName);
      if (!provider) {
        throw new Error(`Audio provider not found: ${providerName}`);
      }
    } else {
      // Auto-select best provider for lip sync
      provider = this.selectBestLipSyncProvider(config);
    }

    if (!provider) {
      throw new Error("No available lip sync provider");
    }

    logger.info(`Submitting lip sync job to ${provider.name}`, {
      videoUrl: config.videoUrl,
      audioUrl: config.audioUrl,
      provider: config.provider,
    });

    return provider.lipSync({ config, webhookUrl });
  }

  /**
   * Submit a Background Music generation job
   */
  async generateMusic(input: {
    config: BackgroundMusicConfig;
    webhookUrl?: string;
    provider?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    const { config, webhookUrl, provider: providerName } = input;

    let provider: AudioProvider | undefined;

    if (providerName) {
      provider = providerRouter.getAudioProvider(providerName);
      if (!provider) {
        throw new Error(`Audio provider not found: ${providerName}`);
      }
    } else {
      // Auto-select best provider for music
      provider = this.selectBestMusicProvider();
    }

    if (!provider) {
      throw new Error("No available music generation provider");
    }

    logger.info(`Submitting music generation job to ${provider.name}`, {
      prompt: config.prompt,
      duration: config.duration,
      genre: config.genre,
      mood: config.mood,
    });

    return provider.generateMusic({ config, webhookUrl });
  }

  /**
   * Get job status
   */
  async getStatus(
    providerName: string,
    jobId: string,
  ): Promise<AudioJobResult> {
    const provider = providerRouter.getAudioProvider(providerName);
    if (!provider) {
      throw new Error(`Audio provider not found: ${providerName}`);
    }

    return provider.getStatus(jobId);
  }

  /**
   * Cancel job
   */
  async cancel(providerName: string, jobId: string): Promise<void> {
    const provider = providerRouter.getAudioProvider(providerName);
    if (!provider) {
      throw new Error(`Audio provider not found: ${providerName}`);
    }

    await provider.cancel(jobId);
  }

  /**
   * Get available voices from all providers
   */
  async getAllVoices(): Promise<
    Array<{
      provider: string;
      voices: Array<{
        id: string;
        name: string;
        language: string;
        gender: "male" | "female" | "neutral";
        previewUrl?: string;
        description?: string;
        category?: "tts" | "music" | "effects";
      }>;
    }>
  > {
    const results: Array<{
      provider: string;
      voices: Array<{
        id: string;
        name: string;
        language: string;
        gender: "male" | "female" | "neutral";
        previewUrl?: string;
        description?: string;
        category?: "tts" | "music" | "effects";
      }>;
    }> = [];

    const providerNames = [
      "elevenlabs",
      "coqui",
      "sadtalker",
      "wav2lip",
      "suno",
      "udio",
    ];

    for (const name of providerNames) {
      const provider = providerRouter.getAudioProvider(name);
      if (provider) {
        try {
          const voices = await provider.getVoices();
          if (voices.length > 0) {
            results.push({ provider: name, voices });
          }
        } catch (error) {
          logger.warn(`Failed to fetch voices from ${name}`, { error });
        }
      }
    }

    return results;
  }

  /**
   * Get available Indonesian voices
   */
  async getIndonesianVoices(): Promise<
    Array<{
      provider: string;
      voices: Array<{
        id: string;
        name: string;
        language: string;
        gender: "male" | "female" | "neutral";
        previewUrl?: string;
        description?: string;
      }>;
    }>
  > {
    const allVoices = await this.getAllVoices();
    return allVoices
      .map(({ provider, voices }) => ({
        provider,
        voices: voices.filter(
          (v) => v.language === "id" || v.language === "id-ID",
        ),
      }))
      .filter(({ voices }) => voices.length > 0);
  }

  /**
   * Wait for job completion
   */
  async waitForCompletion(
    providerName: string,
    jobId: string,
    maxWaitMs = 300000,
  ): Promise<AudioJobResult> {
    const startTime = Date.now();
    let delay = 1000;

    while (Date.now() - startTime < maxWaitMs) {
      const result = await this.getStatus(providerName, jobId);

      if (result.status === "completed") {
        return result;
      }
      if (result.status === "failed") {
        throw new Error(result.error || "Job failed");
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, 30000);
    }

    throw new Error("Job timeout");
  }

  // Provider selection helpers
  private selectBestTTSProvider(config: TTSConfig): AudioProvider | undefined {
    // Priority: ElevenLabs (best quality, Indonesian support) > Coqui (open source)
    const providers = ["elevenlabs", "coqui"];
    for (const name of providers) {
      const provider = providerRouter.getAudioProvider(name);
      if (provider) return provider;
    }
    return undefined;
  }

  private selectBestSoundEffectsProvider(): AudioProvider | undefined {
    // ElevenLabs is the main provider for sound effects
    return providerRouter.getAudioProvider("elevenlabs");
  }

  private selectBestLipSyncProvider(
    config: LipSyncConfig,
  ): AudioProvider | undefined {
    // Priority based on config.provider preference
    if (config.provider === "sadtalker") {
      return (
        providerRouter.getAudioProvider("sadtalker") ||
        providerRouter.getAudioProvider("wav2lip")
      );
    }
    if (config.provider === "wav2lip") {
      return (
        providerRouter.getAudioProvider("wav2lip") ||
        providerRouter.getAudioProvider("sadtalker")
      );
    }
    // Default: SadTalker > Wav2Lip
    return (
      providerRouter.getAudioProvider("sadtalker") ||
      providerRouter.getAudioProvider("wav2lip")
    );
  }

  private selectBestMusicProvider(): AudioProvider | undefined {
    // Priority: Suno > Udio
    return (
      providerRouter.getAudioProvider("suno") ||
      providerRouter.getAudioProvider("udio")
    );
  }

  private estimateTTSDuration(text: string): number {
    // Rough estimation: ~150 words per minute, ~5 chars per word
    const words = text.length / 5;
    return Math.ceil((words / 150) * 60);
  }
}

export const audioService = new AudioService();
