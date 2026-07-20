# Implementation Plan: Klip-AI Remaining Work

> **Status Aktual (Re-verifikasi langsung ke kode, 2026-07-20)**: P0, P1, P2 **terkonfirmasi fixed**. Gap #1 (FFmpeg deployment) **sudah DISELESAIKAN** (Dockerfile, docker-compose, GitHub Actions CI/CD). **Masih 1 gap remaining**: TemplateOrchestrator testing.
> **Updated**: 2026-07-20 (Docker setup) | 2026-07-20 (Initial audit)

---

## 🚀 Baca Ini Dulu (Onboarding Tim Baru)

### Ringkasan Eksekutif

- Monorepo Turborepo + pnpm dengan pemisahan benar: `apps/web`, `apps/api`, `packages/*`
- Layer AI orchestration (`packages/ai`) matang secara desain
- **✅ P0 Fixed**: templateOrchestrator wired ke route `/api/templates/generate`
- **✅ P1 Fixed**: implicit-any errors fixed, type-check hijau
- **✅ P2 Completed**: GenerationType sync, 3D HeroScene wired, error handling + Sentry capture
- **✅ Production Hardening**: Upstash Redis distributed rate limiting implemented
- **✅ UI/UX Polish**: Toast notifications (sonner) implemented
- **Next**: Supabase deployment, production testing

### Peta Repo Super Singkat

