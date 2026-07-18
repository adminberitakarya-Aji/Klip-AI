import { Anthropic } from "@anthropic-ai/sdk";
import { logger } from "@klipai/core/logger";
import {
  PromptEnhancerInput,
  PromptEnhancerOutput,
  EnhancedGenerationRequest,
  TextToVideoParams,
  ImageToVideoParams,
  VideoToVideoParams,
  TextToImageParams,
  ImageToImageParams,
  MotionControlParams,
  GenerationType,
  PROVIDER_CAPABILITIES,
  ProviderCapabilities,
  ReferenceImage,
  ConsistencyConfig,
} from "../pipeline/types";

interface IntentAnalysis {
  complexity: "simple" | "storyboard" | "complex";
  hasMultipleScenes: boolean;
  requiresCharacterConsistency: boolean;
  physicsComplexity: "low" | "medium" | "high";
  suggestedDuration: number;
  suggestedAspectRatio: string;
  // NEW: Specific consistency needs detected
  consistencyType?: "face" | "subject" | "style" | "structure";
  referenceRoles?: Array<
    "character" | "subject" | "style" | "structure" | "face" | "pose"
  >;
}

export class PromptEnhancer {
  private anthropic: Anthropic;

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async enhance(input: PromptEnhancerInput): Promise<PromptEnhancerOutput> {
    // 1. Analyze intent & complexity
    const analysis = await this.analyzeIntent(input);

    // 2. Generate type-specific structured prompt
    const enhanced = await this.generateStructuredPrompt(input, analysis);

    // 3. Validate completeness
    this.validate(enhanced);

    return enhanced;
  }

