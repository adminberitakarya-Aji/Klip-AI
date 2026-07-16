# Implementation Plan: Migrasi Klip-AI ke Monorepo Next.js 15 + R3F + GSAP + Lenis + Zustand

> **Project**: Klip-AI — AI Video & Image Generator untuk Kreator Indonesia  
> **Dari**: TanStack Start + Lovable + Vite (single repo)  
> **Ke**: **Turborepo Monorepo** dengan Next.js 15 (Web + API) + React Three Fiber + GSAP + Lenis + Zustand  
> **Tanggal**: 2025-07-16

---

## 🎯 Tujuan Utama

Migrasi total ke arsitektur **monorepo Turborepo** dengan:
- **apps/web** — Next.js 15 App Router (Landing + Dashboard)
- **apps/api** — Next.js 15 API Routes (6 AI endpoints + Auth + User)
- **packages/ui** — Shared shadcn/ui + Tailwind v4 components
- **packages/core** — Types, Zod schemas, constants, utils (shared frontend/backend)
- **packages/ai** — 6 AI Services: Text-to-Video, Image-to-Video, Video-to-Video, Text-to-Image, Image-to-Image, Motion Control
- **packages/db** — Prisma client, migrations, seeds
- **packages/config** — Env validation (Zod), shared constants

**Stack Utama:**
- **Next.js 15** (App Router, Server Components, Turbopack)
- **TypeScript** (strict mode, project references)
- **Tailwind CSS v4** (design system existing, OKLCH colors)
- **React Three Fiber (R3F)** — 3D/WebGL visual untuk AI creative tool
- **GSAP** — Animasi kompleks & scroll-triggered
- **Lenis** — Smooth scrolling performant
- **Zustand** — Global state management ringan
- **pnpm** — Package manager workspace
- **Turborepo** — Build system & caching

---

## 📋 Phase 1: Cleanup Lovable & TanStack Start (Critical)

### 1.1 Hapus Dependencies Lovable
```bash
# package.json - hapus:
- @lovable.dev/vite-tanstack-config
- lovable-error-reporting.ts (file & imports)
- window.__lovableEvents references
- AGENTS.md LOVABLE comment block
```

### 1.2 Hapus TanStack Start Stack
```bash
# package.json - hapus:
- @tanstack/react-start
- @tanstack/react-router
- @tanstack/router-plugin
- @tanstack/react-query (akan di-reinstall untuk Next.js)
- vite, @vitejs/plugin-react, vite-tsconfig-paths
- nitro
- bunfig.toml, bun.lock
```

### 1.3 Backup File Penting (Copy ke folder sementara)
```
src/
├── routes/
│   ├── __root.tsx        → backup untuk migrasi ke apps/web/src/app/layout.tsx
│   └── index.tsx         → backup untuk migrasi ke apps/web/src/app/page.tsx (932 lines)
├── styles.css            → backup untuk apps/web/src/app/globals.css
├── components/ui/        → 35+ Radix components → migrate ke packages/ui
├── hooks/use-mobile.tsx  → keep → packages/ui/hooks
├── lib/utils.ts          → keep → packages/core/utils
└── assets/               → 13 images → apps/web/public/assets/
```

### 1.4 Cleanup Commands
```bash
rm -rf node_modules bun.lock bunfig.toml vite.config.ts
rm src/start.ts src/server.ts src/router.tsx src/routeTree.gen.ts
rm src/lib/lovable-error-reporting.ts src/lib/error-capture.ts src/lib/error-page.ts
# Edit AGENTS.md - hapus LOVABLE block
```

---

## 📋 Phase 2: Setup Turborepo Monorepo (Critical)

### 2.1 Inisialisasi Monorepo Structure
```bash
# Root directory
mkdir -p klipai/{apps/{web,api},packages/{ui,core,ai,db,config}}
cd klipai

# pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - apps/*
  - packages/*
EOF

# package.json (root)
cat > package.json << 'EOF'
{
  "name": "klipai",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "db:generate": "turbo run db:generate --filter=db",
    "db:push": "turbo run db:push --filter=db",
    "db:studio": "turbo run db:studio --filter=db",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\""
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.5.0",
    "prettier": "^3.3.0",
    "@types/node": "^20.14.0"
  },
  "packageManager": "pnpm@9.0.0"
}
EOF

# tsconfig.json (root - base config)
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["node_modules", "**/dist", "**/.next", "**/.turbo"]
}
EOF

# turbo.json
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "outputs": []
    },
    "db:generate": {
      "outputs": ["prisma/client/**"]
    },
    "db:push": {},
    "db:studio": {}
  },
  "globalEnv": ["DATABASE_URL", "NEXTAUTH_SECRET", "AI_PROVIDER_API_KEY"]
}
EOF
```

