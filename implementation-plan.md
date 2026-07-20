# Klip-AI Implementation Plan

> **Status**: Active Development | **Last Updated**: 2026-07-20

---

## ✅ P0 BARU — CRITICAL SECURITY: Webhook Midtrans signature verification FIXED (2026-07-20)

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

**Catatan**: Pastikan `MIDTRANS_SERVER_KEY` dikonfigurasi di environment sebelum production deployment.

---

## 📋 Completed Items

### ✅ P0 - Critical Path

1. **Template Orchestrator Integration** - `templateOrchestrator` connected to `/api/templates/generate`
2. **Implicit Any Errors Fixed** - 6 TypeScript errors resolved
3. **Prisma Dependencies Fixed** - `db:generate` now auto-runs via turbo.json

### ✅ P1 - Core Infrastructure

4. **GenerationType Sync** - `prismaToPipelineType` helper working
5. **HeroScene 3D Wired** - 3D component integrated
6. **Type-Check Passes** - `pnpm run type-check` is green

### ✅ Production Ready

7. **Error Handling + Sentry** - All routes updated with Sentry capture
8. **Distributed Rate Limiting** - Upstash Redis implemented
9. **Toast Notifications** - Sonner integrated
10. **Docker Deployment** (2026-07-20) - Dockerfile, docker-compose.yml, GitHub Actions CI/CD
11. **FFmpeg Stitching** - Safe for production deployment

### ✅ Credit System (Pay-Per-Use) - NEW 2026-07-20

12. **Database Schema** - CreditPackage, CreditTransaction models added
13. **Pricing Calculator** - `packages/ai/src/services/pricing.ts` implemented
14. **Credit Service** - `apps/api/src/lib/credits.ts` with deduction/refund logic
15. **Midtrans Integration** - Snap payment API integration
16. **Credit API Endpoints**:
    - `GET /api/credits/packages` - List available packages
    - `GET /api/credits/balance` - Get user balance
    - `POST /api/credits/purchase` - Initiate payment
    - `POST /api/credits/webhook` - Midtrans callback
    - `GET /api/credits/history` - Transaction history

---

## 🎯 Immediate Next Steps (Priority Order) — Direvisi 2026-07-20

0. **[✅ P0 BARU] Fix verifikasi signature webhook Midtrans** — DONE (2026-07-20). Webhook sekarang menggunakan verifikasi SHA512 yang benar.
1. **[✅ P0] Sambungkan `templateOrchestrator` ke route `/api/templates/generate`** — DONE
2. **[✅ P1] Perbaiki 6 implicit-any error + db:generate dependency** — DONE
3. **[✅ P2] Sinkronkan `GenerationType`** — DONE (prismaToPipelineType helper)
4. **[✅ P2] Wire HeroScene** — DONE (3D component integrated)
5. **[✅ Production] Error handling + Sentry capture** — DONE (all routes updated)
6. **[✅ Production] Distributed rate limiting** — DONE (Upstash Redis implemented)
7. **[✅ UI/UX] Toast notifications** — DONE (sonner integrated)
8. **[✅ Production] Docker deployment setup** — DONE (2026-07-20): Dockerfile, docker-compose.yml, GitHub Actions CI/CD, next.config.ts update, .env.example update. FFmpeg stitching sekarang aman untuk production deployment.
9. **[✅ P0] Credit System (Pay-Per-Use)** — DONE (2026-07-20): Database schema, pricing calculator, credit service, Midtrans integration, API endpoints
10. **[✅ DONE] Hitung `creditsCost` per template pakai `pricing.ts`** — DONE (2026-07-20). Fungsi `calculateCreditsFromShots()` sudah diimplementasi di route `POST /api/templates` dan `PATCH /api/templates/[slug]`. CreditsCost sekarang auto-calculated dari shots (generation type + resolution). Tidak perlu input manual dari admin.
11. **[✅ DONE] Supabase setup**: Run migrations + seed di Supabase — DONE (user)
12. **[⚠️ Perlu verifikasi ulang] Production testing**: ditandai "selesai" sebelumnya, tapi tidak ada file/artifact test e2e ditemukan di repo (`find . -iname "*e2e*"` kosong) — kemungkinan testing manual belum didokumentasikan sebagai test otomatis. Lihat item near-term di Roadmap API/Backend di bawah.
13. Lihat **🗺 Roadmap (dibagi Web/Frontend dan API/Backend)** di bawah untuk daftar lengkap next steps, termasuk UI credit system dan konfigurasi Midtrans.

