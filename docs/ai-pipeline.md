# Klip-AI AI Pipeline Documentation

## Overview

The Klip-AI AI Pipeline orchestrates the entire generation flow from user prompt to final asset delivery:

```
User Brief → Prompt Enhancer (Claude) → Provider Router → Provider API → Polling → CDN Upload → Database Update
```

---

## Architecture Components

### 1. Prompt Enhancer (`packages/ai/src/services/prompt-enhancer.ts`)

**Purpose**: Transforms user brief into structured, provider-ready generation request using Claude 3.5 Sonnet.

**Input** (`PromptEnhancerInput`):

```typescript
interface PromptEnhancerInput {
  brief: string; // User's natural language prompt
  type: GenerationType; // Target generation type
  images?: string[]; // Reference images (I2V, V2V, I2I)
  video?: string; // Reference video (V2V)
  userPreferences?: {
    style?: "cinematic" | "commercial" | "social" | "artistic";
    duration?: number;
    aspectRatio?: string;
  };
}
```

**Output** (`EnhancedGenerationRequest`):

```typescript
interface EnhancedGenerationRequest {
  prompt: string; // Cinematic prompt for provider
  negativePrompt?: string; // What to avoid
  type: GenerationType;
  images?: string[]; // Passed through from input
  video?: string; // Passed through from input
  params: TypeSpecificParams; // Structured params per type
  metadata: {
    complexity: "simple" | "storyboard" | "complex";
    recommendedProvider: "seedance" | "kling" | "wan";
    estimatedDuration: number;
    requiresConsistency: boolean;
    priority: "speed" | "quality" | "cost";
  };
}
```

**Type-Specific Params:**

- `TextToVideoParams`: duration, aspectRatio, resolution, fps, cameraMotion, scenes[]
- `ImageToVideoParams`: motionStrength, cameraMotion, duration, endImage
- `VideoToVideoParams`: style, strength, preserveStructure, consistencyFrames
- `TextToImageParams`: aspectRatio, resolution, style, negativePrompt, batchSize
- `ImageToImageParams`: strength, preserveStructure, style, mask
- `MotionControlParams`: trajectory, keyframes[], subjectPosition

**Validation**: Ensures all required params present per type; throws on missing fields.

---

### 2. Provider Router (`packages/ai/src/services/provider-router.ts`)

**Purpose**: Selects best provider, maps structured params to provider payload, executes with fallback chain.

**Provider Capabilities Registry:**

```typescript
const PROVIDER_CAPABILITIES: ProviderCapabilities[] = [
  {
    name: "seedance",
    supportedTypes: ALL_TYPES, // All 10 types
    maxDuration: 15,
    maxResolution: "4k",
    pricing: { perSecond: 0.15 },
    strengths: ["cinematic quality", "physics", "consistency", "storyboard"],
    weaknesses: ["slower", "higher cost"],
  },
  {
    name: "kling",
    supportedTypes: ALL_TYPES, // All 10 types
    maxDuration: 15,
    maxResolution: "1080p",
    pricing: { perSecond: 0.08 },
    strengths: ["speed", "motion control", "physics"],
    weaknesses: ["lower resolution"],
  },
  {
    name: "wan",
    supportedTypes: ["text-to-video", "image-to-video", "text-to-image"],
    maxDuration: 15,
    maxResolution: "720p",
    pricing: { perSecond: 0.03 },
    strengths: ["fast", "cheap"],
    weaknesses: ["limited types", "lower quality"],
  },
];
```

**Selection Logic:**

1. Filter providers supporting requested `type`
2. Sort by `metadata.priority` match (quality→seedance, speed→kling, cost→wan)
3. Check circuit breaker state (skip if open)
4. Primary = first in sorted list

**Fallback Chain (Fixed Order):**

```
seedance → kling → wan
```

_Always this order regardless of priority - predictability > optimization during failures_

**Circuit Breaker:**

- Threshold: 3 failures in 60 seconds
- Timeout: 60 seconds before half-open retry
- State persisted in-memory (per process)

