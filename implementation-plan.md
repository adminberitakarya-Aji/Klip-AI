# Implementation Plan: Klip-AI Remaining Work

> **Status**: Monorepo + Web + API **SELESAI** ✅ | AI Pipeline (Phase 9) **SELESAI kecuali testing** ✅
> **Focus**: Testing & Validation → Production Ready
> **Updated**: 2026-07-18

---

## ✅ Done (Ringkasan)

- **Monorepo Turborepo** dengan 8 packages (config, core, ui, db, ai, tsconfig, web, api)
- **apps/web**: Next.js 15 + R3F + GSAP + Lenis + Zustand + Landing page
- **apps/api**: 6 AI endpoints + status polling + user generations + NextAuth v5
- **Packages**: Shared types, schemas, UI components, Prisma schema, AI service stubs

---

## 📋 Phase 8: Testing & Optimization (Database & Dev)

### 8.1 Database Setup

```bash
# Start PostgreSQL (Docker)
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=klipai -p 5432:5432 postgres:16

# Generate Prisma Client & push schema
pnpm run db:generate
pnpm run db:push

# Optional: Seed & Studio
pnpm run db:seed
pnpm run db:studio
```

### 8.2 Dev Server Test

```bash
pnpm run dev  # web:3000 + api:3001
# Test: signup → create generation → poll status → list generations
```

### 8.3 CI/CD Pipeline

- `.github/workflows/ci.yml` - lint, type-check, build, test
- `.github/workflows/deploy.yml` - deploy to Vercel (web) + Railway/Render (api)
- Environment variables setup di hosting

---

## 📋 Phase 9: AI Pipeline Implementation (dari SVG) - **CRITICAL**

### Architecture dari `klip_ai_prompt_to_generation_pipeline.svg`

```
Brief User → CLAUDE ORCHESTRATOR (Prompt Enhancer) → Provider Router (fallback) → Seedance 2.5 / Kling 3.0 / Wan 2.6 → Save to DB
```

**KEY INSIGHT**: Claude Orchestrator adalah **komponen paling kritis** - "garbage in, garbage out". Harus type-aware, output structured params, validate completeness.

---

### ⚠️ Bug Fix Log (2026-07-18)

Audit manual terhadap kode nyata (bukan cuma baca plan ini) nemuin 2 bug kritis yang **lolos dari TypeScript** karena ada `as any` yang nutupin type-checking. Keduanya sudah diperbaiki:

1. **Payload shape mismatch** (`provider-router.ts`): `executeWithFallback()` ngirim flat payload (`{prompt, duration, aspect_ratio, ...}`) langsung ke `provider.generate()`, padahal tiap provider (`seedance.ts`/`kling.ts`/`wan.ts`) expect `GenerationRequest` (`{prompt, type, options, images, video}`). Akibatnya: `request.type` undefined → endpoint provider jadi `undefined`, dan semua parameter generation (duration, resolution, camera motion, dll) ke-drop diam-diam karena provider cuma baca dari `.options`, bukan top-level. **Fix**: bungkus payload jadi `GenerationRequest` yang benar sebelum dikirim ke tiap provider di `executeWithFallback()`.
2. **Polling status pakai provider yang salah** (`generation-service.ts`): `waitForCompletion()` pakai `enhanced.metadata.recommendedProvider` (provider yang **diminta**), bukan provider yang **beneran** fulfill request setelah fallback terjadi. **Fix**: pakai `response.metadata.provider` (dicatat `ProviderRouter.normalizeResponse()`) sebagai sumber kebenaran, fallback ke `recommendedProvider` kalau nggak ada.

Efek samping dari fix #1: ternyata `images`/`video` juga **hilang total** di sepanjang pipeline sejak awal — cuma disebut ke Claude sebagai teks konteks ("Reference images: N"), nggak pernah ikut sebagai data asli ke provider. Ditambahin field `images?`/`video?` ke `EnhancedGenerationRequest` dan diteruskan di `PromptEnhancer.mergeWithDefaults()`.

