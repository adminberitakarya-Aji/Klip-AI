import {
  AIProvider,
  ProviderConfig,
  GenerationRequest,
  GenerationResponse,
  GenerationStatus,
  ProviderCapabilities,
} from "../types";
import {
  ReferenceImage,
  ConsistencyConfig,
  CameraControlConfig,
  MotionBrushConfig,
  PhysicsConfig,
} from "../pipeline/types";
import { env } from "@klipai/config";

export abstract class BaseProvider implements AIProvider {
  protected config: ProviderConfig;
  abstract capabilities: ProviderCapabilities;
  abstract name: "seedance" | "kling" | "wan";

  constructor(config: ProviderConfig) {
    this.config = {
      baseUrl: env.AI_PROVIDER_BASE_URL,
      timeout: 300000,
      ...config,
    };
  }

  abstract generate(request: GenerationRequest): Promise<GenerationResponse>;
  abstract getStatus(id: string): Promise<GenerationResponse>;
  abstract cancel(id: string): Promise<void>;

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          ...options.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  protected mapStatus(providerStatus: string): GenerationStatus {
    const statusMap: Record<string, GenerationStatus> = {
      pending: GenerationStatus.QUEUED,
      queued: GenerationStatus.QUEUED,
      processing: GenerationStatus.PROCESSING,
      running: GenerationStatus.PROCESSING,
      completed: GenerationStatus.COMPLETED,
      succeeded: GenerationStatus.COMPLETED,
      failed: GenerationStatus.FAILED,
      error: GenerationStatus.FAILED,
      cancelled: GenerationStatus.FAILED,
    };
    return statusMap[providerStatus.toLowerCase()] || GenerationStatus.FAILED;
  }

  /**
   * Convert camelCase keys to snake_case
   * e.g., "motionStrength" -> "motion_strength"
   */
  protected serializeOptions(
    opts: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    Object.entries(opts).forEach(([key, value]) => {
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      result[snakeKey] = value;
    });
    return result;
  }

  /**
   * Build shared payload components that are common across providers.
   * Providers should call this and then apply their specific overrides.
   */
  protected buildSharedPayload(
    request: GenerationRequest,
    options: Record<string, unknown>,
  ): {
    payload: Record<string, unknown>;
    referenceImages: ReferenceImage[] | undefined;
    consistency: ConsistencyConfig | undefined;
    cameraControl: CameraControlConfig | undefined;
    motionBrush: MotionBrushConfig | undefined;
    physics: PhysicsConfig | undefined;
  } {
    const payload: Record<string, unknown> = { prompt: request.prompt };
    const opts = options;

    // Handle reference images with roles/weights
    let referenceImages: ReferenceImage[] | undefined;
    if (opts.referenceImages && Array.isArray(opts.referenceImages)) {
      referenceImages = opts.referenceImages as ReferenceImage[];
    }

    // Handle consistency config
    let consistency: ConsistencyConfig | undefined;
    if (opts.consistency) {
      consistency = opts.consistency as ConsistencyConfig;
    }

    // Handle camera control
    let cameraControl: CameraControlConfig | undefined;
    if (opts.cameraControl) {
      cameraControl = opts.cameraControl as CameraControlConfig;
    }

    // Handle motion brush
    let motionBrush: MotionBrushConfig | undefined;
    if (opts.motionBrush) {
      motionBrush = opts.motionBrush as MotionBrushConfig;
    }

    // Handle physics config
    let physics: PhysicsConfig | undefined;
    if (opts.physics) {
      physics = opts.physics as PhysicsConfig;
    }

    // Legacy support: simple images array (backward compat)
    if (request.images?.length) {
      payload.image_urls = request.images;
    }
    if (request.video) {
      payload.video_url = request.video;
    }

    return {
      payload,
      referenceImages,
      consistency,
      cameraControl,
      motionBrush,
      physics,
    };
  }
}
