import {
  GenerationType,
  GenerationRequest,
  GenerationResponse,
  GenerationStatus,
} from "@klipai/core/types";

// ============================================
// REFERENCE IMAGE SYSTEM (NEW - Phase 11.1)
// ============================================

export interface ReferenceImage {
  url: string; // Base64 data URL or HTTPS URL
  role: "character" | "subject" | "style" | "structure" | "face" | "pose";
  weight: number; // 0.1 - 1.0, influence strength
  // Optional: crop/region of interest
  crop?: {
    x: number; // 0-1 normalized
    y: number;
    width: number;
    height: number;
  };
  // Optional: mask for inpainting-style control
  maskUrl?: string;
}

export interface ConsistencyConfig {
  // Identity preservation mode
  identityPreservation: "face" | "subject" | "full" | "style";
  // Reference strength (overrides individual ReferenceImage.weight if set)
  referenceStrength?: number; // 0.1 - 1.0
  // Number of frames to enforce temporal consistency
  consistencyFrames?: number; // e.g., 8, 16, 24
  // For multi-reference: how to blend
  blendMode?: "average" | "weighted" | "primary";
}

// ============================================
// ENHANCED GENERATION REQUEST (Output from Claude Orchestrator)
// ============================================

export interface EnhancedGenerationRequest {
  // Core prompt
  prompt: string;
  negativePrompt?: string;

  // Type & structured params (type-specific)
  type: GenerationType;

  // Reference inputs (carried through from the original request)
  images?: string[]; // Legacy: simple URLs (backward compat)
  video?: string; // Legacy: single video URL (backward compat)

  // NEW: Structured reference images with roles/weights
  referenceImages?: ReferenceImage[];

  // Type-specific structured params
  params:
    | TextToVideoParams
    | ImageToVideoParams
    | VideoToVideoParams
    | TextToImageParams
    | ImageToImageParams
    | MotionControlParams;

  // Metadata for routing & optimization
  metadata: {
    complexity: "simple" | "storyboard" | "complex";
    recommendedProvider: "seedance" | "kling" | "wan";
    estimatedDuration: number; // seconds
    requiresConsistency: boolean;
    priority: "speed" | "quality" | "cost";
    // NEW: Consistency configuration
    consistency?: ConsistencyConfig;
  };
}

// ============================================
// TYPE-SPECIFIC STRUCTURED PARAMS (Extended)
// ============================================

export interface TextToVideoParams {
  duration: 6 | 12 | 15;
  aspectRatio: "9:16" | "16:9" | "1:1";
  resolution: "720p" | "1080p" | "4k";
  fps: 24 | 30;
  cameraMotion: "static" | "pan" | "zoom" | "orbit" | "handheld";
  seed?: number;
  // Storyboard support
  scenes?: Array<{
    timeRange: string; // "0-3s"
    description: string; // "Hero shot produk"
    camera: string; // "slow push in"
    lighting?: string; // "soft key light"
  }>;
  // NEW: Consistency for text-to-video (character generation)
  consistency?: ConsistencyConfig;
}

export interface ImageToVideoParams {
  motionStrength: number; // 0.1 - 1.0
  cameraMotion: "static" | "pan" | "zoom" | "orbit";
  duration: 6 | 12 | 15;
  // Start/end frame control
  endImage?: string; // Optional end frame
  // NEW: Reference images for character consistency in I2V
  referenceImages?: ReferenceImage[];
  consistency?: ConsistencyConfig;
}

export interface VideoToVideoParams {
  style: string; // Style reference / prompt
  strength: number; // 0.1 - 1.0
  preserveStructure: boolean; // ControlNet-style
  // Temporal consistency
  consistencyFrames?: number;
  // NEW: Reference for identity preservation during style transfer
  referenceImages?: ReferenceImage[];
  consistency?: ConsistencyConfig;
}

export interface TextToImageParams {
  aspectRatio: "9:16" | "16:9" | "1:1" | "4:3" | "3:4";
  resolution: "512" | "768" | "1024" | "2048";
  style?: string;
  negativePrompt?: string;
  // Batch
  batchSize?: number; // 1-4
  // NEW: Reference for character consistency in T2I
  referenceImages?: ReferenceImage[];
  consistency?: ConsistencyConfig;
}

export interface ImageToImageParams {
  strength: number; // 0.1 - 1.0
  preserveStructure: boolean;
  style?: string;
  // Mask support
  mask?: string; // Base64 mask for inpainting
  // NEW: Reference images for consistency
  referenceImages?: ReferenceImage[];
  consistency?: ConsistencyConfig;
}

export interface MotionControlParams {
  trajectory:
    "linear" | "circular" | "spiral" | "custom" | "orbit" | "dolly" | "crane";
  keyframes: Array<{
    time: number; // 0-1 normalized
    position: [number, number, number]; // x, y, z
    rotation: [number, number, number]; // pitch, yaw, roll
    fov?: number; // Field of view
  }>;
  // Subject tracking
  subjectPosition?: [number, number, number];
  // NEW: Reference for subject tracking
  referenceImages?: ReferenceImage[];
  consistency?: ConsistencyConfig;
}