**Rekomendasi**: item 9.8 (test provider-router & pipeline-orchestrator) jadi prioritas berikutnya supaya kelas bug ini (lolos type-check karena `as any`) ketahuan otomatis, bukan cuma pas ada yang baca kode manual.

---

### 9.1 Restructure Providers (Breaking Change - Hapus 6 files lama) ✅ **DONE**

**Hapus files lama** (type-based, salah arsitektur):

```
packages/ai/src/providers/
  ❌ text-to-video.ts
  ❌ image-to-video.ts
  ❌ video-to-video.ts
  ❌ text-to-image.ts
  ❌ image-to-image.ts
  ❌ motion-control.ts
```

**Buat files baru** (provider-based, benar - 1 provider support 6 types):

```
packages/ai/src/providers/
  ✅ seedance.ts      # Primary - supports all 6 types
  ✅ kling.ts         # Fallback #1 - supports all 6 types
  ✅ wan.ts           # Fallback #2 - supports all 6 types
  ✅ base.ts          # BaseProvider (keep, extend)
  ✅ index.ts         # Factory + exports
```

---

### 9.2 Pipeline Types & Interfaces ✅ **DONE**

**File**: `packages/ai/src/pipeline/types.ts`

> **Keputusan durasi (2026-07-18)**: kriteria awal milih provider adalah _"minimal 15 detik langsung, single pass"_. Semula `duration` di-type sebagai `6 | 12` dan `maxDuration` provider di-set 6-12 — kontradiksi sama kriteria itu sendiri. Sudah diperbaiki jadi `6 | 12 | 15` di seluruh pipeline (`pipeline/types.ts`, `types.ts`, dan tiap file provider), termasuk instruksi ke Claude di `prompt-enhancer.ts` yang sebelumnya hardcode "6 or 12" di system prompt-nya — jadi bukan cuma tipe datanya yang dilebarin, tapi juga instruksi ke model yang generate nilainya.

```typescript
// Enhanced request yang dihasilkan Claude Orchestrator
export interface EnhancedGenerationRequest {
  // Core prompt
  prompt: string; // Cinematic prompt
  negativePrompt?: string; // What to avoid

  // Type & structured params (type-specific)
  type: GenerationType;

  // Reference inputs (carried through dari request asli — sempat hilang, lihat Bug Fix Log)
  images?: string[];
  video?: string;

  params:
    | TextToVideoParams
    | ImageToVideoParams
    | VideoToVideoParams
    | TextToImageParams
    | ImageToImageParams
    | MotionControlParams;

  // Metadata untuk routing & optimization
  metadata: {
    complexity: "simple" | "storyboard" | "complex";
    recommendedProvider: "seedance" | "kling" | "wan";
    estimatedDuration: number; // seconds
    requiresConsistency: boolean; // Multi-scene/character consistency
    priority: "speed" | "quality" | "cost";
  };
}

// Type-specific structured params (bukan flat options)
export interface TextToVideoParams {
  duration: 6 | 12 | 15;
  aspectRatio: "9:16" | "16:9" | "1:1";
  resolution: "720p" | "1080p" | "4k";
  fps: 24 | 30;
  cameraMotion: "static" | "pan" | "zoom" | "orbit" | "handheld";
  seed?: number;
  // Storyboard support
  scenes?: Array<{
    timeRange: string; // "0-3s"
    description: string; // "Hero shot produk"
    camera: string; // "slow push in"
    lighting?: string; // "soft key light"
  }>;
}

export interface ImageToVideoParams {
  motionStrength: number; // 0.1 - 1.0
  cameraMotion: "static" | "pan" | "zoom" | "orbit";
  duration: 6 | 12 | 15;
  // Start/end frame control
  endImage?: string; // Optional end frame
}

export interface VideoToVideoParams {
  style: string; // Style reference / prompt
  strength: number; // 0.1 - 1.0
  preserveStructure: boolean; // ControlNet-style
  // Temporal consistency
  consistencyFrames?: number;
}

export interface TextToImageParams {
  aspectRatio: "9:16" | "16:9" | "1:1" | "4:3" | "3:4";
  resolution: "512" | "768" | "1024" | "2048";
  style?: string;
  negativePrompt?: string;
  // Batch
  batchSize?: number; // 1-4
}

export interface ImageToImageParams {
  strength: number; // 0.1 - 1.0
  preserveStructure: boolean;
  style?: string;
  // Mask support
  mask?: string; // Base64 mask for inpainting
}

export interface MotionControlParams {
  trajectory:
    "linear" | "circular" | "spiral" | "custom" | "orbit" | "dolly" | "crane";
  keyframes: Array<{
    time: number; // 0-1 normalized
    position: [number, number, number]; // x, y, z
    rotation: [number, number, number]; // pitch, yaw, roll
    fov?: number; // Field of view
  }>;
  // Subject tracking
  subjectPosition?: [number, number, number];
}

// Provider capabilities declaration
export interface ProviderCapabilities {
  name: "seedance" | "kling" | "wan";
  supportedTypes: GenerationType[];
  maxDuration: number; // seconds
  maxResolution: string;
  pricing: { perSecond?: number; perImage?: number };
  strengths: string[]; // ['cinematic', 'physics', 'consistency']
  weaknesses: string[]; // ['slow', 'expensive']
}
```

