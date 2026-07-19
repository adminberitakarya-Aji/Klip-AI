# Implementation Plan: Klip-AI Remaining Work

> **Status Aktual (Audit CTO 2026-07-19)**: Fondasi arsitektur **kuat**, layer AI **sehat**, tetapi produk **belum production-ready end-to-end**
> **Focus Nyata**: Stabilkan contract type/schema, hijaukan type-check `web` + `api`, lalu tuntaskan wiring flow template
> **Updated**: 2026-07-19

---

## 🚀 Baca Ini Dulu (Onboarding Tim Baru)

Dokumen ini sekarang punya **2 fungsi**:

1. sebagai **ringkasan onboarding cepat** untuk tim baru
2. sebagai **arsip rencana implementasi historis** per phase

**Penting**: bagian awal dokumen ini adalah **source of truth terbaru hasil audit kode aktual**. Bagian phase-phase di bawah tetap berguna, tetapi beberapa statusnya sudah **lebih optimistis** daripada kondisi repo nyata saat ini.

### Ringkasan Eksekutif

- Repo ini adalah **monorepo Turborepo + pnpm** dengan pemisahan yang benar antara `apps/web`, `apps/api`, dan `packages/*`
- Bagian paling matang saat ini adalah **layer AI orchestration** di `packages/ai`
- Bagian yang paling butuh perapihan saat ini adalah **wiring produk**, **type contract lintas package**, dan **konsistensi dokumen vs kode aktual**
- Kesimpulan jujur: project ini adalah **strong pre-production system**, belum bisa disebut selesai production

### Peta Repo Super Singkat

#### `apps/web`

- Frontend utama: landing page, auth, template browser/detail/customize
- Menjadi **sumber session/JWT NextAuth**
- Banyak komponen visual dan 3D sudah ada, tetapi tidak semuanya sudah terpasang penuh ke flow utama

#### `apps/api`

- API backend berbasis Next.js route handlers
- Menangani generation, polling status, riwayat user, audio, upscaler, template APIs, health check
- **Bukan** host NextAuth; API hanya memverifikasi JWT yang diterbitkan oleh `apps/web`

#### `packages/ai`

- Jantung sistem: `prompt-enhancer`, `provider-router`, `pipeline-orchestrator`, `generation-service`
- Provider utama saat ini: **Seedance**, **Kling**, **Wan**
- Sudah punya test suite yang lulus

#### `packages/db`

- Prisma schema untuk user, auth, generation, upscaler, template system, preset packs, brand kit, review
- Model sudah kaya, tetapi beberapa contract masih drift dengan layer API/core

#### `packages/core` / `packages/config` / `packages/ui`

- `core`: shared types, schemas, logger, storage interfaces
- `config`: env validation
- `ui`: shared components

### Yang Sudah Terverifikasi Sehat

- `packages/ai` **lulus test** dan **lulus type-check**
- Arsitektur provider fallback dan pipeline AI sudah jauh lebih matang daripada versi plan awal
- Auth web → API via JWT shared secret sudah punya pemisahan concern yang benar
- Template system di level **schema data** dan **seed content** sudah cukup kaya

### Yang Belum Beres / Belum Aman Dianggap Selesai

#### 1. Status compile repo belum hijau

- `pnpm --filter @klipai/web type-check` **gagal**
- `pnpm --filter @klipai/api type-check` **gagal**
- Jadi repo belum layak disebut stabil untuk handoff production

#### 2. Template generation belum benar-benar end-to-end

- Endpoint `POST /api/templates/generate` saat ini membuat `TemplateGenerationJob` dan memotong kredit user
- Tetapi belum ada bukti implementasi worker/orchestrator nyata yang mengeksekusi shot generation + stitching sampai selesai
- Artinya ada risiko user **terpotong kredit tanpa hasil final**

#### 3. Contract generation advanced mode masih drift

- `@klipai/core` dan API route sudah mengenal advanced generation modes
- Tetapi enum `GenerationType` di Prisma masih belum sinkron penuh
- Ini adalah risiko runtime/data-integrity yang harus diprioritaskan

#### 4. Dokumentasi masih drift dari source code

- README dan beberapa bagian plan ini masih menggambarkan status yang lebih selesai dari kondisi nyata
- Tim baru harus **percaya bagian onboarding di atas**, lalu verifikasi ke kode sebelum menganggap sebuah fitur benar-benar selesai

### Fakta Arsitektur Penting Yang Harus Dipahami Tim Baru

#### Auth

- NextAuth dikonfigurasi **hanya di `apps/web`**
- `apps/api` **tidak** menjalankan instance NextAuth sendiri
- Kedua app harus berbagi `NEXTAUTH_SECRET` yang sama

#### Generation Flow

- Request masuk ke `apps/api`
- API melakukan auth check, rate limit, credit decrement, lalu membuat record generation
- `packages/ai` menangani prompt enhancement, provider selection/fallback, polling status provider, dan upload result ke storage

#### Template Flow

- UI template di `apps/web` sudah cukup lengkap di layer browser/detail/customize
- API template di `apps/api` sudah ada untuk list/detail/create/generate/status/stream
- Namun flow **generate from template** masih perlu dianggap **belum final** sampai ada eksekusi job nyata yang terhubung penuh

### Urutan Onboarding 1 Hari Pertama

1. Baca bagian ini sampai selesai
2. Scan struktur repo: `apps/web`, `apps/api`, `packages/ai`, `packages/db`
3. Fokus ke `packages/ai` untuk memahami jantung sistem
4. Baca `apps/web/src/lib/auth.ts` dan `apps/api/src/lib/session.ts` untuk memahami auth boundary
5. Baca route `apps/api/src/app/api/generate/[type]/route.ts` untuk lifecycle request generation
6. Baca Prisma schema untuk memahami model produk yang benar-benar ada
7. Setelah itu baru baca phase-phase historis di bawah sebagai konteks keputusan