// ============================================
// PROVIDER CAPABILITIES
// ============================================

export interface ProviderCapabilities {
  name: "seedance" | "kling" | "wan";
  supportedTypes: GenerationType[];
  maxDuration: number; // seconds
  maxResolution: string;
  pricing: { perSecond?: number; perImage?: number };
  strengths: string[]; // ['cinematic', 'physics', 'consistency']
  weaknesses: string[]; // ['slow', 'expensive']
  // NEW: Consistency feature support per provider
  consistencyFeatures?: {
    ipAdapter?: boolean; // IP-Adapter / reference image conditioning
    controlNet?: boolean; // ControlNet support
    faceId?: boolean; // FaceID / identity preservation
    subjectConsistency?: boolean; // Subject consistency (non-face)
    temporalConsistency?: boolean; // Frame-to-frame consistency
  };
}

export const PROVIDER_CAPABILITIES: ProviderCapabilities[] = [
  {
    name: "seedance",
    supportedTypes: [
      GenerationType.TEXT_TO_VIDEO,
      GenerationType.IMAGE_TO_VIDEO,
      GenerationType.VIDEO_TO_VIDEO,
      GenerationType.TEXT_TO_IMAGE,
      GenerationType.IMAGE_TO_IMAGE,
      GenerationType.MOTION_CONTROL,
    ],
    maxDuration: 15,
    maxResolution: "4k",
    pricing: { perSecond: 0.15, perImage: 0.02 },
    strengths: ["cinematic quality", "physics", "consistency", "storyboard"],
    weaknesses: ["slower", "higher cost"],
    consistencyFeatures: {
      ipAdapter: true,
      controlNet: true,
      faceId: true,
      subjectConsistency: true,
      temporalConsistency: true,
    },
  },
  {
    name: "kling",
    supportedTypes: [
      GenerationType.TEXT_TO_VIDEO,
      GenerationType.IMAGE_TO_VIDEO,
      GenerationType.VIDEO_TO_VIDEO,
      GenerationType.TEXT_TO_IMAGE,
      GenerationType.IMAGE_TO_IMAGE,
      GenerationType.MOTION_CONTROL,
    ],
    maxDuration: 15,
    maxResolution: "1080p",
    pricing: { perSecond: 0.1, perImage: 0.015 },
    strengths: ["speed", "motion control", "physics"],
    weaknesses: ["lower resolution"],
    consistencyFeatures: {
      ipAdapter: true,
      controlNet: true,
      faceId: false,
      subjectConsistency: true,
      temporalConsistency: true,
    },
  },
  {
    name: "wan",
    supportedTypes: [
      GenerationType.TEXT_TO_VIDEO,
      GenerationType.IMAGE_TO_VIDEO,
      GenerationType.TEXT_TO_IMAGE,
    ],
    maxDuration: 15,
    maxResolution: "720p",
    pricing: { perSecond: 0.05, perImage: 0.008 },
    strengths: ["fast", "cheap"],
    weaknesses: ["limited types", "lower quality"],
    consistencyFeatures: {
      ipAdapter: false,
      controlNet: false,
      faceId: false,
      subjectConsistency: false,
      temporalConsistency: false,
    },
  },
];

// ============================================
// PIPELINE CONTEXT
// ============================================

export interface PipelineContext {
  generationId: string;
  userId: string;
  brief: string;
  type: GenerationType;
  images?: string[];
  video?: string;
  referenceImages?: ReferenceImage[]; // NEW
  userPreferences?: {
    style?: "cinematic" | "commercial" | "social" | "artistic";
    duration?: number;
    aspectRatio?: string;
  };
}

// ============================================
// PROMPT ENHANCER INPUT/OUTPUT
// ============================================

export interface PromptEnhancerInput {
  brief: string;
  type: GenerationType;
  images?: string[]; // Legacy
  video?: string; // Legacy
  referenceImages?: ReferenceImage[]; // NEW
  userPreferences?: {
    style?: "cinematic" | "commercial" | "social" | "artistic";
    duration?: number;
    aspectRatio?: string;
  };
}

export type PromptEnhancerOutput = EnhancedGenerationRequest;

// ============================================
// PROVIDER REQUEST/RESPONSE (Internal format)
// ============================================

export interface ProviderRequest {
  provider: "seedance" | "kling" | "wan";
  payload: Record<string, unknown>;
  endpoint: string;
  method: "POST" | "GET";
}

export interface ProviderResponse {
  id: string;
  status: string;
  progress?: number;
  resultUrl?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Re-export GenerationType for consumers
export { GenerationType } from "@klipai/core/types";
