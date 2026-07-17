import { BaseProvider } from "./base";
import {
  ProviderConfig,
  GenerationRequest,
  GenerationResponse,
  GenerationType,
  GenerationStatus,
} from "../types";
import { ProviderCapabilities } from "../pipeline/types";
import { env } from "@klipai/config";

export class WanProvider extends BaseProvider {
  name = "wan" as const;

  capabilities: ProviderCapabilities = {
    name: "wan",
    supportedTypes: [
      GenerationType.TEXT_TO_VIDEO,
      GenerationType.IMAGE_TO_VIDEO,
      GenerationType.TEXT_TO_IMAGE,
    ],
    maxDuration: 6,
    maxResolution: "720p",
    pricing: { perSecond: 0.05, perImage: 0.008 },
    strengths: ["fast", "cheap"],
    weaknesses: ["limited types", "lower quality"],
  };

  constructor(config?: Partial<ProviderConfig>) {
    super({
      apiKey:
        config?.apiKey || env.WAN_API_KEY || env.AI_PROVIDER_API_KEY || "",
      baseUrl: config?.baseUrl || env.WAN_BASE_URL || "https://api.wan.video",
      ...config,
    });
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const payload = this.buildPayload(request);
    const endpoint = this.getEndpoint(request.type);

    const result = await this.request<{
      id: string;
      status: string;
      video_url?: string;
      image_url?: string;
    }>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      id: result.id,
      status: this.mapStatus(result.status),
      progress:
        result.status === "completed"
          ? 100
          : result.status === "processing"
            ? 50
            : 0,
      resultUrl: result.video_url || result.image_url,
      error: result.status === "failed" ? "Generation failed" : undefined,
      createdAt: Date.now(),
    };
  }

  async getStatus(id: string): Promise<GenerationResponse> {
    const result = await this.request<{
      id: string;
      status: string;
      progress: number;
      video_url?: string;
      image_url?: string;
      error?: string;
    }>(`/api/v1/generate/${id}/status`);

    return {
      id: result.id,
      status: this.mapStatus(result.status),
      progress: result.progress,
      resultUrl: result.video_url || result.image_url,
      error: result.error,
      createdAt: Date.now(),
    };
  }

  async cancel(id: string): Promise<void> {
    await this.request(`/api/v1/generate/${id}/cancel`, { method: "POST" });
  }

  private getEndpoint(type: GenerationType): string {
    const endpoints: Record<GenerationType, string> = {
      [GenerationType.TEXT_TO_VIDEO]: "/api/v1/text2video",
      [GenerationType.IMAGE_TO_VIDEO]: "/api/v1/image2video",
      [GenerationType.VIDEO_TO_VIDEO]: "/api/v1/video2video",
      [GenerationType.TEXT_TO_IMAGE]: "/api/v1/text2image",
      [GenerationType.IMAGE_TO_IMAGE]: "/api/v1/image2image",
      [GenerationType.MOTION_CONTROL]: "/api/v1/motion-control",
    };
    return endpoints[type];
  }

  private buildPayload(request: GenerationRequest): Record<string, unknown> {
    const { prompt, type, options, images, video } = request;
    const payload: Record<string, unknown> = { prompt };

    if (options) {
      const opts = options as Record<string, unknown>;
      Object.entries(opts).forEach(([key, value]) => {
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        payload[snakeKey] = value;
      });
    }

    if (images?.length) {
      payload.image_urls = images;
    }
    if (video) {
      payload.video_url = video;
    }

    return payload;
  }
}
