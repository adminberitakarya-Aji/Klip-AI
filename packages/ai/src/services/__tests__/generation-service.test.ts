import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Prisma client before importing GenerationService (which
// imports it at module scope), and mock providers/PromptEnhancer so
// the constructor doesn't try to hit a real Anthropic/provider API.
// vi.mock() factories are hoisted above imports, so mockPrisma must
// be created via vi.hoisted() to exist by the time the factory runs.
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    generation: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));
vi.mock("@klipai/db/client", () => ({ prisma: mockPrisma }));
vi.mock("../../providers", () => ({ initializeProviders: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => ({
  Anthropic: vi.fn().mockImplementation(() => ({
    messages: { create: vi.fn() },
  })),
}));

import { GenerationService } from "../generation-service";

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
      expect(result.find((r) => r.id === "job_retryable")?.retryable).toBe(
        true,
      );
      expect(result.find((r) => r.id === "job_dead")?.retryable).toBe(false);
    });
  });
});