### 2.2 Setup packages/config (Shared Config)
```bash
# packages/config/package.json
cat > packages/config/package.json << 'EOF'
{
  "name": "@klipai/config",
  "version": "0.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@klipai/tsconfig": "workspace:*"
  }
}
EOF

# packages/config/src/index.ts - Env validation
cat > packages/config/src/index.ts << 'EOF'
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Auth
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  
  // AI Providers
  AI_PROVIDER_API_KEY: z.string().min(1),
  AI_PROVIDER_BASE_URL: z.string().url().optional(),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Optional
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
EOF
```

### 2.3 Setup packages/core (Shared Types & Utils)
```bash
# packages/core/package.json
cat > packages/core/package.json << 'EOF'
{
  "name": "@klipai/core",
  "version": "0.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./utils": "./src/utils.ts",
    "./types": "./src/types.ts",
    "./schemas": "./src/schemas.ts",
    "./constants": "./src/constants.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.0",
    "date-fns": "^3.6.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@klipai/tsconfig": "workspace:*",
    "@klipai/config": "workspace:*"
  }
}
EOF

# packages/core/src/utils.ts
cat > packages/core/src/utils.ts << 'EOF'
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
EOF

# packages/core/src/types.ts - Shared types
cat > packages/core/src/types.ts << 'EOF'
// AI Generation Types
export type GenerationType = 
  | 'text-to-video'
  | 'image-to-video'
  | 'video-to-video'
  | 'text-to-image'
  | 'image-to-image'
  | 'motion-control';

export type GenerationStatus = 
  | 'idle'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export interface GenerationRequest {
  prompt: string;
  type: GenerationType;
  options?: Record<string, unknown>;
  images?: string[]; // base64 or URLs for I2V, V2V, I2I
  video?: string; // for V2V
}

export interface GenerationResponse {
  id: string;
  status: GenerationStatus;
  progress: number;
  resultUrl?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: 'user' | 'admin';
  subscription: 'free' | 'pro' | 'umkm';
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  name: 'free' | 'pro' | 'umkm';
  price: number;
  creditsPerMonth: number;
  features: string[];
  maxResolution: '720p' | '1080p' | '4k';
  watermark: boolean;
  priorityQueue: boolean;
  teamSeats: number;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
EOF

# packages/core/src/schemas.ts - Zod schemas
cat > packages/core/src/schemas.ts << 'EOF'
import { z } from 'zod';
import { GenerationType, GenerationStatus } from './types';

export const generationRequestSchema = z.object({
  prompt: z.string().min(1).max(4000),
  type: z.native: z.nativeEnum(GenerationType),
  options: z.record(z.unknown()).optional(),
  images: z.array(z.string().url()).max(4).optional(),
  video: z.string().url().optional(),
});

export const generationResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(GenerationStatus),
  progress: z.number().min(0).max(100),
  resultUrl: z.string().url().optional(),
  error: z.string().optional(),
  createdAt: z.number(),
  completedAt: z.number().optional(),
});

export const userSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().url().nullable(),
  role: z.enum(['user', 'admin']),
  subscription: z.enum(['free', 'pro', 'umkm']),
  credits: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
EOF
```

### 2.4 Setup packages/ui (Shared UI Components)
```bash
# packages/ui/package.json
cat > packages/ui/package.json << 'EOF'
{
  "name": "@klipai/ui",
  "version": "0.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./components/*": "./src/components/*.tsx",
    "./hooks/*": "./src/hooks/*.ts",
    "./lib/*": "./src/lib/*.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.0",
    "@radix-ui/react-collapsible": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-popover": "^1.1.0",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.400.0",
    "tailwind-merge": "^2.3.0",
    "@klipai/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@klipai/tsconfig": "workspace:*",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
EOF

# packages/ui/src/lib/utils.ts (re-export from core)
export { cn } from '@klipai/core/utils';

# packages/ui/src/hooks/use-mobile.ts
cat > packages/ui/src/hooks/use-mobile.ts << 'EOF'
import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
EOF
```

