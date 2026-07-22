# Klip-AI Implementation Plan

> **Status**: Active Development | **Last Updated**: 2026-07-22

---

## 🚀 LAUNCH READINESS: UI/UX FOCUS — 2026-07-22

**Target: Launch website dalam 1-2 hari!**

---

## 📊 Current State Assessment

### ✅ COMPLETED - Ready to Use

| Category         | Items                                                                                                        | Status      |
| ---------------- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| **Landing Page** | Hero, Features, Gallery, Pricing, CTA, Footer, Filmstrip, WhyKlip, Testimonials                              | ✅ Complete |
| **Auth**         | Sign In page, Sign Up page                                                                                   | ✅ Complete |
| **Templates**    | Browse page (`/templates`), TemplateCard, TemplateBrowser                                                    | ✅ Complete |
| **Credits**      | Purchase page (`/credits`), History page (`/credits/history`), CreditPurchase, CreditBalance, CreditPackages | ✅ Complete |
| **Components**   | Nav, Toast (Sonner), 3D Hero Scene, UI library (@klipai/ui)                                                  | ✅ Complete |
| **Backend**      | All API endpoints, Credit system, Midtrans integration, E2E tests (37 passing)                               | ✅ Complete |

### ⚠️ NEEDS WORK - Required for Launch

| Priority | Item                       | File(s)                                                        | Est. Time |
| -------- | -------------------------- | -------------------------------------------------------------- | --------- |
| **P0**   | User Dashboard             | `apps/web/src/app/(dashboard)/dashboard/page.tsx`              | 2-3 hours |
| **P0**   | Generate/Create Video Page | `apps/web/src/app/generate/page.tsx`                           | 2-3 hours |
| **P1**   | Template Detail Page       | `apps/web/src/app/(dashboard)/templates/[slug]/page.tsx`       | 1-2 hours |
| **P1**   | Auth-Aware Navbar          | `apps/web/src/components/Nav.tsx`                              | 1-2 hours |
| **P2**   | 404/Error Pages            | `apps/web/src/app/not-found.tsx`, `apps/web/src/app/error.tsx` | 1 hour    |
| **P2**   | Auth Middleware            | `apps/web/src/middleware.ts`                                   | 1 hour    |
| **P3**   | Mobile Responsive Polish   | Various components                                             | 2 hours   |

---

## 📅 2-Day Launch Plan

### Day 1 (4-6 hours) — Core User Flow

#### Morning Session (2-3 hours)

1. **Create User Dashboard** (`/dashboard`)
   - Show user balance (credits remaining)
   - Recent generations list
   - Quick action buttons (Buy Credits, Create Video, Browse Templates)
   - User profile summary

2. **Create Generate Video Page** (`/generate`)
   - Generation type selector (Text-to-Video, Image-to-Video, Video-to-Video)
   - Prompt input with character counter
   - Optional image/video upload
   - Resolution/quality selector
   - Brand kit selector (optional)
   - Credits cost preview
   - Generate button with loading state
   - Redirect to dashboard on success

#### Afternoon Session (2-3 hours)

3. **Complete Template Detail Page** (`/templates/[slug]`)
   - Template preview (video/image)
   - Template info (name, description, duration, format)
   - "Use This Template" button
   - Credits cost display
   - Related templates

4. **Update Navbar for Auth State**
   - If logged in: Show balance badge, profile dropdown
   - If logged out: Show Sign In / Sign Up buttons
   - Credits balance in header

---

### Day 2 (4-6 hours) — Polish & Launch Prep

#### Morning Session (2-3 hours)

5. **Auth Middleware Protection**
   - Protect `/dashboard`, `/generate`, `/credits` routes
   - Redirect to sign-in if not authenticated
   - Store intended destination for post-login redirect

6. **Create 404 & Error Pages**
   - `not-found.tsx` - Clean 404 page
   - `error.tsx` - Global error boundary with retry option
   - `global-error.tsx` - For critical errors

#### Afternoon Session (2-3 hours)

