import { BaseUpscalerProvider } from "./base";
import {
  UpscalerConfig,
  FrameInterpolationConfig,
  DenoiseSharpenConfig,
  PostProcessingPipeline,
  UpscalerJobResult,
} from "../../pipeline/types";
import { env } from "@klipai/config";

export class RealESRGANProvider extends BaseUpscalerProvider {
  name = "realesrgan" as const;
  supportedModels = [
    "real-esrgan",
    "real-esrgan-anime",
    "realesrgan-x4plus",
    "realesrgan-x4plus-anime",
  ];
  maxResolution = "8k";
  maxDuration = 300; // 5 minutes max

  protected apiKey = env.REALESRGAN_API_KEY || env.UPSCALER_API_KEY || "";
  protected baseUrl =
    env.REALESRGAN_BASE_URL || "https://api.realesrgan.com/v1";

  async upscale(input: {
    videoUrl: string;
    config: UpscalerConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    const payload = {
      input_url: input.videoUrl,
      model: input.config.model,
      scale: input.config.scale,
      ...(input.config.targetResolution && {
        target_resolution: input.config.targetResolution,
      }),
      ...(input.config.faceEnhance !== undefined && {
        face_enhance: input.config.faceEnhance,
      }),
      ...(input.config.faceEnhanceStrength !== undefined && {
        face_enhance_strength: input.config.faceEnhanceStrength,
      }),
      ...(input.config.tileSize !== undefined && {
        tile_size: input.config.tileSize,
      }),
      ...(input.config.tilePad !== undefined && {
        tile_pad: input.config.tilePad,
      }),
      ...(input.config.prePad !== undefined && {
        pre_pad: input.config.prePad,
      }),
      ...(input.config.fp32 !== undefined && {
        fp32: input.config.fp32,
      }),
      ...(input.config.alphaUpscale !== undefined && {
        alpha_upscale: input.config.alphaUpscale,
      }),
      ...(input.config.modelPath && { model_path: input.config.modelPath }),
      ...(input.webhookUrl && { webhook_url: input.webhookUrl }),
    };

    const result = await this.request<{
      job_id: string;
      status_url: string;
    }>("/upscale", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      jobId: result.job_id,
      statusUrl: result.status_url,
    };
  }

  async interpolate(input: {
    videoUrl: string;
    config: FrameInterpolationConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    const payload = {
      input_url: input.videoUrl,
      model: input.config.model,
      target_fps: input.config.targetFps,
      ...(input.config.multiplier && { multiplier: input.config.multiplier }),
      ...(input.config.sceneThreshold !== undefined && {
        scene_threshold: input.config.sceneThreshold,
      }),
      ...(input.config.flowModel && { flow_model: input.config.flowModel }),
      ...(input.config.tta !== undefined && { tta: input.config.tta }),
      ...(input.config.upscaleBeforeInterp !== undefined && {
        upscale_before_interp: input.config.upscaleBeforeInterp,
      }),
      ...(input.config.modelPath && { model_path: input.config.modelPath }),
      ...(input.webhookUrl && { webhook_url: input.webhookUrl }),
    };

    const result = await this.request<{
      job_id: string;
      status_url: string;
    }>("/interpolate", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      jobId: result.job_id,
      statusUrl: result.status_url,
    };
  }

  async denoiseSharpen(input: {
    videoUrl: string;
    config: DenoiseSharpenConfig;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    const payload = {
      input_url: input.videoUrl,
      ...(input.config.denoise && {
        denoise: {
          strength: input.config.denoise.strength,
          ...(input.config.denoise.model && {
            model: input.config.denoise.model,
          }),
          ...(input.config.denoise.temporal !== undefined && {
            temporal: input.config.denoise.temporal,
          }),
          ...(input.config.denoise.spatialOnly !== undefined && {
            spatial_only: input.config.denoise.spatialOnly,
          }),
          ...(input.config.denoise.modelPath && {
            model_path: input.config.denoise.modelPath,
          }),
        },
      }),
      ...(input.config.sharpen && {
        sharpen: {
          strength: input.config.sharpen.strength,
          method: input.config.sharpen.method,
          ...(input.config.sharpen.radius !== undefined && {
            radius: input.config.sharpen.radius,
          }),
          ...(input.config.sharpen.threshold !== undefined && {
            threshold: input.config.sharpen.threshold,
          }),
          ...(input.config.sharpen.model && {
            model: input.config.sharpen.model,
          }),
          ...(input.config.sharpen.modelPath && {
            model_path: input.config.sharpen.modelPath,
          }),
        },
      }),
      ...(input.config.colorEnhance && {
        color_enhance: input.config.colorEnhance,
      }),
      ...(input.config.deblock && { deblock: input.config.deblock }),
      ...(input.config.deflicker && { deflicker: input.config.deflicker }),
      ...(input.webhookUrl && { webhook_url: input.webhookUrl }),
    };

    const result = await this.request<{
      job_id: string;
      status_url: string;
    }>("/denoise-sharpen", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      jobId: result.job_id,
      statusUrl: result.status_url,
    };
  }

  async processPipeline(input: {
    videoUrl: string;
    pipeline: PostProcessingPipeline;
    webhookUrl?: string;
  }): Promise<{ jobId: string; statusUrl: string }> {
    const payload = {
      input_url: input.videoUrl,
      pipeline: {
        ...(input.pipeline.upscaler && {
          upscaler: this.mapUpscalerConfig(input.pipeline.upscaler),
        }),
        ...(input.pipeline.frameInterpolation && {
          frame_interpolation: this.mapFrameInterpolationConfig(
            input.pipeline.frameInterpolation,
          ),
        }),
        ...(input.pipeline.denoiseSharpen && {
          denoise_sharpen: this.mapDenoiseSharpenConfig(
            input.pipeline.denoiseSharpen,
          ),
        }),
        ...(input.pipeline.order && { order: input.pipeline.order }),
        ...(input.pipeline.outputFormat && {
          output_format: input.pipeline.outputFormat,
        }),
        ...(input.pipeline.outputCodec && {
          output_codec: input.pipeline.outputCodec,
        }),
        ...(input.pipeline.outputQuality && {
          output_quality: input.pipeline.outputQuality,
        }),
        ...(input.pipeline.ffmpegArgs && {
          ffmpeg_args: input.pipeline.ffmpegArgs,
        }),
      },
      ...(input.webhookUrl && { webhook_url: input.webhookUrl }),
    };

    const result = await this.request<{
      job_id: string;
      status_url: string;
    }>("/process-pipeline", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      jobId: result.job_id,
      statusUrl: result.status_url,
    };
  }

  async getStatus(jobId: string): Promise<UpscalerJobResult> {
    const result = await this.request<{
      job_id: string;
      status: string;
      progress: number;
      output_url?: string;
      error?: string;
      processing_time?: number;
      input_metadata?: UpscalerJobResult["inputMetadata"];
      output_metadata?: UpscalerJobResult["outputMetadata"];
      created_at: number;
      updated_at: number;
      completed_at?: number;
    }>(`/jobs/${jobId}/status`);

    return {
      id: result.job_id,
      status: this.mapStatus(result.status),
      progress: result.progress,
      inputUrl: "", // Not returned by status endpoint
      outputUrl: result.output_url,
      error: result.error,
      processingTime: result.processing_time,
      inputMetadata: result.input_metadata,
      outputMetadata: result.output_metadata,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      completedAt: result.completed_at,
    };
  }

  async cancel(jobId: string): Promise<void> {
    await this.request(`/jobs/${jobId}/cancel`, { method: "POST" });
  }

  async getModels(): Promise<
    Array<{
      id: string;
      name: string;
      type: "upscale" | "interpolate" | "denoise" | "sharpen";
      maxScale?: number;
      maxFpsMultiplier?: number;
      supportedFormats: string[];
      pricing: { perSecond?: number; perFrame?: number };
    }>
  > {
    const result = await this.request<{
      models: Array<{
        id: string;
        name: string;
        type: "upscale" | "interpolate" | "denoise" | "sharpen";
        max_scale?: number;
        max_fps_multiplier?: number;
        supported_formats: string[];
        pricing: { per_second?: number; per_frame?: number };
      }>;
    }>("/models");

    return result.models.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      maxScale: m.max_scale,
      maxFpsMultiplier: m.max_fps_multiplier,
      supportedFormats: m.supported_formats,
      pricing: {
        perSecond: m.pricing.per_second,
        perFrame: m.pricing.per_frame,
      },
    }));
  }

