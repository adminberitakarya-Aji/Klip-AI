# Implementation Plan: Klip-AI Remaining Work

> **Status**: Monorepo + Web + API **SELESAI** ✅  
> **Focus**: Database setup → AI Pipeline → Production Ready  
> **Updated**: 2025-07-17

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

### 9.1 Restructure Providers (Breaking Change - Hapus 6 files lama)

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

### 9.2 Pipeline Types & Interfaces

**File**: `packages/ai/src/pipeline/types.ts`

```typescript
// Enhanced request yang dihasilkan Claude Orchestrator
export interface EnhancedGenerationRequest {
  // Core prompt
  prompt: string; // Cinematic prompt
  negativePrompt?: string; // What to avoid

  // Type & structured params (type-specific)
  type: GenerationType;
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
  duration: 6 | 12;
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
  duration: 6 | 12;
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

### 9.3 Claude Prompt Enhancer (ORCHESTRATOR - PALING CRITICAL)

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

### 9.4 Provider Router (Fallback Chain)

**File**: `packages/ai/src/services/provider-router.ts`

```typescript
const PROVIDER_CHAIN: ProviderCapabilities[] = [
  {
    name: 'seedance',
    supportedTypes: [ALL 6 TYPES],
    maxDuration: 12,
    maxResolution: '4k',
    strengths: ['cinematic quality', 'physics', 'consistency'],
    weaknesses: ['slower', 'higher cost'],
  },
  {
    name: 'kling',
    supportedTypes: [ALL 6 TYPES],
    maxDuration: 10,
    maxResolution: '1080p',
    strengths: ['speed', 'motion control'],
    weaknesses: ['lower resolution'],
  },
  {
    name: 'wan',
    supportedTypes: [TEXT_TO_VIDEO, IMAGE_TO_VIDEO, TEXT_TO_IMAGE],
    maxDuration: 6,
    maxResolution: '720p',
    strengths: ['fast', 'cheap'],
    weaknesses: ['limited types', 'lower quality'],
  },
];

class ProviderRouter {
  private providers: Map<string, AIProvider> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  async generate(request: EnhancedGenerationRequest): Promise<GenerationResponse> {
    // 1. Select best provider based on: type support, metadata.priority, circuit breaker state
    const provider = this.selectProvider(request);

    // 2. Map structured params to provider format
    const providerRequest = this.mapToProviderFormat(provider, request);

    // 3. Execute with fallback
    return this.executeWithFallback(provider, providerRequest, request);
  }

  private async executeWithFallback(
    primary: AIProvider,
    request: ProviderRequest,
    original: EnhancedGenerationRequest
  ): Promise<GenerationResponse> {
    let lastError: Error;

    for (const provider of this.getFallbackChain(primary, original)) {
      if (this.circuitBreakers.get(provider.name)?.isOpen) continue;

      try {
        return await provider.generate(request);
      } catch (error) {
        lastError = error;
        this.recordFailure(provider.name);
        continue; // Try next
      }
    }

    throw lastError || new Error('All providers failed');
  }

  async waitForCompletion(id: string): Promise<GenerationResponse> {
    // Poll with exponential backoff
    // Max wait: 5 minutes
  }
}
```

---

### 9.5 Concrete Providers (Seedance, Kling, Wan)

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

### 9.6 Pipeline Orchestrator

**File**: `packages/ai/src/services/pipeline-orchestrator.ts`

```typescript
interface PipelineContext {
  generationId: string;
  userId: string;
  brief: string;
  type: GenerationType;
  images?: string[];
  video?: string;
  userPreferences?: any;
}

class PipelineOrchestrator {
  constructor(
    private promptEnhancer: PromptEnhancer,
    private providerRouter: ProviderRouter,
    private db: PrismaClient,
  ) {}

  async runPipeline(context: PipelineContext): Promise<GenerationResponse> {
    // 1. Enhance prompt with Claude
    const enhanced = await this.promptEnhancer.enhance({
      brief: context.brief,
      type: context.type,
      images: context.images,
      video: context.video,
    });

    // 2. Update DB: QUEUED → PROCESSING
    await this.db.generation.update({
      where: { id: context.generationId },
      data: { status: "PROCESSING", progress: 10 },
    });

    // 3. Route to provider with fallback
    const result = await this.providerRouter.generate(enhanced);

    // 4. Poll until completion
    const final = await this.providerRouter.waitForCompletion(result.id);

    // 5. Save final result to DB
    await this.db.generation.update({
      where: { id: context.generationId },
      data: {
        status: final.status,
        progress: 100,
        resultUrl: final.resultUrl,
        error: final.error,
        provider: enhanced.metadata.recommendedProvider,
        providerId: result.id,
        completedAt: final.status === "COMPLETED" ? new Date() : null,
      },
    });

    return final;
  }
}
```

---

### 9.7 Integrate ke GenerationService

**Update**: `packages/ai/src/services/generation-service.ts`

```typescript
// Replace mock processGeneration dengan:
async processGeneration(generationId: string, request: GenerationRequest) {
  const context: PipelineContext = {
    generationId,
    userId: request.userId,
    brief: request.prompt,
    type: request.type,
    images: request.images,
    video: request.video,
  };

  return this.pipelineOrchestrator.runPipeline(context);
}
```

---

### 9.8 Tests & Validation

**Files**: `packages/ai/__tests__/`

- `prompt-enhancer.test.ts` - Test output structure per type
- `provider-router.test.ts` - Test fallback chain
- `pipeline-orchestrator.test.ts` - Integration test

---

## 📋 Phase 10: Production Ready

### 10.1 Monitoring & Observability

- Sentry integration (DSN di env)
- Structured logging (pino/winston)
- Health checks: `/api/health` (DB, AI providers, queue)

### 10.2 Error Handling & Resilience

- Global error boundary di API
- Retry policies dengan exponential backoff
- Dead letter queue untuk failed generations
- Rate limiting (per user, per IP)

### 10.3 Documentation

- `README.md` update: setup, env, deploy
- `docs/api.md` - endpoint specs
- `docs/ai-pipeline.md` - provider configs, fallback logic
- `docs/database.md` - schema, migrations

### 10.4 Performance

- Prisma connection pooling
- Redis cache untuk user credits, provider status
- CDN untuk generated assets
- Bundle analysis (`@next/bundle-analyzer`)

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
3. **Phase 9.1-9.3** → Types, Prompt Enhancer, Provider Router
4. **Phase 9.4-9.6** → Seedance, Kling, Wan providers
5. **Phase 9.7-9.8** → Orchestrator + integrate
6. **Phase 10** → Monitoring, docs, deploy
7. **Phase 11** → Advanced AI (consistency, motion brush, upscaler, audio)
8. **Phase 12** → Platform (templates, visual builder, team, API, billing)