### Prioritas Eksekusi Tim Saat Ini

#### Prioritas 0 — Samakan source of truth

- Sinkronkan dokumen ini, README, dan kode aktual
- Tandai jelas mana fitur yang **implemented**, **partial**, dan **planned**

#### Prioritas 1 — Hijaukan repo

- Bereskan semua type-check error di `apps/web`
- Bereskan semua type-check error di `apps/api`
- Rapikan export/import schema shared antar package

#### Prioritas 2 — Benahi contract generation

- Sinkronkan `GenerationType` di `@klipai/core`, route API, dan Prisma schema
- Hapus drift yang berpotensi merusak advanced modes

#### Prioritas 3 — Amankan template generation

- Jangan anggap fitur ini selesai hanya karena route + UI sudah ada
- Pastikan job benar-benar diproses end-to-end sebelum kredit dipotong atau sebelum fitur dianggap live

#### Prioritas 4 — Rapikan wiring produk

- Perbaiki navigasi yang belum tersambung penuh
- Pastikan CTA, route, dan template card terhubung ke halaman yang benar
- Audit ulang komponen 3D/media yang sudah siap pakai tetapi belum benar-benar diintegrasikan

### Status Nyata Per Area

| Area                | Status Nyata           | Catatan                                     |
| ------------------- | ---------------------- | ------------------------------------------- |
| Monorepo structure  | **Baik**               | Pembagian app/package sudah benar           |
| AI orchestration    | **Kuat**               | Test + type-check lulus                     |
| Web UX/marketing    | **Cukup matang**       | Visual kuat, wiring masih ada gap           |
| Auth boundary       | **Baik**               | Web issue JWT, API verify JWT               |
| Template data model | **Kuat**               | Schema dan seed sudah kaya                  |
| Template execution  | **Parsial**            | Job dibuat, eksekusi belum terbukti lengkap |
| Type safety repo    | **Belum aman**         | `web` dan `api` masih gagal type-check      |
| Docs accuracy       | **Perlu sinkronisasi** | Masih ada drift dengan kode aktual          |

### Aturan Membaca Sisa Dokumen Ini

- Anggap section di bawah sebagai **catatan implementasi historis**
- Jika ada konflik antara plan lama vs kode aktual, **kode aktual menang**
- Jika ada konflik antara status headline lama vs hasil test/type-check terbaru, **hasil test/type-check terbaru menang**

---

## 📌 Legenda Status

- **VERIFIED** = terverifikasi ada di kode dan perilakunya relatif konsisten dengan klaim
- **PARTIAL** = ada sebagian implementasi, tetapi belum utuh / belum aman dianggap selesai
- **PLANNED** = masih rencana, pseudo-code, atau desain

---

## ✅ Done / Verified (Ringkasan)

- **Monorepo Turborepo** dengan 8 packages (config, core, ui, db, ai, tsconfig, web, api)
- **apps/web**: Next.js 15 + R3F + GSAP + Lenis + Zustand + landing/auth/template UI dasar
- **apps/api**: AI endpoints, status polling, user generations, audio, upscaler, templates, health check
- **Auth boundary**: NextAuth hidup di `apps/web`, API hanya verify JWT
- **packages/ai**: provider router, prompt enhancer, generation service, tests
- **packages/db**: Prisma schema kaya untuk auth, generation, template system, preset packs, reviews

> **Catatan audit**: ringkasan di atas adalah area yang memang terlihat nyata di repo. Jangan menyimpulkan seluruh produk sudah production-ready hanya dari daftar ini.

---

## 📋 Phase 8: Testing & Optimization (Database & Dev) — **PARTIAL**

> **Status audit**: langkah setup/dev test ini masih relevan sebagai prosedur onboarding lokal, tetapi hasil akhirnya belum memenuhi klaim "production ready". Repo utama masih butuh perapihan type-check `web` dan `api`.

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

## 📋 Phase 9: AI Pipeline Implementation (dari SVG) - **CRITICAL / VERIFIED**

> **Status audit**: ini adalah phase yang paling sehat di repo saat ini. `packages/ai` lulus test dan type-check. Jika tim baru ingin memahami jantung sistem, mulai dari phase ini.

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

### 9.1 Restructure Providers (Breaking Change - Hapus 6 files lama) — **VERIFIED**

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

### 9.2 Pipeline Types & Interfaces — **VERIFIED**

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

### 9.3 Claude Prompt Enhancer (ORCHESTRATOR - PALING CRITICAL) — **VERIFIED**

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

### 9.4 Provider Router (Fallback Chain) — **VERIFIED**

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

### 9.5 Concrete Providers (Seedance, Kling, Wan) — **VERIFIED**

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

### 9.6 Pipeline Orchestrator — **VERIFIED** (extracted 2026-07-18)

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

### 9.7 Integrate ke GenerationService — **VERIFIED**

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

### 9.8 Tests & Validation — **VERIFIED**

**Files**: `packages/ai/__tests__/`

- `prompt-enhancer.test.ts` — Test output structure per type, termasuk assert `duration` bisa `15` (bukan cuma `6|12`) dan `images`/`video` ikut kebawa ke output
- `provider-router.test.ts` — Test fallback chain jalan sesuai **urutan tetap** Seedance→Kling→Wan (lihat keputusan 9.4), circuit breaker buka/tutup dengan benar, dan **assert `provider.generate()` menerima object berbentuk `GenerationRequest`** (`{prompt, type, options, images, video}`) — supaya regresi ke Bug Fix Log #1 ketauan otomatis, bukan lolos lewat `as any` lagi
- `pipeline-orchestrator.test.ts` — Mock `PromptEnhancer` + `ProviderRouter`, assert `waitForCompletion` dipanggil pakai `response.metadata.provider` (provider yang beneran fulfill), bukan `recommendedProvider` — supaya regresi ke Bug Fix Log #2 ketauan otomatis