### 2.5 Setup packages/db (Database)
```bash
# packages/db/package.json
cat > packages/db/package.json << 'EOF'
{
  "name": "@klipai/db",
  "version": "0.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./client": "./src/client.ts"
  },
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:migrate": "prisma migrate dev",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@prisma/client": "^5.15.0",
    "@klipai/config": "workspace:*"
  },
  "devDependencies": {
    "prisma": "^5.15.0",
    "typescript": "^5.5.0",
    "@klipai/tsconfig": "workspace:*"
  }
}
EOF

# packages/db/prisma/schema.prisma
cat > packages/db/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  passwordHash  String?
  role          Role      @default(USER)
  subscription  Subscription @default(FREE)
  credits       Int       @default(30)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
  generations   Generation[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Generation {
  id          String           @id @default(cuid())
  userId      String
  prompt      String           @db.Text
  type        GenerationType
  status      GenerationStatus @default(QUEUED)
  progress    Int              @default(0)
  resultUrl   String?
  error       String?
  options     Json?
  inputImages String[]
  inputVideo  String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  completedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

enum Role {
  USER
  ADMIN
}

enum Subscription {
  FREE
  PRO
  UMKM
}

enum GenerationType {
  TEXT_TO_VIDEO
  IMAGE_TO_VIDEO
  VIDEO_TO_VIDEO
  TEXT_TO_IMAGE
  IMAGE_TO_IMAGE
  MOTION_CONTROL
}

enum GenerationStatus {
  IDLE
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
}
EOF

# packages/db/src/client.ts
cat > packages/db/src/client.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import { env } from '@klipai/config';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
EOF
```

### 2.6 Setup packages/ai (AI Services)
```bash
# packages/ai/package.json
cat > packages/ai/package.json << 'EOF'
{
  "name": "@klipai/ai",
  "version": "0.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./services/*": "./src/services/*.ts",
    "./providers/*": "./src/providers/*.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@klipai/core": "workspace:*",
    "@klipai/config": "workspace:*",
    "@klipai/db": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@klipai/tsconfig": "workspace:*"
  }
}
EOF

# packages/ai/src/types.ts
cat > packages/ai/src/types.ts << 'EOF'
import { GenerationType, GenerationRequest, GenerationResponse, GenerationStatus } from '@klipai/core/types';

export interface AIProvider {
  name: string;
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  getStatus(id: string): Promise<GenerationResponse>;
  cancel(id: string): Promise<void>;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
}

// Provider-specific options
export interface TextToVideoOptions {
  duration?: 6 | 12;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  resolution?: '720p' | '1080p' | '4k';
  fps?: 24 | 30;
  cameraMotion?: 'static' | 'pan' | 'zoom' | 'orbit';
  seed?: number;
}

export interface ImageToVideoOptions {
  motionStrength?: number;
  cameraMotion?: 'static' | 'pan' | 'zoom';
  duration?: 6 | 12;
}

export interface VideoToVideoOptions {
  style?: string;
  strength?: number;
  preserveStructure?: boolean;
}

export interface TextToImageOptions {
  aspectRatio?: '9:16' | '16:9' | '1:1' | '4:3' | '3:4';
  resolution?: '512' | '768' | '1024' | '2048';
  style?: string;
  negativePrompt?: string;
}

export interface ImageToImageOptions {
  strength?: number;
  preserveStructure?: boolean;
  style?: string;
}

export interface MotionControlOptions {
  trajectory?: 'linear' | 'circular' | 'spiral' | 'custom';
  keyframes?: Array<{ time: number; position: [number, number, number]; rotation: [number, number, number] }>;
}
EOF

# packages/ai/src/providers/base.ts
cat > packages/ai/src/providers/base.ts << 'EOF'
import { AIProvider, ProviderConfig, GenerationRequest, GenerationResponse, GenerationStatus } from '../types';
import { env } from '@klipai/config';

export abstract class BaseProvider implements AIProvider {
  protected config: ProviderConfig;
  
  constructor(config: ProviderConfig) {
    this.config = {
      baseUrl: env.AI_PROVIDER_BASE_URL,
      timeout: 300000, // 5 minutes
      ...config,
    };
  }

  abstract name: string;
  abstract generate(request: GenerationRequest): Promise<GenerationResponse>;
  abstract getStatus(id: string): Promise<GenerationResponse>;
  abstract cancel(id: string): Promise<void>;

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...options.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  protected mapStatus(providerStatus: string): GenerationStatus {
    const statusMap: Record<string, GenerationStatus> = {
      'pending': 'QUEUED',
      'queued': 'QUEUED',
      'processing': 'PROCESSING',
      'running': 'PROCESSING',
      'completed': 'COMPLETED',
      'succeeded': 'COMPLETED',
      'failed': 'FAILED',
      'error': 'FAILED',
      'cancelled': 'FAILED',
    };
    return statusMap[providerStatus.toLowerCase()] || 'FAILED';
  }
}
EOF

# packages/ai/src/services/generation-service.ts
cat > packages/ai/src/services/generation-service.ts << 'EOF'
import { prisma } from '@klipai/db/client';
import { GenerationType, GenerationStatus, GenerationRequest, GenerationResponse } from '@klipai/core/types';
import { AIProvider } from '../types';
import { TextToVideoProvider } from '../providers/text-to-video';
import { ImageToVideoProvider } from '../providers/image-to-video';
import { VideoToVideoProvider } from '../providers/video-to-video';
import { TextToImageProvider } from '../providers/text-to-image';
import { ImageToImageProvider } from '../providers/image-to-image';
import { MotionControlProvider } from '../providers/motion-control';

class GenerationService {
  private providers: Map<GenerationType, AIProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    const apiKey = process.env.AI_PROVIDER_API_KEY;
    const baseUrl = process.env.AI_PROVIDER_BASE_URL;

    this.providers.set('text-to-video', new TextToVideoProvider({ apiKey, baseUrl }));
    this.providers.set('image-to-video', new ImageToVideoProvider({ apiKey, baseUrl }));
    this.providers.set('video-to-video', new VideoToVideoProvider({ apiKey, baseUrl }));
    this.providers.set('text-to-image', new TextToImageProvider({ apiKey, baseUrl }));
    this.providers.set('image-to-image', new ImageToImageProvider({ apiKey, baseUrl }));
    this.providers.set('motion-control', new MotionControlProvider({ apiKey, baseUrl }));
  }

  private getProvider(type: GenerationType): AIProvider {
    const provider = this.providers.get(type);
    if (!provider) throw new Error(`Provider not found for type: ${type}`);
    return provider;
  }

  async createGeneration(userId: string, request: GenerationRequest): Promise<GenerationResponse> {
    // Create DB record
    const generation = await prisma.generation.create({
      data: {
        userId,
        prompt: request.prompt,
        type: request.type.toUpperCase().replace(/-/g, '_') as any,
        status: 'QUEUED',
        options: request.options as any,
        inputImages: request.images || [],
        inputVideo: request.video || null,
      },
    });

    // Queue for processing (in production, use a job queue like BullMQ)
    this.processGeneration(generation.id, request).catch(console.error);

    return {
      id: generation.id,
      status: 'QUEUED',
      progress: 0,
      createdAt: generation.createdAt.getTime(),
    };
  }

  private async processGeneration(generationId: string, request: GenerationRequest) {
    const provider = this.getProvider(request.type);

    try {
      // Update status to processing
      await prisma.generation.update({
        where: { id: generationId },
        data: { status: 'PROCESSING', progress: 10 },
      });

      // Call provider
      const result = await provider.generate(request);

      // Update with result
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: result.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
          progress: 100,
          resultUrl: result.resultUrl,
          error: result.error,
          completedAt: result.status === 'COMPLETED' ? new Date() : null,
        },
      });
    } catch (error) {
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  async getGeneration(id: string) {
    return prisma.generation.findUnique({ where: { id } });
  }

  async getUserGenerations(userId: string, page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      prisma.generation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.generation.count({ where: { userId } }),
    ]);

    return { items, total, page, pageSize, hasMore: total > page * pageSize };
  }

  async checkStatus(generationId: string): Promise<GenerationResponse | null> {
    const generation = await prisma.generation.findUnique({ where: { id: generationId } });
    if (!generation) return null;

    // If still processing, check with provider
    if (generation.status === 'PROCESSING' || generation.status === 'QUEUED') {
      const provider = this.getProvider(generation.type as GenerationType);
      const result = await provider.getStatus(generationId);
      
      if (result.status !== generation.status) {
        await prisma.generation.update({
          where: { id: generationId },
          data: { status: result.status, progress: result.progress, resultUrl: result.resultUrl },
        });
      }
      return result;
    }

    return {
      id: generation.id,
      status: generation.status,
      progress: generation.progress,
      resultUrl: generation.resultUrl || undefined,
      error: generation.error || undefined,
      createdAt: generation.createdAt.getTime(),
      completedAt: generation.completedAt?.getTime(),
    };
  }
}

export const generationService = new GenerationService();
EOF
```

