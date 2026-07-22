import { BaseProvider } from "./base";
import {
  ProviderConfig,
  GenerationRequest,
  GenerationResponse,
  GenerationType,
  GenerationStatus,
} from "../types";
import {
  ProviderCapabilities,
  ReferenceImage,
  ConsistencyConfig,
  CameraControlConfig,
  MotionBrushConfig,
  PhysicsConfig,
} from "../pipeline/types";
import { env } from "@klipai/config";

export class KlingProvider extends BaseProvider {
  name = "kling" as const;

  capabilities: ProviderCapabilities = {
    name: "kling",
    supportedTypes: [
      GenerationType.TEXT_TO_VIDEO,
      GenerationType.IMAGE_TO_VIDEO,
      GenerationType.VIDEO_TO_VIDEO,
      GenerationType.TEXT_TO_IMAGE,
      GenerationType.IMAGE_TO_IMAGE,
      GenerationType.MOTION_CONTROL,
      // Phase 11.5: Advanced Generation Modes
      GenerationType.VIDEO_TO_VIDEO_STYLE_TRANSFER,
      GenerationType.INPAINTING_OUTPAINTING,
      GenerationType.DEPTH_NORMAL_CONTROL,
      GenerationType.MULTI_SHOT_STORYBOARD,
    ],
    maxDuration: 15,
    maxResolution: "1080p",
    pricing: { perSecond: 0.1, perImage: 0.015 },
    strengths: [
      "speed",
      "motion control",
      "physics",
      "style_transfer",
      "inpainting",
    ],
    weaknesses: ["lower resolution"],
  };

