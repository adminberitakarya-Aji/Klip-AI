import {
  EnhancedGenerationRequest,
  ProviderResponse,
  ProviderCapabilities,
  PROVIDER_CAPABILITIES,
  GenerationType,
  ProviderRequest,
  AudioProvider,
  TTSConfig,
  SoundEffectsConfig,
  LipSyncConfig,
  BackgroundMusicConfig,
  AudioJobResult,
} from "../pipeline/types";
import { AIProvider, GenerationRequest } from "../types";
import { logger } from "@klipai/core/logger";
import * as Sentry from "@sentry/nextjs";

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

export class ProviderRouter {
  private providers: Map<string, AIProvider> = new Map();
  private audioProviders: Map<string, AudioProvider> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly CIRCUIT_BREAKER_THRESHOLD = 3;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

  constructor() {
    // Initialize circuit breakers
    for (const cap of PROVIDER_CAPABILITIES) {
      this.circuitBreakers.set(cap.name, {
        failures: 0,
        lastFailure: 0,
        isOpen: false,
      });
    }
  }

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name, provider);
    logger.info(`Provider registered: ${provider.name}`);
  }

  registerAudioProvider(provider: AudioProvider): void {
    this.audioProviders.set(provider.name, provider);
    logger.info(`Audio provider registered: ${provider.name}`);
  }

  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  getAudioProvider(name: string): AudioProvider | undefined {
    return this.audioProviders.get(name);
  }

  async generate(
    request: EnhancedGenerationRequest,
  ): Promise<ProviderResponse> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // Set Sentry context for tracing
    Sentry.setContext("generation_request", {
      requestId,
      type: request.type,
      priority: request.metadata.priority,
      recommendedProvider: request.metadata.recommendedProvider,
      complexity: request.metadata.complexity,
    });

    // 1. Select best provider based on type support, priority, circuit breaker
    const provider = this.selectProvider(request);
    if (!provider) {
      logger.error("No available provider for generation type", {
        type: request.type,
        requestId,
      });
      Sentry.captureException(
        new Error("No available provider for this generation type"),
        {
          extra: { requestId, type: request.type },
        },
      );
      throw new Error("No available provider for this generation type");
    }

    // 2. Map structured params to provider format
    const providerRequest = this.mapToProviderFormat(provider, request);

    // 3. Execute with fallback chain
    try {
      const response = await this.executeWithFallback(
        provider,
        providerRequest,
        request,
        requestId,
        startTime,
      );
      logger.provider.response(
        provider.name,
        request.type,
        requestId,
        Date.now() - startTime,
      );
      return response;
    } catch (error) {
      logger.provider.error(
        provider.name,
        request.type,
        requestId,
        error as Error,
      );
      Sentry.captureException(error, {
        extra: { requestId, provider: provider.name, type: request.type },
      });
      throw error;
    }
  }

  private selectProvider(
    request: EnhancedGenerationRequest,
  ): AIProvider | null {
    const { type, metadata } = request;
    const priority = metadata.priority || "quality";

    // Filter providers that support this type
    const capableProviders = PROVIDER_CAPABILITIES.filter((cap) =>
      cap.supportedTypes.includes(type),
    );

    // Filter out open circuit breakers
    const availableProviders = capableProviders.filter(
      (cap) => !this.circuitBreakers.get(cap.name)?.isOpen,
    );

    if (availableProviders.length === 0) {
      logger.warn("All providers have open circuit breakers", { type });
      return null;
    }

    // Sort by priority preference
    let selected: ProviderCapabilities;

    if (priority === "speed") {
      // Wan > Kling > Seedance for speed
      selected =
        availableProviders.find((p) => p.name === "wan") ||
        availableProviders.find((p) => p.name === "kling") ||
        availableProviders[0];
    } else if (priority === "cost") {
      // Wan > Kling > Seedance for cost
      selected =
        availableProviders.find((p) => p.name === "wan") ||
        availableProviders.find((p) => p.name === "kling") ||
        availableProviders[0];
    } else {
      // Quality: Seedance > Kling > Wan
      selected =
        availableProviders.find((p) => p.name === "seedance") ||
        availableProviders.find((p) => p.name === "kling") ||
        availableProviders[0];
    }

    // Override with user's recommended provider if available
    if (metadata.recommendedProvider) {
      const recommended = availableProviders.find(
        (p) => p.name === metadata.recommendedProvider,
      );
      if (recommended) selected = recommended;
    }

    logger.info(`Provider selected: ${selected.name}`, {
      type,
      priority,
      available: availableProviders.map((p) => p.name),
      selected: selected.name,
    });

    return this.providers.get(selected.name) || null;
  }

  private mapToProviderFormat(
    provider: AIProvider,
    request: EnhancedGenerationRequest,
  ): ProviderRequest {
    const { type, params, prompt, negativePrompt } = request;
    const payload: Record<string, unknown> = {
      prompt,
      negative_prompt: negativePrompt,
    };

    // Map type-specific params
    switch (type) {
      case GenerationType.TEXT_TO_VIDEO: {
        const p = params as any;
        payload.duration = p.duration;
        payload.aspect_ratio = p.aspectRatio;
        payload.resolution = p.resolution;
        payload.fps = p.fps;
        payload.camera_motion = p.cameraMotion;
        if (p.seed) payload.seed = p.seed;
        if (p.scenes) payload.scenes = p.scenes;
        break;
      }
      case GenerationType.IMAGE_TO_VIDEO: {
        const p = params as any;
        payload.motion_strength = p.motionStrength;
        payload.camera_motion = p.cameraMotion;
        payload.duration = p.duration;
        if (p.endImage) payload.end_image = p.endImage;
        break;
      }
      case GenerationType.VIDEO_TO_VIDEO: {
        const p = params as any;
        payload.style = p.style;
        payload.strength = p.strength;
        payload.preserve_structure = p.preserveStructure;
        if (p.consistencyFrames)
          payload.consistency_frames = p.consistencyFrames;
        break;
      }
      case GenerationType.TEXT_TO_IMAGE: {
        const p = params as any;
        payload.aspect_ratio = p.aspectRatio;
        payload.resolution = p.resolution;
        payload.style = p.style;
        payload.negative_prompt = p.negativePrompt || negativePrompt;
        if (p.batchSize) payload.batch_size = p.batchSize;
        break;
      }
      case GenerationType.IMAGE_TO_IMAGE: {
        const p = params as any;
        payload.strength = p.strength;
        payload.preserve_structure = p.preserveStructure;
        payload.style = p.style;
        if (p.mask) payload.mask = p.mask;
        break;
      }
      case GenerationType.MOTION_CONTROL: {
        const p = params as any;
        payload.trajectory = p.trajectory;
        payload.keyframes = p.keyframes;
        if (p.subjectPosition) payload.subject_position = p.subjectPosition;
        break;
      }
      case GenerationType.VIDEO_TO_VIDEO_STYLE_TRANSFER: {
        const p = params as any;
        payload.style_reference = p.styleReference;
        payload.strength = p.strength;
        payload.mode = p.mode;
        payload.preserve_structure = p.preserveStructure;
        if (p.controlNetConditioning)
          payload.control_net_conditioning = p.controlNetConditioning;
        if (p.controlNetStrength)
          payload.control_net_strength = p.controlNetStrength;
        if (p.consistencyFrames)
          payload.consistency_frames = p.consistencyFrames;
        if (p.loraPath) payload.lora_path = p.loraPath;
        if (p.loraScale) payload.lora_scale = p.loraScale;
        break;
      }
      case GenerationType.INPAINTING_OUTPAINTING: {
        const p = params as any;
        payload.mode = p.mode;
        payload.input_url = p.inputUrl;
        if (p.maskUrl) payload.mask = p.maskUrl;
        if (p.outpaint) payload.outpaint = p.outpaint;
        payload.prompt = p.prompt;
        if (p.negativePrompt) payload.negative_prompt = p.negativePrompt;
        if (p.strength) payload.strength = p.strength;
        if (p.variations) payload.variations = p.variations;
        if (p.blendMode) payload.blend_mode = p.blendMode;
        if (p.featherAmount) payload.feather_amount = p.featherAmount;
        if (p.controlNetConditioning)
          payload.control_net_conditioning = p.controlNetConditioning;
        if (p.controlNetStrength)
          payload.control_net_strength = p.controlNetStrength;
        break;
      }
      case GenerationType.DEPTH_NORMAL_CONTROL: {
        const p = params as any;
        payload.input_type = p.inputType;
        payload.input_url = p.inputUrl;
        payload.strength = p.strength;
        if (p.guidanceScale) payload.guidance_scale = p.guidanceScale;
        payload.prompt = p.prompt;
        if (p.negativePrompt) payload.negative_prompt = p.negativePrompt;
        if (p.temporalConsistency)
          payload.temporal_consistency = p.temporalConsistency;
        if (p.consistencyFrames)
          payload.consistency_frames = p.consistencyFrames;
        break;
      }
      case GenerationType.MULTI_SHOT_STORYBOARD: {
        const p = params as any;
        payload.brief = p.brief;
        payload.shot_count = p.shotCount;
        payload.shot_duration = p.shotDuration;
        payload.total_duration = p.totalDuration;
        payload.aspect_ratio = p.aspectRatio;
        if (p.style) payload.style = p.style;
        if (p.shotTypes) payload.shot_types = p.shotTypes;
        if (p.cameraMovements) payload.camera_movements = p.cameraMovements;
        if (p.characterReference)
          payload.character_reference = p.characterReference;
        if (p.autoEdit) payload.auto_edit = p.autoEdit;
        if (p.outputFormat) payload.output_format = p.outputFormat;
        break;
      }
    }

    // Provider-specific endpoint mapping
    const endpointMap: Record<string, Record<GenerationType, string>> = {
      seedance: {
        [GenerationType.TEXT_TO_VIDEO]: "/v1/generate/text-to-video",
        [GenerationType.IMAGE_TO_VIDEO]: "/v1/generate/image-to-video",
        [GenerationType.VIDEO_TO_VIDEO]: "/v1/generate/video-to-video",
        [GenerationType.TEXT_TO_IMAGE]: "/v1/generate/text-to-image",
        [GenerationType.IMAGE_TO_IMAGE]: "/v1/generate/image-to-image",
        [GenerationType.MOTION_CONTROL]: "/v1/generate/motion-control",
        // Phase 11.5: Advanced Generation Modes
        [GenerationType.VIDEO_TO_VIDEO_STYLE_TRANSFER]:
          "/v1/generate/video-to-video-style-transfer",
        [GenerationType.INPAINTING_OUTPAINTING]:
          "/v1/generate/inpainting-outpainting",
        [GenerationType.DEPTH_NORMAL_CONTROL]:
          "/v1/generate/depth-normal-control",
        [GenerationType.MULTI_SHOT_STORYBOARD]:
          "/v1/generate/multi-shot-storyboard",
      },
      kling: {
        [GenerationType.TEXT_TO_VIDEO]: "/v1/videos/text2video",
        [GenerationType.IMAGE_TO_VIDEO]: "/v1/videos/image2video",
        [GenerationType.VIDEO_TO_VIDEO]: "/v1/videos/video2video",
        [GenerationType.TEXT_TO_IMAGE]: "/v1/images/text2image",
        [GenerationType.IMAGE_TO_IMAGE]: "/v1/images/image2image",
        [GenerationType.MOTION_CONTROL]: "/v1/videos/motion-control",
        // Phase 11.5: Advanced Generation Modes
        [GenerationType.VIDEO_TO_VIDEO_STYLE_TRANSFER]:
          "/v1/videos/style-transfer",
        [GenerationType.INPAINTING_OUTPAINTING]:
          "/v1/videos/inpainting-outpainting",
        [GenerationType.DEPTH_NORMAL_CONTROL]:
          "/v1/videos/depth-normal-control",
        [GenerationType.MULTI_SHOT_STORYBOARD]:
          "/v1/videos/multi-shot-storyboard",
      },
      wan: {
        [GenerationType.TEXT_TO_VIDEO]: "/api/v1/text2video",
        [GenerationType.IMAGE_TO_VIDEO]: "/api/v1/image2video",
        [GenerationType.VIDEO_TO_VIDEO]: "/api/v1/video2video",
        [GenerationType.TEXT_TO_IMAGE]: "/api/v1/text2image",
        [GenerationType.IMAGE_TO_IMAGE]: "/api/v1/image2image",
        [GenerationType.MOTION_CONTROL]: "/api/v1/motion-control",
        // Phase 11.5: Advanced Generation Modes (Wan may not support all)
        [GenerationType.VIDEO_TO_VIDEO_STYLE_TRANSFER]:
          "/api/v1/style-transfer",
        [GenerationType.INPAINTING_OUTPAINTING]:
          "/api/v1/inpainting-outpainting",
        [GenerationType.DEPTH_NORMAL_CONTROL]: "/api/v1/depth-normal-control",
        [GenerationType.MULTI_SHOT_STORYBOARD]: "/api/v1/multi-shot-storyboard",
      },
    };

    return {
      provider: provider.name as "seedance" | "kling" | "wan",
      payload,
      endpoint: endpointMap[provider.name]?.[type] || "/generate",
      method: "POST",
    };
  }

  private async executeWithFallback(
    primaryProvider: AIProvider,
    request: ProviderRequest,
    originalRequest: EnhancedGenerationRequest,
    requestId: string,
    startTime: number,
  ): Promise<ProviderResponse> {
    const fallbackChain = this.getFallbackChain(
      primaryProvider.name,
      originalRequest,
    );
    let lastError: Error = new Error("All providers failed");

    for (const provider of fallbackChain) {
      const breaker = this.circuitBreakers.get(provider.name);

      // Skip if circuit breaker is open
      if (breaker?.isOpen) {
        if (Date.now() - breaker.lastFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
          // Half-open: allow one request
          breaker.isOpen = false;
        } else {
          logger.provider.circuitBreaker(provider.name, "open");
          continue;
        }
      }

      try {
        logger.provider.request(provider.name, originalRequest.type, requestId);

        // Providers expect the structured GenerationRequest shape
        // ({ prompt, type, options, images, video }), not the flat
        // router payload. Wrap it correctly here so buildPayload()
        // and getEndpoint() on each provider actually receive the
        // fields they read from.
        const providerRequest: GenerationRequest = {
          prompt: originalRequest.prompt,
          type: originalRequest.type,
          options: request.payload,
          images: originalRequest.images,
          video: originalRequest.video,
        };

        const response = await provider.generate(providerRequest);

        // Success - reset circuit breaker
        if (breaker) {
          breaker.failures = 0;
          breaker.isOpen = false;
        }

        return this.normalizeResponse(provider.name, response);
      } catch (error) {
        lastError = error as Error;
        logger.provider.error(
          provider.name,
          originalRequest.type,
          requestId,
          error as Error,
        );

        // Record failure
        if (breaker) {
          breaker.failures++;
          breaker.lastFailure = Date.now();
          if (breaker.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
            breaker.isOpen = true;
            logger.provider.circuitBreaker(provider.name, "open");
          }
        }

        // Log the fallback to the next candidate in the chain, if any
        const nextProvider = fallbackChain[fallbackChain.indexOf(provider) + 1];
        if (nextProvider) {
          logger.provider.fallback(
            provider.name,
            nextProvider.name,
            lastError.message,
          );
        }
        continue;
      }
    }

    throw lastError || new Error("All providers failed");
  }

  private getFallbackChain(
    primaryName: string,
    request: EnhancedGenerationRequest,
  ): AIProvider[] {
    const chain: AIProvider[] = [];
    const primary = this.providers.get(primaryName);
    if (primary) chain.push(primary);

    // Add fallbacks in order: Seedance -> Kling -> Wan
    const fallbackOrder = ["seedance", "kling", "wan"];

    for (const name of fallbackOrder) {
      if (name === primaryName) continue;
      const provider = this.providers.get(name);
      if (provider) {
        // Check if provider supports this type
        const caps = PROVIDER_CAPABILITIES.find((c) => c.name === name);
        if (caps?.supportedTypes.includes(request.type)) {
          chain.push(provider);
        }
      }
    }

    return chain;
  }

  private normalizeResponse(
    providerName: string,
    response: any,
  ): ProviderResponse {
    return {
      id:
        response.id ||
        response.generation_id ||
        `${providerName}_${Date.now()}`,
      status: this.mapStatus(response.status),
      progress: response.progress || 0,
      resultUrl:
        response.resultUrl ||
        response.result_url ||
        response.video_url ||
        response.image_url,
      error: response.error,
      metadata: { provider: providerName, ...response.metadata },
    };
  }

  private mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: "queued",
      queued: "queued",
      processing: "processing",
      running: "processing",
      completed: "completed",
      success: "completed",
      failed: "failed",
      error: "failed",
      cancelled: "cancelled",
    };
    return statusMap[status?.toLowerCase()] || "processing";
  }

  async getStatus(providerName: string, id: string): Promise<ProviderResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    const response = await provider.getStatus(id);
    return this.normalizeResponse(providerName, response);
  }

  async waitForCompletion(
    providerName: string,
    id: string,
    maxWaitMs = 300000, // 5 minutes
  ): Promise<ProviderResponse> {
    const startTime = Date.now();
    let delay = 1000; // Start with 1 second

    while (Date.now() - startTime < maxWaitMs) {
      const response = await this.getStatus(providerName, id);

      if (response.status === "completed") {
        return response;
      }
      if (response.status === "failed") {
        throw new Error(response.error || "Generation failed");
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, 30000);
    }

    throw new Error("Generation timeout");
  }

  async cancel(providerName: string, id: string): Promise<void> {
    const provider = this.providers.get(providerName);
    if (provider) {
      await provider.cancel(id);
    }
  }

  /**
   * Lightweight health snapshot per provider — registration status +
   * circuit breaker state. Deliberately does NOT make a live network
   * call to each provider's API on every hit (slow, and some providers
   * bill per request); circuit breaker state is a good-enough proxy
   * for "is this provider currently usable by the router".
   */
  getHealth(): Record<
    string,
    { registered: boolean; circuitOpen: boolean; failures: number }
  > {
    const result: Record<
      string,
      { registered: boolean; circuitOpen: boolean; failures: number }
    > = {};

    for (const cap of PROVIDER_CAPABILITIES) {
      const breaker = this.circuitBreakers.get(cap.name);
      result[cap.name] = {
        registered: this.providers.has(cap.name),
        circuitOpen: breaker?.isOpen ?? false,
        failures: breaker?.failures ?? 0,
      };
    }

    return result;
  }
}

export const providerRouter = new ProviderRouter();