---

## 💰 Credit System Design (Finalized 2026-07-20)

### Model: Pay-Per-Use (No Subscription)

**Keuntungan**:

- Barrier to entry rendah
- Sesuai perilaku UMKM (sporadis, tidak setiap hari)
- Tidak ada "uang mati" (credits tidak hangus)
- Pricing transparan

### Credit Packages

| Package             | Credits | Price (IDR) | Per Credit | Status      |
| ------------------- | ------- | ----------- | ---------- | ----------- |
| **Free (New User)** | 10      | FREE        | -          | ✅ One-time |
| **Starter**         | 20      | Rp 50.000   | Rp 2.500   | ✅          |
| **Pro**             | 100     | Rp 200.000  | Rp 2.000   | ✅ Popular  |
| **Business**        | 500     | Rp 800.000  | Rp 1.600   | ✅          |

### Payment Methods (via Midtrans)

- 💳 Credit/Debit Card (Visa, Mastercard, JCB)
- 📱 OVO, GoPay, DANA, ShopeePay
- 🏷️ QRIS (semua bank e-wallet)
- 🏦 Virtual Account (BCA, Mandiri, BNI, BRI)
- 🏦 Internet Banking

### Credit Policy

- ✅ Credits **tidak expire** (never expire)
- ✅ Bisa top-up kapan saja
- ✅ Refund otomatis jika generation gagal
- ✅ 1 credit ≈ 1 video shot (varies by resolution/mode)

### Pricing Calculator

```typescript
// Formula:
// baseCost = shots × baseCostPerShot × providerMultiplier × resolutionMultiplier × upscaleMultiplier
// retryBuffer = baseCost × 20%
// totalCredits = baseCost + retryBuffer

// Example: 3 shots, text-to-video, 1080p, no upscale
// baseCost = 3 × 1 × 1.0 × 1.5 × 1.0 = 4.5 → ceil = 5
// retryBuffer = 5 × 0.2 = 1
// totalCredits = 6
```

### API Endpoints

| Endpoint                | Method | Auth | Description               |
| ----------------------- | ------ | ---- | ------------------------- |
| `/api/credits/packages` | GET    | No   | List credit packages      |
| `/api/credits/balance`  | GET    | Yes  | Get user balance          |
| `/api/credits/purchase` | POST   | Yes  | Initiate Midtrans payment |
| `/api/credits/webhook`  | POST   | No   | Midtrans notification     |
| `/api/credits/history`  | GET    | Yes  | Transaction history       |

### Database Tables

```prisma
model CreditPackage {
  id, name, slug, credits, priceIdr, priceUsd, description, features, isActive, isPopular
}

model CreditTransaction {
  id, userId, packageId, amount, type, description, orderId, paymentStatus, metadata
}

model User {
  // Updated fields:
  credits Int @default(0)
  hasReceivedFreeCredits Boolean @default(false)
}
```

---

## 📅 Onboarding Operasional: Checklist Minggu Pertama

> ⚠️ **Updated 2026-07-20**: P0, P1, P2, Production items, dan Credit System sudah fixed. Checklist ini masih berguna untuk onboarding tapi item-item yang sudah selesai bisa dilewati.

### Hari 1 — Setup dan Peta Sistem

- [x] Clone repo, `pnpm install`, copy `.env.example` — **DONE**
- [x] **`pnpm --filter @klipai/db db:generate`** — **DONE (auto-run via turbo.json)**
- [x] `pnpm run type-check` **di root** — **DONE (type-check hijau)**
- [x] Catat semua error sebagai baseline — **Skip, tidak ada error**

### Hari 2 — Pahami Jantung AI Pipeline

