import {
  PromptEnhancerInput,
  EnhancedGenerationRequest,
  ProviderResponse,
  GenerationType,
} from "../pipeline/types";
import { PromptEnhancer } from "./prompt-enhancer";
import { providerRouter } from "./provider-router";
import { PipelineOrchestrator } from "./pipeline-orchestrator";
import { initializeProviders } from "../providers";
import {
  GenerationRequest,
  GenerationResponse,
  GenerationStatus,
} from "../types";
import { prisma } from "@klipai/db/client";
import { logger } from "@klipai/core/logger";
import { createStorageProvider } from "./storage";
import { StorageProvider } from "@klipai/core/storage";

export interface GenerationJob {
  id: string;
  brief: string;
  type: GenerationType;
  images?: string[];
  video?: string;
  // NEW: Structured reference images with roles/weights (Phase 11.1)
  referenceImages?: import("../pipeline/types").ReferenceImage[];
  userPreferences?: {
    style?: "cinematic" | "commercial" | "social" | "artistic";
    duration?: number;
    aspectRatio?: string;
  };
  status: GenerationStatus;
  progress: number;
  resultUrl?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export class GenerationService {
  private promptEnhancer: PromptEnhancer;
  private orchestrator: PipelineOrchestrator;
  private jobs: Map<string, GenerationJob> = new Map();
  private storage: StorageProvider;

  // Dead letter queue: a FAILED generation can be retried this many
  // times (via retryFailedGeneration) before it's considered
  // permanently dead. No separate queue table/infra (Redis/SQS) yet —
  // this reuses the existing Generation row, see 10.4 for a future
  // Redis-backed upgrade if volume ever needs it.
  private readonly MAX_RETRIES = 3;

  constructor(storage?: StorageProvider) {
    this.promptEnhancer = new PromptEnhancer();
    this.orchestrator = new PipelineOrchestrator(
      this.promptEnhancer,
      providerRouter,
    );
    this.storage = storage || createStorageProvider();
    initializeProviders();
  }

  async generate(input: PromptEnhancerInput): Promise<GenerationJob> {
    // Create job record
    const jobId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: GenerationJob = {
      id: jobId,
      brief: input.brief,
      type: input.type,
      images: input.images,
      video: input.video,
      userPreferences: input.userPreferences,
      status: GenerationStatus.QUEUED,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.jobs.set(jobId, job);

    // Process asynchronously
    this.processGeneration(jobId, input).catch((error) => {
      this.updateJob(jobId, {
        status: GenerationStatus.FAILED,
        error: error.message,
        updatedAt: Date.now(),
      }).catch((updateError) =>
        logger.error(
          "Failed to mark job as failed after processGeneration error",
          {
            jobId,
            error:
              updateError instanceof Error
                ? updateError.message
                : String(updateError),
          },
        ),
      );
    });

    return job;
  }

  public async processGeneration(
    jobId: string,
    input: PromptEnhancerInput,
  ): Promise<void> {
    if (!this.jobs.has(jobId)) {
      this.jobs.set(jobId, {
        id: jobId,
        brief: input.brief,
        type: input.type,
        images: input.images,
        video: input.video,
        userPreferences: input.userPreferences,
        status: GenerationStatus.QUEUED,
        progress: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    try {
      const completed = await this.orchestrator.runPipeline(input, (update) =>
        this.updateJob(jobId, { ...update, updatedAt: Date.now() }),
      );

      // NEW: Upload result to CDN/storage if configured and result URL exists
      if (completed.resultUrl && this.storage.isConfigured()) {
        try {
          // Fetch the generated file from provider URL
          const response = await fetch(completed.resultUrl);
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            const contentType = this.getContentType(input.type);
            const key = `generations/${jobId}/output${this.getFileExtension(input.type, contentType)}`;

            const uploadResult = await this.storage.upload(
              key,
              buffer,
              contentType,
            );

            // Update job with CDN URL
            await this.updateJob(jobId, { resultUrl: uploadResult.url });
          }
        } catch (uploadError) {
          logger.error("Failed to upload generated asset to storage", {
            jobId,
            error:
              uploadError instanceof Error
                ? uploadError.message
                : String(uploadError),
          });
          // Don't fail the generation if upload fails - keep original URL
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Generation failed";
      logger.generation.failed(
        jobId,
        input.type,
        error instanceof Error ? error : new Error(message),
      );
      await this.updateJob(jobId, {
        status: GenerationStatus.FAILED,
        error: message,
        updatedAt: Date.now(),
      });
      await this.recordFailureForRetry(jobId);
    }
  }

  /**
   * Get content type based on generation type
   */
  private getContentType(type: GenerationType): string {
    const isVideo = [
      GenerationType.TEXT_TO_VIDEO,
      GenerationType.IMAGE_TO_VIDEO,
      GenerationType.VIDEO_TO_VIDEO,
      GenerationType.MOTION_CONTROL,
    ].includes(type);
    return isVideo ? "video/mp4" : "image/png";
  }

  /**
   * Get file extension based on generation type
   */
  private getFileExtension(type: GenerationType, contentType: string): string {
    if (contentType.startsWith("video/")) return ".mp4";
    if (contentType.startsWith("image/")) return ".png";
    return ".bin";
  }

  /**
   * Bumps retryCount/lastFailedAt on a failed generation, so it shows
   * up in the dead letter queue with accurate retry history. Separate
   * from updateJob() because retryCount isn't part of GenerationJob —
   * it's DLQ bookkeeping, not job/progress state.
   */
  private async recordFailureForRetry(jobId: string): Promise<void> {
    try {
      await prisma.generation.update({
        where: { id: jobId },
        data: {
          retryCount: { increment: 0 }, // no-op on first failure; retryFailedGeneration() increments on actual retry
          lastFailedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error(`Failed to record DLQ metadata for job ${jobId}`, {
        jobId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Retries a previously failed generation, up to MAX_RETRIES times.
   * Reconstructs the pipeline input straight from the stored
   * Generation row (prompt/type/images/video/options), so no separate
   * queue payload needs to be kept around.
   */
  async retryFailedGeneration(jobId: string): Promise<{
    retried: boolean;
    reason?: "NOT_FOUND" | "NOT_FAILED" | "MAX_RETRIES_EXCEEDED";
  }> {
    const record = await prisma.generation.findUnique({
      where: { id: jobId },
    });
    if (!record) return { retried: false, reason: "NOT_FOUND" };
    if (record.status !== "FAILED") {
      return { retried: false, reason: "NOT_FAILED" };
    }
    if (record.retryCount >= this.MAX_RETRIES) {
      return { retried: false, reason: "MAX_RETRIES_EXCEEDED" };
    }

    await prisma.generation.update({
      where: { id: jobId },
      data: {
        status: "QUEUED",
        progress: 0,
        error: null,
        retryCount: { increment: 1 },
      },
    });

    // Drop stale in-memory state so processGeneration() re-seeds it
    // as a fresh QUEUED job instead of reusing old FAILED fields.
    this.jobs.delete(jobId);

    const input: PromptEnhancerInput = {
      brief: record.prompt,
      type: record.type.toLowerCase().replace(/_/g, "-") as GenerationType,
      images: record.images,
      video: record.video || undefined,
      userPreferences: (record.options as any) || undefined,
    };

    logger.generation.retried(
      jobId,
      record.retryCount + 1,
      new Error(record.error || "unknown failure"),
    );

    this.processGeneration(jobId, input).catch((error) =>
      logger.error("Retry processGeneration failed", {
        jobId,
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return { retried: true };
  }

  /**
   * Dead letter queue view: failed generations for a user (or
   * globally if no userId given), with whether each is still
   * eligible for retry.
   */
  async listDeadLetterQueue(options: { userId?: string } = {}): Promise<
    Array<{
      id: string;
      prompt: string;
      type: string;
      error: string | null;
      retryCount: number;
      retryable: boolean;
      failedAt: Date | null;
    }>
  > {
    const records = await prisma.generation.findMany({
      where: {
        status: "FAILED",
        ...(options.userId ? { userId: options.userId } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    return records.map(
      (r: {
        id: string;
        prompt: string;
        type: string;
        error: string | null;
        retryCount: number;
        lastFailedAt: Date | null;
      }) => ({
        id: r.id,
        prompt: r.prompt,
        type: r.type,
        error: r.error,
        retryCount: r.retryCount,
        retryable: r.retryCount < this.MAX_RETRIES,
        failedAt: r.lastFailedAt,
      }),
    );
  }

  private async updateJob(
    jobId: string,
    updates: Partial<GenerationJob>,
  ): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      this.jobs.set(jobId, { ...job, ...updates });
    }

    // Map properties for DB update
    const dbUpdates: any = {};
    if (updates.status) {
      dbUpdates.status = updates.status.toUpperCase();
    }
    if (updates.progress !== undefined) {
      dbUpdates.progress = updates.progress;
    }
    if (updates.resultUrl !== undefined) {
      dbUpdates.resultUrl = updates.resultUrl;
    }
    if (updates.error !== undefined) {
      dbUpdates.error = updates.error;
    }
    if (updates.status === GenerationStatus.COMPLETED) {
      dbUpdates.completedAt = new Date();
    }

    try {
      await prisma.generation.update({
        where: { id: jobId },
        data: dbUpdates,
      });
    } catch (error) {
      logger.db.error(
        "Generation",
        "update",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  getJob(id: string): GenerationJob | undefined {
    return this.jobs.get(id);
  }

  getAllJobs(): GenerationJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  }

  async checkStatus(id: string): Promise<GenerationJob | null> {
    // 1. Check in-memory jobs first
    const job = this.jobs.get(id);
    if (job) {
      return job;
    }

    // 2. Fallback to database
    try {
      const dbJob = await prisma.generation.findUnique({ where: { id } });
      if (!dbJob) return null;

      // Map DB schema to GenerationJob / API response status format
      return {
        id: dbJob.id,
        brief: dbJob.prompt,
        type: dbJob.type.toLowerCase().replace(/_/g, "-") as GenerationType,
        images: dbJob.images,
        video: dbJob.video || undefined,
        status: dbJob.status.toLowerCase() as GenerationStatus,
        progress: dbJob.progress,
        resultUrl: dbJob.resultUrl || undefined,
        error: dbJob.error || undefined,
        createdAt: dbJob.createdAt.getTime(),
        updatedAt: dbJob.updatedAt.getTime(),
      };
    } catch (error) {
      logger.db.error(
        "Generation",
        "findUnique",
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  }

  async getJobStatus(id: string): Promise<GenerationJob | null> {
    return this.checkStatus(id);
  }

  async cancelJob(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job || job.status !== GenerationStatus.PROCESSING) {
      return false;
    }

    // Would need to track provider job ID to cancel
    // For now, mark as cancelled
    await this.updateJob(id, {
      status: GenerationStatus.FAILED,
      error: "Cancelled by user",
      updatedAt: Date.now(),
    });
    return true;
  }
}

// Export singleton instance
export const generationService = new GenerationService();

// Also export a function to use the pipeline directly
export async function generateFromBrief(
  input: PromptEnhancerInput,
): Promise<GenerationJob> {
  return generationService.generate(input);
}

export async function enhancePromptOnly(
  input: PromptEnhancerInput,
): Promise<EnhancedGenerationRequest> {
  const enhancer = new PromptEnhancer();
  return enhancer.enhance(input);
}

export { providerRouter } from "./provider-router";
export { PromptEnhancer } from "./prompt-enhancer";
