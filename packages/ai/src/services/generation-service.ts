import { prisma } from '@klipai/db/client';
import { GenerationType, GenerationStatus, GenerationRequest, GenerationResponse } from '@klipai/core/types';
import { AIProvider } from '../types';
import { TextToVideoProvider } from '../providers/text-to-video';
import { ImageToVideoProvider } from '../providers/image-to-video';
import { VideoToVideoProvider } from '../providers/video-to-video';
import { TextToImageProvider } from '../providers/text-to-image';
import { ImageToImageProvider } from '../providers/image-to-image';
import { MotionControlProvider } from '../providers/motion-control';

class GenerationService {
  private providers: Map<GenerationType, AIProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    const apiKey = process.env.AI_PROVIDER_API_KEY || '';
    const baseUrl = process.env.AI_PROVIDER_BASE_URL || '';

    this.providers.set(GenerationType.TEXT_TO_VIDEO, new TextToVideoProvider({ apiKey, baseUrl }));
    this.providers.set(GenerationType.IMAGE_TO_VIDEO, new ImageToVideoProvider({ apiKey, baseUrl }));
    this.providers.set(GenerationType.VIDEO_TO_VIDEO, new VideoToVideoProvider({ apiKey, baseUrl }));
    this.providers.set(GenerationType.TEXT_TO_IMAGE, new TextToImageProvider({ apiKey, baseUrl }));
    this.providers.set(GenerationType.IMAGE_TO_IMAGE, new ImageToImageProvider({ apiKey, baseUrl }));
    this.providers.set(GenerationType.MOTION_CONTROL, new MotionControlProvider({ apiKey, baseUrl }));
  }

  private getProvider(type: GenerationType): AIProvider {
    const provider = this.providers.get(type);
    if (!provider) throw new Error(`Provider not found for type: ${type}`);
    return provider;
  }

  async createGeneration(userId: string, request: GenerationRequest): Promise<GenerationResponse> {
    // Create DB record
    const generation = await prisma.generation.create({
      data: {
        userId,
        prompt: request.prompt,
        type: request.type.toUpperCase().replace(/-/g, '_') as any,
        status: 'QUEUED',
        options: request.options as any,
        images: request.images || [],
        video: request.video || null,
      },
    });

    // Queue for processing (in production, use a job queue like BullMQ)
    this.processGeneration(generation.id, request).catch(console.error);

    return {
      id: generation.id,
      status: GenerationStatus.QUEUED,
      progress: 0,
      createdAt: generation.createdAt.getTime(),
    };
  }

  async processGeneration(generationId: string, request: GenerationRequest) {
    const provider = this.getProvider(request.type);

    try {
      // Update status to processing
      await prisma.generation.update({
        where: { id: generationId },
        data: { status: 'PROCESSING', progress: 10 },
      });

      // Call provider
      const result = await provider.generate(request);

      // Update with result - save provider's external job ID to providerId field
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: result.status === 'completed' ? 'COMPLETED' : 'FAILED',
          progress: 100,
          resultUrl: result.resultUrl,
          error: result.error,
          providerId: result.id, // Save provider's external job ID
          completedAt: result.status === 'completed' ? new Date() : null,
        },
      });
    } catch (error) {
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  async getGeneration(id: string) {
    return prisma.generation.findUnique({ where: { id } });
  }

  async getUserGenerations(userId: string, page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      prisma.generation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.generation.count({ where: { userId } }),
    ]);

    return { items, total, page, pageSize, hasMore: total > page * pageSize };
  }

  async checkStatus(generationId: string): Promise<GenerationResponse | null> {
    const generation = await prisma.generation.findUnique({ where: { id: generationId } });
    if (!generation) return null;

    // If still processing, check with provider using provider's external job ID
    if (generation.status === 'PROCESSING' || generation.status === 'QUEUED') {
      const provider = this.getProvider(generation.type as GenerationType);
      // Use providerId (external job ID) if available, otherwise fallback to internal ID
      const providerJobId = generation.providerId || generationId;
      const result = await provider.getStatus(providerJobId);
      
      const mappedStatus = result.status.toUpperCase() as 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'IDLE';
      if (mappedStatus !== generation.status) {
        await prisma.generation.update({
          where: { id: generationId },
          data: { status: mappedStatus, progress: result.progress, resultUrl: result.resultUrl },
        });
      }
      return result;
    }

    return {
      id: generation.id,
      status: generation.status.toLowerCase() as GenerationStatus,
      progress: generation.progress,
      resultUrl: generation.resultUrl || undefined,
      error: generation.error || undefined,
      createdAt: generation.createdAt.getTime(),
      completedAt: generation.completedAt?.getTime(),
    };
  }
}

export const generationService = new GenerationService();