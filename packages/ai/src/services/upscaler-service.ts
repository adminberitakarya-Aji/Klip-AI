import { prisma } from "@klipai/db/client";
import { logger } from "@klipai/core/logger";
import { RealESRGANProvider } from "../providers/upscaler/realesrgan";
import { BaseUpscalerProvider } from "../providers/upscaler/base";
import {
  UpscalerConfig,
  FrameInterpolationConfig,
  DenoiseSharpenConfig,
  PostProcessingPipeline,
  UpscalerJobResult,
  UpscalerProvider,
} from "../pipeline/types";

export interface UpscalerJob {
  id: string;
  userId: string;
  generationId?: string;
  inputUrl: string;
  pipeline: PostProcessingPipeline;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  outputUrl?: string;
  error?: string;
  processingTime?: number;
  inputMetadata?: UpscalerJobResult["inputMetadata"];
  outputMetadata?: UpscalerJobResult["outputMetadata"];
  provider?: string;
  providerId?: string;
  webhookUrl?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export class UpscalerService {
  private providers: Map<string, UpscalerProvider> = new Map();
  private jobs: Map<string, UpscalerJob> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize Real-ESRGAN provider
    const realesrgan = new RealESRGANProvider();
    this.providers.set(realesrgan.name, realesrgan);

    logger.info("Upscaler providers initialized", {
      providers: Array.from(this.providers.keys()),
    });
  }

  getProvider(name: string): UpscalerProvider | undefined {
    return this.providers.get(name);
  }