---

### 9.3 Claude Prompt Enhancer (ORCHESTRATOR - PALING CRITICAL) ✅ **DONE**

**File**: `packages/ai/src/services/prompt-enhancer.ts`

```typescript
interface PromptEnhancerInput {
  brief: string; // User input text
  type: GenerationType;
  images?: string[]; // Base64/URLs for I2V, V2V, I2I
  video?: string; // For V2V
  userPreferences?: {
    style?: "cinematic" | "commercial" | "social" | "artistic";
    duration?: number;
    aspectRatio?: string;
  };
}

class PromptEnhancer {
  private anthropic: Anthropic; // Anthropic SDK

  async enhance(
    input: PromptEnhancerInput,
  ): Promise<EnhancedGenerationRequest> {
    // 1. Analyze intent & complexity
    const analysis = await this.analyzeIntent(input);

    // 2. Generate type-specific structured prompt
    const enhanced = await this.generateStructuredPrompt(input, analysis);

    // 3. Validate completeness
    this.validate(enhanced);

    return enhanced;
  }

  private async analyzeIntent(input: PromptEnhancerInput) {
    // Use Claude to understand: simple vs storyboard vs complex
    // Detect: multi-scene, character consistency needs, physics complexity
  }

  private async generateStructuredPrompt(
    input: PromptEnhancerInput,
    analysis: IntentAnalysis,
  ): Promise<EnhancedGenerationRequest> {
    // Type-specific prompt templates
    // Output: cinematic prompt + structured params + metadata
  }

  private validate(enhanced: EnhancedGenerationRequest) {
    // Ensure all required params present per type
    // Check: duration, aspect, resolution, camera motion, etc.
  }
}
```

**Prompt Templates per Type** (internal, tidak user-facing):

- `TEXT_TO_VIDEO`: Scene breakdown, camera, lighting, timing per scene
- `IMAGE_TO_VIDEO`: Motion vector, physics, camera relative to image
- `VIDEO_TO_VIDEO`: Style transfer params, structure preservation
- `TEXT_TO_IMAGE`: Composition, lighting, style, negative prompts
- `IMAGE_TO_IMAGE`: Mask, strength, structure preservation
- `MOTION_CONTROL`: 3D trajectory, keyframes, subject tracking

---

### 9.4 Provider Router (Fallback Chain) ✅ **DONE**

