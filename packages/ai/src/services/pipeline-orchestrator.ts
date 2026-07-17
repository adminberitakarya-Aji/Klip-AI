import { PromptEnhancer } from "./prompt-enhancer";
import { ProviderRouter } from "./provider-router";
import { PromptEnhancerInput, ProviderResponse } from "../pipeline/types";
import { GenerationStatus } from "../types";

/**
 * Progress/result update emitted at each pipeline stage. Shape is a
 * structural subset of GenerationJob (owned by GenerationService) so it
 * can be passed straight into that service's updateJob() without any
 * mapping — but this file intentionally does not import GenerationJob to
 * avoid a circular dependency and to keep the orchestrator testable in
 * isolation (no DB, no in-memory job map).
 */
export interface PipelineProgressUpdate {
  status?: GenerationStatus;
  progress?: number;
  resultUrl?: string;
  error?: string;
}

/**
 * Runs the Brief -> Claude Prompt Enhancer -> Provider Router (fallback) ->
 * Result pipeline described in klip_ai_prompt_to_generation_pipeline.svg.
 *
 * This class owns ONLY the orchestration sequence. Job bookkeeping
 * (in-memory job map, DB persistence, status lookups) stays in
 * GenerationService, which supplies an onProgress callback here.
 */
export class PipelineOrchestrator {
  constructor(
    private promptEnhancer: PromptEnhancer,
    private providerRouter: ProviderRouter,
  ) {}

  async runPipeline(
    input: PromptEnhancerInput,
    onProgress?: (update: PipelineProgressUpdate) => void | Promise<void>,
  ): Promise<ProviderResponse> {
    await onProgress?.({ status: GenerationStatus.PROCESSING, progress: 10 });

    // Step 1: Enhance prompt with Claude
    await onProgress?.({ progress: 20 });
    const enhanced = await this.promptEnhancer.enhance(input);

    // Step 2: Route to provider (with fallback chain) and generate
    await onProgress?.({ progress: 40 });
    const response = await this.providerRouter.generate(enhanced);

    // Step 3: Poll for completion — using the provider that ACTUALLY
    // fulfilled the request, not the originally recommended one. A
    // fallback may have kicked in inside providerRouter.generate(),
    // and polling the wrong provider will 404 or fetch someone else's
    // job status.
    const fulfilledBy =
      (response.metadata?.provider as
        "seedance" | "kling" | "wan" | undefined) ??
      enhanced.metadata.recommendedProvider;

    await onProgress?.({ progress: 60 });
    const completed = await this.providerRouter.waitForCompletion(
      fulfilledBy,
      response.id,
      300000, // 5 minutes
    );

    await onProgress?.({
      status:
        completed.status === "completed"
          ? GenerationStatus.COMPLETED
          : GenerationStatus.FAILED,
      progress: 100,
      resultUrl: completed.resultUrl,
      error: completed.error,
    });

    return completed;
  }
}