  private async analyzeIntent(
    input: PromptEnhancerInput,
  ): Promise<IntentAnalysis> {
    const systemPrompt = `You are an expert video generation prompt analyzer. Analyze the user's brief and determine:
1. Complexity: simple (single shot) | storyboard (multi-scene narrative) | complex (technical/specific requirements)
2. Has multiple scenes: true/false
3. Requires character/object consistency: true/false
4. Physics complexity: low (static) | medium (simple motion) | high (complex physics, fluids, cloth)
5. Suggested duration (seconds): 6, 12, or 15
6. Suggested aspect ratio: 9:16, 16:9, or 1:1

Return ONLY valid JSON.`;

    const userPrompt = `User brief: "${input.brief}"
Type: ${input.type}
${input.images ? `Reference images: ${input.images.length}` : ""}
${input.video ? "Reference video: yes" : ""}
Preferences: ${JSON.stringify(input.userPreferences || {})}`;

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const content = response.content[0];
      if (content.type === "text") {
        return JSON.parse(content.text) as IntentAnalysis;
      }
    } catch (error) {
      logger.warn("Claude intent analysis failed, using defaults", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Fallback defaults
    return {
      complexity: "simple",
      hasMultipleScenes: false,
      requiresCharacterConsistency: false,
      physicsComplexity: "low",
      suggestedDuration: input.userPreferences?.duration || 6,
      suggestedAspectRatio: input.userPreferences?.aspectRatio || "16:9",
    };
  }

  private async generateStructuredPrompt(
    input: PromptEnhancerInput,
    analysis: IntentAnalysis,
  ): Promise<EnhancedGenerationRequest> {
    const systemPrompt = this.getSystemPrompt(input.type);
    const userPrompt = this.buildUserPrompt(input, analysis);

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 3000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const content = response.content[0];
      if (content.type === "text") {
        const parsed = JSON.parse(content.text) as EnhancedGenerationRequest;
        return this.mergeWithDefaults(parsed, input, analysis);
      }
    } catch (error) {
      logger.warn(
        "Claude structured prompt generation failed, using template",
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }

    // Fallback: template-based generation
    return this.generateFromTemplate(input, analysis);
  }

  private getSystemPrompt(type: GenerationType): string {
    const basePrompt = `You are a world-class cinematic prompt engineer for AI video generation.
Generate a STRUCTURED, COMPLETE prompt with all required parameters for the specified type.
Output ONLY valid JSON matching the exact schema.`;

    const typePrompts: Record<GenerationType, string> = {
      [GenerationType.TEXT_TO_VIDEO]: `${basePrompt}

TYPE: TEXT_TO_VIDEO
SCHEMA:
{
  "prompt": "cinematic prompt describing the full video",
  "negativePrompt": "what to avoid",
  "type": "text-to-video",
  "params": {
    "duration": 6|12|15,
    "aspectRatio": "9:16|16:9|1:1",
    "resolution": "720p|1080p|4k",
    "fps": 24|30,
    "cameraMotion": "static|pan|zoom|orbit|handheld",
    "seed": number,
    "scenes": [{"timeRange": "0-3s", "description": "...", "camera": "...", "lighting": "..."}]
  },
  "metadata": {
    "complexity": "simple|storyboard|complex",
    "recommendedProvider": "seedance|kling|wan",
    "estimatedDuration": number,
    "requiresConsistency": boolean,
    "priority": "speed|quality|cost"
  }
}

RULES:
- For storyboard: break into 3-5 scenes with timeRange, description, camera, lighting
- Camera motion: match scene emotion (orbit for product, handheld for lifestyle)
- Lighting: specify key/fill/rim for cinematic quality
- Duration: 6s for simple, 12s for storyboard, 15s for complex/multi-shot narratives`,

      [GenerationType.IMAGE_TO_VIDEO]: `${basePrompt}

TYPE: IMAGE_TO_VIDEO
SCHEMA:
{
  "prompt": "motion description relative to the input image",
  "negativePrompt": "what to avoid",
  "type": "image-to-video",
  "params": {
    "motionStrength": 0.1-1.0,
    "cameraMotion": "static|pan|zoom|orbit",
    "duration": 6|12|15,
    "endImage": "optional base64/url"
  },
  "metadata": {...}
}

RULES:
- Describe MOTION, not static content (the image provides content)
- motionStrength: 0.3 subtle, 0.6 moderate, 0.9 dynamic
- Camera motion relative to image perspective`,

      [GenerationType.VIDEO_TO_VIDEO]: `${basePrompt}

TYPE: VIDEO_TO_VIDEO
SCHEMA:
{
  "prompt": "style transfer description",
  "negativePrompt": "what to avoid",
  "type": "video-to-video",
  "params": {
    "style": "cinematic|anime|claymation|paper-cutout|cyberpunk|vintage",
    "strength": 0.1-1.0,
    "preserveStructure": true,
    "consistencyFrames": 8
  },
  "metadata": {...}
}

RULES:
- Style: be specific (not just "anime" but "1990s cel anime, grain, limited palette")
- Strength: 0.3 subtle, 0.6 balanced, 0.9 full stylization
- preserveStructure: true for product/character consistency`,

      [GenerationType.TEXT_TO_IMAGE]: `${basePrompt}

TYPE: TEXT_TO_IMAGE
SCHEMA:
{
  "prompt": "detailed image prompt",
  "negativePrompt": "what to avoid",
  "type": "text-to-image",
  "params": {
    "aspectRatio": "9:16|16:9|1:1|4:3|3:4",
    "resolution": "512|768|1024|2048",
    "style": "photorealistic|illustration|3d-render|anime",
    "negativePrompt": "...",
    "batchSize": 1-4
  },
  "metadata": {...}
}

RULES:
- Include: subject, composition, lighting, color palette, texture, mood
- Negative prompt: deformations, watermark, text, blur, low quality`,

      [GenerationType.IMAGE_TO_IMAGE]: `${basePrompt}

TYPE: IMAGE_TO_IMAGE
SCHEMA:
{
  "prompt": "transformation description",
  "negativePrompt": "what to avoid",
  "type": "image-to-image",
  "params": {
    "strength": 0.1-1.0,
    "preserveStructure": true,
    "style": "optional style",
    "mask": "optional base64 for inpainting"
  },
  "metadata": {...}
}

RULES:
- Strength: 0.3 subtle edit, 0.6 moderate, 0.9 reimagine
- Mask for inpainting: describe what area to modify`,

      [GenerationType.MOTION_CONTROL]: `${basePrompt}

TYPE: MOTION_CONTROL
SCHEMA:
{
  "prompt": "camera movement description",
  "negativePrompt": "shaky, unstable, jittery",
  "type": "motion-control",
  "params": {
    "trajectory": "orbit|dolly|crane|circular|spiral|linear|custom",
    "keyframes": [{"time": 0.0, "position": [0,0,0], "rotation": [0,0,0], "fov": 50}],
    "subjectPosition": [0,0,0]
  },
  "metadata": {...}
}

RULES:
- Time normalized 0-1
- Position: x,y,z in world space
- Rotation: pitch,yaw,roll in degrees
- Subject position for target tracking`,
    };

    return typePrompts[type];
  }

  private buildUserPrompt(
    input: PromptEnhancerInput,
    analysis: IntentAnalysis,
  ): string {
    return `BRIEF: "${input.brief}"
TYPE: ${input.type}
ANALYSIS: ${JSON.stringify(analysis)}
${input.images ? `REFERENCE IMAGES: ${input.images.length} provided` : ""}
${input.video ? "REFERENCE VIDEO: provided" : ""}
PREFERENCES: ${JSON.stringify(input.userPreferences || {})}

Generate the complete structured prompt.`;
  }

  private mergeWithDefaults(
    parsed: EnhancedGenerationRequest,
    input: PromptEnhancerInput,
    analysis: IntentAnalysis,
  ): EnhancedGenerationRequest {
    // Ensure metadata is complete with required fields
    const metadata = {
      complexity: analysis.complexity,
      recommendedProvider: this.selectProvider(input.type, analysis),
      estimatedDuration: analysis.suggestedDuration,
      requiresConsistency: analysis.requiresCharacterConsistency,
      priority: (input.userPreferences?.style === "cinematic"
        ? "quality"
        : "speed") as "speed" | "quality" | "cost",
    };

    return {
      ...parsed,
      images: input.images,
      video: input.video,
      metadata: {
        ...metadata,
        ...(parsed.metadata || {}),
      },
    };
  }

  private selectProvider(
    type: GenerationType,
    analysis: IntentAnalysis,
  ): "seedance" | "kling" | "wan" {
    // Wan doesn't support V2V, I2I, Motion Control
    const wanSupported = [
      GenerationType.TEXT_TO_VIDEO,
      GenerationType.IMAGE_TO_VIDEO,
      GenerationType.TEXT_TO_IMAGE,
    ].includes(type);

    if (!wanSupported) {
      return analysis.physicsComplexity === "high" ? "seedance" : "kling";
    }

    // For supported types, choose based on complexity
    if (
      analysis.complexity === "complex" ||
      analysis.physicsComplexity === "high"
    ) {
      return "seedance";
    }
    if (analysis.complexity === "simple") {
      return "wan";
    }
    return "kling";
  }

  private generateFromTemplate(
    input: PromptEnhancerInput,
    analysis: IntentAnalysis,
  ): EnhancedGenerationRequest {
    const template = this.buildTemplate(input, analysis);
    // Same passthrough as mergeWithDefaults() — the Claude-generated
    // path isn't the only one that needs images/video carried through.
    return { ...template, images: input.images, video: input.video };
  }

  private buildTemplate(
    input: PromptEnhancerInput,
    analysis: IntentAnalysis,
  ): EnhancedGenerationRequest {
    const provider = this.selectProvider(input.type, analysis);
    const duration = analysis.suggestedDuration;
    const aspectRatio = analysis.suggestedAspectRatio as any;

    const baseParams = {
      duration,
      aspectRatio,
      resolution:
        provider === "seedance"
          ? "1080p"
          : provider === "kling"
            ? "720p"
            : "720p",
      fps: 24,
      cameraMotion: "static" as const,
    };

    switch (input.type) {
      case GenerationType.TEXT_TO_VIDEO:
        return {
          prompt: `Cinematic ${input.brief}, professional lighting, high quality`,
          negativePrompt: "blurry, low quality, distorted, watermark, text",
          type: GenerationType.TEXT_TO_VIDEO,
          params: {
            ...baseParams,
            cameraMotion: "orbit",
            scenes: analysis.hasMultipleScenes
              ? [
                  {
                    timeRange: "0-3s",
                    description: "Establishing shot",
                    camera: "slow push in",
                    lighting: "soft key light",
                  },
                  {
                    timeRange: "3-6s",
                    description: "Detail view",
                    camera: "macro orbit",
                    lighting: "rim light",
                  },
                  {
                    timeRange: "6-12s",
                    description: "Hero moment",
                    camera: "handheld natural",
                    lighting: "golden hour",
                  },
                ]
              : undefined,
          } as TextToVideoParams,
          metadata: {
            complexity: analysis.complexity,
            recommendedProvider: provider,
            estimatedDuration: duration,
            requiresConsistency: analysis.requiresCharacterConsistency,
            priority: "quality",
          },
        };

      case GenerationType.IMAGE_TO_VIDEO:
        return {
          prompt: `Animate the image: ${input.brief}, smooth natural motion`,
          negativePrompt: "static, frozen, jittery, morphing, distortion",
          type: GenerationType.IMAGE_TO_VIDEO,
          params: {
            motionStrength: 0.5,
            cameraMotion: "zoom",
            duration,
          } as ImageToVideoParams,
          metadata: {
            complexity: "simple",
            recommendedProvider: provider,
            estimatedDuration: duration,
            requiresConsistency: false,
            priority: "speed",
          },
        };

      case GenerationType.VIDEO_TO_VIDEO:
        return {
          prompt: `Style transfer: ${input.brief}, maintain structure and motion`,
          negativePrompt:
            "structure collapse, flickering, temporal inconsistency",
          type: GenerationType.VIDEO_TO_VIDEO,
          params: {
            style: input.userPreferences?.style || "cinematic",
            strength: 0.6,
            preserveStructure: true,
            consistencyFrames: 8,
          } as VideoToVideoParams,
          metadata: {
            complexity: "complex",
            recommendedProvider: provider,
            estimatedDuration: duration,
            requiresConsistency: true,
            priority: "quality",
          },
        };

      case GenerationType.TEXT_TO_IMAGE:
        return {
          prompt: `Professional photography: ${input.brief}, 8k, sharp focus, dramatic lighting`,
          negativePrompt:
            "blur, low quality, deformed, watermark, text, signature",
          type: GenerationType.TEXT_TO_IMAGE,
          params: {
            aspectRatio,
            resolution: "1024",
            style: "photorealistic",
            batchSize: 1,
          } as TextToImageParams,
          metadata: {
            complexity: "simple",
            recommendedProvider: provider,
            estimatedDuration: 10,
            requiresConsistency: false,
            priority: "speed",
          },
        };

      case GenerationType.IMAGE_TO_IMAGE:
        return {
          prompt: `Transform: ${input.brief}, preserve composition`,
          negativePrompt: "composition change, structure loss",
          type: GenerationType.IMAGE_TO_IMAGE,
          params: {
            strength: 0.5,
            preserveStructure: true,
            style: input.userPreferences?.style,
          } as ImageToImageParams,
          metadata: {
            complexity: "simple",
            recommendedProvider: provider,
            estimatedDuration: 10,
            requiresConsistency: true,
            priority: "speed",
          },
        };

      case GenerationType.MOTION_CONTROL:
        return {
          prompt: `Camera movement: ${input.brief}, smooth cinematic motion`,
          negativePrompt: "shaky, jittery, unstable, sudden moves",
          type: GenerationType.MOTION_CONTROL,
          params: {
            trajectory: "orbit",
            keyframes: [
              { time: 0, position: [0, 0, -5], rotation: [0, 0, 0], fov: 50 },
              {
                time: 0.5,
                position: [3, 0, -4],
                rotation: [0, 45, 0],
                fov: 50,
              },
              { time: 1, position: [0, 0, -5], rotation: [0, 90, 0], fov: 50 },
            ],
            subjectPosition: [0, 0, 0],
          } as MotionControlParams,
          metadata: {
            complexity: "complex",
            recommendedProvider: provider,
            estimatedDuration: duration,
            requiresConsistency: false,
            priority: "quality",
          },
        };
    }
  }

  private validate(enhanced: EnhancedGenerationRequest): void {
    // Validate required fields
    if (!enhanced.prompt || enhanced.prompt.length < 10) {
      throw new Error("Prompt too short or missing");
    }

    // Validate type-specific params
    const params = enhanced.params;
    const type = enhanced.type;

    if (type === GenerationType.TEXT_TO_VIDEO) {
      const p = params as TextToVideoParams;
      if (!p.duration || !p.aspectRatio || !p.resolution) {
        throw new Error("Missing required TextToVideo params");
      }
    } else if (type === GenerationType.IMAGE_TO_VIDEO) {
      const p = params as ImageToVideoParams;
      if (p.motionStrength === undefined || !p.cameraMotion) {
        throw new Error("Missing required ImageToVideo params");
      }
    } else if (type === GenerationType.VIDEO_TO_VIDEO) {
      const p = params as VideoToVideoParams;
      if (!p.style || p.strength === undefined) {
        throw new Error("Missing required VideoToVideo params");
      }
    } else if (type === GenerationType.TEXT_TO_IMAGE) {
      const p = params as TextToImageParams;
      if (!p.aspectRatio || !p.resolution) {
        throw new Error("Missing required TextToImage params");
      }
    } else if (type === GenerationType.IMAGE_TO_IMAGE) {
      const p = params as ImageToImageParams;
      if (p.strength === undefined) {
        throw new Error("Missing required ImageToImage params");
      }
    } else if (type === GenerationType.MOTION_CONTROL) {
      const p = params as MotionControlParams;
      if (!p.trajectory || !p.keyframes?.length) {
        throw new Error("Missing required MotionControl params");
      }
    }

    // Validate metadata
    if (!enhanced.metadata.recommendedProvider) {
      throw new Error("Missing recommendedProvider in metadata");
    }
  }
}

export const promptEnhancer = new PromptEnhancer();
