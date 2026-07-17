import {
  GenerationType,
  GenerationRequest,
  GenerationResponse,
  GenerationStatus,
} from "@klipai/core/types";

// ============================================
// ENHANCED GENERATION REQUEST (Output from Claude Orchestrator)
// ============================================

export interface EnhancedGenerationRequest {
  // Core prompt
  prompt: string;
  negativePrompt?: string;

  // Type & structured params (type-specific)
  type: GenerationType;
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
    estimatedDuration: number;
    requiresConsistency: boolean;
    priority: "speed" | "quality" | "cost";
  };
}

// ============================================
// TYPE-SPECIFIC STRUCTURED PARAMS
// ============================================

export interface TextToVideoParams {
  duration: 6 | 12;
  aspectRatio: "9:16" | "16:9" | "1:1";
  resolution: "720p" | "1080p" | "4k";
  fps: 24 | 30;
  cameraMotion: "static" | "pan" | "zoom" | "orbit" | "handheld";
  seed?: number;
  // Storyboard support
  scenes?: Array<{
    timeRange: string;
    description: string;
    camera: string;
    lighting?: string;
  }>;
}

export interface ImageToVideoParams {
  motionStrength: number;
  cameraMotion: "static" | "pan" | "zoom" | "orbit";
  duration: 6 | 12;
  endImage?: string;
}

export interface VideoToVideoParams {
  style: string;
  strength: number;
  preserveStructure: boolean;
  consistencyFrames?: number;
}

export interface TextToImageParams {
  aspectRatio: "9:16" | "16:9" | "1:1" | "4:3" | "3:4";
  resolution: "512" | "768" | "1024" | "2048";
  style?: string;
  negativePrompt?: string;
  batchSize?: number;
}

export interface ImageToImageParams {
  strength: number;
  preserveStructure: boolean;
  style?: string;
  mask?: string;
}

export interface MotionControlParams {
  trajectory:
    "linear" | "circular" | "spiral" | "custom" | "orbit" | "dolly" | "crane";
  keyframes: Array<{
    time: number;
    position: [number, number, number];
    rotation: [number, number, number];
    fov?: number;
  }>;
  subjectPosition?: [number, number, number];
}

// ============================================
// PROVIDER CAPABILITIES
// ============================================

export interface ProviderCapabilities {
  name: "seedance" | "kling" | "wan";
  supportedTypes: GenerationType[];
  maxDuration: number;
  maxResolution: string;
  pricing: { perSecond?: number; perImage?: number };
  strengths: string[];
  weaknesses: string[];
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
    maxDuration: 12,
    maxResolution: "4k",
    pricing: { perSecond: 0.15, perImage: 0.02 },
    strengths: ["cinematic quality", "physics", "consistency", "storyboard"],
    weaknesses: ["slower", "higher cost"],
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
    maxDuration: 10,
    maxResolution: "1080p",
    pricing: { perSecond: 0.1, perImage: 0.015 },
    strengths: ["speed", "motion control", "physics"],
    weaknesses: ["lower resolution"],
  },
  {
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
  images?: string[];
  video?: string;
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