---

## 📋 Phase 3: Setup apps/web (Next.js 15 Frontend)

### 3.1 Initialize Next.js App
```bash
cd apps/web
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm \
  --no-turbopack
```

### 3.2 apps/web/package.json Dependencies
```json
{
  "name": "@klipai/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.40.0",
    "@tanstack/react-query-devtools": "^5.40.0",
    "zustand": "^4.5.0",
    "@react-three/fiber": "^8.16.0",
    "@react-three/drei": "^9.110.0",
    "three": "^0.165.0",
    "gsap": "^3.12.0",
    "@gsap/react": "^2.1.0",
    "@studio-freight/lenis": "^1.0.0",
    "next-auth": "^5.0.0-beta.18",
    "react-hook-form": "^7.51.0",
    "@hookform/resolvers": "^3.4.0",
    "zod": "^3.23.0",
    "lucide-react": "^0.400.0",
    "sonner": "^1.5.0",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.1.0",
    "vaul": "^1.1.0",
    "cmdk": "^1.0.0",
    "recharts": "^2.12.0",
    "react-day-picker": "^8.10.0",
    "input-otp": "^1.2.0",
    "@klipai/ui": "workspace:*",
    "@klipai/core": "workspace:*",
    "@klipai/config": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/three": "^0.165.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@klipai/tsconfig": "workspace:*"
  }
}
```