  private mapUpscalerConfig(config: UpscalerConfig): Record<string, unknown> {
    return {
      model: config.model,
      scale: config.scale,
      ...(config.targetResolution && {
        target_resolution: config.targetResolution,
      }),
      ...(config.faceEnhance !== undefined && {
        face_enhance: config.faceEnhance,
      }),
      ...(config.faceEnhanceStrength !== undefined && {
        face_enhance_strength: config.faceEnhanceStrength,
      }),
      ...(config.tileSize !== undefined && { tile_size: config.tileSize }),
      ...(config.tilePad !== undefined && { tile_pad: config.tilePad }),
      ...(config.prePad !== undefined && { pre_pad: config.prePad }),
      ...(config.fp32 !== undefined && { fp32: config.fp32 }),
      ...(config.alphaUpscale !== undefined && {
        alpha_upscale: config.alphaUpscale,
      }),
      ...(config.modelPath && { model_path: config.modelPath }),
    };
  }

  private mapFrameInterpolationConfig(
    config: FrameInterpolationConfig,
  ): Record<string, unknown> {
    return {
      model: config.model,
      target_fps: config.targetFps,
      ...(config.multiplier && { multiplier: config.multiplier }),
      ...(config.sceneThreshold !== undefined && {
        scene_threshold: config.sceneThreshold,
      }),
      ...(config.flowModel && { flow_model: config.flowModel }),
      ...(config.tta !== undefined && { tta: config.tta }),
      ...(config.upscaleBeforeInterp !== undefined && {
        upscale_before_interp: config.upscaleBeforeInterp,
      }),
      ...(config.modelPath && { model_path: config.modelPath }),
    };
  }

