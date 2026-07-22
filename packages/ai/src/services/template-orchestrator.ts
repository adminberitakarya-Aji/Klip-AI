import { prisma } from "@klipai/db/client";
import { z } from "zod";
import { providerRouter } from "./provider-router";
import { generationService } from "./generation-service";
import { createStorageProvider } from "./storage";
import { StorageProvider } from "@klipai/core/storage";
import { logger } from "@klipai/core/logger";
import { FFmpegService, FFmpegConcatInput } from "./ffmpeg-service";
import {
  EnhancedGenerationRequest,
  GenerationType,
  ReferenceImage,
  TextToVideoParams,
  ImageToVideoParams,
  VideoToVideoParams,
  CameraControlConfig,
  MotionBrushConfig,
  PhysicsConfig,
} from "../pipeline/types";
import {
  TemplateShot,
  TemplateGenerateInput,
  templateGenerateSchema,
} from "@klipai/core/schemas/template";
import { BrandKit } from "@prisma/client";

/**
 * Convert Prisma enum format to pipeline string format
 * Prisma: "TEXT_TO_VIDEO" → Pipeline: "text-to-video"
 */
function prismaToPipelineType(prismaType: string): GenerationType {
  return prismaType.toLowerCase().replace(/_/g, "-") as GenerationType;
}

// Prisma template with shots type
type PrismaTemplateWithShots = Awaited<
  ReturnType<typeof prisma.storyboardTemplate.findUnique>
> & {
  shots: PrismaTemplateShot[];
};