### 3.3 apps/web/tsconfig.json (extends root)
```json
{
  "extends": "@klipai/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@klipai/ui/*": ["../../packages/ui/src/*"],
      "@klipai/core/*": ["../../packages/core/src/*"],
      "@klipai/config/*": ["../../packages/config/src/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 3.4 apps/web/src/app/globals.css (Migrasi dari styles.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);

  --font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-cyan-glow: var(--cyan-glow);
  --color-warm: var(--warm);
  --color-deep: var(--deep);
}

:root {
  --radius: 1rem;
  --background: oklch(0.04 0 0);
  --foreground: oklch(0.99 0 0);
  --card: oklch(0.08 0.005 260);
  --card-foreground: oklch(0.99 0 0);
  --popover: oklch(0.08 0.005 260);
  --popover-foreground: oklch(0.99 0 0);
  --primary: oklch(0.99 0 0);
  --primary-foreground: oklch(0.05 0 0);
  --secondary: oklch(0.14 0.008 260);
  --secondary-foreground: oklch(0.99 0 0);
  --muted: oklch(0.14 0.008 260);
  --muted-foreground: oklch(0.65 0.01 260);
  --accent: oklch(0.82 0.15 205);
  --accent-foreground: oklch(0.05 0 0);
  --destructive: oklch(0.65 0.22 27);
  --destructive-foreground: oklch(0.99 0 0);
  --border: oklch(1 0 0 / 0.08);
  --input: oklch(1 0 0 / 0.1);
  --ring: oklch(0.82 0.15 205);
  --deep: oklch(0.22 0.1 260);
  --cyan-glow: oklch(0.82 0.15 205);
  --warm: oklch(0.78 0.18 55);
  --gradient-hero: linear-gradient(135deg, oklch(0.14 0.06 260) 0%, oklch(0.24 0.12 250) 55%, oklch(0.4 0.16 210) 100%);
  --gradient-brand: linear-gradient(90deg, var(--cyan-glow), var(--warm));
  --gradient-radial: radial-gradient(circle at 50% 0%, oklch(0.4 0.16 210 / 0.35), transparent 60%);
  --shadow-glow: 0 20px 60px -20px oklch(0.4 0.16 210 / 0.55);
  --shadow-card: 0 10px 40px -20px oklch(0 0 0 / 0.6);
  --shadow-warm: 0 20px 50px -20px oklch(0.78 0.18 55 / 0.55);
}

@layer base {
  * { border-color: var(--color-border); }
  html { scroll-behavior: smooth; background-color: var(--color-background); color-scheme: dark; }
  body { background-color: var(--color-background); color: var(--color-foreground); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
  h1, h2, h3, h4 { font-family: var(--font-display); letter-spacing: -0.03em; }
  ::selection { background-color: oklch(0.82 0.15 205 / 0.3); }
}

@utility gradient-hero { background-image: var(--gradient-hero); }
@utility gradient-brand { background-image: var(--gradient-brand); }
@utility text-gradient-brand { background-image: linear-gradient(90deg, var(--cyan-glow), var(--warm)); -webkit-background-clip: text; background-clip: text; color: transparent; }
@utility shadow-glow { box-shadow: var(--shadow-glow); }
@utility shadow-card { box-shadow: var(--shadow-card); }
@utility shadow-warm { box-shadow: var(--shadow-warm); }
@utility glass { background-color: oklch(1 0 0 / 0.05); backdrop-filter: blur(20px); border: 1px solid oklch(1 0 0 / 0.08); }

@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@keyframes fade-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slow-zoom { from { transform: scale(1); } to { transform: scale(1.08); } }
@keyframes aurora-drift { 0%, 100% { transform: translate3d(0,0,0) scale(1); opacity: 0.55; } 50% { transform: translate3d(4%, -3%, 0) scale(1.15); opacity: 0.8; } }
@keyframes marquee-x { from { transform: translateX(0); } to { transform: translateX(-50%); } }

@utility animate-float { animation: float 6s ease-in-out infinite; }
@utility animate-fade-up { animation: fade-up 0.8s ease-out both; }
@utility animate-slow-zoom { animation: slow-zoom 20s ease-out forwards; }
@utility animate-aurora { animation: aurora-drift 14s ease-in-out infinite; }
@utility animate-marquee { animation: marquee-x 40s linear infinite; }

@utility grain-overlay {
  position: fixed; inset: 0; pointer-events: none; z-index: 40; opacity: 0.06; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.7 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}

@utility eyebrow-rule {
  display: inline-flex; align-items: center; gap: 0.75rem; font-size: 0.7rem; letter-spacing: 0.35em; text-transform: uppercase; color: oklch(1 0 0 / 0.55);
  &::before { content: ""; display: inline-block; width: 2.5rem; height: 1px; background: linear-gradient(90deg, transparent, oklch(1 0 0 / 0.5)); }
}
```