**File**: `packages/ai/src/services/provider-router.ts`

> ⚠️ Snippet di bawah ini sudah diupdate 2026-07-18 supaya sesuai kode aktual — versi sebelumnya di plan ini nunjukin `provider.generate(request)` dengan `request: ProviderRequest`, padahal implementasi asli `AIProvider.generate()` nerima `GenerationRequest` (`{prompt, type, options, images, video}`). Ketidaksesuaian dokumentasi vs kode itu persis akar dari bug #1 di Bug Fix Log di atas — dokumentasi yang nggak disinkronkan bikin bug lolos nggak ketahuan. Jaga snippet di sini tetap sesuai kode nyata setiap kali `provider-router.ts` diubah.

**Keputusan fallback order (2026-07-18)**: fallback chain **sengaja** pakai urutan tetap Seedance → Kling → Wan, terlepas dari `metadata.priority` (speed/cost/quality) yang dipakai buat milih provider utama. Alasannya: predictability lebih penting daripada optimasi speed/cost pas kondisi darurat (provider utama down) — bukan bug atau item yang belum sempat dikerjain.

```typescript
export const PROVIDER_CAPABILITIES: ProviderCapabilities[] = [
  {
    name: 'seedance',
    supportedTypes: [ALL 6 TYPES],
    maxDuration: 15,   // native single-pass, sesuai keputusan 15 detik minimum
    maxResolution: '4k',
    strengths: ['cinematic quality', 'physics', 'consistency', 'storyboard'],
    weaknesses: ['slower', 'higher cost'],
  },
  {
    name: 'kling',
    supportedTypes: [ALL 6 TYPES],
    maxDuration: 15,
    maxResolution: '1080p',
    strengths: ['speed', 'motion control', 'physics'],
    weaknesses: ['lower resolution'],
  },
  {
    name: 'wan',
    supportedTypes: [TEXT_TO_VIDEO, IMAGE_TO_VIDEO, TEXT_TO_IMAGE],
    maxDuration: 15,
    maxResolution: '720p',
    strengths: ['fast', 'cheap'],
    weaknesses: ['limited types', 'lower quality'],
  },
];

class ProviderRouter {
  private providers: Map<string, AIProvider> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();

  async generate(request: EnhancedGenerationRequest): Promise<ProviderResponse> {
    // 1. Select best provider based on: type support, metadata.priority, circuit breaker state
    const provider = this.selectProvider(request);

    // 2. Map structured params to a flat provider payload
    const providerRequest = this.mapToProviderFormat(provider, request);

    // 3. Execute with fallback (fixed order: seedance -> kling -> wan)
    return this.executeWithFallback(provider, providerRequest, request);
  }

  private async executeWithFallback(
    primaryProvider: AIProvider,
    request: ProviderRequest,
    originalRequest: EnhancedGenerationRequest
  ): Promise<ProviderResponse> {
    let lastError: Error = new Error('All providers failed');

    for (const provider of this.getFallbackChain(primaryProvider.name, originalRequest)) {
      const breaker = this.circuitBreakers.get(provider.name);
      if (breaker?.isOpen) {
        if (Date.now() - breaker.lastFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
          breaker.isOpen = false; // half-open: allow one retry
        } else {
          continue; // still open, skip
        }
      }

      try {
        // IMPORTANT: providers expect a structured GenerationRequest
        // ({ prompt, type, options, images, video }), NOT the flat
        // router payload — wrap it correctly (see Bug Fix Log #1).
        const providerRequest: GenerationRequest = {
          prompt: originalRequest.prompt,
          type: originalRequest.type,
          options: request.payload,
          images: originalRequest.images,
          video: originalRequest.video,
        };
        const response = await provider.generate(providerRequest);
        if (breaker) { breaker.failures = 0; breaker.isOpen = false; }
        return this.normalizeResponse(provider.name, response);
      } catch (error) {
        lastError = error as Error;
        if (breaker) {
          breaker.failures++;
          breaker.lastFailure = Date.now();
          if (breaker.failures >= this.CIRCUIT_BREAKER_THRESHOLD) breaker.isOpen = true;
        }
        continue; // Try next in fixed order
      }
    }

    throw lastError;
  }

  private getFallbackChain(primaryName: string, request: EnhancedGenerationRequest): AIProvider[] {
    // Fixed order regardless of priority — see decision note above
    const order = ['seedance', 'kling', 'wan'];
    // primary goes first, then the rest of the fixed order that supports this type
  }

  async waitForCompletion(
    providerName: string,
    id: string,
    maxWaitMs = 300000, // 5 minutes
  ): Promise<ProviderResponse> {
    // Poll with exponential backoff (1s -> 2s -> 4s ... capped at 30s)
    // Max wait: 5 minutes. Caller must pass the provider that ACTUALLY
    // fulfilled the request (response.metadata.provider), not the
    // originally recommended one — see Bug Fix Log #2.
  }
}
```