---

## 📋 Phase 10: Production Hardening — **PARTIAL**

> **Status audit**: judul lama "Production Ready" terlalu optimistis. Beberapa komponen hardening memang sudah ada, tetapi repo secara keseluruhan belum lulus type-check pada `apps/web` dan `apps/api`, sehingga belum layak disebut production-ready end-to-end.

### 10.1 Monitoring & Observability — **VERIFIED**

- Sentry integration (DSN di env)
- Structured logging (pino/winston)
- Health checks: `/api/health` (DB, AI providers, queue)

### 10.2 Error Handling & Resilience — **PARTIAL**

- Global error boundary di API
- Retry policies dengan exponential backoff
- Dead letter queue untuk failed generations
- Rate limiting (per user, per IP)

> **Catatan audit**: retry, rate limiting, dan DLQ metadata/route terlihat ada. Namun wording "global error boundary" dan "resilience selesai" terlalu luas untuk kondisi repo sekarang; anggap area ini sudah berjalan **sebagian**, belum final.

### 10.3 Documentation — **PARTIAL**

- `README.md` update: setup, env, deploy
- `docs/api.md` - endpoint specs
- `docs/ai-pipeline.md` - provider configs, fallback logic
- `docs/database.md` - schema, migrations

> **Catatan audit**: dokumen ada dan cukup kaya, tetapi sebagian sudah drift dari kode aktual. Dokumentasi saat ini membantu onboarding, namun belum bisa dianggap sepenuhnya sinkron.

### 10.4 Performance — **PARTIAL**

- Prisma connection pooling
- Redis cache untuk user credits, provider status
- **CDN untuk generated assets (Cloudflare R2 + Vercel Blob)**
- Bundle analysis (`@next/bundle-analyzer`)

> **Catatan audit**: storage abstraction terverifikasi ada. Redis cache dan bundle analysis belum terverifikasi sebagai implementasi aktif di repo saat ini; perlakukan item tersebut sebagai target, bukan selesai.

---

## 📋 Phase 10.4 Detail: Storage Abstraction + Cloudflare R2 / Vercel Blob — **VERIFIED**

> **Status audit**: bagian storage abstraction ini konsisten dengan kode dan termasuk salah satu area infra yang paling rapi di repo.

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

## 📋 Phase 11: Advanced AI Features (Differentiation) — **PARTIAL**

> **Status audit**: feature-feature di phase ini tidak berada pada level kematangan yang sama. Sebagian sudah nyata di backend/API, sebagian masih berada pada level schema/request contract, dan sebagian lagi baru sebatas arah produk.

### 11.1 Character & Object Consistency — **PARTIAL**

- **Reference Image System** - Upload character/object reference, maintain across generations
- **LoRA/ControlNet Integration** - Fine-tune per user brand character
- **Identity Preservation** - FaceID, IP-Adapter untuk konsistensi wajah/produk

> **Catatan audit**: struktur data dan jalur referensi mulai terlihat, tetapi workflow user-facing dan validasi end-to-end belum cukup kuat untuk disebut selesai.

### 11.2 Motion Brush & Camera Control — **PARTIAL**

- **Motion Brush** - Brush area → define motion vector (Runway Gen-2 style)
- **Camera Path Editor** - Visual keyframe editor untuk trajectory 3D
- **Physics Simulation** - Cloth, hair, fluid dynamics untuk realism

> **Catatan audit**: dukungan contract/request dan beberapa field backend sudah ada, tetapi visual editor dan pengalaman produk penuhnya belum terlihat selesai.

### 11.3 Upscaler & Quality Enhancement — **VERIFIED (BACKEND)**

- **Video Upscaler** - 720p→4k (Real-ESRGAN / Topaz style)
- **Frame Interpolation** - 24fps→60fps smooth motion
- **Denoise & Sharpen** - Post-process pipeline

> **Catatan audit**: endpoint dan service backend untuk area ini memang ada. Status "verified" di sini berarti **backend capability exists**, bukan jaminan UX final.

### 11.4 Audio & Multi-modal — **VERIFIED (BACKEND)**

- **Text-to-Speech** - Indonesian voices (ElevenLabs / Coqui)
- **Sound Effects Generation** - Foley, ambient, impact sounds
- **Lip Sync** - Audio-driven facial animation (SadTalker / Wav2Lip)
- **Background Music** - AI music generation (Suno / Udio style)

> **Catatan audit**: route dan service backend memang ada. Status ini tetap perlu dibedakan dari kesiapan product UX di frontend.

### 11.5 Advanced Generation Modes — **PARTIAL / ADA DRIFT CONTRACT**

- **Video-to-Video Style Transfer** - Cinematic, anime, claymation, paper cutout
- **Inpainting/Outpainting** - Extend canvas, remove objects
- **Depth/Normal Map Control** - Geometric control
- **Multi-shot Storyboard** - Generate 5-10 shots dari 1 prompt, auto-edit

#### 11.5.1 Phase 1: Foundation & Style Transfer (Week 1) — **PARTIAL**