| Bagian                            | Isi                                                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`                        | Landing, auth, template browser/detail/customize. Sumber session/JWT NextAuth.                                                                |
| `apps/api`                        | Route handlers: generation, polling, riwayat, audio, upscaler, template API, health. Verify JWT dari `apps/web`, tidak host NextAuth sendiri. |
| `packages/ai`                     | Jantung sistem: `prompt-enhancer`, `provider-router`, `pipeline-orchestrator`, `generation-service`, `template-orchestrator`.                 |
| `packages/db`                     | Prisma schema: user, auth, generation, upscaler, template system, preset packs, brand kit, review.                                            |
| `packages/core` / `config` / `ui` | Shared types & schema, env validation, shared components.                                                                                     |

---

## 🔴 P0 — BUG KRITIS: Template generation memotong kredit tanpa generate apa pun

**✅ FIXED 2026-07-20**

- `apps/api/src/app/api/templates/generate/route.ts` sekarang memanggil `templateOrchestrator.generateFromTemplate(...)` dengan proper error handling + credit rollback on failure
- Background job processing dengan status update (`QUEUED` → `PROCESSING` → `COMPLETED`/`FAILED`)
- Refund credits on total failure

Status: **VERIFIED - Fixed**

---

## 🟠 P1 — Type-check repo belum hijau

**✅ FIXED 2026-07-20**

- 6 implicit-any errors fixed di 5 files
- `db:generate` dependency added ke `turbo.json` (sebelum `build` dan `type-check`)
- tsconfig deprecation warnings fixed (`ignoreDeprecations: "6.0"` added ke semua tsconfigs)

Status: **VERIFIED - Type-check hijau**

---

## ⚠️ Gap Sebelum Production (ditemukan saat re-verifikasi 2026-07-20)

Semua fix P0/P1/P2 sudah dicek jalan di kode (bukan cuma dipercaya dari commit message). **1 gap sudah DISELESAIKAN**, **1 gap remaining**:

1. **✅ FFmpeg deployment solution - DISELESAIKAN 2026-07-20:**
   - `Dockerfile` dibuat untuk `apps/api` dengan `ffmpeg` terinstall via Alpine packages
   - `docker-compose.yml` dibuat untuk local development (API + PostgreSQL + Redis)
   - `.github/workflows/docker.yml` dibuat untuk CI/CD ke GitHub Container Registry
   - `apps/api/next.config.ts` diupdate dengan `output: "standalone"` untuk Docker compatibility
   - `.env.example` diupdate dengan `FFMPEG_PATH="/usr/bin/ffmpeg"` documentation
   - Deploy ke Railway/Render/Fly.io direkomendasikan (bukan Vercel serverless)

2. **🟠 TemplateOrchestrator testing - REMAINING:**
   27 test yang lulus itu untuk `provider-router`, `pipeline-orchestrator`, `prompt-enhancer`, `generation-service` — bukan untuk `TemplateOrchestrator` (hybrid batch generation, retry, stitching). Ini logic paling kompleks dan paling baru diperbaiki, butuh integration test sebelum dipercaya jalan otomatis di production.

---

## 📌 Legenda Status

- **VERIFIED** = dicek langsung ke kode aktual, perilakunya konsisten dengan klaim
- **PARTIAL** = ada implementasi, tapi belum utuh / belum aman dianggap selesai
- **BROKEN** = ada implementasinya tapi tidak berfungsi end-to-end (lihat P0)
- **PLANNED** = masih desain/roadmap, belum ada kode

## Status Nyata Per Area

| Area                                | Status   | Catatan                                                                       |
| ----------------------------------- | -------- | ----------------------------------------------------------------------------- |
| Monorepo structure                  | VERIFIED | Pembagian app/package benar, Turbo pipeline benar                             |
| AI orchestration (generation biasa) | VERIFIED | Desain kuat, type-safe                                                        |
| Template generation                 | VERIFIED | ✅ P0 Fixed - orchestrator wired + error handling                             |
| Type safety repo                    | VERIFIED | ✅ Type-check hijau                                                           |
| Error handling + Monitoring         | VERIFIED | ✅ Sentry capture utility + all routes updated                                |
| Distributed Rate Limiting           | VERIFIED | ✅ Upstash Redis implemented with in-memory fallback                          |
| UI/UX Polish                        | VERIFIED | ✅ Toast notifications (sonner) + micro-interactions                          |
| 3D Components                       | PARTIAL  | ✅ HeroScene wired; FeatureCard3D/Gallery3D deferred (design decision needed) |
| Schema alignment                    | VERIFIED | ✅ SQL seed table names fixed, GenerationType conversion layer verified       |
| Web UX/marketing                    | VERIFIED | Visual kuat, HeroScene integrated, toast feedback                             |
| Auth boundary                       | VERIFIED | Web issue JWT, API verify JWT                                                 |
| Template data model (Prisma)        | VERIFIED | Schema kaya, seed data complete                                               |

---

## Koreksi vs Audit Sebelumnya

Plan versi lama (arsip lengkap di git history / `implementation-plan-OLD-backup.md`) mengklaim:

> "`TemplateOrchestrator` dalam bentuk di bawah masih harus diperlakukan sebagai desain/pseudocode. Belum ditemukan implementasi worker nyata."

Ini **tidak akurat lagi** per hari ini. File-nya sudah ada dan lengkap (dicek: `class TemplateOrchestrator`, method `generateFromTemplate`, `executeHybridBatch`, `stitchShots`, semuanya berisi implementasi asli, bukan komentar TODO). Masalah sebenarnya bukan "belum dibuat", tapi **"sudah dibuat, tidak pernah dipanggil"** — root cause yang berbeda dan butuh fix yang berbeda (wiring, bukan development dari nol).

Pelajaran untuk proses ke depan: klaim "belum diimplementasi" di dokumen harus selalu diverifikasi dengan `grep` penggunaan nyata (siapa yang memanggil fungsi ini?), bukan cuma cek keberadaan file.

---

## 🎯 Immediate Next Steps (Priority Order) — Direvisi 2026-07-20

1. **[✅ P0] Sambungkan `templateOrchestrator` ke route `/api/templates/generate`** — DONE
2. **[✅ P1] Perbaiki 6 implicit-any error + db:generate dependency** — DONE
3. **[✅ P2] Sinkronkan `GenerationType`** — DONE (prismaToPipelineType helper)
4. **[✅ P2] Wire HeroScene** — DONE (3D component integrated)
5. **[✅ Production] Error handling + Sentry capture** — DONE (all routes updated)
6. **[✅ Production] Distributed rate limiting** — DONE (Upstash Redis implemented)
7. **[✅ UI/UX] Toast notifications** — DONE (sonner integrated)
8. **[✅ Production] Docker deployment setup** — DONE (2026-07-20): Dockerfile, docker-compose.yml, GitHub Actions CI/CD, next.config.ts update, .env.example update. FFmpeg stitching sekarang aman untuk production deployment.
9. **[🟠 Sebelum go-live] Hitung ulang `creditsCost` per template**: rata-rata biaya per shot × jumlah shot + buffer margin retry, bukan angka default sembarang
10. **[Next] Supabase setup**: Run migrations + seed di Supabase (task owner: user)
11. **[Next] Production testing**: End-to-end testing, terutama flow template generate sampai `resultUrl` selesai
12. **[P3] Roadmap ekspansi**: advanced UX, team workspace, billing, public API/SDK (lihat Backlog di bawah)

---

## 📅 Onboarding Operasional: Checklist Minggu Pertama

> ⚠️ **Updated 2026-07-20**: P0 dan P1 sudah fixed. Checklist ini masih berguna untuk onboarding tapi item-item yang sudah selesai bisa dilewati.

### Hari 1 — Setup dan Peta Sistem

- [x] Clone repo, `pnpm install`, copy `.env.example` — **DONE (atau skip jika sudah ada)**
- [x] **`pnpm --filter @klipai/db db:generate`** — **DONE (db:generate sekarang auto-run via turbo.json)**
- [x] `pnpm run type-check` **di root** — **DONE (type-check hijau sekarang)**
- [x] Catat semua error sebagai baseline — **Skip, tidak ada error (type-check hijau)**
- [x] Scan folder: `apps/web`, `apps/api`, `packages/ai`, `packages/db` — **Sudah terstruktur dengan benar**

### Hari 2 — Pahami Jantung AI Pipeline

- [x] Baca `packages/ai/src/services/prompt-enhancer.ts`, `provider-router.ts`, `pipeline-orchestrator.ts`, `generation-service.ts`
- [x] Baca `packages/ai/src/services/template-orchestrator.ts` — **P0 sudah fixed, ini referensi**
- [x] Baca test files di `packages/ai/src/services/__tests__/` — untuk understanding expected behavior
- [x] Jalankan `pnpm --filter @klipai/ai test` — **✅ 4 test files, 27 tests passed**

### Hari 3 — Pahami Boundary Web, API, dan Auth

- [x] Baca `apps/web/src/lib/auth.ts`, `apps/api/src/lib/session.ts` — **JWT-based auth, web issue, API verify**
- [x] Baca `apps/api/src/app/api/generate/[type]/route.ts` (flow generation biasa — ini yang **berfungsi**)
- [x] Baca `apps/api/src/app/api/templates/generate/route.ts` (flow template — **✅ Fixed, tidak lagi rusak**)

### Hari 4 — Pahami Model Data dan Template System

- [x] Baca `packages/db/prisma/schema.prisma`, fokus `Generation`, `StoryboardTemplate`, `TemplateShot`, `BrandKit`, `TemplateGenerationJob`
- [x] Baca `packages/db/prisma/seed-templates.ts` — **✅ negativePrompt field sudah complete**

### Hari 5 — Next Steps untuk New Joiner

- [ ] Setup Supabase local atau connect ke Supabase cloud
- [ ] Explore FeatureCard3D/Gallery3D wiring (design decision needed)
- [ ] Pick 1 item dari Backlog di bawah

### Hari 6-7 — Validasi & Exploration

- [ ] Uji manual: generate dari template end-to-end sampai dapat `resultUrl`
- [ ] Explore production concerns: distributed rate limiting, UI/UX polish

---

## 🗂 Referensi Arsitektur (ringkas, tidak duplikat kode — cek source untuk detail)

### Generation Flow (biasa, non-template) — berfungsi

`apps/api` → auth check → rate limit → credit decrement → buat record `Generation` → `packages/ai` (prompt enhancement → provider select/fallback: Seedance → Kling → Wan, urutan tetap → polling status → upload result ke storage).

Fallback order sengaja tetap (bukan berdasarkan `metadata.priority`) demi predictability saat provider utama down — keputusan desain, bukan bug.

### Template Flow — sudah tersambung (P0 fixed), tapi FFmpeg belum aman untuk deploy

UI (`apps/web/src/components/templates/`) → API generate route → `executeTemplateGeneration()` (fire-and-forget) → `template-orchestrator.ts` (`generateFromTemplate`) → hybrid batch shot generation → FFmpeg stitch (**perlu binary `ffmpeg` di runtime — lihat Gap #1 di atas**) → storage upload → update job status.

### Storage

Factory di `packages/ai/src/services/storage/index.ts`: prioritas R2 → Vercel Blob → NullProvider (no-op). Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, atau `BLOB_READ_WRITE_TOKEN`.

### Key Technical Decisions (final — tidak ada lagi open question)

| Decision                | Choice                                                                                                                                   | Rationale                                                                                                                                                                                            | Action item                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Template storage        | Prisma DB (bukan JSON)                                                                                                                   | Versioning, querying, relations, auth                                                                                                                                                                | Selesai                                                                                                                                                  |
| Shot generation         | Hybrid batch (3-4 paralel)                                                                                                               | Balance speed vs rate limit                                                                                                                                                                          | Selesai                                                                                                                                                  |
| Video stitching         | FFmpeg concat (codec copy)                                                                                                               | Lossless, cepat, no re-encode                                                                                                                                                                        | Selesai                                                                                                                                                  |
| Fallback provider order | Fixed: Seedance → Kling → Wan                                                                                                            | Predictability > optimasi speed/cost saat darurat                                                                                                                                                    | Selesai                                                                                                                                                  |
| Error handling shot     | Retry 2x per shot, stitch partial                                                                                                        | User tetap dapat hasil walau 1-2 shot gagal                                                                                                                                                          | Selesai                                                                                                                                                  |
| **FFmpeg execution**    | **Binary `ffmpeg` di dalam container `apps/api`** (bukan wasm, bukan service terpisah)                                                   | wasm terlalu lambat/berat untuk concat rutin; service terpisah over-engineering untuk tahap sekarang; kode `FFmpegService` sudah baca `FFMPEG_PATH`, tinggal environment-nya yang harus punya binary | **TODO**: tambahkan `Dockerfile` untuk `apps/api` (`apt-get install ffmpeg`), deploy ke Railway/Render/Fly.io — **jangan** ke Vercel serverless function |
| **Storage kewajiban**   | **Final result wajib R2/Blob. Shot mentah antara boleh tetap URL provider sementara** (didownload ke temp, dipakai stitch, lalu dibuang) | URL signed provider expire dalam hitungan jam-hari — tidak aman untuk hasil akhir yang dilihat user nanti; upload semua shot mentah ke R2 cuma nambah biaya & waktu tanpa manfaat                    | Sudah sesuai desain `generation-service`/`template-orchestrator` yang ada — pastikan diterapkan konsisten di semua jalur                                 |
| **Template authoring**  | **Admin-only untuk MVP**, community authoring masuk Backlog roadmap                                                                      | Volume template MVP kecil, admin-only bukan bottleneck; community authoring butuh sistem review/moderasi yang overhead-nya belum sepadan sekarang                                                    | Sudah sesuai kode yang ada (route create template = admin/official only) — tidak ada aksi tambahan                                                       |
| **Credit policy**       | **Flat fee per template** (`StoryboardTemplate.creditsCost`)                                                                             | UX simpel untuk target UMKM; per-shot billing jadi rumit begitu ada retry logic                                                                                                                      | **TODO**: pastikan angka `creditsCost` dihitung dari rata-rata biaya per shot × jumlah shot + buffer margin retry — bukan angka sembarang                |
| **Realtime job update** | **SSE** (`GET /api/templates/generations/[jobId]/stream`), **bukan WebSocket**                                                           | Job berdurasi menit bukan detik, tidak butuh update sub-detik; WebSocket butuh state/pub-sub yang kompleksitasnya tidak sepadan di tahap ini                                                         | Sudah diimplementasikan — tidak ada aksi tambahan                                                                                                        |

---

## 📋 Backlog / Roadmap Masa Depan (belum mulai, urutan setelah P0-P2 beres)

- **Visual Prompt Builder**: drag-drop scene builder, shot list generator dari script, real-time low-res preview
- **Team Workspace**: multi-user roles (Owner/Admin/Creator/Viewer), project folders, comments & approval workflow, shared asset library
- **Public API & Developer Platform**: REST API, SDK (TS/Python/Go), webhooks, API key management
- **Billing & Subscription**: Stripe (Free/Pro/UMKM/Enterprise), credit system, usage dashboard, invoice + PPN Indonesia
- **Export & Distribution**: multi-format export (MP4/WebM/GIF/MOV/ProRes), auto-crop aspect ratio, direct publish ke TikTok/Reels/Shorts, CDN signed URL

---

**Updated**: 2026-07-20 — P0/P1/P2 terkonfirmasi fixed. Gap #1 (FFmpeg deployment) **sudah DISELESAIKAN** (Dockerfile + docker-compose + GitHub Actions CI/CD). **Remaining**: TemplateOrchestrator testing. Sistem sekarang aman untuk deployment ke Railway/Render/Fly.io dengan FFmpeg support.

> **Arsip**: versi lengkap sebelumnya (dengan seluruh histori phase 8-12 dan dump kode) disimpan sebagai `implementation-plan-ARCHIVE.md` untuk referensi historis. Dokumen ini (`implementation-plan.md`) adalah source of truth aktif — jangan tambahkan dump kode besar lagi di sini, cukup pointer ke file + status.