---

### 9.5 Concrete Providers (Seedance, Kling, Wan) ✅ **DONE**

**Files**:

- `packages/ai/src/providers/seedance.ts`
- `packages/ai/src/providers/kling.ts`
- `packages/ai/src/providers/wan.ts`

Each implements `AIProvider` interface:

```typescript
interface AIProvider {
  name: "seedance" | "kling" | "wan";
  capabilities: ProviderCapabilities;
  generate(request: ProviderRequest): Promise<GenerationResponse>;
  getStatus(id: string): Promise<GenerationResponse>;
  cancel(id: string): Promise<void>;
}
```

**Key**: Map `EnhancedGenerationRequest.params` (structured) → provider-specific payload format

---

### 9.6 Pipeline Orchestrator ✅ **DONE** (extracted 2026-07-18)

**File**: `packages/ai/src/services/pipeline-orchestrator.ts`

> Desain final beda dari pseudocode awal di dua hal, sengaja: (1) orchestrator **tidak** pegang `db: PrismaClient` langsung — dia terima `onProgress` callback, dan `GenerationService` yang tetap pegang in-memory job map + DB sync lewat `updateJob()` yang sudah ada. (2) input-nya `PromptEnhancerInput`, bukan `PipelineContext` — `generationId`/`userId` nggak dipakai di logic orchestration itu sendiri, jadi nggak perlu jadi bagian tipe input orchestrator. Alasan utama desain ini: **testability** — `pipeline-orchestrator.test.ts` (lihat 9.8) tinggal mock `PromptEnhancer` + `ProviderRouter`, nggak perlu mock DB atau job map sama sekali.

```typescript
export interface PipelineProgressUpdate {
  status?: GenerationStatus;
  progress?: number;
  resultUrl?: string;
  error?: string;
}

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

    // 1. Enhance prompt with Claude
    await onProgress?.({ progress: 20 });
    const enhanced = await this.promptEnhancer.enhance(input);

    // 2. Route to provider with fallback
    await onProgress?.({ progress: 40 });
    const response = await this.providerRouter.generate(enhanced);

    // 3. Poll until completion — pakai provider yang BENERAN fulfill
    // (lihat Bug Fix Log #2), bukan yang direkomendasikan di awal
    const fulfilledBy =
      (response.metadata?.provider as
        "seedance" | "kling" | "wan" | undefined) ??
      enhanced.metadata.recommendedProvider;

    await onProgress?.({ progress: 60 });
    const completed = await this.providerRouter.waitForCompletion(
      fulfilledBy,
      response.id,
      300000,
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
```

---

### 9.7 Integrate ke GenerationService ✅ **DONE**

**Update**: `packages/ai/src/services/generation-service.ts`

