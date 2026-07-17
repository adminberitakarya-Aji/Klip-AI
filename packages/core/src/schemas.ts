import { z } from 'zod';
import { GenerationType, GenerationStatus, Role, Subscription } from './types';

export const generationRequestSchema = z.object({
  prompt: z.string().min(1).max(4000),
  type: z.nativeEnum(GenerationType),
  options: z.record(z.unknown()).optional(),
  images: z.array(z.string().url()).max(4).optional(),
  video: z.string().url().optional(),
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
