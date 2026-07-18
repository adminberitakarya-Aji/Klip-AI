import { z } from "zod";
import { GenerationType, GenerationStatus, Role, Subscription } from "./types";

// Reference image schema (NEW - Phase 11.1)
export const referenceImageSchema = z.object({
  url: z.string().url(),
  role: z.enum(["character", "subject", "style", "structure", "face", "pose"]),
  weight: z.number().min(0.1).max(1.0),
  crop: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      width: z.number().min(0).max(1),
      height: z.number().min(0).max(1),
    })
    .optional(),
  maskUrl: z.string().url().optional(),
});

// Consistency config schema (NEW - Phase 11.1)
export const consistencyConfigSchema = z.object({
  identityPreservation: z.enum(["face", "subject", "full", "style"]),
  referenceStrength: z.number().min(0.1).max(1.0).optional(),
  consistencyFrames: z.number().int().positive().optional(),
  blendMode: z.enum(["average", "weighted", "primary"]).optional(),
});

// Motion Brush schema (NEW - Phase 11.2)
export const motionBrushMaskSchema = z.object({
  type: z.enum(["image", "polygon"]),
  imageBase64: z.string().optional(),
  polygon: z.array(z.tuple([z.number(), z.number()])).optional(),
  feather: z.number().min(0).max(1).optional(),
});

export const motionBrushStrokeSchema = z.object({
  id: z.string(),
  mask: motionBrushMaskSchema,
  motionVector: z.tuple([z.number(), z.number(), z.number().optional()]),
  speed: z.number().min(0.1).max(5.0).optional(),
  loop: z.boolean().optional(),
  easing: z
    .enum(["linear", "ease-in", "ease-out", "ease-in-out", "bounce"])
    .optional(),
  timeRange: z
    .tuple([z.number().min(0).max(1), z.number().min(0).max(1)])
    .optional(),
});

export const motionBrushConfigSchema = z.object({
  strokes: z.array(motionBrushStrokeSchema).min(1),
  globalStrength: z.number().min(0.1).max(2.0).optional(),
  useOpticalFlow: z.boolean().optional(),
  temporalSmoothness: z.number().min(0).max(1).optional(),
});

// Camera Control schema (NEW - Phase 11.2)
export const cameraKeyframeSchema = z.object({
  time: z.number().min(0).max(1),
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
  fov: z.number().positive().optional(),
  target: z.tuple([z.number(), z.number(), z.number()]).optional(),
  easing: z.enum(["linear", "ease-in", "ease-out", "ease-in-out"]).optional(),
});

export const cameraShakeConfigSchema = z.object({
  enabled: z.boolean(),
  intensity: z.number().min(0).max(1),
  frequency: z.number().positive(),
  translation: z.tuple([z.number(), z.number(), z.number()]).optional(),
  rotation: z.tuple([z.number(), z.number(), z.number()]).optional(),
  seed: z.number().optional(),
});

export const autoFrameConfigSchema = z.object({
  enabled: z.boolean(),
  subject: z.union([z.number(), z.enum(["center", "auto"])]),
  padding: z.number().min(0).max(1).optional(),
  maxSpeed: z.number().positive().optional(),
  smoothness: z.number().min(0).max(1).optional(),
});

export const depthOfFieldConfigSchema = z.object({
  enabled: z.boolean(),
  focusDistance: z.number().positive().optional(),
  aperture: z.number().positive().optional(),
  autoFocus: z.boolean().optional(),
  focusSubject: z.number().optional(),
});

export const cameraControlConfigSchema = z.object({
  keyframes: z.array(cameraKeyframeSchema).min(1),
  interpolation: z
    .enum(["linear", "bezier", "catmull-rom", "smooth"])
    .optional(),
  defaultFov: z.number().positive().optional(),
  defaultNear: z.number().positive().optional(),
  defaultFar: z.number().positive().optional(),
  shake: cameraShakeConfigSchema.optional(),
  autoFrame: autoFrameConfigSchema.optional(),
  depthOfField: depthOfFieldConfigSchema.optional(),
});