- [x] 1.1 Tambah `GenerationType` baru di `@klipai/core/types`
- [x] 1.2 Update `VALID_TYPES` di `/api/generate/[type]/route.ts`
- [x] 1.3 ControlNet integrated into providers (no separate wrapper needed)
- [x] 1.4 IP-Adapter integrated into providers (no separate wrapper needed)
- [x] 1.5 Register providers di `provider-router.ts` (Seedance, Kling, Wan all support)
- [x] 1.6 Style Transfer logic implemented in provider `buildPayload()` methods

> **Catatan audit**: advanced modes sudah dikenali di `@klipai/core` dan API route, tetapi enum Prisma belum sinkron penuh. Jadi status riilnya belum aman dianggap selesai.

#### 11.5.2 Phase 2: Inpainting/Outpainting + Depth Control (Week 2) — **PARTIAL**

- [x] 2.1 Inpainting/Outpainting logic implemented in provider `buildPayload()` methods
- [x] 2.2 Depth/Normal Map Control implemented in provider `buildPayload()` methods
- [x] 2.3 ControlNet infrastructure shared across all 3 providers
- [x] 2.4 Test all three modes (TypeScript type-check passes)

> **Catatan audit**: logic provider bisa ada, tetapi status persistence/runtime secara keseluruhan masih terpengaruh drift `GenerationType`.

#### 11.5.3 Phase 3: Multi-shot Storyboard (Week 3) — **PARTIAL**

- [x] 3.1 Multi-shot Storyboard implemented in provider `buildPayload()` methods (no separate orchestrator needed)
- [x] 3.2 Shot generation parameters mapped to provider endpoints
- [x] 3.3 Integrated with existing pipeline via provider router
- [x] 3.4 Test storyboard generation (TypeScript type-check passes)

> **Catatan audit**: untuk pipeline generation generik, ini terlihat ada. Tetapi untuk produk template/storyboard end-to-end di Phase 12, worker/orchestrator batch-stitch masih belum terbukti aktif.

#### 11.5.4 Phase 4: Polish & Tests (Week 4)

- [ ] 4.1 Unit tests untuk advanced modes
- [ ] 4.2 Integration tests

---

## 📋 Phase 12: Platform & UX (Productization) — **PARTIAL + PLANNED**

> **Status audit**: phase ini campuran antara implementasi nyata, implementasi parsial, dan roadmap masa depan. Tim baru tidak boleh membaca seluruh phase ini seolah-olah semuanya sudah ada.

### 12.1 Template & Preset System — **PARTIAL**

- **Template Library** - 100+ templates: "Iklan Skincare", "Reels Travel", "Product Demo UMKM"
- **One-Click Presets** - Style packs: "Cinematic", "TikTok Viral", "Corporate Clean"
- **Brand Kit** - Logo, color palette, font, jingle → auto-apply ke semua video

> **Catatan audit**:
>
> - data model template/preset/brand kit **sudah ada**
> - API template/preset **sudah ada sebagian**
> - UI template browser/detail/customize **sudah ada sebagian**
> - generate-from-template end-to-end **belum terbukti selesai**

Saya sudah cukup konteks untuk membuat rencana detail **Phase 12.1: Template & Preset System (Multi-shot Storyboard v1)**.

---

## 📋 RENCANA DETAIL: Template System MVP

> **Catatan audit**: section ini harus dibaca sebagai **gabungan antara implementasi yang sudah terjadi dan rencana yang belum selesai**. Status per subbagian sudah diperjelas di bawah.

### 🎯 Scope MVP (Multi-shot Storyboard v1)

- **Template = StoryboardTemplate** (5-10 shots pre-defined)
- **Full generation config per shot** (duration, aspect, resolution, camera, lighting, prompt, negative prompt)
- **Reference style image** untuk consistency across shots (IP-Adapter/ControlNet)
- **Brand Kit slots** (logo, color palette, font, jingle placeholder)
- **Low-res preview per shot** (generated saat publish template)
- **Hybrid batch generation** (3-4 parallel → stitch via FFmpeg concat)
- **Authoring**: Klip-AI curated seed templates (v1)

---

### 🗄️ 1. DATA MODEL (Prisma Schema Addition) — **VERIFIED**

> **Status audit**: mayoritas model inti untuk template/preset/brand kit memang sudah ada di Prisma schema.

```prisma
// packages/db/prisma/schema.prisma - TAMBAHAN

model StoryboardTemplate {
  id              String   @id @default(cuid())
  name            String   // "Hero Product Showcase 15s"
  slug            String   @unique // "hero-product-showcase-15s"
  description     String   @db.Text
  category        String   // "Product Showcase", "Social Commerce", "Brand Story"
  tags            String[] // ["skincare", "tiktok-shop", "hero-shot", "indonesia"]
  industry        String?  // "Skincare", "F&B", "Fashion", "Tech"
  format          String   // "REELS", "TIKTOK", "STORY", "SHORTS"
  style           String   // "Cinematic", "UGC", "Commercial", "Educational"

  // Duration & aspect
  totalDuration   Int      // 15 (seconds)
  aspectRatio     String   // "9:16"
  shotCount       Int      // 5-10

  // Reference style for consistency
  referenceStyleUrl   String? // Reference image/video URL
  referenceStyleType  String? // "image" | "video"

  // Brand kit placeholders
  brandKitSlots     Json?     // {logo: {positions: ["top-left", "bottom-right"]}, colors: ["#hex"], font: "Inter", jingle: true}

  // Versioning & publishing
  version         Int      @default(1)
  isPublished     Boolean  @default(false)
  isOfficial      Boolean  @default(false) // Klip-AI curated vs community
  authorId        String?  // User ID (null = official)

  // Preview assets (generated at publish time)
  previewThumbnailUrl String? // Cover thumbnail
  previewVideoUrl     String? // Stitched low-res preview
  shotPreviews        Json?   // [{shotIndex: 0, url: "...", duration: 3}, ...]

  // Stats
  usageCount      Int      @default(0)
  rating          Float?   @default(null)
  reviewCount     Int      @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  publishedAt     DateTime?

  shots           TemplateShot[]
  @@index([category])
  @@index([format])
  @@index([isPublished, isOfficial])
  @@index([authorId])
  @@map("storyboard_templates")
}

model TemplateShot {
  id              String   @id @default(cuid())
  templateId      String
  index           Int      // 0-9
  timeRange       String   // "0-3s"
  duration        Int      // 3 (seconds)
  description     String   // "Hero shot produk close-up"
  prompt          String   @db.Text // Cinematic prompt untuk shot ini
  negativePrompt  String?  @db.Text
  camera          String   // "slow push in"
  lighting        String   // "soft key light, rim light"

  // Generation params (full config)
  generationType  String   // "TEXT_TO_VIDEO", "IMAGE_TO_VIDEO", etc
  resolution      String   // "720p" | "1080p" | "4k"
  fps             Int      // 24 | 30
  cameraMotion    String   // "static" | "pan" | "zoom" | "orbit" | "handheld"
  motionStrength  Float?   // 0.1-1.0 (for I2V)
  seed            Int?     // Optional fixed seed

  // Reference per shot (optional override)
  referenceImageUrl String?
  referenceRole     String? // "character" | "style" | "structure"
  referenceWeight   Float?  // 0.1-1.0

  // Brand kit injection points
  brandKitOverlays  Json?   // {logo: {position: "bottom-right", opacity: 0.9}, text: {content: "{price}", position: "center"}}

  // Preview (generated at template publish)
  previewUrl        String?
  previewGeneratedAt DateTime?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  template          StoryboardTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  @@unique([templateId, index])
  @@map("template_shots")
}

// Brand Kit (untuk auto-apply ke template)
model BrandKit {
  id              String   @id @default(cuid())
  userId          String   @unique
  name            String   // "My Brand Kit"
  logoUrl         String?
  logoPosition    String   @default("bottom-right") // "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  logoOpacity     Float    @default(0.9)
  colorPalette    String[] // ["#FF6B35", "#FFFFFF", "#1A1A1A"]
  primaryFont     String?  // "Inter", "Poppins", "Plus Jakarta Sans"
  secondaryFont   String?
  jingleUrl       String?  // Audio file
  brandGuidelines String?  @db.Text // JSON: dos/don'ts
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("brand_kits")
}

// Template Generation Job (track batch generation from template)
model TemplateGenerationJob {
  id              String   @id @default(cuid())
  userId          String
  templateId      String
  brandKitId      String?
  status          TemplateJobStatus @default(QUEUED)
  progress        Int      @default(0)
  currentShot     Int      @default(0)
  totalShots      Int

  // Input customizations dari user
  customizations  Json?    // {shotOverrides: {0: {prompt: "..."}}, brandKit: {...}, referenceStyleUrl: "..."}

  // Results
  shotResults     Json?    // [{shotIndex: 0, generationId: "cuid", status: "COMPLETED", url: "..."}, ...]
  stitchedVideoUrl String?
  error           String?
  creditsUsed     Int      @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  completedAt     DateTime?

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  template        StoryboardTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  brandKit        BrandKit? @relation(fields: [brandKitId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([templateId])
  @@index([status])
  @@map("template_generation_jobs")
}

enum TemplateJobStatus {
  QUEUED
  PREPARING
  GENERATING_SHOTS
  STITCHING
  COMPLETED
  FAILED
  PARTIAL_SUCCESS
}
```

---

### 🔌 2. API ENDPOINTS (apps/api/src/app/api/templates/) — **PARTIAL**

> **Status audit**: route list/detail/create/generate/status/stream terlihat ada. Tetapi keberadaan route tidak sama dengan end-to-end execution yang selesai.

| Method | Endpoint                                   | Description                                                              |
| ------ | ------------------------------------------ | ------------------------------------------------------------------------ |
| GET    | `/api/templates`                           | List templates (filter: category, format, style, industry, tags, search) |
| GET    | `/api/templates/:slug`                     | Detail template + shots + previews                                       |
| POST   | `/api/templates`                           | Create template (admin/official only)                                    |
| PATCH  | `/api/templates/:id`                       | Update template (author/admin)                                           |
| DELETE | `/api/templates/:id`                       | Delete template (author/admin)                                           |
| POST   | `/api/templates/:slug/generate`            | **Generate from template** → create TemplateGenerationJob, return jobId  |
| GET    | `/api/templates/generations/:jobId`        | Poll generation job status                                               |
| GET    | `/api/templates/generations/:jobId/result` | Get final stitched video URL                                             |
| POST   | `/api/templates/:slug/preview`             | Generate/update shot previews (admin)                                    |

---

### ⚙️ 3. CORE LOGIC (packages/ai/src/services/template-orchestrator.ts) — **PLANNED**

> **Status audit**: `TemplateOrchestrator` dalam bentuk di bawah masih harus diperlakukan sebagai desain/pseudocode. Belum ditemukan implementasi worker nyata yang memproses `TemplateGenerationJob` sampai stitched result.

```typescript
// NEW FILE: packages/ai/src/services/template-orchestrator.ts

interface TemplateGenerationInput {
  templateId: string;
  userId: string;
  brandKitId?: string;
  customizations?: {
    shotOverrides?: Record<number, Partial<TemplateShot>>; // User edit prompt/camera per shot
    referenceStyleUrl?: string; // User upload reference image
    brandKitOverrides?: Partial<BrandKit>;
  };
}

interface ShotGenerationTask {
  shotIndex: number;
  shot: TemplateShot;
  prompt: string; // Final prompt after brand kit injection
  generationType: GenerationType;
  params: EnhancedGenerationRequest["params"];
  referenceImages?: ReferenceImage[];
}

class TemplateOrchestrator {
  constructor(
    private providerRouter: ProviderRouter,
    private storage: StorageProvider,
    private ffmpeg: FFmpegService,
  ) {}

  async generateFromTemplate(
    input: TemplateGenerationInput,
  ): Promise<TemplateGenerationJob> {
    // 1. Load template + shots
    const template = await this.loadTemplate(input.templateId);
    const brandKit = input.brandKitId
      ? await this.loadBrandKit(input.brandKitId)
      : null;

    // 2. Prepare shot tasks (apply customizations, inject brand kit)
    const shotTasks = this.prepareShotTasks(
      template,
      input.customizations,
      brandKit,
    );

    // 3. Create job record in DB
    const job = await this.createJobRecord(input, shotTasks.length);

    // 4. Execute hybrid batch generation (3-4 parallel)
    const shotResults = await this.executeHybridBatch(shotTasks, job.id);

    // 5. Stitch successful shots with FFmpeg concat
    const stitchedUrl = await this.stitchShots(shotResults, template);

    // 6. Upload to CDN, update job
    await this.finalizeJob(job.id, shotResults, stitchedUrl);

    return job;
  }

  private async executeHybridBatch(
    tasks: ShotGenerationTask[],
    jobId: string,
  ): Promise<ShotResult[]> {
    const BATCH_SIZE = 3;
    const results: ShotResult[] = [];

    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE);

      // Update job progress
      await this.updateJobProgress(jobId, i, tasks.length);

      // Generate batch in parallel
      const batchPromises = batch.map((task) =>
        this.generateShotWithRetry(task, 2).catch((err) => ({
          shotIndex: task.shotIndex,
          success: false,
          error: err.message,
        })),
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  private async generateShotWithRetry(
    task: ShotGenerationTask,
    maxRetries: number,
  ): Promise<ShotResult> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const enhanced = await this.buildEnhancedRequest(task);
        const response = await this.providerRouter.generate(enhanced);
        const completed = await this.providerRouter.waitForCompletion(
          response.metadata.provider,
          response.id,
        );
        return {
          shotIndex: task.shotIndex,
          success: true,
          generationId: completed.id,
          url: completed.resultUrl,
        };
      } catch (err) {
        if (attempt === maxRetries) throw err;
        await this.sleep(2000 * (attempt + 1)); // Exponential backoff
      }
    }
    throw new Error("Max retries exceeded");
  }

  private async stitchShots(
    results: ShotResult[],
    template: StoryboardTemplate,
  ): Promise<string> {
    const successfulShots = results
      .filter((r) => r.success)
      .sort((a, b) => a.shotIndex - b.shotIndex);

    if (successfulShots.length === 0)
      throw new Error("No successful shots to stitch");

    // Download all shot videos
    const localPaths = await Promise.all(
      successfulShots.map((r, i) =>
        this.downloadShot(r.url, `${r.shotIndex}_${i}.mp4`),
      ),
    );

    // FFmpeg concat (same codec/resolution/fps = lossless fast concat)
    const concatFile = await this.createConcatFile(localPaths);
    const outputPath = await this.ffmpeg.concat(concatFile, {
      codec: "copy", // Fast, lossless
      // Optionally: add crossfade transitions using filter_complex
    });

    // Upload stitched video
    const cdnUrl = await this.storage.upload(
      `template-generations/${jobId}/stitched.mp4`,
      outputPath,
      "video/mp4",
    );

    // Cleanup temp files
    await this.cleanup(localPaths, concatFile, outputPath);

    return cdnUrl;
  }
}
```

---

### 🎨 4. UI COMPONENTS (apps/web/src/components/templates/) — **PARTIAL**

> **Status audit**: `TemplateBrowser`, `TemplateCard`, `TemplateDetail`, dan `TemplateCustomize` ada. Tetapi flow generate/result penuh belum lengkap, dan sebagian wiring navigasi masih lepas.

```
components/templates/
├── TemplateBrowser.tsx          # Grid/list view dengan filter sidebar
├── TemplateCard.tsx             # Card: thumbnail, name, category, format, duration, shots count
├── TemplateDetail.tsx           # Modal/page: preview video, shot breakdown, "Gunakan Template" CTA
├── TemplateCustomize.tsx        # Form: per-shot prompt edit, brand kit select, reference upload
├── TemplateGenerateFlow.tsx     # Wizard: Pilih template → Customize → Generate → Progress → Result
├── ShotPreview.tsx              # Individual shot preview player
├── GenerationProgress.tsx       # Real-time progress: "Generating shot 3/7...", shot thumbnails appear
└── TemplateResult.tsx           # Final video player, download, share, regenerate shot
```

**Pages (app router):**

```
apps/web/src/app/(dashboard)/templates/
├── page.tsx                     # Template browser (list + filters)
├── [slug]/
│   ├── page.tsx                 # Template detail
│   ├── customize/
│   │   └── page.tsx             # Customize form
│   └── generate/
│       └── page.tsx             # Generation progress + result
```

---

### 🌱 5. SEED DATA: 15+ Indonesian UMKM Templates (scripts/seed-templates.ts) — **VERIFIED**

> **Status audit**: seed template memang nyata dan merupakan salah satu aset onboarding yang bagus untuk memahami model data dan intent produk.