```typescript
export class GenerationService {
  private promptEnhancer: PromptEnhancer;
  private orchestrator: PipelineOrchestrator;
  private jobs: Map<string, GenerationJob> = new Map();

  constructor() {
    this.promptEnhancer = new PromptEnhancer();
    this.orchestrator = new PipelineOrchestrator(
      this.promptEnhancer,
      providerRouter,
    );
    initializeProviders();
  }

  async processGeneration(jobId: string, input: PromptEnhancerInput) {
    // jobId = Generation.id yang sudah dibuat sekali oleh route.ts
    // di dalam prisma $transaction (lihat 9.9 / duplicate-record fix)
    try {
      await this.orchestrator.runPipeline(input, (update) =>
        this.updateJob(jobId, { ...update, updatedAt: Date.now() }),
      );
    } catch (error) {
      await this.updateJob(jobId, {
        status: GenerationStatus.FAILED,
        error: error instanceof Error ? error.message : "Generation failed",
        updatedAt: Date.now(),
      });
    }
  }

  // updateJob() tetap yang nanganin in-memory map + prisma.generation.update()
}
```

---

### 9.8 Tests & Validation ✅ **DONE**

**Files**: `packages/ai/__tests__/`

- `prompt-enhancer.test.ts` — Test output structure per type, termasuk assert `duration` bisa `15` (bukan cuma `6|12`) dan `images`/`video` ikut kebawa ke output
- `provider-router.test.ts` — Test fallback chain jalan sesuai **urutan tetap** Seedance→Kling→Wan (lihat keputusan 9.4), circuit breaker buka/tutup dengan benar, dan **assert `provider.generate()` menerima object berbentuk `GenerationRequest`** (`{prompt, type, options, images, video}`) — supaya regresi ke Bug Fix Log #1 ketauan otomatis, bukan lolos lewat `as any` lagi
- `pipeline-orchestrator.test.ts` — Mock `PromptEnhancer` + `ProviderRouter`, assert `waitForCompletion` dipanggil pakai `response.metadata.provider` (provider yang beneran fulfill), bukan `recommendedProvider` — supaya regresi ke Bug Fix Log #2 ketauan otomatis

---

## 📋 Phase 10: Production Ready

### 10.1 Monitoring & Observability ✅ **DONE**

- Sentry integration (DSN di env)
- Structured logging (pino/winston)
- Health checks: `/api/health` (DB, AI providers, queue)

### 10.2 Error Handling & Resilience ✅ **DONE**

- Global error boundary di API
- Retry policies dengan exponential backoff
- Dead letter queue untuk failed generations
- Rate limiting (per user, per IP)

### 10.3 Documentation

- `README.md` update: setup, env, deploy
- `docs/api.md` - endpoint specs
- `docs/ai-pipeline.md` - provider configs, fallback logic
- `docs/database.md` - schema, migrations

### 10.4 Performance ✅ **DONE**

- Prisma connection pooling
- Redis cache untuk user credits, provider status
- **CDN untuk generated assets (Cloudflare R2 + Vercel Blob)**
- Bundle analysis (`@next/bundle-analyzer`)

---

## 📋 Phase 10.4 Detail: Storage Abstraction + Cloudflare R2 / Vercel Blob ✅ **DONE**

### Architecture

```
packages/core/src/storage.ts          → Interface StorageProvider
packages/ai/src/services/storage/
  ├── r2-provider.ts                  → Cloudflare R2 implementation
  ├── vercel-blob-provider.ts         → Vercel Blob implementation
  └── index.ts                        → Factory createStorageProvider()
packages/ai/src/services/generation-service.ts  → Inject storage, upload result
packages/config/src/index.ts          → Zod validation untuk R2 & Blob env
apps/api/.env.example                 → Document env vars
apps/web/.env.example                 → Document NEXT_PUBLIC_R2_PUBLIC_URL
```

### Interface (`packages/core/src/storage.ts`)