// Physics Config schema (NEW - Phase 11.2)
export const physicsConfigSchema = z.object({
  cloth: z
    .object({
      enabled: z.boolean(),
      targets: z.array(z.string()),
      stiffness: z.number().min(0).max(1).optional(),
      damping: z.number().min(0).max(1).optional(),
      mass: z.number().positive().optional(),
      wind: z
        .object({
          enabled: z.boolean(),
          direction: z.tuple([z.number(), z.number(), z.number()]),
          strength: z.number().min(0).max(10),
          turbulence: z.number().min(0).max(1).optional(),
        })
        .optional(),
      colliders: z
        .array(
          z.object({
            type: z.enum(["sphere", "box", "capsule"]),
            position: z.tuple([z.number(), z.number(), z.number()]),
            size: z.tuple([z.number(), z.number(), z.number()]),
          }),
        )
        .optional(),
    })
    .optional(),
  hair: z
    .object({
      enabled: z.boolean(),
      targets: z.array(z.string()),
      stiffness: z.number().min(0).max(1).optional(),
      damping: z.number().min(0).max(1).optional(),
      length: z.number().positive().optional(),
      segments: z.number().int().positive().optional(),
      gravity: z.tuple([z.number(), z.number(), z.number()]).optional(),
      wind: z
        .object({
          enabled: z.boolean(),
          direction: z.tuple([z.number(), z.number(), z.number()]),
          strength: z.number().positive(),
        })
        .optional(),
    })
    .optional(),
  fluid: z
    .object({
      enabled: z.boolean(),
      domain: z.object({
        min: z.tuple([z.number(), z.number(), z.number()]),
        max: z.tuple([z.number(), z.number(), z.number()]),
        resolution: z.number().int().positive(),
      }),
      viscosity: z.number().min(0).max(1).optional(),
      density: z.number().positive().optional(),
      emitters: z
        .array(
          z.object({
            position: z.tuple([z.number(), z.number(), z.number()]),
            velocity: z.tuple([z.number(), z.number(), z.number()]),
            rate: z.number().positive(),
            radius: z.number().positive(),
          }),
        )
        .optional(),
    })
    .optional(),
  rigidBody: z
    .object({
      enabled: z.boolean(),
      objects: z.array(
        z.object({
          id: z.string(),
          type: z.enum(["box", "sphere", "capsule", "convex", "mesh"]),
          position: z.tuple([z.number(), z.number(), z.number()]),
          rotation: z.tuple([z.number(), z.number(), z.number()]),
          size: z.tuple([z.number(), z.number(), z.number()]).optional(),
          mass: z.number().positive().optional(),
          friction: z.number().min(0).max(1).optional(),
          restitution: z.number().min(0).max(1).optional(),
          isStatic: z.boolean().optional(),
          isKinematic: z.boolean().optional(),
        }),
      ),
    })
    .optional(),
  gravity: z.tuple([z.number(), z.number(), z.number()]).optional(),
  timeStep: z.number().positive().optional(),
  subSteps: z.number().int().positive().optional(),
});

// ============================================
// UPSCALER & QUALITY ENHANCEMENT SCHEMAS (Phase 11.3)
// ============================================

// Upscaler config schema
export const upscalerConfigSchema = z.object({
  model: z.enum([
    "real-esrgan",
    "real-esrgan-anime",
    "topaz",
    "waifu2x",
    "custom",
  ]),
  scale: z.union([z.literal(2), z.literal(4)]),
  targetResolution: z.enum(["720p", "1080p", "4k", "8k"]).optional(),
  faceEnhance: z.boolean().optional(),
  faceEnhanceStrength: z.number().min(0.1).max(1.0).optional(),
  tileSize: z.number().int().nonnegative().optional(),
  tilePad: z.number().int().nonnegative().optional(),
  prePad: z.number().int().nonnegative().optional(),
  fp32: z.boolean().optional(),
  alphaUpscale: z.boolean().optional(),
  modelPath: z.string().optional(),
});

// Frame interpolation config schema
export const frameInterpolationConfigSchema = z.object({
  model: z.enum(["rife", "rife-v4", "film", "gmvf", "custom"]),
  targetFps: z.union([
    z.literal(30),
    z.literal(60),
    z.literal(120),
    z.literal(240),
  ]),
  multiplier: z.union([z.literal(2), z.literal(4), z.literal(8)]).optional(),
  sceneThreshold: z.number().min(0).max(1).optional(),
  flowModel: z.enum(["default", "lightweight", "ensemble"]).optional(),
  tta: z.boolean().optional(),
  upscaleBeforeInterp: z.boolean().optional(),
  modelPath: z.string().optional(),
});

// Denoise config schema
export const denoiseConfigSchema = z.object({
  strength: z.number().min(0.1).max(1.0),
  model: z.enum(["fast", "high-quality", "custom"]).optional(),
  temporal: z.boolean().optional(),
  spatialOnly: z.boolean().optional(),
  modelPath: z.string().optional(),
});

// Sharpen config schema
export const sharpenConfigSchema = z.object({
  strength: z.number().min(0.1).max(1.0),
  method: z.enum(["unsharp-mask", "lanczos", "ai-based", "custom"]),
  radius: z.number().positive().optional(),
  threshold: z.number().min(0).max(1).optional(),
  model: z.string().optional(),
  modelPath: z.string().optional(),
});

