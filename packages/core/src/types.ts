// AI Generation Types
export enum GenerationType {
  TEXT_TO_VIDEO = 'text-to-video',
  IMAGE_TO_VIDEO = 'image-to-video',
  VIDEO_TO_VIDEO = 'video-to-video',
  TEXT_TO_IMAGE = 'text-to-image',
  IMAGE_TO_IMAGE = 'image-to-image',
  MOTION_CONTROL = 'motion-control',
}

export enum GenerationStatus {
  IDLE = 'idle',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Re-export as const for type-only imports if needed
export const GenerationStatusValues = Object.values(GenerationStatus);

export interface GenerationRequest {
  prompt: string;
  type: GenerationType;
  options?: Record<string, unknown>;
  images?: string[]; // base64 or URLs for I2V, V2V, I2I
  video?: string; // for V2V
}

export interface GenerationResponse {
  id: string;
  status: GenerationStatus;
  progress: number;
  resultUrl?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

// User Types - Match Prisma enums exactly (uppercase)
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum Subscription {
  FREE = 'FREE',
  PRO = 'PRO',
  UMKM = 'UMKM',
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  subscription: Subscription;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  name: Subscription;
  price: number;
  creditsPerMonth: number;
  features: string[];
  maxResolution: '720p' | '1080p' | '4k';
  watermark: boolean;
  priorityQueue: boolean;
  teamSeats: number;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}