**Payload Mapping:**
Maps `EnhancedGenerationRequest.params` → provider-specific JSON payload.

**Response Normalization:**

```typescript
interface ProviderResponse {
  id: string; // Provider's job ID
  status: "queued" | "processing" | "completed" | "failed";
  resultUrl?: string; // Direct provider CDN URL
  error?: string;
  metadata: {
    provider: "seedance" | "kling" | "wan";
    modelVersion: string;
    processingTimeMs?: number;
  };
}
```

---

### 3. Providers (`packages/ai/src/providers/`)

All providers implement `AIProvider` interface:

```typescript
interface AIProvider {
  name: "seedance" | "kling" | "wan";
  capabilities: ProviderCapabilities;
  generate(request: GenerationRequest): Promise<ProviderResponse>;
  getStatus(id: string): Promise<ProviderResponse>;
  cancel(id: string): Promise<void>;
}
```

**BaseProvider** (`base.ts`): Abstract class with shared logic:

- HTTP client with timeout/retry
- Auth header management
- Error normalization
- Polling helper (`waitForCompletion`)

#### Seedance Provider (`seedance.ts`)

- **Endpoint**: `https://api.seedance.ai/v1/generate`
- **Auth**: Bearer token (`SEEDANCE_API_KEY`)
- **Supports**: All 10 generation types
- **Features**: Storyboard scenes, ControlNet (canny/depth/normal/openpose), IP-Adapter, 4K output
- **Payload Format**:
  ```json
  {
    "prompt": "cinematic prompt...",
    "model": "seedance-2.5-pro",
    "parameters": {
      "duration": 15,
      "aspect_ratio": "9:16",
      "resolution": "1080p",
      "camera_motion": "orbit",
      "controlnet": { "type": "depth", "image": "...", "strength": 0.8 },
      "ip_adapter": { "reference_image": "...", "strength": 0.7 }
    }
  }
  ```

#### Kling Provider (`kling.ts`)

- **Endpoint**: `https://api.kling.ai/v1/generate`
- **Auth**: Bearer token (`KLING_API_KEY`)
- **Supports**: All 10 generation types
- **Features**: Motion brush, physics simulation (cloth/hair/fluid/rigid), 1080p max
- **Payload Format**:
  ```json
  {
    "prompt": "cinematic prompt...",
    "model": "kling-3.0",
    "parameters": {
      "duration": 15,
      "aspect_ratio": "9:16",
      "resolution": "1080p",
      "motion_brush": { "strokes": [...] },
      "physics": { "cloth": { "enabled": true, "targets": ["skirt"] } }
    }
  }
  ```

#### Wan Provider (`wan.ts`)

- **Endpoint**: `https://api.wan.ai/v1/generate`
- **Auth**: Bearer token (`WAN_API_KEY`)
- **Supports**: text-to-video, image-to-video, text-to-image only
- **Features**: Fast, cheap, 720p max
- **Payload Format**:
  ```json
  {
    "prompt": "cinematic prompt...",
    "model": "wan-2.6",
    "parameters": {
      "duration": 15,
      "aspect_ratio": "9:16",
      "resolution": "720p"
    }
  }
  ```

#### Audio Providers (`packages/ai/src/providers/audio/`)

- **ElevenLabs**: TTS, voice cloning
- **Coqui**: Open-source TTS alternative
- **Suno**: Music generation
- **SadTalker**: Lip sync
- **AudioService** orchestrates with same router pattern

---

### 4. Pipeline Orchestrator (`packages/ai/src/services/pipeline-orchestrator.ts`)

**Purpose**: Coordinates enhancer → router → polling → CDN upload. Pure logic, no DB.

