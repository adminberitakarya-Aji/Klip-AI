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
import * as Sentry from "@sentry/nextjs";

export interface GenerationJob {
  id: string;
  brief: string;
  type: GenerationType;
  images?: string[];
  video?: string;
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

  constructor() {
    this.promptEnhancer = new PromptEnhancer();
    this.orchestrator = new PipelineOrchestrator(
      this.promptEnhancer,
      providerRouter,
    );
    initializeProviders();
    logger.info("GenerationService initialized");
  }

  async generate(input: PromptEnhancerInput): Promise<GenerationJob> {
    const jobId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Create job record
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

    // Set Sentry context
    Sentry.setContext("generation_job", {
      jobId,
      type: input.type,
      brief: input.brief,
      hasImages: !!input.images?.length,
      hasVideo: !!input.video,
    });

    logger.info("Generation job created", {
      jobId,
      type: input.type,
      brief: input.brief,
    });

    // Process asynchronously
    this.processGeneration(jobId, input)
      .then(() => {
        const duration = Date.now() - startTime;
        logger.info("Generation job completed", {
          jobId,
          durationMs: duration,
        });
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        logger.error("Generation job failed", {
          jobId,
          durationMs: duration,
          error: error.message,
        });
        Sentry.captureException(error, {
          extra: { jobId, type: input.type },
        });
        this.updateJob(jobId, {
          status: GenerationStatus.FAILED,
          error: error.message,
          updatedAt: Date.now(),
        }).catch(console.error);
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
      await this.orchestrator.runPipeline(input, (update) =>
        this.updateJob(jobId, { ...update, updatedAt: Date.now() }),
      );
    } catch (error) {
      await this.updateJob(jobId, {
        status: GenerationStatus.FAILED,
        error: error instanceof Error ? error.message : "Generation failed",
        updatedAt: Date.now(),
      });
    }
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
      console.error(`Failed to update database for job ${jobId}:`, error);
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
      console.error(`Failed to fetch status for job ${id}:`, error);
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
