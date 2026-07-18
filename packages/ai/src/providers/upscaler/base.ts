import {
  UpscalerProvider,
  UpscalerConfig,
  FrameInterpolationConfig,
  DenoiseSharpenConfig,
  PostProcessingPipeline,
  UpscalerJobResult,
} from "../../pipeline/types";

export abstract class BaseUpscalerProvider implements UpscalerProvider {
  abstract name: string;
  abstract supportedModels: string[];
  abstract maxResolution: string;
  abstract maxDuration: number;

  protected abstract apiKey: string;
  protected abstract baseUrl: string;

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Upscaler API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return response.json();
  }

  protected mapStatus(status: string): UpscalerJobResult["status"] {
    switch (status.toLowerCase()) {
      case "queued":
      case "pending":
        return "queued";
      case "processing":
      case "running":
        return "processing";
      case "completed":
      case "success":
      case "done":
        return "completed";
      case "failed":
      case "error":
      default:
        return "failed";
    }
  }

  abstract upscale(input: {
    videoUrl: string;
    config: UpscalerConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  abstract interpolate(input: {
    videoUrl: string;
    config: FrameInterpolationConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  abstract denoiseSharpen(input: {
    videoUrl: string;
    config: DenoiseSharpenConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  abstract processPipeline(input: {
    videoUrl: string;
    pipeline: PostProcessingPipeline;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }>;

  abstract getStatus(jobId: string): Promise<UpscalerJobResult>;

  abstract cancel(jobId: string): Promise<void>;

  abstract getModels(): Promise<
    Array<{
      id: string;
      name: string;
      type: "upscale" | "interpolate" | "denoise" | "sharpen";
      maxScale?: number;
      maxFpsMultiplier?: number;
      supportedFormats: string[];
      pricing: { perSecond?: number; perFrame?: number };
    }>
  >;
}