```typescript
export interface StorageProvider {
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
  isConfigured(): boolean;
}

export interface SignedUrlOptions {
  expiresIn?: number; // seconds, default 3600
  method?: "GET" | "PUT";
}

export interface UploadResult {
  url: string; // public URL (R2 custom domain) atau signed URL
  key: string; // object key
  provider: "r2" | "vercel-blob";
}
```

### R2 Provider Implementation (`packages/ai/src/services/storage/r2-provider.ts`)

- **SDK**: `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (S3-compatible)
- **Endpoint**: `https://<account-id>.r2.cloudflarestorage.com`
- **Custom Domain**: `R2_PUBLIC_URL` (e.g., `https://cdn.klip.ai`) → public URL tanpa signed URL
- **Fallback**: Auto-generate signed URL (TTL 1h default) kalau custom domain belum setup
- **Key Format**: `generations/{userId}/{generationId}.{ext}`

### Vercel Blob Provider (`packages/ai/src/services/storage/vercel-blob-provider.ts`)

- **SDK**: `@vercel/blob`
- **Token**: `BLOB_READ_WRITE_TOKEN`
- **Use Case**: Fallback kalau R2 tidak dikonfigurasi, atau untuk preview assets

### Factory (`packages/ai/src/services/storage/index.ts`)

```typescript
export function createStorageProvider(): StorageProvider {
  // Priority: R2 > Vercel Blob > NullProvider (no-op)
  if (env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY) {
    return new R2StorageProvider({ ... });
  }
  if (env.BLOB_READ_WRITE_TOKEN) {
    return new VercelBlobStorageProvider({ token: env.BLOB_READ_WRITE_TOKEN });
  }
  return new NullStorageProvider(); // no-op, return original URL
}
```

### Integration di `GenerationService`

```typescript
// generation-service.ts
constructor(private storage: StorageProvider = createStorageProvider()) {}

async processGeneration(jobId: string, input: PromptEnhancerInput) {
  // ... existing pipeline ...
  const completed = await this.orchestrator.runPipeline(input, ...);

  // NEW: Upload result to CDN/storage
  if (completed.resultUrl && this.storage.isConfigured()) {
    const response = await fetch(completed.resultUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const key = `generations/${jobId}/output.mp4`;
    const cdnUrl = await this.storage.upload(key, buffer, 'video/mp4');

    // Update DB dengan CDN URL
    await this.updateJob(jobId, { resultUrl: cdnUrl });
  }
}
```

### Environment Variables

**`apps/api/.env.example`**

```env
# Cloudflare R2 (Primary)
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET="klip-ai-generations"
R2_PUBLIC_URL="https://cdn.klip.ai"  # optional: custom domain

# Vercel Blob (Alternative/Fallback)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_token"
```

**`apps/web/.env.example`**

```env
NEXT_PUBLIC_R2_PUBLIC_URL="https://cdn.klip.ai"
```

