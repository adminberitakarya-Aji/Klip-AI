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

export const generationRequestSchema = z.object({
  prompt: z.string().min(1).max(4000),
  type: z.nativeEnum(GenerationType),
  options: z.record(z.unknown()).optional(),
  images: z.array(z.string().url()).max(4).optional(),
  video: z.string().url().optional(),
  // NEW: Structured reference images with roles/weights (Phase 11.1)
  referenceImages: z.array(referenceImageSchema).max(8).optional(),
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