  constructor(config?: Partial<ProviderConfig>) {
    super({
      apiKey:
        config?.apiKey || env.KLING_API_KEY || env.AI_PROVIDER_API_KEY || "",
      baseUrl: config?.baseUrl || env.KLING_BASE_URL || "https://api.kling.ai",
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
    }>(`/v1/generate/${id}/status`);

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
    await this.request(`/v1/generate/${id}/cancel`, { method: "POST" });
  }

  private getEndpoint(type: GenerationType): string {
    const endpoints: Record<GenerationType, string> = {
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
      [GenerationType.DEPTH_NORMAL_CONTROL]: "/v1/videos/depth-normal-control",
      [GenerationType.MULTI_SHOT_STORYBOARD]:
        "/v1/videos/multi-shot-storyboard",
    };
    return endpoints[type];
  }

  private buildPayload(request: GenerationRequest): Record<string, unknown> {
    const { prompt, type, options, images, video } = request;
    const payload: Record<string, unknown> = { prompt };

    if (options) {
      const opts = options as Record<string, unknown>;
      // Use base class shared logic
      const shared = this.buildSharedPayload(request, opts);
      Object.assign(payload, shared.payload);

      // Handle reference images with roles/weights (NEW - Phase 11.1)
      if (shared.referenceImages) {
        payload.reference_images = shared.referenceImages.map((ref) => ({
          url: ref.url,
          role: ref.role,
          weight: ref.weight,
          ...(ref.crop && { crop: ref.crop }),
          ...(ref.maskUrl && { mask_url: ref.maskUrl }),
        }));
      }

      // Handle consistency config (NEW - Phase 11.1)
      if (shared.consistency) {
        payload.identity_preservation = shared.consistency.identityPreservation;
        if (shared.consistency.referenceStrength !== undefined) {
          payload.reference_strength = shared.consistency.referenceStrength;
        }
        if (shared.consistency.consistencyFrames !== undefined) {
          payload.consistency_frames = shared.consistency.consistencyFrames;
        }
        if (shared.consistency.blendMode) {
          payload.blend_mode = shared.consistency.blendMode;
        }
      }

      // Handle camera control (NEW - Phase 11.2)
      if (shared.cameraControl) {
        payload.camera_control = {
          keyframes: shared.cameraControl.keyframes.map((kf) => ({
            time: kf.time,
            position: kf.position,
            rotation: kf.rotation,
            ...(kf.fov !== undefined && { fov: kf.fov }),
            ...(kf.target && { target: kf.target }),
            ...(kf.easing && { easing: kf.easing }),
          })),
          ...(shared.cameraControl.interpolation && {
            interpolation: shared.cameraControl.interpolation,
          }),
          ...(shared.cameraControl.defaultFov && {
            default_fov: shared.cameraControl.defaultFov,
          }),
          ...(shared.cameraControl.defaultNear && {
            default_near: shared.cameraControl.defaultNear,
          }),
          ...(shared.cameraControl.defaultFar && {
            default_far: shared.cameraControl.defaultFar,
          }),
          ...(shared.cameraControl.shake && {
            shake: shared.cameraControl.shake,
          }),
          ...(shared.cameraControl.autoFrame && {
            auto_frame: shared.cameraControl.autoFrame,
          }),
          ...(shared.cameraControl.depthOfField && {
            depth_of_field: shared.cameraControl.depthOfField,
          }),
        };
      }

      // Handle motion brush (NEW - Phase 11.2)
      if (shared.motionBrush) {
        payload.motion_brush = {
          strokes: shared.motionBrush.strokes.map((stroke) => ({
            id: stroke.id,
            mask: stroke.mask,
            motion_vector: stroke.motionVector,
            ...(stroke.speed !== undefined && { speed: stroke.speed }),
            ...(stroke.loop !== undefined && { loop: stroke.loop }),
            ...(stroke.easing && { easing: stroke.easing }),
            ...(stroke.timeRange && { time_range: stroke.timeRange }),
          })),
          ...(shared.motionBrush.globalStrength !== undefined && {
            global_strength: shared.motionBrush.globalStrength,
          }),
          ...(shared.motionBrush.useOpticalFlow !== undefined && {
            use_optical_flow: shared.motionBrush.useOpticalFlow,
          }),
          ...(shared.motionBrush.temporalSmoothness !== undefined && {
            temporal_smoothness: shared.motionBrush.temporalSmoothness,
          }),
        };
      }

      // Handle physics config (NEW - Phase 11.2)
      if (shared.physics) {
        payload.physics = shared.physics;
      }

      // ============================================
      // PHASE 11.5: Advanced Generation Modes
      // ============================================
      switch (type) {
        case GenerationType.VIDEO_TO_VIDEO_STYLE_TRANSFER: {
          // Style transfer specific params
          if (opts.styleReference)
            payload.style_reference = opts.styleReference;
          if (opts.strength !== undefined) payload.strength = opts.strength;
          if (opts.mode) payload.mode = opts.mode;
          if (opts.preserveStructure !== undefined)
            payload.preserve_structure = opts.preserveStructure;
          if (opts.controlNetConditioning)
            payload.controlnet_conditioning = opts.controlNetConditioning;
          if (opts.controlNetStrength !== undefined)
            payload.controlnet_strength = opts.controlNetStrength;
          if (opts.consistencyFrames !== undefined)
            payload.consistency_frames = opts.consistencyFrames;
          if (opts.loraPath) payload.lora_path = opts.loraPath;
          if (opts.loraScale !== undefined) payload.lora_scale = opts.loraScale;
          break;
        }
        case GenerationType.INPAINTING_OUTPAINTING: {
          if (opts.mode) payload.mode = opts.mode;
          if (opts.inputUrl) payload.input_url = opts.inputUrl;
          if (opts.maskUrl) payload.mask_url = opts.maskUrl;
          if (opts.outpaint) payload.outpaint = opts.outpaint;
          if (opts.prompt) payload.prompt = opts.prompt;
          if (opts.negativePrompt)
            payload.negative_prompt = opts.negativePrompt;
          if (opts.strength !== undefined) payload.strength = opts.strength;
          if (opts.variations !== undefined)
            payload.variations = opts.variations;
          if (opts.blendMode) payload.blend_mode = opts.blendMode;
          if (opts.featherAmount !== undefined)
            payload.feather_amount = opts.featherAmount;
          if (opts.controlNetConditioning)
            payload.controlnet_conditioning = opts.controlNetConditioning;
          if (opts.controlNetStrength !== undefined)
            payload.controlnet_strength = opts.controlNetStrength;
          break;
        }
        case GenerationType.DEPTH_NORMAL_CONTROL: {
          if (opts.inputType) payload.input_type = opts.inputType;
          if (opts.inputUrl) payload.input_url = opts.inputUrl;
          if (opts.strength !== undefined) payload.strength = opts.strength;
          if (opts.guidanceScale !== undefined)
            payload.guidance_scale = opts.guidanceScale;
          if (opts.temporalConsistency !== undefined)
            payload.temporal_consistency = opts.temporalConsistency;
          if (opts.consistencyFrames !== undefined)
            payload.consistency_frames = opts.consistencyFrames;
          break;
        }
        case GenerationType.MULTI_SHOT_STORYBOARD: {
          if (opts.brief) payload.brief = opts.brief;
          if (opts.shotCount !== undefined) payload.shot_count = opts.shotCount;
          if (opts.shotDuration !== undefined)
            payload.shot_duration = opts.shotDuration;
          if (opts.totalDuration !== undefined)
            payload.total_duration = opts.totalDuration;
          if (opts.aspectRatio) payload.aspect_ratio = opts.aspectRatio;
          if (opts.style) payload.style = opts.style;
          if (opts.shotTypes) payload.shot_types = opts.shotTypes;
          if (opts.cameraMovements)
            payload.camera_movements = opts.cameraMovements;
          if (opts.characterReference)
            payload.character_reference = opts.characterReference;
          if (opts.autoEdit) payload.auto_edit = opts.autoEdit;
          if (opts.outputFormat) payload.output_format = opts.outputFormat;
          break;
        }
      }
    }

    // Legacy support: simple images array (backward compat)
    if (images?.length) {
      payload.image_urls = images;
    }
    if (video) {
      payload.video_url = video;
    }

    return payload;
  }
}
