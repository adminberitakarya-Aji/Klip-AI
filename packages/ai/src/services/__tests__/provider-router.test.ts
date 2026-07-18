import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProviderRouter } from "../provider-router";
import { EnhancedGenerationRequest } from "../../pipeline/types";
import {
  AIProvider,
  GenerationRequest,
  GenerationResponse,
  GenerationType,
  GenerationStatus,
} from "../../types";

/**
 * Builds a mock AIProvider. `generate`/`getStatus` are vi.fn() so each
 * test can control resolve/reject behavior and inspect call arguments.
 */
function createMockProvider(
  name: "seedance" | "kling" | "wan",
  overrides: Partial<AIProvider> = {},
): AIProvider {
  return {
    name,
    capabilities: {
      name,
      supportedTypes: [
        GenerationType.TEXT_TO_VIDEO,
        GenerationType.IMAGE_TO_VIDEO,
      ],
      maxDuration: 15,
      maxResolution: "1080p",
      strengths: [],
      weaknesses: [],
    } as any,
    generate: vi.fn().mockResolvedValue({
      id: `${name}_job_1`,
      status: GenerationStatus.PROCESSING,
      progress: 0,
      createdAt: Date.now(),
    } satisfies GenerationResponse),
    getStatus: vi.fn().mockResolvedValue({
      id: `${name}_job_1`,
      status: GenerationStatus.COMPLETED,
      progress: 100,
      resultUrl: `https://cdn.example.com/${name}.mp4`,
      createdAt: Date.now(),
    } satisfies GenerationResponse),
    cancel: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function baseRequest(
  overrides: Partial<EnhancedGenerationRequest> = {},
): EnhancedGenerationRequest {
  return {
    prompt: "Cinematic product hero shot, soft light, slow push in",
    negativePrompt: "blurry, watermark",
    type: GenerationType.TEXT_TO_VIDEO,
    images: ["https://example.com/product.jpg"],
    video: undefined,
    params: {
      duration: 15,
      aspectRatio: "9:16",
      resolution: "1080p",
      fps: 24,
      cameraMotion: "orbit",
    } as any,
    metadata: {
      complexity: "simple",
      recommendedProvider: "seedance",
      estimatedDuration: 15,
      requiresConsistency: false,
      priority: "quality",
    },
    ...overrides,
  };
}

describe("ProviderRouter", () => {
  let router: ProviderRouter;

  beforeEach(() => {
    router = new ProviderRouter();
  });

  describe("regression: payload shape sent to provider.generate() (Bug Fix Log #1)", () => {
    it("sends a structured GenerationRequest, not the flat router payload", async () => {
      const seedance = createMockProvider("seedance");
      router.registerProvider(seedance);
      router.registerProvider(createMockProvider("kling"));
      router.registerProvider(createMockProvider("wan"));

      await router.generate(baseRequest());

      expect(seedance.generate).toHaveBeenCalledTimes(1);
      const sentRequest = (seedance.generate as any).mock
        .calls[0][0] as GenerationRequest;

      // Must be the structured shape...
      expect(sentRequest.prompt).toBe(
        "Cinematic product hero shot, soft light, slow push in",
      );
      expect(sentRequest.type).toBe(GenerationType.TEXT_TO_VIDEO);
      expect(sentRequest.images).toEqual(["https://example.com/product.jpg"]);

      // ...with generation params nested under `.options`, not flattened
      // onto the top level (that was the bug: providers only read
      // request.options, so flattened params were silently dropped).
      expect(sentRequest.options).toBeDefined();
      expect(sentRequest.options?.duration).toBe(15);
      expect(sentRequest.options?.aspect_ratio).toBe("9:16");
      expect((sentRequest as any).duration).toBeUndefined();
    });
  });

  describe("fixed fallback order (decision: 9.4 — always seedance -> kling -> wan)", () => {
    it("falls back to kling when seedance fails, without trying wan", async () => {
      const seedance = createMockProvider("seedance", {
        generate: vi.fn().mockRejectedValue(new Error("seedance 503")),
      });
      const kling = createMockProvider("kling");
      const wan = createMockProvider("wan");
      router.registerProvider(seedance);
      router.registerProvider(kling);
      router.registerProvider(wan);

      const response = await router.generate(baseRequest());

      expect(seedance.generate).toHaveBeenCalledTimes(1);
      expect(kling.generate).toHaveBeenCalledTimes(1);
      expect(wan.generate).not.toHaveBeenCalled();
      expect(response.metadata?.provider).toBe("kling");
    });

    it("keeps seedance -> kling -> wan order even when priority is 'speed'", async () => {
      // priority "speed" would normally select wan as primary; force
      // wan as primary via recommendedProvider, then fail it and
      // confirm the NEXT attempt is seedance (fixed order), not kling.
      const wan = createMockProvider("wan", {
        generate: vi.fn().mockRejectedValue(new Error("wan down")),
      });
      const seedance = createMockProvider("seedance");
      const kling = createMockProvider("kling");
      router.registerProvider(wan);
      router.registerProvider(seedance);
      router.registerProvider(kling);

      const response = await router.generate(
        baseRequest({
          metadata: {
            complexity: "simple",
            recommendedProvider: "wan",
            estimatedDuration: 15,
            requiresConsistency: false,
            priority: "speed",
          },
        }),
      );

      expect(wan.generate).toHaveBeenCalledTimes(1);
      expect(seedance.generate).toHaveBeenCalledTimes(1);
      expect(response.metadata?.provider).toBe("seedance");
    });
  });

  describe("circuit breaker", () => {
    it("opens after 3 consecutive failures and stops routing to that provider", async () => {
      const wan = createMockProvider("wan", {
        generate: vi.fn().mockRejectedValue(new Error("wan always down")),
      });
      router.registerProvider(wan);

      const request = baseRequest({
        type: GenerationType.IMAGE_TO_VIDEO,
        metadata: {
          complexity: "simple",
          recommendedProvider: "wan",
          estimatedDuration: 15,
          requiresConsistency: false,
          priority: "speed",
        },
      });

      // Only "wan" is registered, so each call fails through the whole
      // (1-provider) chain and throws.
      await expect(router.generate(request)).rejects.toThrow();
      await expect(router.generate(request)).rejects.toThrow();
      await expect(router.generate(request)).rejects.toThrow();

      expect(wan.generate).toHaveBeenCalledTimes(3);

      // 4th call: breaker should now be open, so selectProvider()
      // finds no available provider at all (distinct error).
      await expect(router.generate(request)).rejects.toThrow(
        "No available provider for this generation type",
      );
      expect(wan.generate).toHaveBeenCalledTimes(3); // not called a 4th time
    });
  });

  describe("waitForCompletion", () => {
    it("resolves once the provider reports completed", async () => {
      const kling = createMockProvider("kling", {
        getStatus: vi.fn().mockResolvedValue({
          id: "kling_job_1",
          status: GenerationStatus.COMPLETED,
          progress: 100,
          resultUrl: "https://cdn.example.com/kling.mp4",
          createdAt: Date.now(),
        }),
      });
      router.registerProvider(kling);

      const result = await router.waitForCompletion("kling", "kling_job_1");

      expect(result.status).toBe("completed");
      expect(result.resultUrl).toBe("https://cdn.example.com/kling.mp4");
    });

    it("throws when the provider reports failed", async () => {
      const kling = createMockProvider("kling", {
        getStatus: vi.fn().mockResolvedValue({
          id: "kling_job_1",
          status: GenerationStatus.FAILED,
          progress: 0,
          error: "content policy violation",
          createdAt: Date.now(),
        }),
      });
      router.registerProvider(kling);

      await expect(
        router.waitForCompletion("kling", "kling_job_1"),
      ).rejects.toThrow("content policy violation");
    });
  });
});