```typescript
interface PipelineProgressUpdate {
  status?: GenerationStatus;
  progress?: number;
  resultUrl?: string;
  error?: string;
}

class PipelineOrchestrator {
  constructor(
    private promptEnhancer: PromptEnhancer,
    private providerRouter: ProviderRouter,
  ) {}

  async runPipeline(
    input: PromptEnhancerInput,
    onProgress?: (update: PipelineProgressUpdate) => void,
  ): Promise<ProviderResponse> {
    // 1. Enhance prompt (progress: 20)
    await onProgress?.({ progress: 20 });
    const enhanced = await this.promptEnhancer.enhance(input);

    // 2. Route to provider (progress: 40)
    await onProgress?.({ progress: 40 });
    const response = await this.providerRouter.generate(enhanced);

    // 3. Poll for completion (progress: 60-90)
    const fulfilledBy =
      response.metadata.provider ?? enhanced.metadata.recommendedProvider;
    await onProgress?.({ progress: 60 });
    const completed = await this.providerRouter.waitForCompletion(
      fulfilledBy, // CRITICAL: Use actual provider, not recommended
      response.id,
      300000, // 5 min max
    );

    // 4. Final (progress: 100)
    await onProgress?.({
      status: completed.status === "completed" ? "COMPLETED" : "FAILED",
      progress: 100,
      resultUrl: completed.resultUrl,
      error: completed.error,
    });

    return completed;
  }
}
```

---

### 5. Generation Service (`packages/ai/src/services/generation-service.ts`)

**Purpose**: Bridges pipeline with database, job management, retry logic, DLQ.

**Key Responsibilities:**

- In-memory job map + Prisma persistence
- Credit deduction (atomic transaction with generation creation)
- CDN upload post-completion (R2 / Vercel Blob)
- Retry failed generations (max 3x)
- Dead Letter Queue view

```typescript
async processGeneration(jobId: string, input: PromptEnhancerInput) {
  try {
    const completed = await this.orchestrator.runPipeline(input, (update) =>
      this.updateJob(jobId, { ...update, updatedAt: Date.now() }),
    );

    // Upload to CDN if configured
    if (completed.resultUrl && this.storage.isConfigured()) {
      const buffer = await fetch(completed.resultUrl).then(r => r.arrayBuffer());
      const cdnUrl = await this.storage.upload(
        `generations/${jobId}/output.mp4`,
        Buffer.from(buffer),
        "video/mp4",
      );
      await this.updateJob(jobId, { resultUrl: cdnUrl });
    }
  } catch (error) {
    await this.updateJob(jobId, { status: "FAILED", error: error.message });
    await this.recordFailureForRetry(jobId);
  }
}
```

**Retry Logic:**

```typescript
async retryFailedGeneration(jobId: string): Promise<{ retried: boolean; reason? }> {
  const record = await prisma.generation.findUnique({ where: { id: jobId } });
  if (!record) return { retried: false, reason: "NOT_FOUND" };
  if (record.status !== "FAILED") return { retried: false, reason: "NOT_FAILED" };
  if (record.retryCount >= 3) return { retried: false, reason: "MAX_RETRIES_EXCEEDED" };

  await prisma.generation.update({
    where: { id: jobId },
    data: { status: "QUEUED", progress: 0, error: null, retryCount: { increment: 1 } },
  });

  this.jobs.delete(jobId); // Clear stale state
  this.processGeneration(jobId, reconstructedInput);
  return { retried: true };
}
```

---

## Configuration

### Environment Variables (`packages/config/src/index.ts`)

```env
# AI Providers (at least one required)
SEEDANCE_API_KEY="sk-..."
SEEDANCE_BASE_URL="https://api.seedance.ai"
KLING_API_KEY="sk-..."
KLING_BASE_URL="https://api.kling.ai"
WAN_API_KEY="sk-..."
WAN_BASE_URL="https://api.wan.ai"

# Audio Providers
ELEVENLABS_API_KEY="..."
COQUI_BASE_URL="http://localhost:5002"
SUNO_API_KEY="..."
SADTALKER_BASE_URL="http://localhost:8000"

# Storage (CDN for generated assets)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="klip-ai-generations"
R2_PUBLIC_URL="https://cdn.klip.ai"        # Optional custom domain

# Fallback storage
BLOB_READ_WRITE_TOKEN="vercel_blob_token"

# Feature flags
ENABLE_ADVANCED_MODES="true"                # Phase 11.5 modes
ENABLE_AUDIO_PIPELINE="true"                # Phase 11.4 audio
```