type PrismaTemplateShot = {
  id: string;
  templateId: string;
  index: number;
  timeRange: string;
  duration: number;
  description: string;
  prompt: string;
  negativePrompt: string | null;
  camera: string;
  lighting: string;
  generationType: string;
  resolution: string;
  fps: number;
  cameraMotion: string;
  motionStrength: number | null;
  seed: number | null;
  referenceImageUrl: string | null;
  referenceRole: string | null;
  referenceWeight: number | null;
  brandKitOverlays: any | null;
  previewUrl: string | null;
  previewGeneratedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// Extract customization types from TemplateGenerateInput
type TemplateGenerateInputCustomizations = NonNullable<
  z.infer<typeof templateGenerateSchema.shape.customizations>
>;
type TemplateCustomizations = TemplateGenerateInputCustomizations;
type ShotOverride = NonNullable<
  TemplateCustomizations["shotOverrides"]
>[string];
type BrandKitOverrides = NonNullable<
  TemplateCustomizations["brandKitOverrides"]
>;

export interface TemplateGenerationInput {
  templateId: string;
  userId: string;
  brandKitId?: string;
  customizations?: TemplateCustomizations;
}

export interface ShotGenerationTask {
  shotIndex: number;
  shot: TemplateShot;
  prompt: string;
  generationType: GenerationType;
  params: EnhancedGenerationRequest["params"];
  referenceImages?: ReferenceImage[];
  cameraControl?: CameraControlConfig;
  motionBrush?: MotionBrushConfig;
  physics?: PhysicsConfig;
}

export interface ShotResult {
  shotIndex: number;
  success: boolean;
  generationId?: string;
  url?: string;
  error?: string;
  localPath?: string;
}

export interface TemplateGenerationJobResult {
  jobId: string;
  status:
    | "QUEUED"
    | "PREPARING"
    | "GENERATING_SHOTS"
    | "STITCHING"
    | "COMPLETED"
    | "FAILED"
    | "PARTIAL_SUCCESS";
  progress: number;
  shotResults: ShotResult[];
  stitchedVideoUrl?: string;
  error?: string;
  creditsUsed: number;
}

export class TemplateOrchestrator {
  private providerRouter = providerRouter;
  private storage: StorageProvider;
  private ffmpeg: FFmpegService;

  constructor(storage?: StorageProvider) {
    this.storage = storage || createStorageProvider();
    this.ffmpeg = FFmpegService.getInstance();
  }

  /**
   * Main entry point: Generate video from template
   */
  async generateFromTemplate(
    input: TemplateGenerationInput,
  ): Promise<TemplateGenerationJobResult> {
    const { templateId, userId, brandKitId, customizations } = input;

    // 1. Load template + shots
    const template = await this.loadTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // 2. Load brand kit if provided
    const brandKit = brandKitId
      ? await this.loadBrandKit(brandKitId, userId)
      : null;

    // 3. Create job record in DB
    const job = await this.createJobRecord(
      templateId,
      userId,
      brandKitId,
      template.shots.length,
      customizations,
    );

    try {
      // 4. Update status to PREPARING
      await this.updateJobStatus(job.id, "PREPARING", 5);

      // 5. Prepare shot tasks (apply customizations, inject brand kit)
      const shotTasks = this.prepareShotTasks(
        template as any,
        customizations,
        brandKit,
      );

      // 6. Update status to GENERATING_SHOTS
      await this.updateJobStatus(job.id, "GENERATING_SHOTS", 10);

      // 7. Execute hybrid batch generation (3-4 parallel)
      const shotResults = await this.executeHybridBatch(shotTasks, job.id);

      // 8. Update status to STITCHING
      await this.updateJobStatus(job.id, "STITCHING", 90);

      // 9. Stitch successful shots with FFmpeg
      let stitchedVideoUrl: string | undefined;
      const successfulShots = shotResults.filter(
        (r) => r.success && r.localPath,
      );

      if (successfulShots.length > 0) {
        // Create template object with template-level properties for stitching
        const templateForStitching = {
          shots: shotTasks.map((t) => t.shot),
          totalDuration: template.totalDuration,
          aspectRatio: template.aspectRatio,
        };

        const stitchedPath = await this.stitchShots(
          successfulShots,
          templateForStitching,
        );

        // 10. Upload stitched video to CDN
        const uploadResult = await this.storage.upload(
          `template-generations/${job.id}/stitched.mp4`,
          await this.readFile(stitchedPath),
          "video/mp4",
        );
        stitchedVideoUrl = uploadResult.url;

        // Cleanup temp files
        await this.cleanupTempFiles(
          shotResults.map((r) => r.localPath).filter(Boolean) as string[],
        );
        await this.cleanupTempFiles([stitchedPath]);
      }

      // 11. Finalize job
      const finalStatus =
        successfulShots.length === 0
          ? "FAILED"
          : successfulShots.length === shotTasks.length
            ? "COMPLETED"
            : "PARTIAL_SUCCESS";

      await this.finalizeJob(
        job.id,
        finalStatus,
        shotResults,
        stitchedVideoUrl,
      );

      return {
        jobId: job.id,
        status: finalStatus,
        progress: 100,
        shotResults,
        stitchedVideoUrl,
        creditsUsed: successfulShots.length, // 1 credit per successful shot
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Template generation failed";
      logger.error("Template generation failed", {
        templateId,
        userId,
        jobId: job.id,
        error: message,
      });

      await this.finalizeJob(job.id, "FAILED", [], undefined, message);

      return {
        jobId: job.id,
        status: "FAILED",
        progress: 100,
        shotResults: [],
        error: message,
        creditsUsed: 0,
      };
    }
  }

  /**
   * Load template with shots from database
   */
  private async loadTemplate(templateId: string) {
    return prisma.storyboardTemplate.findUnique({
      where: { id: templateId },
      include: {
        shots: { orderBy: { index: "asc" } },
      },
    });
  }

  /**
   * Map Prisma template to core TemplateShot type
   */
  private mapPrismaShotsToCore(prismaTemplate: {
    shots: PrismaTemplateShot[];
    aspectRatio: string;
    totalDuration: number;
  }): { shots: TemplateShot[]; aspectRatio: string; totalDuration: number } {
    return {
      shots: prismaTemplate.shots.map((s) => ({
        index: s.index,
        timeRange: s.timeRange,
        duration: s.duration,
        description: s.description,
        prompt: s.prompt,
        camera: s.camera,
        lighting: s.lighting,
        generationType: s.generationType as
          | "TEXT_TO_VIDEO"
          | "IMAGE_TO_VIDEO"
          | "VIDEO_TO_VIDEO"
          | "TEXT_TO_IMAGE"
          | "IMAGE_TO_IMAGE"
          | "MOTION_CONTROL",
        resolution: s.resolution as "720p" | "1080p" | "4k",
        fps: s.fps as 24 | 30,
        cameraMotion: s.cameraMotion as
          "static" | "pan" | "zoom" | "orbit" | "handheld" | "dolly" | "crane",
        motionStrength: s.motionStrength ?? undefined,
        seed: s.seed ?? undefined,
        referenceImageUrl: s.referenceImageUrl ?? undefined,
        referenceRole: s.referenceRole as
          | "character"
          | "subject"
          | "style"
          | "structure"
          | "face"
          | "pose"
          | undefined,
        referenceWeight: s.referenceWeight ?? undefined,
        brandKitOverlays: s.brandKitOverlays ?? undefined,
      })),
      aspectRatio: prismaTemplate.aspectRatio,
      totalDuration: prismaTemplate.totalDuration,
    };
  }

  /**
   * Load brand kit from database
   */
  private async loadBrandKit(brandKitId: string, userId: string) {
    return prisma.brandKit.findUnique({
      where: { id: brandKitId, userId },
    });
  }

  /**
   * Create template generation job record
   */
  private async createJobRecord(
    templateId: string,
    userId: string,
    brandKitId: string | undefined,
    totalShots: number,
    customizations: TemplateGenerateInput["customizations"],
  ) {
    return prisma.templateGenerationJob.create({
      data: {
        userId,
        templateId,
        brandKitId,
        totalShots,
        status: "QUEUED",
        progress: 0,
        currentShot: 0,
        customizations: customizations as any,
        creditsUsed: 0,
      },
    });
  }

  /**
   * Update job status in database
   */
  private async updateJobStatus(
    jobId: string,
    status: TemplateGenerationJobResult["status"],
    progress: number,
    currentShot?: number,
  ) {
    await prisma.templateGenerationJob.update({
      where: { id: jobId },
      data: {
        status,
        progress,
        currentShot: currentShot ?? undefined,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Prepare shot generation tasks by applying customizations and brand kit
   */
  private prepareShotTasks(
    template: { shots: TemplateShot[]; aspectRatio: string },
    customizations: TemplateCustomizations | undefined,
    brandKit: BrandKit | null,
  ): ShotGenerationTask[] {
    return template.shots.map((shot) => {
      const shotIndex = shot.index;
      const shotOverride = customizations?.shotOverrides?.[String(shotIndex)];
      const referenceStyleUrl = customizations?.referenceStyleUrl;

      // Build final prompt with brand kit injection
      let finalPrompt = shot.prompt;

      // Apply shot-specific prompt override
      if (shotOverride?.prompt) {
        finalPrompt = shotOverride.prompt;
      }

      // Inject brand kit text placeholders
      if (brandKit && customizations?.brandKitOverrides?.textValues) {
        const textValues = customizations.brandKitOverrides.textValues;
        Object.entries(textValues).forEach(([key, value]) => {
          finalPrompt = finalPrompt.replace(
            new RegExp(`\\{${key}\\}`, "g"),
            value,
          );
        });
      }

      // Apply reference style if provided
      const referenceImages: ReferenceImage[] = [];
      if (referenceStyleUrl) {
        referenceImages.push({
          url: referenceStyleUrl,
          role: "style",
          weight: 0.8,
        });
      }
      if (shot.referenceImageUrl) {
        referenceImages.push({
          url: shot.referenceImageUrl,
          role: shot.referenceRole || "subject",
          weight: shot.referenceWeight || 0.7,
        });
      }
      if (shotOverride?.referenceImageUrl) {
        referenceImages.push({
          url: shotOverride.referenceImageUrl,
          role: "subject",
          weight: 0.9,
        });
      }

      // Build type-specific params
      const params = this.buildShotParams(
        shot,
        shotOverride,
        brandKit,
        customizations?.brandKitOverrides,
        template.aspectRatio,
      );

      return {
        shotIndex,
        shot,
        prompt: finalPrompt,
        generationType: prismaToPipelineType(shot.generationType),
        params,
        referenceImages:
          referenceImages.length > 0 ? referenceImages : undefined,
        cameraControl: this.buildCameraControl(shot, shotOverride),
        motionBrush: this.buildMotionBrush(shot, shotOverride),
        physics: this.buildPhysics(shot),
      };
    });
  }

  /**
   * Build type-specific parameters for the shot
   */
  private buildShotParams(
    shot: TemplateShot,
    override: ShotOverride | undefined,
    brandKit: BrandKit | null,
    brandKitOverrides: BrandKitOverrides | undefined,
    templateAspectRatio: string,
  ): EnhancedGenerationRequest["params"] {
    const baseParams = {
      duration: shot.duration,
      aspectRatio: templateAspectRatio || "9:16",
      resolution: shot.resolution,
      fps: shot.fps,
      cameraMotion: shot.cameraMotion,
      seed: shot.seed,
    };

    // Apply color filter from brand kit if enabled
    const colorFilter = shot.brandKitOverlays?.colorFilter?.enabled
      ? shot.brandKitOverlays.colorFilter.intensity
      : brandKitOverrides?.colorPalette
        ? 0.3
        : undefined;

    switch (shot.generationType) {
      case "TEXT_TO_VIDEO":
        return {
          ...baseParams,
          cameraMotion: override?.camera || shot.cameraMotion,
          negativePrompt: override?.negativePrompt || shot.negativePrompt,
        } as TextToVideoParams;

      case "IMAGE_TO_VIDEO":
        return {
          ...baseParams,
          motionStrength: shot.motionStrength || 0.5,
          cameraMotion: override?.camera || shot.cameraMotion,
        } as ImageToVideoParams;

      case "VIDEO_TO_VIDEO":
        return {
          ...baseParams,
          style: override?.prompt || shot.prompt,
          strength: 0.7,
          preserveStructure: true,
        } as VideoToVideoParams;

      default:
        return baseParams as any;
    }
  }

  /**
   * Build camera control config from shot data
   */
  private buildCameraControl(
    shot: TemplateShot,
    override: ShotOverride | undefined,
  ): CameraControlConfig | undefined {
    // Map cameraMotion to keyframes
    const motionMap: Record<string, CameraControlConfig["keyframes"]> = {
      static: [{ time: 0, position: [0, 0, 5], rotation: [0, 0, 0] }],
      pan: [
        { time: 0, position: [0, 0, 5], rotation: [0, 0, 0] },
        { time: 1, position: [2, 0, 5], rotation: [0, 15, 0] },
      ],
      zoom: [
        { time: 0, position: [0, 0, 5], rotation: [0, 0, 0], fov: 50 },
        { time: 1, position: [0, 0, 3], rotation: [0, 0, 0], fov: 30 },
      ],
      orbit: [
        {
          time: 0,
          position: [5, 0, 0],
          rotation: [0, 0, 0],
          target: [0, 0, 0],
        },
        {
          time: 1,
          position: [0, 0, 5],
          rotation: [0, 90, 0],
          target: [0, 0, 0],
        },
      ],
      handheld: [
        { time: 0, position: [0, 0, 5], rotation: [0, 0, 0] },
        { time: 0.25, position: [0.1, 0.05, 5], rotation: [1, 0.5, 0] },
        { time: 0.5, position: [-0.05, 0.1, 5], rotation: [-0.5, 1, 0] },
        { time: 0.75, position: [0.05, -0.05, 5], rotation: [0.5, -0.5, 0] },
        { time: 1, position: [0, 0, 5], rotation: [0, 0, 0] },
      ],
      dolly: [
        { time: 0, position: [0, 0, 8], rotation: [0, 0, 0] },
        { time: 1, position: [0, 0, 3], rotation: [0, 0, 0] },
      ],
      crane: [
        { time: 0, position: [0, 3, 5], rotation: [-15, 0, 0] },
        { time: 1, position: [0, -1, 5], rotation: [10, 0, 0] },
      ],
    };

    const cameraMotion = override?.camera || shot.cameraMotion;
    const keyframes = motionMap[cameraMotion] || motionMap.static;

    return {
      keyframes,
      interpolation: "smooth",
      defaultFov: 50,
    };
  }

  /**
   * Build motion brush config (placeholder for future enhancement)
   */
  private buildMotionBrush(
    shot: TemplateShot,
    override: ShotOverride | undefined,
  ): MotionBrushConfig | undefined {
    // Could be extended to support motion brush per shot
    return undefined;
  }

  /**
   * Build physics config (placeholder for future enhancement)
   */
  private buildPhysics(shot: TemplateShot): PhysicsConfig | undefined {
    // Could be extended to support physics per shot
    return undefined;
  }

  /**
   * Execute hybrid batch generation with controlled parallelism
   */
  private async executeHybridBatch(
    tasks: ShotGenerationTask[],
    jobId: string,
  ): Promise<ShotResult[]> {
    const BATCH_SIZE = 3;
    const results: ShotResult[] = [];

    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE);
      const currentShot = i;

      // Update job progress
      await this.updateJobStatus(
        jobId,
        "GENERATING_SHOTS",
        10 + Math.floor((i / tasks.length) * 75),
        currentShot,
      );

      // Generate batch in parallel
      const batchPromises = batch.map((task) =>
        this.generateShotWithRetry(task, 2).catch((err) => ({
          shotIndex: task.shotIndex,
          success: false,
          error: err.message,
        })),
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Update shot results in DB for polling
      await this.updateShotResults(jobId, results);
    }

    return results;
  }

  /**
   * Generate a single shot with retry logic
   */
  private async generateShotWithRetry(
    task: ShotGenerationTask,
    maxRetries: number,
  ): Promise<ShotResult> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Build enhanced request
        const enhancedRequest = this.buildEnhancedRequest(task);

        // Generate via provider router
        const response = await this.providerRouter.generate(enhancedRequest);

        // Wait for completion
        const fulfilledBy =
          (response.metadata?.provider as string) ||
          enhancedRequest.metadata.recommendedProvider;
        const completed = await this.providerRouter.waitForCompletion(
          fulfilledBy,
          response.id,
          300000, // 5 minutes
        );

        if (completed.status === "completed" && completed.resultUrl) {
          // Download the generated video to local temp file for stitching
          const localPath = await this.downloadToTempFile(
            completed.resultUrl,
            task.shotIndex,
          );

          return {
            shotIndex: task.shotIndex,
            success: true,
            generationId: completed.id,
            url: completed.resultUrl,
            localPath,
          };
        }

        throw new Error(completed.error || "Generation failed");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";

        if (attempt === maxRetries) {
          logger.error("Shot generation failed after retries", {
            shotIndex: task.shotIndex,
            attempt,
            error: message,
          });
          return {
            shotIndex: task.shotIndex,
            success: false,
            error: message,
          };
        }

        // Exponential backoff
        await this.sleep(2000 * (attempt + 1));
      }
    }

    throw new Error("Max retries exceeded");
  }

  /**
   * Build enhanced generation request from shot task
   */
  private buildEnhancedRequest(
    task: ShotGenerationTask,
  ): EnhancedGenerationRequest {
    const isVideoType = [
      GenerationType.TEXT_TO_VIDEO,
      GenerationType.IMAGE_TO_VIDEO,
      GenerationType.VIDEO_TO_VIDEO,
      GenerationType.MOTION_CONTROL,
      GenerationType.VIDEO_TO_VIDEO_STYLE_TRANSFER,
      GenerationType.INPAINTING_OUTPAINTING,
      GenerationType.DEPTH_NORMAL_CONTROL,
      GenerationType.MULTI_SHOT_STORYBOARD,
    ].includes(task.generationType);

    return {
      prompt: task.prompt,
      negativePrompt: (task.params as any).negativePrompt,
      type: task.generationType,
      images: task.referenceImages?.map((r) => r.url),
      video: (task.params as any).inputUrl,
      referenceImages: task.referenceImages,
      params: task.params,
      metadata: {
        complexity: "storyboard",
        recommendedProvider: "seedance",
        estimatedDuration: task.shot.duration,
        requiresConsistency: true,
        priority: "quality",
        consistency: {
          identityPreservation: "subject",
          referenceStrength: 0.8,
          consistencyFrames: 16,
        },
      },
    };
  }

  /**
   * Download generated video to temporary file for stitching
   */
  private async downloadToTempFile(
    url: string,
    shotIndex: number,
  ): Promise<string> {
    const { tmpdir } = await import("os");
    const { join } = await import("path");
    const { writeFile } = await import("fs/promises");
    const fetch = (await import("node-fetch")).default;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = join(tmpdir(), `shot_${shotIndex}_${Date.now()}.mp4`);

    await writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Stitch successful shots into final video
   */
  private async stitchShots(
    shots: ShotResult[],
    template: {
      shots: TemplateShot[];
      totalDuration: number;
      aspectRatio: string;
    },
  ): Promise<string> {
    const { tmpdir } = await import("os");
    const { join } = await import("path");
    const outputPath = join(tmpdir(), `stitched_${Date.now()}.mp4`);

    // Sort by shot index
    const sortedShots = shots.sort((a, b) => a.shotIndex - b.shotIndex);

    // Prepare inputs for FFmpeg
    const inputs: FFmpegConcatInput[] = sortedShots.map((shot) => ({
      filePath: shot.localPath!,
      duration:
        template.shots.find((s) => s.index === shot.shotIndex)?.duration || 3,
    }));

    // Use fast concat (codec copy) since all shots should have same codec/resolution/fps
    await this.ffmpeg.concatVideos(inputs, outputPath, { codec: "copy" });

    return outputPath;
  }

  /**
   * Update shot results in database for polling UI
   */
  private async updateShotResults(jobId: string, results: ShotResult[]) {
    await prisma.templateGenerationJob.update({
      where: { id: jobId },
      data: {
        shotResults: results as any,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Finalize job record
   */
  private async finalizeJob(
    jobId: string,
    status: TemplateGenerationJobResult["status"],
    shotResults: ShotResult[],
    stitchedVideoUrl?: string,
    error?: string,
  ) {
    const creditsUsed = shotResults.filter((r) => r.success).length;

    await prisma.templateGenerationJob.update({
      where: { id: jobId },
      data: {
        status,
        progress: 100,
        shotResults: shotResults as any,
        stitchedVideoUrl,
        error,
        creditsUsed,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Cleanup temporary files
   */
  private async cleanupTempFiles(paths: string[]) {
    const { unlink } = await import("fs/promises");
    await Promise.all(paths.map((p) => unlink(p).catch(() => {})));
  }

  /**
   * Read file as buffer
   */
  private async readFile(path: string): Promise<Buffer> {
    const { readFile } = await import("fs/promises");
    return readFile(path);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const templateOrchestrator = new TemplateOrchestrator();
