import { GenerationType, GenerationRequest, GenerationResponse, GenerationStatus } from '@klipai/core/types';

export type { GenerationType, GenerationRequest, GenerationResponse, GenerationStatus } from '@klipai/core/types';
import { env } from '@klipai/config';

export interface AIProvider {
  name: string;
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  getStatus(id: string): Promise<GenerationResponse>;
  cancel(id: string): Promise<void>;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
}

export interface TextToVideoOptions {
  duration?: 6 | 12;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  resolution?: '720p' | '1080p' | '4k';
  fps?: 24 | 30;
  cameraMotion?: 'static' | 'pan' | 'zoom' | 'orbit';
  seed?: number;
}

export interface ImageToVideoOptions {
  motionStrength?: number;
  cameraMotion?: 'static' | 'pan' | 'zoom';
  duration?: 6 | 12;
}

export interface VideoToVideoOptions {
  style?: string;
  strength?: number;
  preserveStructure?: boolean;
}

export interface TextToImageOptions {
  aspectRatio?: '9:16' | '16:9' | '1:1' | '4:3' | '3:4';
  resolution?: '512' | '768' | '1024' | '2048';
  style?: string;
  negativePrompt?: string;
}

export interface ImageToImageOptions {
  strength?: number;
  preserveStructure?: boolean;
  style?: string;
}

export interface MotionControlOptions {
  trajectory?: 'linear' | 'circular' | 'spiral' | 'custom';
  keyframes?: Array<{ time: number; position: [number, number, number]; rotation: [number, number, number] }>;
}