  getAllProviders(): UpscalerProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Submit an upscaling job
   */
  async upscale(input: {
    userId: string;
    generationId?: string;
    videoUrl: string;
    config: UpscalerConfig;
    webhookUrl?: string;
    provider?: string;
  }): Promise<UpscalerJob> {
    const provider = this.getProvider(input.provider || "realesrgan");
    if (!provider) {
      throw new Error(`Provider ${input.provider || "realesrgan"} not found`);
    }

    const jobId = `up_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: UpscalerJob = {
      id: jobId,
      userId: input.userId,
      generationId: input.generationId,
      inputUrl: input.videoUrl,
      pipeline: { upscaler: input.config },
      status: "queued",
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.jobs.set(jobId, job);

    // Create DB record
    await prisma.upscalerJob.create({
      data: {
        id: jobId,
        userId: input.userId,
        generationId: input.generationId,
        inputUrl: input.videoUrl,
        pipeline: { upscaler: input.config } as any,
        status: "QUEUED",
        progress: 0,
        webhookUrl: input.webhookUrl,
        provider: provider.name,
      },
    });

    // Process asynchronously
    this.processUpscalerJob(jobId, input, provider).catch((error) => {
      this.updateJob(jobId, {
        status: "failed",
        error: error.message,
        updatedAt: Date.now(),
      }).catch((updateError) =>
        logger.error("Failed to mark upscaler job as failed", {
          jobId,
          error:
            updateError instanceof Error
              ? updateError.message
              : String(updateError),
        }),
      );
    });

    return job;
  }

  /**
   * Submit a frame interpolation job
   */
  async interpolate(input: {
    userId: string;
    generationId?: string;
    videoUrl: string;
    config: FrameInterpolationConfig;
    webhookUrl?: string;
    provider?: string;
  }): Promise<UpscalerJob> {
    const provider = this.getProvider(input.provider || "realesrgan");
    if (!provider) {
      throw new Error(`Provider ${input.provider || "realesrgan"} not found`);
    }

    const jobId = `up_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: UpscalerJob = {
      id: jobId,
      userId: input.userId,
      generationId: input.generationId,
      inputUrl: input.videoUrl,
      pipeline: { frameInterpolation: input.config },
      status: "queued",
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.jobs.set(jobId, job);

    await prisma.upscalerJob.create({
      data: {
        id: jobId,
        userId: input.userId,
        generationId: input.generationId,
        inputUrl: input.videoUrl,
        pipeline: { frameInterpolation: input.config } as any,
        status: "QUEUED",
        progress: 0,
        webhookUrl: input.webhookUrl,
        provider: provider.name,
      },
    });

    this.processUpscalerJob(jobId, input, provider).catch((error) => {
      this.updateJob(jobId, {
        status: "failed",
        error: error.message,
        updatedAt: Date.now(),
      }).catch((updateError) =>
        logger.error("Failed to mark upscaler job as failed", {
          jobId,
          error:
            updateError instanceof Error
              ? updateError.message
              : String(updateError),
        }),
      );
    });

    return job;
  }

  /**
   * Submit a denoise/sharpen job
   */
  async denoiseSharpen(input: {
    userId: string;
    generationId?: string;
    videoUrl: string;
    config: DenoiseSharpenConfig;
    webhookUrl?: string;
    provider?: string;
  }): Promise<UpscalerJob> {
    const provider = this.getProvider(input.provider || "realesrgan");
    if (!provider) {
      throw new Error(`Provider ${input.provider || "realesrgan"} not found`);
    }

    const jobId = `up_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: UpscalerJob = {
      id: jobId,
      userId: input.userId,
      generationId: input.generationId,
      inputUrl: input.videoUrl,
      pipeline: { denoiseSharpen: input.config },
      status: "queued",
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.jobs.set(jobId, job);

    await prisma.upscalerJob.create({
      data: {
        id: jobId,
        userId: input.userId,
        generationId: input.generationId,
        inputUrl: input.videoUrl,
        pipeline: { denoiseSharpen: input.config } as any,
        status: "QUEUED",
        progress: 0,
        webhookUrl: input.webhookUrl,
        provider: provider.name,
      },
    });

    this.processUpscalerJob(jobId, input, provider).catch((error) => {
      this.updateJob(jobId, {
        status: "failed",
        error: error.message,
        updatedAt: Date.now(),
      }).catch((updateError) =>
        logger.error("Failed to mark upscaler job as failed", {
          jobId,
          error:
            updateError instanceof Error
              ? updateError.message
              : String(updateError),
        }),
      );
    });

    return job;
  }

  /**
   * Submit a full post-processing pipeline job
   */
  async processPipeline(input: {
    userId: string;
    generationId?: string;
    videoUrl: string;
    pipeline: PostProcessingPipeline;
    webhookUrl?: string;
    provider?: string;
  }): Promise<UpscalerJob> {
    const provider = this.getProvider(input.provider || "realesrgan");
    if (!provider) {
      throw new Error(`Provider ${input.provider || "realesrgan"} not found`);
    }

    const jobId = `up_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: UpscalerJob = {
      id: jobId,
      userId: input.userId,
      generationId: input.generationId,
      inputUrl: input.videoUrl,
      pipeline: input.pipeline,
      status: "queued",
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.jobs.set(jobId, job);

    await prisma.upscalerJob.create({
      data: {
        id: jobId,
        userId: input.userId,
        generationId: input.generationId,
        inputUrl: input.videoUrl,
        pipeline: input.pipeline as any,
        status: "QUEUED",
        progress: 0,
        webhookUrl: input.webhookUrl,
        provider: provider.name,
      },
    });

    this.processUpscalerJob(jobId, input, provider).catch((error) => {
      this.updateJob(jobId, {
        status: "failed",
        error: error.message,
        updatedAt: Date.now(),
      }).catch((updateError) =>
        logger.error("Failed to mark upscaler job as failed", {
          jobId,
          error:
            updateError instanceof Error
              ? updateError.message
              : String(updateError),
        }),
      );
    });

    return job;
  }

  private async processUpscalerJob(
    jobId: string,
    input: {
      userId: string;
      generationId?: string;
      videoUrl: string;
      config?:
        | UpscalerConfig
        | FrameInterpolationConfig
        | DenoiseSharpenConfig
        | PostProcessingPipeline;
      webhookUrl?: string;
      provider?: string;
    },
    provider: UpscalerProvider,
  ): Promise<void> {
    try {
      await this.updateJob(jobId, {
        status: "processing",
        progress: 10,
        updatedAt: Date.now(),
      });

      let result: { jobId: string; statusUrl: string };

      if ("upscaler" in input.config!) {
        result = await provider.upscale({
          videoUrl: input.videoUrl,
          config: input.config as UpscalerConfig,
          webhookUrl: input.webhookUrl,
        });
      } else if ("frameInterpolation" in input.config!) {
        result = await provider.interpolate({
          videoUrl: input.videoUrl,
          config: input.config as FrameInterpolationConfig,
          webhookUrl: input.webhookUrl,
        });
      } else if ("denoiseSharpen" in input.config!) {
        result = await provider.denoiseSharpen({
          videoUrl: input.videoUrl,
          config: input.config as DenoiseSharpenConfig,
          webhookUrl: input.webhookUrl,
        });
      } else {
        result = await provider.processPipeline({
          videoUrl: input.videoUrl,
          pipeline: input.config as PostProcessingPipeline,
          webhookUrl: input.webhookUrl,
        });
      }

      // Poll for completion
      const finalResult = await this.pollForCompletion(
        result.jobId,
        provider,
        jobId,
      );

      await this.updateJob(jobId, {
        status: finalResult.status,
        progress: 100,
        outputUrl: finalResult.outputUrl,
        error: finalResult.error,
        processingTime: finalResult.processingTime,
        inputMetadata: finalResult.inputMetadata,
        outputMetadata: finalResult.outputMetadata,
        providerId: result.jobId,
        updatedAt: Date.now(),
        completedAt:
          finalResult.status === "completed" ? Date.now() : undefined,
      });

      // Call webhook if provided
      if (input.webhookUrl) {
        this.callWebhook(input.webhookUrl, finalResult).catch((error) =>
          logger.error("Webhook call failed", { jobId, error: error.message }),
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upscaler job failed";
      logger.error("Upscaler job failed", { jobId, error: message });
      await this.updateJob(jobId, {
        status: "failed",
        error: message,
        updatedAt: Date.now(),
      });
    }
  }

  private async pollForCompletion(
    providerJobId: string,
    provider: UpscalerProvider,
    jobId: string,
  ): Promise<UpscalerJobResult> {
    const maxAttempts = 300; // 5 minutes at 1 second intervals
    const intervalMs = 1000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await provider.getStatus(providerJobId);

      await this.updateJob(jobId, {
        progress: status.progress,
        updatedAt: Date.now(),
      });

      if (status.status === "completed" || status.status === "failed") {
        return status;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    // Timeout
    return {
      id: providerJobId,
      status: "failed",
      progress: 100,
      inputUrl: "",
      error: "Processing timeout",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  private async callWebhook(
    webhookUrl: string,
    result: UpscalerJobResult,
  ): Promise<void> {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
  }

  private async updateJob(
    jobId: string,
    updates: Partial<UpscalerJob>,
  ): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      this.jobs.set(jobId, { ...job, ...updates });
    }

    const dbUpdates: any = {};
    if (updates.status) {
      dbUpdates.status = updates.status.toUpperCase();
    }
    if (updates.progress !== undefined) {
      dbUpdates.progress = updates.progress;
    }
    if (updates.outputUrl !== undefined) {
      dbUpdates.outputUrl = updates.outputUrl;
    }
    if (updates.error !== undefined) {
      dbUpdates.error = updates.error;
    }
    if (updates.processingTime !== undefined) {
      dbUpdates.processingTime = updates.processingTime;
    }
    if (updates.inputMetadata !== undefined) {
      dbUpdates.inputMetadata = updates.inputMetadata as any;
    }
    if (updates.outputMetadata !== undefined) {
      dbUpdates.outputMetadata = updates.outputMetadata as any;
    }
    if (updates.providerId !== undefined) {
      dbUpdates.providerId = updates.providerId;
    }
    if (updates.status === "completed") {
      dbUpdates.completedAt = new Date();
    }

    try {
      await prisma.upscalerJob.update({
        where: { id: jobId },
        data: dbUpdates,
      });
    } catch (error) {
      logger.db.error(
        "UpscalerJob",
        "update",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  getJob(id: string): UpscalerJob | undefined {
    return this.jobs.get(id);
  }

  async getJobStatus(id: string): Promise<UpscalerJob | null> {
    const job = this.jobs.get(id);
    if (job) {
      return job;
    }

    try {
      const dbJob = await prisma.upscalerJob.findUnique({ where: { id } });
      if (!dbJob) return null;

      return {
        id: dbJob.id,
        userId: dbJob.userId,
        generationId: dbJob.generationId || undefined,
        inputUrl: dbJob.inputUrl,
        pipeline: dbJob.pipeline as PostProcessingPipeline,
        status: dbJob.status.toLowerCase() as
          "queued" | "processing" | "completed" | "failed",
        progress: dbJob.progress,
        outputUrl: dbJob.outputUrl || undefined,
        error: dbJob.error || undefined,
        processingTime: dbJob.processingTime || undefined,
        inputMetadata:
          dbJob.inputMetadata as UpscalerJobResult["inputMetadata"],
        outputMetadata:
          dbJob.outputMetadata as UpscalerJobResult["outputMetadata"],
        provider: dbJob.provider || undefined,
        providerId: dbJob.providerId || undefined,
        webhookUrl: dbJob.webhookUrl || undefined,
        createdAt: dbJob.createdAt.getTime(),
        updatedAt: dbJob.updatedAt.getTime(),
        completedAt: dbJob.completedAt?.getTime(),
      };
    } catch (error) {
      logger.db.error(
        "UpscalerJob",
        "findUnique",
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  }

  async listJobs(
    options: { userId?: string; status?: string } = {},
  ): Promise<UpscalerJob[]> {
    const where: any = {};
    if (options.userId) where.userId = options.userId;
    if (options.status) where.status = options.status.toUpperCase();

    const dbJobs = await prisma.upscalerJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return dbJobs.map((job) => ({
      id: job.id,
      userId: job.userId,
      generationId: job.generationId || undefined,
      inputUrl: job.inputUrl,
      pipeline: job.pipeline as PostProcessingPipeline,
      status: job.status.toLowerCase() as
        "queued" | "processing" | "completed" | "failed",
      progress: job.progress,
      outputUrl: job.outputUrl || undefined,
      error: job.error || undefined,
      processingTime: job.processingTime || undefined,
      inputMetadata: job.inputMetadata as UpscalerJobResult["inputMetadata"],
      outputMetadata: job.outputMetadata as UpscalerJobResult["outputMetadata"],
      provider: job.provider || undefined,
      providerId: job.providerId || undefined,
      webhookUrl: job.webhookUrl || undefined,
      createdAt: job.createdAt.getTime(),
      updatedAt: job.updatedAt.getTime(),
      completedAt: job.completedAt?.getTime(),
    }));
  }

  async cancelJob(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job || job.status !== "processing") {
      return false;
    }

    const provider = this.getProvider(job.provider || "realesrgan");
    if (provider && job.providerId) {
      try {
        await provider.cancel(job.providerId);
      } catch (error) {
        logger.error("Failed to cancel provider job", {
          id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await this.updateJob(id, {
      status: "failed",
      error: "Cancelled by user",
      updatedAt: Date.now(),
    });
    return true;
  }
}

export const upscalerService = new UpscalerService();