### Dependencies (root `package.json`)

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.500.0",
    "@aws-sdk/s3-request-presigner": "^3.500.0",
    "@vercel/blob": "^0.23.0"
  }
}
```

---

## 📋 Phase 11: Advanced AI Features (Differentiation)

### 11.1 Character & Object Consistency

- **Reference Image System** - Upload character/object reference, maintain across generations
- **LoRA/ControlNet Integration** - Fine-tune per user brand character
- **Identity Preservation** - FaceID, IP-Adapter untuk konsistensi wajah/produk

### 11.2 Motion Brush & Camera Control

- **Motion Brush** - Brush area → define motion vector (Runway Gen-2 style)
- **Camera Path Editor** - Visual keyframe editor untuk trajectory 3D
- **Physics Simulation** - Cloth, hair, fluid dynamics untuk realism

### 11.3 Upscaler & Quality Enhancement

- **Video Upscaler** - 720p→4k (Real-ESRGAN / Topaz style)
- **Frame Interpolation** - 24fps→60fps smooth motion
- **Denoise & Sharpen** - Post-process pipeline

### 11.4 Audio & Multi-modal

- **Text-to-Speech** - Indonesian voices (ElevenLabs / Coqui)
- **Sound Effects Generation** - Foley, ambient, impact sounds
- **Lip Sync** - Audio-driven facial animation (SadTalker / Wav2Lip)
- **Background Music** - AI music generation (Suno / Udio style)

### 11.5 Advanced Generation Modes

- **Video-to-Video Style Transfer** - Cinematic, anime, claymation, paper cutout
- **Inpainting/Outpainting** - Extend canvas, remove objects
- **Depth/Normal Map Control** - Geometric control
- **Multi-shot Storyboard** - Generate 5-10 shots dari 1 prompt, auto-edit

---

## 📋 Phase 12: Platform & UX (Productization)

### 12.1 Template & Preset System

- **Template Library** - 100+ templates: "Iklan Skincare", "Reels Travel", "Product Demo UMKM"
- **One-Click Presets** - Style packs: "Cinematic", "TikTok Viral", "Corporate Clean"
- **Brand Kit** - Logo, color palette, font, jingle → auto-apply ke semua video

### 12.2 Visual Prompt Builder (No-Code)

- **Drag-drop Scene Builder** - Timeline-based, add shots, transitions, text overlay
- **Shot List Generator** - AI breakdown script → shot list → generate each shot
- **Real-time Preview** - Low-res preview sebelum generate full quality

### 12.3 Team Workspace & Collaboration

- **Multi-user Workspaces** - Role: Owner, Admin, Creator, Viewer
- **Project Folders** - Organize by campaign/client
- **Comments & Approvals** - Review workflow: Draft → Review → Approved → Export
- **Shared Asset Library** - Brand assets, approved clips, music

### 12.4 Public API & Developer Platform

- **REST API** - Generate, status, list, webhook callbacks
- **SDKs** - TypeScript, Python, Go
- **Webhooks** - generation.completed, generation.failed, credits.low
- **API Keys Management** - Scoped keys, rate limits, usage analytics

### 12.5 Billing & Subscription

- **Stripe Integration** - Subscription (Free/Pro/UMKM/Enterprise)
- **Credit System** - Pay-per-generation, bulk credits, rollover
- **Usage Dashboard** - Real-time credits, cost per video, ROI calculator
- **Invoice & Tax** - Indonesia PPN compliance

### 12.6 Export & Distribution

- **Multi-format Export** - MP4, WebM, GIF, MOV, ProRes
- **Aspect Ratio Auto-crop** - 9:16, 16:9, 1:1, 4:5, 2:3
- **Direct Publish** - TikTok, Instagram Reels, YouTube Shorts, LinkedIn
- **CDN & Signed URLs** - Secure delivery, expiration, analytics

---

## 🎯 Immediate Next Steps (Priority Order)

1. **DB Setup** → `docker run postgres` + `pnpm db:generate && pnpm db:push`
2. **Dev Test** → `pnpm dev` → test full flow
3. **Phase 9.8** → Tests & validation: `provider-router.test.ts` (assert `GenerationRequest` shape ke provider, fallback order tetap) + `pipeline-orchestrator.test.ts` (assert polling pakai `response.metadata.provider`) — prioritas tertinggi karena 2 bug kritis kemarin lolos type-check via `as any`
4. **Phase 10** → Monitoring, docs, deploy
   - **10.2** Error Handling & Resilience (rate limiting, retry, DLQ)
   - **10.3** Documentation (README, api.md, ai-pipeline.md, database.md)
   - **10.4** Performance (Prisma pooling, Redis cache, **R2/Blob Storage**, Bundle analysis)
5. **Phase 11** → Advanced AI (consistency, motion brush, upscaler, audio)
6. **Phase 12** → Platform (templates, visual builder, team, API, billing)

---

**Updated**: 2026-07-18 — Added Phase 10.4 Storage Abstraction + Cloudflare R2 / Vercel Blob detail