---

## Generation Types Matrix

| Type                          | Seedance | Kling | Wan | Duration | Max Res | Advanced Features          |
| ----------------------------- | -------- | ----- | --- | -------- | ------- | -------------------------- |
| text-to-video                 | ✅       | ✅    | ✅  | 6/12/15s | 4K      | Storyboard, Camera         |
| image-to-video                | ✅       | ✅    | ✅  | 6/12/15s | 4K      | End frame, Motion          |
| video-to-video                | ✅       | ✅    | ❌  | 6/12/15s | 4K      | Style transfer, ControlNet |
| text-to-image                 | ✅       | ✅    | ✅  | N/A      | 4K      | Batch (1-4)                |
| image-to-image                | ✅       | ✅    | ❌  | N/A      | 4K      | Mask, Strength             |
| motion-control                | ✅       | ✅    | ❌  | 6/12/15s | 4K      | 3D keyframes               |
| video-to-video-style-transfer | ✅       | ✅    | ❌  | 6/12/15s | 4K      | IP-Adapter, ControlNet     |
| inpainting-outpainting        | ✅       | ✅    | ❌  | N/A      | 4K      | Mask, Direction            |
| depth-normal-control          | ✅       | ✅    | ❌  | 6/12/15s | 4K      | Depth/Normal maps          |
| multi-shot-storyboard         | ✅       | ✅    | ❌  | Variable | 4K      | Auto-edit, Transitions     |

---

## Error Handling & Resilience

### Provider Errors

- Network timeout → retry next provider
- 4xx (auth, quota) → circuit breaker open, try next
- 5xx → circuit breaker, try next
- All providers fail → return `PROVIDER_UNAVAILABLE`

### Polling

- Exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s (cap)
- Max wait: 5 minutes (300,000ms)
- Cancellation: Not yet implemented (TODO)

### Database

- Prisma connection pool: 10 connections
- Retry on P2034 (transaction conflict): 3x
- Dead letter queue: `retryCount` + `lastFailedAt` on Generation model

---

## Monitoring & Observability

### Structured Logging (Pino)

```typescript
logger.generation.started(jobId, type, provider);
logger.generation.progress(jobId, progress, provider);
logger.generation.completed(jobId, type, provider, durationMs);
logger.generation.failed(jobId, type, provider, error);
```

### Metrics to Track

- Generation latency (p50, p95, p99)
- Success rate per provider per type
- Fallback frequency
- Credit consumption rate
- CDN upload success rate
- Queue depth (in-memory jobs)

### Health Checks

```
GET /api/health
```

Returns:

```json
{
  "status": "healthy",
  "database": "connected",
  "providers": {
    "seedance": "healthy",
    "kling": "degraded",
    "wan": "healthy"
  },
  "storage": "configured",
  "queueDepth": 12
}
```

---

## Testing

### Unit Tests (`packages/ai/__tests__/`)

- `prompt-enhancer.test.ts` - Output structure, duration=15 support, images/video passthrough
- `provider-router.test.ts` - Fallback chain order, circuit breaker, GenerationRequest shape
- `pipeline-orchestrator.test.ts` - waitForCompletion uses `response.metadata.provider`

### Integration Tests

- Full pipeline with mocked providers
- Credit deduction atomicity
- Retry logic
- DLQ listing

---

## Future Improvements

1. **Redis-backed job queue** - Replace in-memory map for horizontal scaling
2. **Provider-specific prompt templates** - Optimize per provider
3. **Smart routing** - ML-based provider selection based on historical performance
4. **Cancellation API** - Cancel in-flight generations
5. **Batch generation** - Multiple prompts in single request
6. **Cost tracking** - Per-generation cost logging for billing reconciliation
