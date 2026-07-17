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

interface GenerationJob {
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
      });
    });

    return job;
  }

  private async processGeneration(
    jobId: string,
    input: PromptEnhancerInput,
  ): Promise<void> {
    this.updateJob(jobId, {
      status: GenerationStatus.PROCESSING,
      progress: 10,
      updatedAt: Date.now(),
    });

    try {
      // Step 1: Enhance prompt with Claude
      this.updateJob(jobId, { progress: 20, updatedAt: Date.now() });
      const enhanced = await this.promptEnhancer.enhance(input);

      // Step 2: Route to provider and generate
      this.updateJob(jobId, { progress: 40, updatedAt: Date.now() });
      const response = await providerRouter.generate(enhanced);

      // Step 3: Poll for completion
      this.updateJob(jobId, { progress: 60, updatedAt: Date.now() });
      const completed = await providerRouter.waitForCompletion(
        enhanced.metadata.recommendedProvider,
        response.id,
        300000, // 5 minutes
      );

      this.updateJob(jobId, {
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
      this.updateJob(jobId, {
        status: GenerationStatus.FAILED,
        error: error instanceof Error ? error.message : "Generation failed",
        updatedAt: Date.now(),
      });
    }
  }

  private updateJob(jobId: string, updates: Partial<GenerationJob>): void {
    const job = this.jobs.get(jobId);
    if (job) {
      this.jobs.set(jobId, { ...job, ...updates });
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

  async getJobStatus(id: string): Promise<GenerationJob | null> {
    const job = this.jobs.get(id);
    if (!job) return null;

    // If still processing, check provider status
    if (job.status === GenerationStatus.PROCESSING && job.resultUrl) {
      // Could poll provider here for real-time progress
    }
    return job;
  }

  async cancelJob(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job || job.status !== GenerationStatus.PROCESSING) {
      return false;
    }

    // Would need to track provider job ID to cancel
    // For now, mark as cancelled
    this.updateJob(id, {
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
