import {
  PromptEnhancerInput,
  EnhancedGenerationRequest,
  ProviderResponse,
  PipelineContext,
  GenerationType,
} from "../pipeline/types";
import { PromptEnhancer } from "./prompt-enhancer";
import { providerRouter } from "./provider-router";
import { initializeProviders } from "../providers";
import {
  GenerationRequest,
  GenerationResponse,
  GenerationStatus,
} from "../types";
import { prisma } from "@klipai/db/client";

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
  private jobs: Map<string, GenerationJob> = new Map();

  constructor() {
    this.promptEnhancer = new PromptEnhancer();
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

    await this.updateJob(jobId, {
      status: GenerationStatus.PROCESSING,
      progress: 10,
      updatedAt: Date.now(),
    });

    try {
      // Step 1: Enhance prompt with Claude
      await this.updateJob(jobId, { progress: 20, updatedAt: Date.now() });
      const enhanced = await this.promptEnhancer.enhance(input);

      // Step 2: Route to provider and generate
      await this.updateJob(jobId, { progress: 40, updatedAt: Date.now() });
      const response = await providerRouter.generate(enhanced);

      // Step 3: Poll for completion
      await this.updateJob(jobId, { progress: 60, updatedAt: Date.now() });
      const completed = await providerRouter.waitForCompletion(
        enhanced.metadata.recommendedProvider,
        response.id,
        300000, // 5 minutes
      );

      await this.updateJob(jobId, {
        status:
          completed.status === "completed"
            ? GenerationStatus.COMPLETED
            : GenerationStatus.FAILED,
        progress: 100,
        resultUrl: completed.resultUrl,
        error: completed.error,
        updatedAt: Date.now(),
      });
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
