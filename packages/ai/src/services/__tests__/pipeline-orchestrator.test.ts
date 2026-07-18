import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PipelineOrchestrator,
  PipelineProgressUpdate,
} from "../pipeline-orchestrator";
import { PromptEnhancer } from "../prompt-enhancer";
import { ProviderRouter } from "../provider-router";
import {
  EnhancedGenerationRequest,
  PromptEnhancerInput,
} from "../../pipeline/types";
import { GenerationType, GenerationStatus } from "../../types";

function enhancedRequest(
  recommendedProvider: "seedance" | "kling" | "wan",
): EnhancedGenerationRequest {
  return {
    prompt: "Cinematic product hero shot",
    type: GenerationType.TEXT_TO_VIDEO,
    images: ["https://example.com/product.jpg"],
    params: {
      duration: 15,
      aspectRatio: "9:16",
      resolution: "1080p",
      fps: 24,
      cameraMotion: "orbit",
    } as any,
    metadata: {
      complexity: "simple",
      recommendedProvider,
      estimatedDuration: 15,
      requiresConsistency: false,
      priority: "quality",
    },
  };
}

describe("PipelineOrchestrator", () => {
  let promptEnhancer: PromptEnhancer;
  let providerRouter: ProviderRouter;
  let orchestrator: PipelineOrchestrator;

  const input: PromptEnhancerInput = {
    brief: "Video promosi kopi kekinian buat TikTok",
    type: GenerationType.TEXT_TO_VIDEO,
    images: ["https://example.com/product.jpg"],
  };

  beforeEach(() => {
    promptEnhancer = { enhance: vi.fn() } as unknown as PromptEnhancer;
    providerRouter = {
      generate: vi.fn(),
      waitForCompletion: vi.fn(),
    } as unknown as ProviderRouter;
    orchestrator = new PipelineOrchestrator(promptEnhancer, providerRouter);
  });

  describe("regression: polling uses the provider that actually fulfilled the request (Bug Fix Log #2)", () => {
    it("polls with response.metadata.provider when a fallback occurred", async () => {
      // Enhancer recommends seedance...
      (promptEnhancer.enhance as any).mockResolvedValue(
        enhancedRequest("seedance"),
      );
      // ...but the router's fallback chain actually fulfilled the
      // request via kling (seedance was down).
      (providerRouter.generate as any).mockResolvedValue({
        id: "kling_job_1",
        status: "processing",
        progress: 0,
        metadata: { provider: "kling" },
      });
      (providerRouter.waitForCompletion as any).mockResolvedValue({
        id: "kling_job_1",
        status: "completed",
        progress: 100,
        resultUrl: "https://cdn.example.com/kling.mp4",
        metadata: { provider: "kling" },
      });

      await orchestrator.runPipeline(input);

      expect(providerRouter.waitForCompletion).toHaveBeenCalledWith(
        "kling", // must be the FULFILLING provider...
        "kling_job_1",
        300000,
      );
      expect(providerRouter.waitForCompletion).not.toHaveBeenCalledWith(
        "seedance", // ...never the originally recommended one
        expect.anything(),
        expect.anything(),
      );
    });

    it("falls back to enhanced.metadata.recommendedProvider if response.metadata.provider is missing", async () => {
      (promptEnhancer.enhance as any).mockResolvedValue(enhancedRequest("wan"));
      (providerRouter.generate as any).mockResolvedValue({
        id: "job_no_metadata",
        status: "processing",
        progress: 0,
        // metadata omitted entirely — edge case
      });
      (providerRouter.waitForCompletion as any).mockResolvedValue({
        id: "job_no_metadata",
        status: "completed",
        progress: 100,
        resultUrl: "https://cdn.example.com/wan.mp4",
      });

      await orchestrator.runPipeline(input);

      expect(providerRouter.waitForCompletion).toHaveBeenCalledWith(
        "wan",
        "job_no_metadata",
        300000,
      );
    });
  });

  it("reports progress in order: 10 -> 20 -> 40 -> 60 -> 100, ending with COMPLETED", async () => {
    (promptEnhancer.enhance as any).mockResolvedValue(
      enhancedRequest("seedance"),
    );
    (providerRouter.generate as any).mockResolvedValue({
      id: "job_1",
      status: "processing",
      progress: 0,
      metadata: { provider: "seedance" },
    });
    (providerRouter.waitForCompletion as any).mockResolvedValue({
      id: "job_1",
      status: "completed",
      progress: 100,
      resultUrl: "https://cdn.example.com/seedance.mp4",
      metadata: { provider: "seedance" },
    });

    const updates: PipelineProgressUpdate[] = [];
    await orchestrator.runPipeline(input, (update) => {
      updates.push(update);
    });

    expect(updates.map((u) => u.progress)).toEqual([10, 20, 40, 60, 100]);
    expect(updates[0].status).toBe(GenerationStatus.PROCESSING);
    expect(updates[updates.length - 1].status).toBe(GenerationStatus.COMPLETED);
    expect(updates[updates.length - 1].resultUrl).toBe(
      "https://cdn.example.com/seedance.mp4",
    );
  });

  it("reports FAILED status when the provider ultimately fails", async () => {
    (promptEnhancer.enhance as any).mockResolvedValue(
      enhancedRequest("seedance"),
    );
    (providerRouter.generate as any).mockResolvedValue({
      id: "job_1",
      status: "processing",
      progress: 0,
      metadata: { provider: "seedance" },
    });
    (providerRouter.waitForCompletion as any).mockResolvedValue({
      id: "job_1",
      status: "failed",
      progress: 100,
      error: "content policy violation",
      metadata: { provider: "seedance" },
    });

    const updates: PipelineProgressUpdate[] = [];
    await orchestrator.runPipeline(input, (update) => {
      updates.push(update);
    });

    const last = updates[updates.length - 1];
    expect(last.status).toBe(GenerationStatus.FAILED);
    expect(last.error).toBe("content policy violation");
  });
});