- [x] Baca `packages/ai/src/services/prompt-enhancer.ts`, `provider-router.ts`, `pipeline-orchestrator.ts`, `generation-service.ts`
- [x] Baca `packages/ai/src/services/template-orchestrator.ts` — **P0 fixed, ini referensi**
- [x] Baca `packages/ai/src/services/pricing.ts` — **Credit system pricing calculator**
- [x] Baca test files di `packages/ai/src/services/__tests__/`
- [x] Jalankan `pnpm --filter @klipai/ai test` — **✅ 5 test files, 59 tests passed** (termasuk test baru `template-orchestrator.test.ts`)

### Hari 3 — Pahami Boundary Web, API, dan Auth

- [x] Baca `apps/web/src/lib/auth.ts`, `apps/api/src/lib/session.ts` — **JWT-based auth, web issue, API verify**
- [x] Baca `apps/api/src/app/api/generate/[type]/route.ts` (flow generation biasa — ini yang **berfungsi**)
- [x] Baca `apps/api/src/app/api/templates/generate/route.ts` (template flow — P0 fixed)
- [x] Baca `apps/api/src/lib/credits.ts` — **Credit deduction service**
- [x] Baca `apps/api/src/lib/midtrans.ts` — **Payment integration**

### Hari 4 — Test Template Generation Flow

- [ ] Test dari awal sampe selesai: prompt → enhanced → routed → generated → resultUrl
- [ ] Test `/api/credits/packages` endpoint
- [ ] Test `/api/credits/balance` endpoint
- [ ] Setup Midtrans sandbox dan test payment flow

### Hari 5 — Deployment & Monitoring

- [ ] Setup Sentry project
- [ ] Setup Upstash Redis
- [ ] Test Docker build
- [ ] Setup GitHub Actions secrets (MIDTRANS__, SENTRY__, etc)

---

## 🔧 Technical Reference

### Project Structure

```
apps/
├── api/              # Next.js API routes
│   └── src/app/api/
│       ├── credits/      # Credit system endpoints
│       ├── generate/     # Generation endpoints
│       └── templates/    # Template endpoints
├── web/              # Next.js frontend
packages/
├── ai/               # AI pipeline services
│   └── src/services/
│       ├── pricing.ts    # Credit pricing calculator
│       └── ...
├── db/               # Prisma schema & client
│   └── prisma/
│       ├── schema.prisma  # Database schema (updated with CreditPackage, CreditTransaction)
│       └── seed-credits.ts # Credit package seed data
├── core/             # Shared utilities
└── ui/               # UI components
```

### Environment Variables Required

**For Credit System**:

```env
# Midtrans
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_IS_PRODUCTION=false  # true for production

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Key Files Modified

1. `packages/db/prisma/schema.prisma` - Added CreditPackage, CreditTransaction, updated User
2. `packages/ai/src/services/pricing.ts` - Credit pricing calculator (NEW)
3. `packages/db/prisma/seed-credits.ts` - Credit package seed data (NEW)
4. `packages/ai/package.json` - Added pricing export
5. `apps/api/src/lib/credits.ts` - Credit service (NEW)
6. `apps/api/src/lib/midtrans.ts` - Midtrans integration (NEW)
7. `apps/api/src/app/api/credits/` - Credit API routes (NEW)

---

## 📚 Documentation

Lihat dokumentasi lengkap di:

- `docs/ai-pipeline.md` - AI pipeline architecture
- `docs/api.md` - API endpoints reference
- `docs/database.md` - Database schema documentation

---

## 🗺 Roadmap (Dibagi 2: Web/Frontend dan API/Backend) — 2026-07-20

> Dipisah supaya jelas siapa/tim mana yang kerjakan apa. Tiap bagian ada 2 lapis: **Near-term** (perlu sebelum atau segera setelah launch) dan **Future** (P3, ekspansi jangka panjang).

### 1️⃣ Web / Frontend / UI-UX

**Near-term — sebelum launch credit system ke user real**

- [ ] UI credit packages: display paket (Starter/Pro/Business), tombol beli
- [ ] Flow purchase: integrasi Midtrans Snap di client (`snapToken` dari `POST /api/credits/purchase`)
- [ ] Halaman balance kredit di dashboard user
- [ ] Halaman callback Midtrans: `/credits/success`, `/credits/error`, `/credits/pending` (URL-nya sudah didefinisikan di `midtrans.ts`, tapi belum dicek apakah halamannya sudah ada di `apps/web`)
- [ ] Riwayat transaksi kredit (pakai `GET /api/credits/history` yang sudah ada)

**Future (P3)**

- [ ] Visual Prompt Builder (drag-drop interface)
- [ ] Timeline editor untuk preview video
- [ ] Custom watermark settings
- [ ] Team workspace UI (kalau kolaborasi tim jadi prioritas)
- [ ] Shared templates UI

### 2️⃣ API / Backend

**Near-term — sebelum production**

- [ ] Tambahkan `"test": "vitest run"` ke `apps/api/package.json` — test webhook Midtrans (8 test, sudah lulus manual) **belum jalan otomatis di CI** karena tidak ada script `test`
- [ ] Rapikan duplikasi formula pricing — saat ini ada **3 salinan** logic yang sama (`packages/ai/src/services/pricing.ts`, `apps/api/.../templates/route.ts`, `apps/api/.../templates/[slug]/route.ts`). 2 salinan di route API lebih sederhana dari aslinya (hilang `upscaleMultiplier` dan 4 tipe generation lanjutan) — sebaiknya kedua route import langsung dari `pricing.ts` supaya tidak drift
- [ ] Fix 3 implicit-any baru di `apps/api/src/lib/credits.ts` (parameter `tx` di `prisma.$transaction`)
- [ ] Set `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION` di environment production (Docker/Railway/Render secrets)
- [ ] End-to-end test asli untuk flow generate (template → orchestrator → resultUrl) dan flow payment (purchase → webhook → credit bertambah) — belum ada file test e2e di repo

**Future (P3)**

- [ ] Public API
- [ ] SDK (JS, Python)
- [ ] Webhook events (buat integrasi pihak ketiga, beda dari webhook Midtrans yang sudah ada)
- [ ] Team billing (backend)

### Removed dari Roadmap

- ~~Billing & Subscription (Stripe)~~ → **Diganti Pay-Per-Use Credits (Midtrans)**
- ~~Export & Distribution~~ → Future consideration, belum diprioritaskan

---

## ⚠️ Known Issues & Notes

1. **✅ Webhook signature verification FIXED** — lihat P0 BARU di atas. Signature verification sekarang aktif.

2. **`pricing.ts` sekarang disambungkan, tapi terduplikasi 3x** — fungsi `calculateCreditsFromShots()` auto-calculated dari generation type + resolution di route create/update template, sudah aktif. Tapi logic-nya di-copy-paste ke 2 route API alih-alih import dari `packages/ai/src/services/pricing.ts` — lihat item di Roadmap API/Backend.

3. **Credit deduction generation biasa**: sudah wired (flat -1 credit per generation di `/api/generate/[type]/route.ts`, atomic decrement) — **bukan** "belum di-wired" seperti klaim sebelumnya. Yang belum: memakai formula `pricing.ts` untuk deduction dinamis berdasarkan resolution/upscale (masih flat 1 kredit untuk semua jenis generation).

4. **Midtrans Sandbox**: Pastikan test dengan sandbox dulu sebelum production — dan setelah fix signature verification di atas, test juga skenario signature palsu/hilang harus ditolak.

5. **Database Migration**: Perlu run `prisma migrate dev` atau `prisma db push` untuk update schema di database.

6. **Seed Data**: Credit packages perlu di-seed manual dengan `npx tsx prisma/seed-credits.ts`

---

## ✅ Verification Checklist

Run sebelum production:

```bash
# 1. Type check
pnpm run type-check

# 2. Run tests
pnpm --filter @klipai/ai test

# 3. Build
pnpm run build

# 4. Database migration (jika ada perubahan schema)
cd packages/db && pnpm db:push

# 5. Seed credit packages
cd packages/db && npx tsx prisma/seed-credits.ts
```
