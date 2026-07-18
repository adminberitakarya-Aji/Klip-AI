import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Anthropic SDK before importing PromptEnhancer, so no real
// network call is ever made. `messages.create` is a vi.fn() we control
// per-test via mockResolvedValueOnce/mockRejectedValueOnce.
// vi.mock() factories are hoisted above imports, so mockCreate must be
// created via vi.hoisted() to exist by the time the factory runs.
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => ({
  Anthropic: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

import { PromptEnhancer } from "../prompt-enhancer";
import { PromptEnhancerInput } from "../../pipeline/types";
import { GenerationType } from "../../types";

function textResponse(json: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(json) }] };
}

const input: PromptEnhancerInput = {
  brief: "Video promosi kopi kekinian buat TikTok",
  type: GenerationType.TEXT_TO_VIDEO,
  images: ["https://example.com/kopi.jpg"],
  video: undefined,
};

const analysisJson = {
  complexity: "simple",
  hasMultipleScenes: false,
  requiresCharacterConsistency: false,
  physicsComplexity: "low",
  suggestedDuration: 15,
  suggestedAspectRatio: "9:16",
};

const structuredJson = {
  prompt: "Cinematic coffee shot, steam rising, warm golden light",
  negativePrompt: "blurry, watermark",
  type: "text-to-video",
  params: {
    duration: 15,
    aspectRatio: "9:16",
    resolution: "1080p",
    fps: 24,
    cameraMotion: "orbit",
  },
  metadata: {
    complexity: "simple",
    recommendedProvider: "seedance",
    estimatedDuration: 15,
    requiresConsistency: false,
    priority: "quality",
  },
};

describe("PromptEnhancer", () => {
  let enhancer: PromptEnhancer;

  beforeEach(() => {
    mockCreate.mockReset();
    enhancer = new PromptEnhancer("fake-api-key");
  });

  describe("regression: images/video carried through to the output", () => {
    it("keeps images/video when Claude succeeds (mergeWithDefaults path)", async () => {
      mockCreate
        .mockResolvedValueOnce(textResponse(analysisJson))
        .mockResolvedValueOnce(textResponse(structuredJson));

      const result = await enhancer.enhance(input);

      expect(result.images).toEqual(["https://example.com/kopi.jpg"]);
      expect(result.video).toBeUndefined();
    });

    it("keeps images/video when Claude fails entirely (generateFromTemplate fallback path)", async () => {
      mockCreate.mockRejectedValue(new Error("rate limited"));

      const result = await enhancer.enhance(input);

      // Fallback template path — same field, must not be dropped here either.
      expect(result.images).toEqual(["https://example.com/kopi.jpg"]);
    });
  });

  describe("15-second duration support (decision: 2026-07-18)", () => {
    it("allows Claude to return a 15s duration without being clipped", async () => {
      mockCreate
        .mockResolvedValueOnce(textResponse(analysisJson))
        .mockResolvedValueOnce(textResponse(structuredJson));

      const result = await enhancer.enhance(input);

      expect((result.params as any).duration).toBe(15);
    });

    it("template fallback can also produce a 15s duration", async () => {
      mockCreate.mockRejectedValue(new Error("network error"));

      const result = await enhancer.enhance({
        ...input,
        userPreferences: { duration: 15 },
      });

      // generateFromTemplate uses analysis.suggestedDuration, which
      // falls back to input.userPreferences?.duration when the Claude
      // analysis call also fails.
      expect((result.params as any).duration).toBe(15);
    });
  });

  it("throws when the structured prompt fails validation (empty/short prompt)", async () => {
    mockCreate
      .mockResolvedValueOnce(textResponse(analysisJson))
      .mockResolvedValueOnce(textResponse({ ...structuredJson, prompt: "hi" }));

    await expect(enhancer.enhance(input)).rejects.toThrow(
      "Prompt too short or missing",
    );
  });
});