### 3.5 apps/web/src/app/layout.tsx
```tsx
import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Klip — AI Video & Image Generator untuk Kreator Indonesia',
  description: 'Klip adalah AI creative tool untuk konten kreator & UMKM Indonesia. Bikin video Reels, TikTok, dan gambar jualan dari teks dalam hitungan detik.',
  keywords: ['AI video generator', 'text to video', 'image to video', 'AI creative tool', 'Indonesia UMKM', 'content creator'],
  authors: [{ name: 'Klip' }],
  creator: 'Klip',
  publisher: 'Klip',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://klip.ai',
    title: 'Klip — AI Video & Image Generator untuk Kreator Indonesia',
    description: 'Text to Video, Image to Video, dan tools AI lengkap untuk kreator & UMKM Indonesia.',
    siteName: 'Klip',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Klip AI Generator' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Klip — AI Video & Image Generator',
    description: 'AI creative tool untuk kreator & UMKM Indonesia.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', weight: ['400','500','600','700'], display: 'swap' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.klip.ai" />
      </head>
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 3.6 apps/web/src/app/providers.tsx
```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SessionProvider } from 'next-auth/react';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { LenisProvider } from '@/components/animations/LenisProvider';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
  }));

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <LenisProvider>
          {children}
        </LenisProvider>
        <Toaster position="bottom-right" richColors theme="dark" />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

### 3.7 apps/web/src/app/page.tsx (Landing Page)
```tsx
'use client';

import { Hero } from '@/components/sections/Hero';
import { Filmstrip } from '@/components/sections/Filmstrip';
import { Features } from '@/components/sections/Features';
import { WhyKlip } from '@/components/sections/WhyKlip';
import { Gallery } from '@/components/sections/Gallery';
import { Testimonials } from '@/components/sections/Testimonials';
import { Pricing } from '@/components/sections/Pricing';
import { CtaFooter } from '@/components/sections/CtaFooter';
import { Nav } from '@/components/ui/Nav';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="grain-overlay" aria-hidden />
      <Nav />
      <main className="relative">
        <Hero />
        <Filmstrip />
        <Features />
        <WhyKlip />
        <Gallery />
        <Testimonials />
        <Pricing />
        <CtaFooter />
      </main>
    </div>
  );
}
```

---

## 📋 Phase 4: Setup apps/api (Next.js 15 API Routes)

### 4.1 Initialize Next.js API App
```bash
cd apps/api
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm \
  --no-turbopack
```

### 4.2 apps/api/package.json (Minimal - API only)
```json
{
  "name": "@klipai/api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack --port 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.0",
    "next-auth": "^5.0.0-beta.18",
    "zod": "^3.23.0",
    "@prisma/client": "^5.15.0",
    "@klipai/ai": "workspace:*",
    "@klipai/db": "workspace:*",
    "@klipai/core": "workspace:*",
    "@klipai/config": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^15.0.0",
    "prisma": "^5.15.0",
    "@klipai/tsconfig": "workspace:*"
  }
}
```

### 4.3 apps/api/src/app/api/generate/text-to-video/route.ts
```tsx
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generationService } from '@klipai/ai/services/generation-service';
import { generationRequestSchema } from '@klipai/core/schemas';
import { prisma } from '@klipai/db/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
    }

    // Check user credits
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.credits <= 0) {
      return NextResponse.json({ success: false, error: { code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits' } }, { status: 402 });
    }

    const result = await generationService.createGeneration(session.user.id, {
      ...parsed.data,
      type: 'text-to-video',
    });

    // Deduct credit
    await prisma.user.update({ where: { id: session.user.id }, data: { credits: { decrement: 1 } } });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Text-to-Video error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Generation failed' } }, { status: 500 });
  }
}
```

### 4.4 apps/api/src/app/api/generate/[type]/route.ts (Dynamic route untuk 6 AI types)
```tsx
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generationService } from '@klipai/ai/services/generation-service';
import { generationRequestSchema } from '@klipai/core/schemas';
import { prisma } from '@klipai/db/client';
import { GenerationType } from '@klipai/core/types';

const VALID_TYPES: GenerationType[] = [
  'text-to-video',
  'image-to-video',
  'video-to-video',
  'text-to-image',
  'image-to-image',
  'motion-control',
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  
  if (!VALID_TYPES.includes(type as GenerationType)) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_TYPE', message: 'Invalid generation type' } }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.credits <= 0) {
      return NextResponse.json({ success: false, error: { code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits' } }, { status: 402 });
    }

    const result = await generationService.createGeneration(session.user.id, {
      ...parsed.data,
      type: type as GenerationType,
    });

    await prisma.user.update({ where: { id: session.user.id }, data: { credits: { decrement: 1 } } });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error(`${type} error:`, error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Generation failed' } }, { status: 500 });
  }
}
```

