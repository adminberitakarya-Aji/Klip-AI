# Klip-AI — AI Video & Image Generator untuk Kreator Indonesia

> **Klip-AI** adalah platform AI generatif yang dibangun khusus untuk kreator konten dan UMKM Indonesia. Menghasilkan video Reels, TikTok, dan gambar jualan dari teks dalam hitungan detik.

[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-FF724C?logo=turborepo)](https://turbo.build/repo)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![pnpm](https://img.shields.io/badge/pnpm-9-F69220?logo=pnpm)](https://pnpm.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](https://prisma.io)

---

## 🎯 Fitur Utama

| Kategori | Fitur |
|----------|-------|
| **Text-to-Video** | Generate video dari prompt teks (6-12 detik, 720p-4K) |
| **Image-to-Video** | Animasi gambar statis jadi video dengan kontrol gerakan kamera |
| **Video-to-Video** | Transformasi style video existing (anime, cinematic, dll) |
| **Text-to-Image** | Generate gambar high-res dari prompt (512-2048px) |
| **Image-to-Image** | Edit/transform gambar existing dengan strength control |
| **Motion Control** | Kontrol gerakan kamera 3D presisi via keyframes/trajectory |

---

## 🏗️ Arsitektur Monorepo

```
klip-ai/
├── apps/
│   ├── web/                    # Next.js 15 Frontend (Landing + Dashboard)
│   │   ├── src/app/            # App Router (pages, layouts, API routes)
│   │   ├── src/components/     # R3F, GSAP, Lenis, Section components
│   │   ├── src/lib/            # Utilities, stores (Zustand), hooks
│   │   └── public/             # Assets, 3D models, images
│   │
│   └── api/                    # Next.js 15 API Routes (Backend)
│       ├── src/app/api/        # API Routes
│       │   ├── generate/       # 6 AI generation endpoints
│       │   ├── user/           # User generations history
│       │   └── auth/           # NextAuth v5 endpoints
│       └── src/lib/            # Auth config, utilities
│
├── packages/
│   ├── ai/                     # 🤖 AI Services & Providers
│   │   ├── src/
│   │   │   ├── providers/      # 6 Provider implementations
│   │   │   │   ├── base.ts          # Abstract BaseProvider
│   │   │   │   ├── text-to-video.ts
│   │   │   │   ├── image-to-video.ts
│   │   │   │   ├── video-to-video.ts
│   │   │   │   ├── text-to-image.ts
│   │   │   │   ├── image-to-image.ts
│   │   │   │   └── motion-control.ts
│   │   │   ├── services/
│   │   │   │   └── generation-service.ts  # Orchestration + DB
│   │   │   └── types.ts        # Provider interfaces, options
│   │
│   ├── core/                   # 📦 Shared Types, Schemas, Utils
│   │   ├── src/
│   │   │   ├── types.ts        # GenerationType, User, Subscription, etc.
│   │   │   ├── schemas.ts      # Zod validation schemas
│   │   │   ├── utils.ts        # cn() helper (clsx + tailwind-merge)
│   │   │   └── constants.ts    # App constants, enums
│   │
│   ├── db/                     # 🗄️ Database (Prisma + PostgreSQL)
│   │   ├── prisma/
│   │   │   └── schema.prisma   # User, Generation, Account, Session models
│   │   └── src/client.ts       # PrismaClient singleton
│   │
│   ├── ui/                     # 🎨 Shared UI Components (shadcn/ui + Radix)
│   │   ├── src/
│   │   │   ├── components/     # 40+ Radix-based components
│   │   │   ├── hooks/          # use-mobile, use-toast, etc.
│   │   │   └── lib/            # cn() re-export
│   │
│   ├── config/                 # ⚙️ Environment Validation (Zod)
│   │   └── src/index.ts        # env schema + parsed config
│   │
│   └── tsconfig/               # 📝 TypeScript Configs
│       ├── base.json
│       ├── nextjs.json
│       └── react-library.json
│
├── turbo.json                  # Turborepo pipeline config
├── pnpm-workspace.yaml         # pnpm workspace config
└── package.json                # Root scripts, devDependencies
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Build System** | Turborepo | 2.x |
| **Package Manager** | pnpm | 9.x |
| **Frontend Framework** | Next.js | 15 (App Router) |
| **API Framework** | Next.js API Routes | 15 |
| **Language** | TypeScript | 5.5 (strict) |
| **Styling** | Tailwind CSS | v4 (OKLCH colors) |
| **UI Components** | shadcn/ui + Radix UI | Latest |
| **3D/WebGL** | React Three Fiber (R3F) | 9.x |
| **3D Helpers** | @react-three/drei | 10.x |
| **Animation** | GSAP + ScrollTrigger | 3.12 |
| **Smooth Scroll** | Lenis | 1.x |
| **State Management** | Zustand | 4.5 |
| **Data Fetching** | TanStack Query | 5.40 |
| **Authentication** | NextAuth.js | 5.0 (beta) |
| **Database ORM** | Prisma | 5.15 |
| **Database** | PostgreSQL | 15+ |
| **Validation** | Zod | 3.23 |
| **Forms** | React Hook Form + Zod Resolver | 7.51 |
| **Notifications** | Sonner | 1.5 |
| **Charts** | Recharts | 3.9 |

---

## 🚀 Quick Start

### Prasyarat

- **Node.js** ≥ 20.0.0
- **pnpm** ≥ 9.0.0
- **PostgreSQL** ≥ 15
- **Git**

### Instalasi

```bash
# Clone repository
git clone https://github.com/your-org/klip-ai.git
cd klip-ai

# Install dependencies
pnpm install

# Setup environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Edit .env files with your credentials

# Generate Prisma client
pnpm db:generate

# Push database schema
pnpm db:push

# (Optional) Seed database
pnpm db:seed

# Start development servers
pnpm dev
```

### Environment Variables

#### `apps/api/.env`
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/klipai?schema=public"

# Auth (NextAuth v5)
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3001"

# AI Provider
AI_PROVIDER_API_KEY="your-ai-provider-api-key"
AI_PROVIDER_BASE_URL="https://api.your-ai-provider.com"

# Optional
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
SENTRY_DSN=""
```

#### `apps/web/.env`
```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Jalankan semua apps (web + api) via Turborepo |
| `pnpm build` | Build semua packages & apps |
| `pnpm lint` | Lint semua workspace |
| `pnpm type-check` | Type-check semua workspace |
| `pnpm format` | Format kode dengan Prettier |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:push` | Push schema ke database |
| `pnpm db:migrate` | Jalankan migrasi Prisma |
| `pnpm db:studio` | Buka Prisma Studio |
| `pnpm clean` | Clean build artifacts & node_modules |
| `pnpm changeset` | Buat changeset untuk release |
| `pnpm version` | Bump version packages |
| `pnpm release` | Build & publish ke npm |

### Per-App Scripts

```bash
# Frontend (apps/web)
cd apps/web
pnpm dev          # Next.js dev server (port 3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint
pnpm type-check   # TypeScript check

# Backend (apps/api)
cd apps/api
pnpm dev          # Next.js dev server (port 3001)
pnpm build        # Production build
pnpm start        # Start production server
```

---

## 🎨 AI Generation Types

### 1. Text-to-Video (`text-to-video`)
```typescript
interface TextToVideoOptions {
  duration?: 6 | 12;                    // Durasi video
  aspectRatio?: '9:16' | '16:9' | '1:1'; // Aspect ratio
  resolution?: '720p' | '1080p' | '4k';   // Resolusi output
  fps?: 24 | 30;                         // Frame rate
  cameraMotion?: 'static' | 'pan' | 'zoom' | 'orbit';
  seed?: number;                         // Reproducible results
}
```

### 2. Image-to-Video (`image-to-video`)
```typescript
interface ImageToVideoOptions {
  motionStrength?: number;    // 0-1, kekuatan gerakan
  cameraMotion?: 'static' | 'pan' | 'zoom';
  duration?: 6 | 12;
}
```

### 3. Video-to-Video (`video-to-video`)
```typescript
interface VideoToVideoOptions {
  style?: string;             // Style target (anime, cinematic, dll)
  strength?: number;          // 0-1, seberapa jauh perubahan
  preserveStructure?: boolean; // Pertahankan struktur original
}
```

### 4. Text-to-Image (`text-to-image`)
```typescript
interface TextToImageOptions {
  aspectRatio?: '9:16' | '16:9' | '1:1' | '4:3' | '3:4';
  resolution?: '512' | '768' | '1024' | '2048';
  style?: string;
  negativePrompt?: string;
}
```

### 5. Image-to-Image (`image-to-image`)
```typescript
interface ImageToImageOptions {
  strength?: number;          // 0-1, kekuatan transformasi
  preserveStructure?: boolean;
  style?: string;
}
```

### 6. Motion Control (`motion-control`)
```typescript
interface MotionControlOptions {
  trajectory?: 'linear' | 'circular' | 'spiral' | 'custom';
  keyframes?: Array<{
    time: number;
    position: [number, number, number];
    rotation: [number, number, number];
  }>;
}
```

---

## 🔌 API Endpoints

### Generation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate/text-to-video` | Generate video dari teks |
| `POST` | `/api/generate/image-to-video` | Animasi gambar jadi video |
| `POST` | `/api/generate/video-to-video` | Transform style video |
| `POST` | `/api/generate/text-to-image` | Generate gambar dari teks |
| `POST` | `/api/generate/image-to-image` | Edit/transform gambar |
| `POST` | `/api/generate/motion-control` | Kontrol gerakan kamera 3D |

### Dynamic Route (All Types)
```bash
POST /api/generate/[type]
# type: text-to-video | image-to-video | video-to-video | text-to-image | image-to-image | motion-control
```

### Status & History
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/generate/[id]/status` | Cek status generation |
| `GET` | `/api/user/generations` | Riwayat generasi user (paginated) |

### Auth Endpoints (NextAuth v5)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/auth/[...nextauth]` | Auth handlers |

---

## 🗄️ Database Schema (Prisma)

```prisma
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

enum Role { USER ADMIN }
enum Subscription { FREE PRO UMKM }
enum GenerationType { TEXT_TO_VIDEO IMAGE_TO_VIDEO VIDEO_TO_VIDEO TEXT_TO_IMAGE IMAGE_TO_IMAGE MOTION_CONTROL }
enum GenerationStatus { IDLE QUEUED PROCESSING COMPLETED FAILED }
```

---

## 📦 Package Details

### `@klipai/ai` — AI Services
- **Providers**: 6 concrete implementations extending `BaseProvider`
- **GenerationService**: Orchestrates generation lifecycle (DB + Provider)
- **Types**: Provider interfaces, options per generation type

### `@klipai/core` — Shared Core
- **Types**: Generation, User, Subscription, API response types
- **Schemas**: Zod validation for requests/responses
- **Utils**: `cn()` helper (clsx + tailwind-merge)
- **Constants**: App-wide constants, enums

### `@klipai/db` — Database
- **Prisma Client**: Singleton pattern untuk serverless
- **Schema**: User, Account, Session, Generation models
- **Scripts**: generate, push, migrate, studio

### `@klipai/ui` — UI Components
- **40+ Radix-based components**: Button, Dialog, Form, Table, etc.
- **Hooks**: `useIsMobile`, `useToast`, etc.
- **Exports**: Component, hooks, lib utilities

### `@klipai/config` — Config
- **Env Validation**: Zod schema untuk environment variables
- **Type-safe**: `env` object dengan TypeScript inference

---

## 🎬 Frontend Architecture (apps/web)

### Key Directories
```
src/
├── app/
│   ├── (auth)/           # Auth routes (login, register)
│   ├── (dashboard)/      # Protected dashboard routes
│   ├── api/              # API route handlers (proxy to apps/api)
│   ├── globals.css       # Tailwind v4 + custom properties
│   ├── layout.tsx        # Root layout + fonts + providers
│   ├── page.tsx          # Landing page
│   └── providers.tsx     # QueryClient, Session, Lenis, Toaster
├── components/
│   ├── ui/               # Re-exports from @klipai/ui
│   ├── three/            # R3F Components
│   │   ├── CanvasProvider.tsx
│   │   ├── HeroScene.tsx
│   │   ├── FeatureCard3D.tsx
│   │   └── objects/      # Float, Stars, AuroraOrbs, etc.
│   ├── animations/       # GSAP + Lenis components
│   │   ├── LenisProvider.tsx
│   │   ├── ScrollReveal.tsx
│   │   ├── Marquee.tsx
│   │   ├── MagneticButton.tsx
│   │   └── Parallax.tsx
│   └── sections/         # Landing page sections
│       ├── Hero.tsx
│       ├── Filmstrip.tsx
│       ├── Features.tsx
│       ├── Gallery.tsx
│       └── ...
├── lib/
│   ├── stores/           # Zustand stores
│   │   ├── generation-store.ts
│   │   ├── ui-store.ts
│   │   └── auth-store.ts
│   ├── hooks/            # Custom hooks
│   └── utils/            # Helpers
└── types/                # Frontend-specific types
```

### 3D/Animation Stack
- **R3F**: Declarative Three.js dengan React
- **GSAP**: Complex animations, ScrollTrigger
- **Lenis**: Smooth scrolling (1.2s duration, exponential easing)
- **Zustand**: Lightweight global state

---

## 🔐 Authentication

Menggunakan **NextAuth.js v5 (Beta)** dengan:
- **Credentials Provider**: Email + password (bcryptjs)
- **OAuth Providers**: Google, GitHub (ready to configure)
- **Prisma Adapter**: `@auth/prisma-adapter`
- **Session Strategy**: JWT dengan database sync
- **Role-based Access**: `user` | `admin`
- **Subscription Tiers**: `free` | `pro` | `umkm`

### Subscription Plans

| Feature | Free | Pro | UMKM |
|---------|------|-----|------|
| **Harga/Bulan** | Gratis | Rp 199.000 | Rp 499.000 |
| **Kredit/Bulan** | 30 | 500 | 2.000 |
| **Max Resolusi** | 720p | 1080p | 4K |
| **Watermark** | Ya | Tidak | Tidak |
| **Priority Queue** | Tidak | Ya | Ya |
| **Team Seats** | 1 | 3 | 10 |

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm i -g vercel

# Deploy web
cd apps/web
vercel --prod

# Deploy api
cd apps/api
vercel --prod
```

### Docker

```dockerfile
# Dockerfile.example
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
CMD ["pnpm", "start"]
```

### Environment Variables (Production)
```env
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..." # Generate: openssl rand -base64 32
NEXTAUTH_URL="https://your-domain.com"
AI_PROVIDER_API_KEY="..."
AI_PROVIDER_BASE_URL="https://api.provider.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_API_URL="https://api.your-domain.com"

# Optional
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
SENTRY_DSN=""
```

---

## 🧪 Development Workflow

### 1. Branch Strategy
```bash
main ← develop ← feature/*, fix/*, chore/*
```

### 2. Commit Convention (Conventional Commits)
```
feat: add text-to-video generation
fix: resolve hydration mismatch in Hero
chore: update dependencies
docs: update API documentation
refactor: extract generation service
test: add unit tests for generation store
```

### 3. Changesets untuk Versioning
```bash
# Buat changeset
pnpm changeset

# Version bump
pnpm version

# Publish
pnpm release
```

### 4. Pre-commit Hooks (Husky + lint-staged)
```bash
# Setup (run once)
pnpm prepare
```

---

## 📁 Project Structure Summary

```
klip-ai/
├── .github/workflows/      # CI/CD pipelines
├── .husky/                 # Git hooks
├── .vscode/                # VS Code settings
├── apps/
│   ├── web/                # Next.js 15 Frontend
│   └── api/                # Next.js 15 Backend API
├── packages/
│   ├── ai/                 # AI Providers & Services
│   ├── core/               # Shared Types, Schemas, Utils
│   ├── db/                 # Prisma + PostgreSQL
│   ├── ui/                 # shadcn/ui Components
│   ├── config/             # Env Validation (Zod)
│   └── tsconfig/           # TypeScript Configs
├── turbo.json              # Turborepo Pipeline
├── pnpm-workspace.yaml     # pnpm Workspace Config
├── package.json            # Root Scripts & DevDeps
└── README.md               # This file
```

---

## 🤝 Contributing

1. **Fork** repository
2. **Create branch**: `git checkout -b feature/nama-fitur`
3. **Commit changes**: `git commit -m "feat: deskripsi singkat"`
4. **Push**: `git push origin feature/nama-fitur`
5. **Open Pull Request**

### Code Style
- **TypeScript strict mode** — wajib
- **ESLint + Prettier** — format sebelum commit
- **Conventional Commits** — wajib
- **Changesets** — untuk versioning packages

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- **shadcn/ui** — Beautiful accessible components
- **Radix UI** — Unstyled accessible primitives
- **React Three Fiber** — React renderer for Three.js
- **GSAP** — Professional-grade animation
- **Lenis** — Buttery smooth scrolling
- **Turborepo** — High-performance build system
- **Next.js Team** — The React Framework
- **Prisma** — Next-generation ORM

---

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/your-org/klip-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/klip-ai/discussions)
- **Email**: support@klip.ai

---

<div align="center">

**Dibangun dengan ❤️ untuk Kreator Indonesia**

[Website](https://klip.ai) • [Documentation](https://docs.klip.ai) • [Twitter](https://twitter.com/klip_ai) • [Discord](https://discord.gg/klip-ai)

</div>