  private mapDenoiseSharpenConfig(
    config: DenoiseSharpenConfig,
  ): Record<string, unknown> {
    return {
      ...(config.denoise && {
        denoise: {
          strength: config.denoise.strength,
          ...(config.denoise.model && { model: config.denoise.model }),
          ...(config.denoise.temporal !== undefined && {
            temporal: config.denoise.temporal,
          }),
          ...(config.denoise.spatialOnly !== undefined && {
            spatial_only: config.denoise.spatialOnly,
          }),
          ...(config.denoise.modelPath && {
            model_path: config.denoise.modelPath,
          }),
        },
      }),
      ...(config.sharpen && {
        sharpen: {
          strength: config.sharpen.strength,
          method: config.sharpen.method,
          ...(config.sharpen.radius !== undefined && {
            radius: config.sharpen.radius,
          }),
          ...(config.sharpen.threshold !== undefined && {
            threshold: config.sharpen.threshold,
          }),
          ...(config.sharpen.model && { model: config.sharpen.model }),
          ...(config.sharpen.modelPath && {
            model_path: config.sharpen.modelPath,
          }),
        },
      }),
      ...(config.colorEnhance && { color_enhance: config.colorEnhance }),
      ...(config.deblock && { deblock: config.deblock }),
      ...(config.deflicker && { deflicker: config.deflicker }),
    };
  }
}