### 4.5 apps/api/src/app/api/generate/[id]/status/route.ts
```tsx
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generationService } from '@klipai/ai/services/generation-service';
import { prisma } from '@klipai/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const generation = await prisma.generation.findUnique({ where: { id } });
    if (!generation || generation.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Generation not found' } }, { status: 404 });
    }

    const status = await generationService.checkStatus(id);
    
    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to check status' } }, { status: 500 });
  }
}
```

### 4.6 apps/api/src/app/api/user/generations/route.ts
```tsx
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@klipai/db/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await prisma.generation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await prisma.generation.count({ where: { userId: session.user.id } });

    return NextResponse.json({
      success: true,
      data: {
        items: result,
        total,
        page,
        pageSize,
        hasMore: total > page * pageSize,
      },
    });
  } catch (error) {
    console.error('User generations error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch generations' } }, { status: 500 });
  }
}
```

---

## 📋 Phase 5: Migrasi Landing Page + R3F/GSAP/Lenis (Critical)

### 5.1 Struktur Components di apps/web/src/components/
```
apps/web/src/components/
├── ui/                    # Re-export dari @klipai/ui
├── three/                 # R3F components
│   ├── CanvasProvider.tsx
│   ├── HeroScene.tsx
│   ├── FeatureCard3D.tsx
│   ├── Gallery3D.tsx
│   └── objects/
│       ├── Float.tsx
│       ├── Stars.tsx
│       ├── AuroraOrbs.tsx
│       ├── ImageGallery.tsx
│       └── GalleryItem.tsx
├── animations/            # GSAP/Lenis components
│   ├── LenisProvider.tsx
│   ├── ScrollReveal.tsx
│   ├── Marquee.tsx
│   ├── MagneticButton.tsx
│   └── Parallax.tsx
└── sections/              # Page sections (dari index.tsx)
    ├── Hero.tsx
    ├── Filmstrip.tsx
    ├── Features.tsx
    ├── WhyKlip.tsx
    ├── Gallery.tsx
    ├── Testimonials.tsx
    ├── Pricing.tsx
    └── CtaFooter.tsx
```

### 5.2 Lenis Provider (apps/web/src/components/animations/LenisProvider.tsx)
```tsx
'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Lenis } from '@studio-freight/lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gsap from 'gsap';

gsap.registerPlugin(ScrollTrigger);

export function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      ScrollTrigger.update();
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="lenis" data-lenis-prevent>
      {children}
    </div>
  );
}

export function useLenis() {
  return lenisRef.current;
}
```

### 5.3 ScrollReveal Component (apps/web/src/components/animations/ScrollReveal.tsx)
```tsx
'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef, type ReactNode, type HTMLAttributes } from 'react';
import { useLenis } from './LenisProvider';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
  as?: keyof JSX.IntrinsicElements;
}

export function ScrollReveal({ children, delay = 0, className = '', as = 'div', ...props }: ScrollRevealProps) {
  const lenis = useLenis();
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current!, 
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay: delay / 1000,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 85%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse',
            scroller: lenis?.scrollContainer || undefined,
          },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, { scope: ref });

  const Component = as;
  return <Component ref={ref} className={className} {...props}>{children}</Component>;
}
```

### 5.4 Hero Scene R3F (apps/web/src/components/three/HeroScene.tsx)
```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { Float, Stars, AuroraOrbs } from './objects';
import { usePromptStore } from '@/lib/store/prompt-store';
import { useRef } from 'react';
import * as THREE from 'three';

export function HeroScene() {
  const { currentPrompt } = usePromptStore();
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  useFrame((state) => {
    timeRef.current = state.clock.getElapsedTime();
    if (particlesRef.current) {
      particlesRef.current.rotation.y = timeRef.current * 0.02;
      particlesRef.current.rotation.x = Math.sin(timeRef.current * 0.1) * 0.1;
    }
  });

  useGSAP(() => {
    if (!particlesRef.current) return;
    gsap.to(particlesRef.current.material, {
      opacity: currentPrompt ? 0.8 : 0.4,
      duration: 1,
      ease: 'power2.out',
    });
  }, { scope: particlesRef, dependencies: [currentPrompt] });

  return (
    <>
      <Float ref={particlesRef} count={3000} size={2} />
      <Stars count={2000} />
      <AuroraOrbs />
    </>
  );
}
```