| Template                     | Category         | Format | Shots | Industry        | Style           |
| ---------------------------- | ---------------- | ------ | ----- | --------------- | --------------- |
| **Hero Skincare 15s**        | Product Showcase | REELS  | 5     | Skincare        | Cinematic       |
| **Flash Sale TikTok 10s**    | Social Commerce  | TIKTOK | 4     | F&B/Fashion     | UGC/Viral       |
| **Founder Story 30s**        | Brand Story      | REELS  | 7     | All             | Documentary     |
| **Ramadhan Promo 15s**       | Seasonal         | STORY  | 5     | F&B/Retail      | Warm/Cinematic  |
| **Product Demo 20s**         | Educational      | TIKTOK | 6     | Tech/Home       | Clean/Modern    |
| **BTS Process 15s**          | Brand Story      | REELS  | 5     | Craft/Fashion   | Authentic       |
| **UGC Testimonial 15s**      | Social Proof     | TIKTOK | 4     | All             | Raw/Real        |
| **Bundle Deal 10s**          | Social Commerce  | REELS  | 3     | F&B/Beauty      | High Energy     |
| **New Launch Teaser 10s**    | Product Showcase | STORY  | 4     | All             | Mystery/Hype    |
| **How-to-use 20s**           | Educational      | REELS  | 6     | Skincare/Tech   | Step-by-step    |
| **Myth vs Fact 15s**         | Educational      | TIKTOK | 5     | Skincare/Health | Engaging        |
| **Lebaran Collection 15s**   | Seasonal         | REELS  | 5     | Fashion/Hijab   | Festive/Elegant |
| **Harbolnas Countdown 10s**  | Seasonal         | STORY  | 4     | All             | Urgency         |
| **Ingredient Spotlight 15s** | Educational      | REELS  | 5     | Skincare/F&B    | Scientific      |
| **Customer Journey 20s**     | Brand Story      | TIKTOK | 6     | Service/UMKM    | Emotional       |

Each seed includes: 5-7 shots with cinematic prompts, camera, lighting, reference style URL (placeholder), brand kit slots.

---

### 📦 6. DEPENDENCIES TAMBAHAN — **PLANNED**

> **Status audit**: dependency FFmpeg yang disebut di bawah adalah target desain. Belum menjadi implementasi aktif yang tervalidasi di repo saat ini.

```json
// package.json (root)
{
  "dependencies": {
    "@ffmpeg/ffmpeg": "^0.12.0", // FFmpeg.wasm untuk server-side stitching
    "@ffmpeg/util": "^0.12.0",
    "fluent-ffmpeg": "^2.1.2", // Wrapper FFmpeg CLI (server)
    "@types/fluent-ffmpeg": "^2.1.24"
  }
}
```

---

### ✅ IMPLEMENTATION ORDER (Priority) — **DIREVISI BERDASARKAN STATUS AKTUAL**

| Item                                             | Status Aktual                            | Catatan                                                      |
| ------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------ |
| Prisma schema + migration                        | **Sudah ada**                            | Perlu validasi ulang terhadap drift `GenerationType`         |
| Template CRUD API + Zod schemas                  | **Parsial**                              | Route ada, tetapi package export/type-check masih bermasalah |
| TemplateOrchestrator (batch gen + FFmpeg stitch) | **Belum ada**                            | Masih level desain                                           |
| Generate-from-template API endpoint              | **Ada tapi parsial**                     | Job dibuat, eksekusi end-to-end belum terbukti               |
| Seed 15 Indonesian templates                     | **Sudah ada**                            | Bagus untuk demo/onboarding                                  |
| UI: TemplateBrowser + TemplateCard               | **Ada tapi parsial**                     | Card/navigation belum seluruhnya tersambung                  |
| UI: TemplateDetail + ShotPreview                 | **Ada sebagian**                         | Detail ada, preview/result flow belum penuh                  |
| UI: TemplateCustomize                            | **Ada tapi type-check masih bermasalah** | Perlu perbaikan sebelum dianggap stabil                      |
| UI: GenerationProgress                           | **Belum terbukti lengkap**               | SSE/status route ada, halaman hasil penuh belum tervalidasi  |
| UI: TemplateResult                               | **Belum ada lengkap**                    | Masih target                                                 |
| Integration test full flow                       | **Belum ada**                            | Ini gap penting                                              |
| BrandKit model + API + UI                        | **Parsial**                              | Model ada, UX dan contract belum rapi penuh                  |

**Interpretasi baru**: tabel ini sekarang adalah **status aktual** yang harus dipakai untuk perencanaan sprint berikutnya.

---

### 🔑 KEY TECHNICAL DECISIONS SUMMARY

| Decision                | Choice                                  | Rationale                                      |
| ----------------------- | --------------------------------------- | ---------------------------------------------- |
| **Template storage**    | Prisma DB (not JSON)                    | Versioning, querying, relations, auth          |
| **Shot generation**     | Hybrid batch (3-4 parallel)             | Balance speed vs rate limits                   |
| **Video stitching**     | FFmpeg concat (codec copy)              | Lossless, fast, no re-encode                   |
| **Style consistency**   | Reference image + same provider         | Best consistency via IP-Adapter/ControlNet     |
| **Error handling**      | Retry failed shots (2x), stitch partial | User gets usable output even if 1-2 shots fail |
| **Preview generation**  | At template publish (admin)             | Fast browse, no on-demand generation cost      |
| **Brand kit injection** | Per-shot overlay config in template     | Flexible positioning per shot type             |

---

### ❓ OPEN QUESTIONS YANG MASIH RELEVAN