7. **Mobile Responsive Polish**
   - Test all pages on mobile viewports
   - Fix any layout issues in Nav, Templates, Credits pages
   - Ensure touch-friendly buttons and inputs

8. **Final Testing & Deployment Prep**
   - Test complete user flow: Sign up → Dashboard → Generate → Credits → History
   - Verify all API endpoints return proper responses
   - Final type-check: `pnpm run type-check`
   - Build test: `pnpm run build`

---

## 📋 Detailed Task List

### Day 1 Tasks

- [ ] **1.1** Create `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- [ ] **1.2** Create `apps/web/src/components/dashboard/UserBalance.tsx`
- [ ] **1.3** Create `apps/web/src/components/dashboard/RecentGenerations.tsx`
- [ ] **1.4** Create `apps/web/src/app/generate/page.tsx`
- [ ] **1.5** Create `apps/web/src/components/generate/GenerationForm.tsx`
- [ ] **1.6** Create `apps/web/src/components/generate/GenerationTypeSelector.tsx`
- [ ] **1.7** Create `apps/web/src/components/generate/GenerationPreview.tsx`
- [ ] **1.8** Update `apps/web/src/app/(dashboard)/templates/[slug]/page.tsx`
- [ ] **1.9** Create `apps/web/src/components/templates/TemplatePreview.tsx`
- [ ] **1.10** Update `apps/web/src/components/Nav.tsx` with auth state

### Day 2 Tasks

- [ ] **2.1** Create `apps/web/src/middleware.ts` for auth protection
- [ ] **2.2** Create `apps/web/src/app/not-found.tsx`
- [ ] **2.3** Create `apps/web/src/app/error.tsx`
- [ ] **2.4** Create `apps/web/src/app/global-error.tsx`
- [ ] **2.5** Test mobile responsiveness
- [ ] **2.6** Fix any mobile layout issues
- [ ] **2.7** Run full test suite: `pnpm run type-check && pnpm run build`
- [ ] **2.8** Final verification of all pages

---

## 🎨 Design Guidelines for New Pages

### Color Palette

- Primary: Purple gradient (`#9333EA` to `#EC4899`)
- Background: Black (`#000000`), Neutral-950 (`#0a0a0a`)
- Text: White (`#FFFFFF`), Neutral-400 (`#A3A3A3`)
- Accent: Cyan-400 (`#22D3EE`), Green-500 (`#22C55E`)
- Border: White/10 (`rgba(255,255,255,0.1)`)

### Typography

- Font: Space Grotesk (headings), Inter (body)
- Headings: 2xl-5xl, bold, tracking-tight
- Body: sm-lg, normal weight

### Components to Reuse from @klipai/ui

- `Button` - For all actions
- `Card` - For containers
- `Input` - For form fields
- `Select` - For dropdowns
- `Skeleton` / `LoadingSpinner` - For loading states
- `ErrorState` - For error displays

---

## 🔗 Existing API Endpoints (Backend Ready)

| Endpoint                  | Method   | Auth | Purpose                |
| ------------------------- | -------- | ---- | ---------------------- |
| `/api/auth/[...nextauth]` | GET/POST | No   | NextAuth handlers      |
| `/api/credits/packages`   | GET      | No   | List credit packages   |
| `/api/credits/balance`    | GET      | Yes  | Get user balance       |
| `/api/credits/purchase`   | POST     | Yes  | Initiate payment       |
| `/api/credits/webhook`    | POST     | No   | Midtrans callback      |
| `/api/credits/history`    | GET      | Yes  | Transaction history    |
| `/api/templates`          | GET      | No   | List templates         |
| `/api/templates/[slug]`   | GET      | No   | Get template detail    |
| `/api/templates/generate` | POST     | Yes  | Generate from template |
| `/api/generate/[type]`    | POST     | Yes  | Generate video         |

---

## 📁 File Structure After Implementation