// Color enhance config schema
export const colorEnhanceConfigSchema = z.object({
  autoWhiteBalance: z.boolean().optional(),
  autoExposure: z.boolean().optional(),
  contrast: z.number().min(-1).max(1).optional(),
  saturation: z.number().min(-1).max(1).optional(),
  brightness: z.number().min(-1).max(1).optional(),
  gamma: z.number().positive().optional(),
  lutPath: z.string().optional(),
});

// Deblock config schema
export const deblockConfigSchema = z.object({
  enabled: z.boolean(),
  strength: z.number().min(0.1).max(1.0).optional(),
});

// Deflicker config schema
export const deflickerConfigSchema = z.object({
  enabled: z.boolean(),
  windowSize: z.number().int().positive().optional(),
  strength: z.number().min(0).max(1).optional(),
});

// Denoise sharpen config schema
export const denoiseSharpenConfigSchema = z.object({
  denoise: denoiseConfigSchema.optional(),
  sharpen: sharpenConfigSchema.optional(),
  colorEnhance: colorEnhanceConfigSchema.optional(),
  deblock: deblockConfigSchema.optional(),
  deflicker: deflickerConfigSchema.optional(),
});

// Post processing pipeline schema
export const postProcessingPipelineSchema = z.object({
  upscaler: upscalerConfigSchema.optional(),
  frameInterpolation: frameInterpolationConfigSchema.optional(),
  denoiseSharpen: denoiseSharpenConfigSchema.optional(),
  order: z
    .array(z.enum(["upscale", "interpolate", "denoise_sharpen"]))
    .optional(),
  outputFormat: z.enum(["mp4", "webm", "mov", "gif", "prores"]).optional(),
  outputCodec: z.enum(["h264", "h265", "vp9", "av1", "prores"]).optional(),
  outputQuality: z.enum(["low", "medium", "high", "lossless"]).optional(),
  ffmpegArgs: z.array(z.string()).optional(),
});

// Upscaler job result schema
export const upscalerJobResultSchema = z.object({
  id: z.string(),
  status: z.enum(["queued", "processing", "completed", "failed"]),
  progress: z.number().min(0).max(100),
  inputUrl: z.string().url(),
  outputUrl: z.string().url().optional(),
  error: z.string().optional(),
  processingTime: z.number().optional(),
  inputMetadata: z
    .object({
      width: z.number(),
      height: z.number(),
      fps: z.number(),
      duration: z.number(),
      codec: z.string(),
      format: z.string(),
    })
    .optional(),
  outputMetadata: z
    .object({
      width: z.number(),
      height: z.number(),
      fps: z.number(),
      duration: z.number(),
      codec: z.string(),
      format: z.string(),
      filesize: z.number(),
    })
    .optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  completedAt: z.number().optional(),
});

// Upscaler provider models schema
export const upscalerProviderModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["upscale", "interpolate", "denoise", "sharpen"]),
  maxScale: z.number().optional(),
  maxFpsMultiplier: z.number().optional(),
  supportedFormats: z.array(z.string()),
  pricing: z.object({
    perSecond: z.number().optional(),
    perFrame: z.number().optional(),
  }),
});

export const generationRequestSchema = z.object({
  prompt: z.string().min(1).max(4000),
  type: z.nativeEnum(GenerationType),
  options: z.record(z.unknown()).optional(),
  images: z.array(z.string().url()).max(4).optional(),
  video: z.string().url().optional(),
  // NEW: Structured reference images with roles/weights (Phase 11.1)
  referenceImages: z.array(referenceImageSchema).max(8).optional(),
  // NEW: Camera control (Phase 11.2)
  cameraControl: cameraControlConfigSchema.optional(),
  // NEW: Motion brush (Phase 11.2)
  motionBrush: motionBrushConfigSchema.optional(),
  // NEW: Physics config (Phase 11.2)
  physics: physicsConfigSchema.optional(),
  // NEW: Post-processing pipeline (Phase 11.3)
  postProcessing: postProcessingPipelineSchema.optional(),
});

export const generationResponseSchema = z.object({
  id: z.string().cuid(), // Prisma uses cuid, not uuid
  status: z.nativeEnum(GenerationStatus),
  progress: z.number().min(0).max(100),
  resultUrl: z.string().url().optional(),
  error: z.string().optional(),
  createdAt: z.number(),
  completedAt: z.number().optional(),
});

export const userSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().url().nullable(),
  role: z.nativeEnum(Role),
  subscription: z.nativeEnum(Subscription),
  credits: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