1. **FFmpeg strategy** - apakah stitching akan memakai binary server, wasm, atau service terpisah?
2. **Storage preview/result** - apakah semua output template harus masuk R2/Blob sejak MVP?
3. **Template authoring model** - admin only dulu, atau community workflow dengan review?
4. **Credit policy** - flat fee per template atau per shot?
5. **Realtime mechanism** - cukup polling/SSE dulu atau butuh WebSocket?

> **Catatan audit**: pertanyaan-pertanyaan ini masih valid. Yang berubah adalah baseline-nya: kita **belum** mulai dari nol, tetapi juga **belum** berada di tahap polish akhir.

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

## 🎯 Immediate Next Steps (Priority Order) — **REVISED 2026-07-19**

1. **Hijaukan type-check repo**
   - perbaiki `apps/web`
   - perbaiki `apps/api`
   - rapikan export/import schema shared
2. **Sinkronkan `GenerationType` lintas layer**
   - `@klipai/core`
   - route API
   - Prisma schema
3. **Amankan template generation**
   - jangan anggap live sampai ada eksekusi job nyata
   - hindari kredit terpotong tanpa hasil final
4. **Sinkronkan dokumentasi dengan kode**
   - README
   - plan ini
   - docs API/pipeline/database
5. **Rapikan wiring produk**
   - navigasi template
   - route/CTA
   - halaman progress/result yang belum lengkap
6. **Baru lanjut ke roadmap ekspansi**
   - advanced UX
   - team workspace
   - billing
   - public API/SDK

---

## 📅 Onboarding Operasional: Checklist 1 Minggu Pertama Untuk Engineer Baru

### Hari 1 — Setup dan Peta Sistem

- [ ] Clone repo, install dependency, copy `.env.example`, lalu jalankan setup DB lokal
- [ ] Jalankan `pnpm --filter @klipai/ai test`
- [ ] Jalankan `pnpm --filter @klipai/ai type-check`
- [ ] Jalankan `pnpm --filter @klipai/web type-check` dan `pnpm --filter @klipai/api type-check`
- [ ] Catat semua error yang muncul sebagai baseline onboarding
- [ ] Baca section onboarding di awal dokumen ini
- [ ] Scan folder: `apps/web`, `apps/api`, `packages/ai`, `packages/db`

### Hari 2 — Pahami Jantung AI Pipeline

- [ ] Baca `packages/ai/src/services/prompt-enhancer.ts`
- [ ] Baca `packages/ai/src/services/provider-router.ts`
- [ ] Baca `packages/ai/src/services/pipeline-orchestrator.ts`
- [ ] Baca `packages/ai/src/services/generation-service.ts`
- [ ] Pahami fallback order provider, polling, dan upload result
- [ ] Jalankan ulang test AI bila perlu sambil membaca test sebagai dokumentasi perilaku

### Hari 3 — Pahami Boundary Web, API, dan Auth

- [ ] Baca `apps/web/src/lib/auth.ts`
- [ ] Baca `apps/api/src/lib/session.ts`
- [ ] Baca `apps/api/src/app/api/generate/[type]/route.ts`
- [ ] Baca `apps/api/src/app/api/health/route.ts`
- [ ] Pastikan memahami bahwa NextAuth hidup di `apps/web`, bukan di `apps/api`
- [ ] Pahami alur: request → auth → rate limit → credit decrement → generation record → async processing

### Hari 4 — Pahami Model Data dan Template System

- [ ] Baca `packages/db/prisma/schema.prisma`
- [ ] Fokus ke model `Generation`, `StoryboardTemplate`, `TemplateShot`, `BrandKit`, `TemplateGenerationJob`
- [ ] Baca `packages/db/prisma/seed-templates.ts`
- [ ] Baca route template di `apps/api/src/app/api/templates/*`
- [ ] Identifikasi mana yang sudah implementasi nyata vs mana yang masih desain

### Hari 5 — Pahami Frontend Nyata Yang Sudah Ada

- [ ] Baca `apps/web/src/app/page.tsx` dan section landing utama
- [ ] Baca `apps/web/src/components/templates/TemplateBrowser.tsx`
- [ ] Baca `apps/web/src/components/templates/TemplateDetail.tsx`
- [ ] Baca `apps/web/src/components/templates/TemplateCustomize.tsx`
- [ ] Catat gap wiring UI: route, CTA, card click, progress/result flow
- [ ] Jalankan aplikasi lokal dan cocokkan UI dengan kode

### Hari 6 — First Fix Sprint

- [ ] Ambil 1-2 bug onboarding berisiko rendah tapi berdampak jelas
- [ ] Prioritas yang direkomendasikan:
- [ ] perbaiki type-check import/export shared schema
- [ ] perbaiki type-check halaman template customize
- [ ] perbaiki wiring navigasi template card / CTA
- [ ] buat catatan singkat apa yang berhasil diperbaiki dan apa yang masih mengganjal

### Hari 7 — Handshake Ke Tim

- [ ] Tulis ringkasan temuan teknis 1 halaman
- [ ] Daftar 3 area paling sehat di repo
- [ ] Daftar 3 risiko terbesar yang masih perlu dibereskan
- [ ] Ajukan 1 sprint plan realistis berbasis status aktual, bukan plan lama
- [ ] Pastikan semua temuan mengacu ke kode aktual, bukan asumsi dari dokumen lama

### Output Yang Diharapkan Di Akhir Minggu Pertama

- Engineer baru paham arsitektur inti repo
- Engineer baru bisa menjalankan test/type-check utama
- Engineer baru tahu area mana yang aman disentuh lebih dulu
- Engineer baru tidak salah mengira phase `DONE` lama sebagai status produksi aktual

---

**Updated**: 2026-07-19 — Status phase diselaraskan dengan audit kode aktual + onboarding checklist minggu pertama ditambahkan
