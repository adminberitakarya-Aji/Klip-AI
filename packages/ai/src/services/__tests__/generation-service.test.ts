import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenerationType, GenerationStatus } from "@klipai/core/types";
import { ReferenceImage } from "@klipai/ai";

// Mock the Prisma client before importing GenerationService (which
// imports it at module scope), and mock providers/PromptEnhancer so
// the constructor doesn't try to hit a real Anthropic/provider API.
// vi.mock() factories are hoisted above imports, so mockPrisma must
// be created via vi.hoisted() to exist by the time the factory runs.
const { mockPrisma, mockEnhance, mockGenerate, mockWaitForCompletion } =
  vi.hoisted(() => ({
    mockPrisma: {
      generation: {
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      user: {
        update: vi.fn(),
      },
    },
    mockEnhance: vi.fn(),
    mockGenerate: vi.fn(),
    mockWaitForCompletion: vi.fn(),
  }));

vi.mock("@klipai/db/client", () => ({ prisma: mockPrisma }));
vi.mock("../../providers", () => ({ initializeProviders: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => ({
  Anthropic: vi.fn().mockImplementation(() => ({
    messages: { create: vi.fn() },
  })),
}));
vi.mock("../prompt-enhancer", () => ({
  promptEnhancer: {
    enhance: mockEnhance,
  },
  PromptEnhancer: vi.fn().mockImplementation(() => ({
    enhance: mockEnhance,
  })),
}));
vi.mock("../provider-router", () => ({
  providerRouter: {
    generate: mockGenerate,
    waitForCompletion: mockWaitForCompletion,
  },
}));
vi.mock("../storage", () => ({
  createStorageProvider: () => ({
    isConfigured: () => false,
    upload: vi.fn(),
  }),
}));
vi.mock("@klipai/core/logger", () => ({
  logger: {
    generation: {
      failed: vi.fn(),
      retried: vi.fn(),
    },
    error: vi.fn(),
    warn: vi.fn(),
    db: {
      error: vi.fn(),
    },
  },
}));

import { GenerationService } from "../generation-service";
import { promptEnhancer } from "../prompt-enhancer";
import { providerRouter } from "../provider-router";

describe("GenerationService — dead letter queue (10.2)", () => {
  let service: GenerationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GenerationService();
  });

  describe("retryFailedGeneration", () => {
    it("returns NOT_FOUND for an unknown id", async () => {
      mockPrisma.generation.findUnique.mockResolvedValue(null);

      const result = await service.retryFailedGeneration("missing_id");

      expect(result).toEqual({ retried: false, reason: "NOT_FOUND" });
      expect(mockPrisma.generation.update).not.toHaveBeenCalled();
    });

    it("returns NOT_FAILED when the generation isn't in FAILED status", async () => {
      mockPrisma.generation.findUnique.mockResolvedValue({
        id: "job_1",
        status: "COMPLETED",
        retryCount: 0,
      });

      const result = await service.retryFailedGeneration("job_1");

      expect(result).toEqual({ retried: false, reason: "NOT_FAILED" });
    });

    it("returns MAX_RETRIES_EXCEEDED once retryCount hits the limit", async () => {
      mockPrisma.generation.findUnique.mockResolvedValue({
        id: "job_1",
        status: "FAILED",
        retryCount: 3, // MAX_RETRIES
      });

      const result = await service.retryFailedGeneration("job_1");

      expect(result).toEqual({
        retried: false,
        reason: "MAX_RETRIES_EXCEEDED",
      });
      expect(mockPrisma.generation.update).not.toHaveBeenCalled();
    });

    it("resets status to QUEUED and increments retryCount when eligible", async () => {
      mockPrisma.generation.findUnique.mockResolvedValue({
        id: "job_1",
        status: "FAILED",
        retryCount: 1,
        prompt: "Cinematic coffee shot",
        type: "TEXT_TO_VIDEO",
        images: ["https://example.com/kopi.jpg"],
        video: null,
        options: { duration: 15 },
      });
      mockPrisma.generation.update.mockResolvedValue({});

      const result = await service.retryFailedGeneration("job_1");

      expect(result).toEqual({ retried: true });
      expect(mockPrisma.generation.update).toHaveBeenCalledWith({
        where: { id: "job_1" },
        data: {
          status: "QUEUED",
          progress: 0,
          error: null,
          retryCount: { increment: 1 },
        },
      });
    });
  });

  describe("listDeadLetterQueue", () => {
    it("marks generations at or above MAX_RETRIES as not retryable", async () => {
      mockPrisma.generation.findMany.mockResolvedValue([
        {
          id: "job_retryable",
          prompt: "A",
          type: "TEXT_TO_VIDEO",
          error: "provider timeout",
          retryCount: 1,
          lastFailedAt: new Date("2026-07-18T00:00:00Z"),
        },
        {
          id: "job_dead",
          prompt: "B",
          type: "TEXT_TO_VIDEO",
          error: "content policy violation",
          retryCount: 3,
          lastFailedAt: new Date("2026-07-18T00:00:00Z"),
        },
      ]);

      const result = await service.listDeadLetterQueue({ userId: "u1" });

      expect(mockPrisma.generation.findMany).toHaveBeenCalledWith({
        where: { status: "FAILED", userId: "u1" },
        orderBy: { updatedAt: "desc" },
      });
      expect(result.find((r: any) => r.id === "job_retryable")?.retryable).toBe(
        true,
      );
      expect(result.find((r: any) => r.id === "job_dead")?.retryable).toBe(
        false,
      );
    });
  });
});

describe("GenerationService — Phase 11.2 features", () => {
  let service: GenerationService;

  const mockEnhancedRequest = {
    prompt: "Enhanced cinematic prompt",
    negativePrompt: "blurry, low quality",
    type: GenerationType.TEXT_TO_VIDEO,
    params: {
      duration: 6,
      aspectRatio: "16:9",
      resolution: "1080p",
      fps: 24,
      cameraMotion: "orbit",
    },
    metadata: {
      complexity: "simple",
      recommendedProvider: "kling",
      estimatedDuration: 6,
      requiresConsistency: false,
      priority: "speed",
    },
  };

  const mockProviderResponse = {
    id: "provider_job_123",
    status: "completed",
    progress: 100,
    resultUrl: "https://example.com/video.mp4",
    error: undefined,
    metadata: { provider: "kling" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GenerationService();
    mockEnhance.mockResolvedValue(mockEnhancedRequest);
    mockGenerate.mockResolvedValue(mockProviderResponse);
    mockWaitForCompletion.mockResolvedValue(mockProviderResponse);
    mockPrisma.generation.update.mockResolvedValue({});
    mockPrisma.generation.findUnique.mockResolvedValue(null);
    mockPrisma.generation.findMany.mockResolvedValue([]);
    mockPrisma.user.update.mockResolvedValue({ credits: 29 });
  });

  describe("generate", () => {
    it("should create a job and return it immediately", async () => {
      const input = {
        brief: "A beautiful sunset over mountains",
        type: GenerationType.TEXT_TO_VIDEO,
      };

      const job = await service.generate(input);

      expect(job).toBeDefined();
      expect(job.id).toMatch(/^gen_\d+_[a-z0-9]+$/);
      expect(job.brief).toBe(input.brief);
      expect(job.type).toBe(input.type);
      expect(job.status).toBe(GenerationStatus.QUEUED);
      expect(job.progress).toBe(0);
      // generate() is fire-and-forget, promptEnhancer.enhance is called async in processGeneration
      expect(mockEnhance).not.toHaveBeenCalled();
    });

    it("should store reference images in job (Phase 11.1)", async () => {
      const referenceImages: ReferenceImage[] = [
        { url: "https://example.com/ref1.jpg", role: "character", weight: 0.8 },
        { url: "https://example.com/ref2.jpg", role: "style", weight: 0.5 },
      ];
      const input = {
        brief: "A beautiful sunset over mountains",
        type: GenerationType.TEXT_TO_VIDEO,
        referenceImages,
      };

      const job = await service.generate(input);

      expect(job).toBeDefined();
    });
  });

  describe("processGeneration", () => {
    it("should process generation through the pipeline", async () => {
      const jobId = "test_job_123";
      const input = {
        brief: "A beautiful sunset over mountains",
        type: GenerationType.TEXT_TO_VIDEO,
      };

      await service.processGeneration(jobId, input);

      expect(mockEnhance).toHaveBeenCalledWith(
        expect.objectContaining({
          brief: input.brief,
          type: input.type,
        }),
      );
      expect(mockGenerate).toHaveBeenCalledWith(mockEnhancedRequest);
      expect(mockWaitForCompletion).toHaveBeenCalled();
      expect(mockPrisma.generation.update).toHaveBeenCalled();
    });

    it("should handle motion brush config (Phase 11.2)", async () => {
      const jobId = "test_motion_brush";
      const input = {
        brief: "A person walking with motion brush on arm",
        type: GenerationType.TEXT_TO_VIDEO,
        referenceImages: [],
      };

      const mockWithMotionBrush = {
        ...mockEnhancedRequest,
        motionBrush: {
          strokes: [
            {
              id: "stroke_1",
              mask: {
                type: "polygon",
                polygon: [
                  [0.2, 0.2],
                  [0.4, 0.2],
                  [0.4, 0.6],
                  [0.2, 0.6],
                ],
              },
              motionVector: [0.1, 0, 0],
              speed: 1.0,
              loop: true,
            },
          ],
          globalStrength: 1.0,
        },
      };

      mockEnhance.mockResolvedValue(mockWithMotionBrush);

      await service.processGeneration(jobId, input);

      expect(mockEnhance).toHaveBeenCalled();
      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          motionBrush: expect.any(Object),
        }),
      );
    });

    it("should handle camera control config (Phase 11.2)", async () => {
      const jobId = "test_camera_control";
      const input = {
        brief: "Cinematic orbit around product",
        type: GenerationType.TEXT_TO_VIDEO,
        referenceImages: [],
      };

      const mockWithCameraControl = {
        ...mockEnhancedRequest,
        cameraControl: {
          keyframes: [
            { time: 0, position: [0, 0, -5], rotation: [0, 0, 0], fov: 50 },
            { time: 0.5, position: [3, 0, -4], rotation: [0, 45, 0], fov: 50 },
            { time: 1, position: [0, 0, -5], rotation: [0, 90, 0], fov: 50 },
          ],
          interpolation: "catmull-rom",
          defaultFov: 50,
        },
      };

      mockEnhance.mockResolvedValue(mockWithCameraControl);

      await service.processGeneration(jobId, input);

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          cameraControl: expect.any(Object),
        }),
      );
    });

    it("should handle physics config (Phase 11.2)", async () => {
      const jobId = "test_physics";
      const input = {
        brief: "Flag waving in wind with cloth physics",
        type: GenerationType.TEXT_TO_VIDEO,
        referenceImages: [],
      };

      const mockWithPhysics = {
        ...mockEnhancedRequest,
        physics: {
          cloth: {
            enabled: true,
            targets: ["flag_mesh"],
            stiffness: 0.8,
            damping: 0.3,
            wind: {
              enabled: true,
              direction: [1, 0, 0],
              strength: 5,
              turbulence: 0.2,
            },
          },
        },
      };

      mockEnhance.mockResolvedValue(mockWithPhysics);

      await service.processGeneration(jobId, input);

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          physics: expect.any(Object),
        }),
      );
    });
  });
});