```
apps/web/src/
├── app/
│   ├── (auth)/
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # NEW
│   │   └── templates/
│   │       ├── page.tsx
│   │       └── [slug]/page.tsx   # UPDATE
│   ├── credits/
│   │   ├── page.tsx
│   │   └── history/page.tsx
│   ├── generate/
│   │   └── page.tsx              # NEW
│   ├── layout.tsx
│   ├── page.tsx
│   ├── not-found.tsx             # NEW
│   └── error.tsx                 # NEW
├── components/
│   ├── dashboard/                # NEW
│   │   ├── UserBalance.tsx
│   │   └── RecentGenerations.tsx
│   ├── generate/                # NEW
│   │   ├── GenerationForm.tsx
│   │   ├── GenerationTypeSelector.tsx
│   │   └── GenerationPreview.tsx
│   ├── templates/
│   │   ├── TemplateBrowser.tsx
│   │   ├── TemplateCard.tsx
│   │   ├── TemplateDetail.tsx
│   │   └── TemplatePreview.tsx  # NEW
│   ├── credits/
│   │   ├── CreditPurchase.tsx
│   │   ├── CreditBalance.tsx
│   │   └── CreditPackages.tsx
│   └── Nav.tsx                   # UPDATE
├── middleware.ts                  # NEW
└── lib/
    └── auth.ts
```

---

## ✅ Pre-Launch Checklist

- [ ] All new pages have proper metadata (title, description)
- [ ] All forms have loading states and error handling
- [ ] All pages work on mobile (375px+)
- [ ] Auth redirects work correctly
- [ ] `pnpm run type-check` passes
- [ ] `pnpm run build` succeeds
- [ ] All E2E tests pass: `pnpm --filter @klipai/api test`
- [ ] Environment variables configured for production
- [ ] Database migrations applied: `pnpm --filter @klipai/db db:push`
- [ ] Credit packages seeded: `cd packages/db && npx tsx prisma/seed-credits.ts`

---

## 📚 Previous Implementation Notes

### ✅ P0 BARU — CRITICAL SECURITY: Webhook Midtrans signature verification FIXED (2026-07-20)

**Status: FIXED ✅**

- `apps/api/src/app/api/credits/webhook/route.ts` — Implementasi verifikasi signature SHA512 yang benar
- Signature verification sekarang aktif dan menolak notification dengan signature salah/tidak ada
- Test suite ditambahkan di `apps/api/src/app/api/credits/webhook/webhook.test.ts`

**Yang sudah dilakukan:**

1. ✅ Implementasi verifikasi signature: `SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)`
2. ✅ Verifikasi di route handler diaktifkan, return `403` kalau signature tidak cocok
3. ✅ Test khusus untuk signature validation: 7 test cases (valid signature, missing, invalid, tampered order_id, tampered amount, wrong server key)
4. ✅ Constant-time comparison dengan `crypto.timingSafeEqual` untuk prevent timing attacks
5. ✅ Development mode fallback jika server key tidak dikonfigurasi

---

## 🔧 Technical Reference

### Environment Variables Required for Launch

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:xxx@aws-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:xxx@aws-xxx.supabase.co:5432/postgres

# Auth
NEXTAUTH_SECRET=your-32-character-minimum-secret-key
NEXTAUTH_URL=https://your-domain.com

# AI Providers
SEEDANCE_API_KEY=xxx
KLING_API_KEY=xxx
WAN_API_KEY=xxx

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=klip-ai-generations
R2_PUBLIC_URL=https://cdn.your-domain.com

# Midtrans Payment
MIDTRANS_SERVER_KEY=xxx
MIDTRANS_CLIENT_KEY=xxx
MIDTRANS_IS_PRODUCTION=false

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## 🎯 Tier A Launch Target

**Definisi Tier A**: Website launch-ready dengan semua core user flows berfungsi (browse templates, sign up/in, generate video, purchase credits).

**Gerbang Lulus Tier A**:

- ✅ Landing page dengan template browse dan pricing
- ✅ User sign up/in flow dengan auth protection
- ✅ Generate video page dengan credits deduction
- ✅ Credits purchase dengan Midtrans integration
- ✅ User dashboard dengan balance dan history
- ✅ `pnpm run type-check` ✅ dan `pnpm run test` ✅ hijau total

---

_Last Updated: 2026-07-22_