---

## 📋 Phase 6: Zustand State Management

### 6.1 apps/web/src/lib/store/index.ts
```tsx
export { useUIStore } from './ui-store';
export { usePromptStore } from './prompt-store';
export { useGenerationStore } from './generation-store';
export { useScrollStore } from './scroll-store';
```

### 6.2 apps/web/src/lib/store/ui-store.ts
```tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isMobileMenuOpen: boolean;
  isPromptModalOpen: boolean;
  theme: 'dark' | 'light';
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  togglePromptModal: () => void;
  setPromptModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isMobileMenuOpen: false,
      isPromptModalOpen: false,
      theme: 'dark',
      toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
      togglePromptModal: () => set((s) => ({ isPromptModalOpen: !s.isPromptModalOpen })),
      setPromptModalOpen: (open) => set({ isPromptModalOpen: open }),
    }),
    { name: 'klip-ui-store', partialize: (s) => ({ theme: s.theme }) }
  )
);
```

### 6.3 apps/web/src/lib/store/prompt-store.ts
```tsx
import { create } from 'zustand';

interface PromptState {
  currentPrompt: string;
  history: string[];
  suggestions: string[];
  setCurrentPrompt: (prompt: string) => void;
  addToHistory: (prompt: string) => void;
  setSuggestions: (suggestions: string[]) => void;
  clearHistory: () => void;
}

export const usePromptStore = create<PromptState>((set) => ({
  currentPrompt: '',
  history: [],
  suggestions: [
    'Iklan skincare cinematic',
    'Reels promo diskon',
    'Vlog Bali',
    'Product shot UMKM',
  ],
  setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
  addToHistory: (prompt) => set((s) => ({
    history: [prompt, ...s.history.filter(p => p !== prompt)].slice(0, 10),
  })),
  setSuggestions: (suggestions) => set({ suggestions }),
  clearHistory: () => set({ history: [] }),
}));
```

### 6.4 apps/web/src/lib/store/generation-store.ts
```tsx
import { create } from 'zustand';
import { GenerationType } from '@klipai/core/types';

type GenerationStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';

interface GenerationItem {
  id: string;
  prompt: string;
  type: GenerationType;
  status: GenerationStatus;
  progress: number;
  resultUrl?: string;
  error?: string;
  createdAt: number;
}

interface GenerationState {
  queue: GenerationItem[];
  currentGeneration: GenerationItem | null;
  addToQueue: (item: Omit<GenerationItem, 'id' | 'createdAt'>) => string;
  updateStatus: (id: string, status: GenerationStatus, progress?: number) => void;
  setResult: (id: string, url: string) => void;
  setError: (id: string, error: string) => void;
  removeFromQueue: (id: string) => void;
  clearCompleted: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  queue: [],
  currentGeneration: null,
  addToQueue: (item) => {
    const id = crypto.randomUUID();
    const newItem: GenerationItem = { ...item, id, createdAt: Date.now() };
    set((s) => ({ queue: [...s.queue, newItem], currentGeneration: newItem }));
    return id;
  },
  updateStatus: (id, status, progress = 0) => set((s) => ({
    queue: s.queue.map((i) => i.id === id ? { ...i, status, progress } : i),
    currentGeneration: s.currentGeneration?.id === id ? { ...s.currentGeneration, status, progress } : s.currentGeneration,
  })),
  setResult: (id, url) => set((s) => ({
    queue: s.queue.map((i) => i.id === id ? { ...i, status: 'completed', resultUrl: url, progress: 100 } : i),
  })),
  setError: (id, error) => set((s) => ({
    queue: s.queue.map((i) => i.id === id ? { ...i, status: 'failed', error } : i),
  })),
  removeFromQueue: (id) => set((s) => ({ queue: s.queue.filter((i) => i.id !== id) })),
  clearCompleted: () => set((s) => ({ queue: s.queue.filter((i) => i.status !== 'completed') })),
}));
```

---

## 📋 Phase 7: UI Components Migration

### 7.1 Strategy: Extract to packages/ui
- Copy all 35+ Radix components dari `src/components/ui/` → `packages/ui/src/components/`
- Update imports to use `@klipai/ui`
- Add Tailwind config di packages/ui

### 7.2 packages/ui/tailwind.config.ts
```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../apps/web/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

---

## 📋 Phase 8: Testing & Optimization

### 8.1 Commands
```bash
# Root level
pnpm install
pnpm run build          # Build all packages & apps
pnpm run dev            # Start web (3000) + api (3001)
pnpm run lint           # Lint all
pnpm run type-check     # Type check all
pnpm run db: