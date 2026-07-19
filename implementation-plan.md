# Implementation Plan: Klip-AI Remaining Work

> **Status Aktual (Updated 2026-07-20)**: P0, P1, P2 completed. Distributed rate limiting (Upstash Redis) implemented. UI/UX polish done (toast notifications). All critical fixes complete. Ready for production deployment.
> **Perubahan dari audit sebelumnya**: beberapa klaim di versi plan lama sudah **usang/salah** setelah dicek ulang langsung ke kode. Detail ada di bagian "Koreksi vs Audit Sebelumnya".
> **Updated**: 2026-07-20

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
8. **[Next] Supabase setup**: Run migrations + seed di Supabase (task owner: user)
9. **[Next] Production testing**: End-to-end testing, Upstash Redis setup
10. **[P3] Roadmap ekspansi**: advanced UX, team workspace, billing, public API/SDK (lihat Backlog di bawah)

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

### Template Flow — rusak di titik eksekusi (lihat P0)

UI (`apps/web/src/components/templates/`) → API list/detail/create/generate/status/stream (`apps/api/src/app/api/templates/`) → **[PUTUS DI SINI]** → seharusnya `template-orchestrator.ts` → FFmpeg stitch → storage upload → update job.

### Storage

Factory di `packages/ai/src/services/storage/index.ts`: prioritas R2 → Vercel Blob → NullProvider (no-op). Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, atau `BLOB_READ_WRITE_TOKEN`.

### Key Technical Decisions (masih berlaku)

| Decision                | Choice                            | Rationale                                         |
| ----------------------- | --------------------------------- | ------------------------------------------------- |
| Template storage        | Prisma DB (bukan JSON)            | Versioning, querying, relations, auth             |
| Shot generation         | Hybrid batch (3-4 paralel)        | Balance speed vs rate limit                       |
| Video stitching         | FFmpeg concat (codec copy)        | Lossless, cepat, no re-encode                     |
| Fallback provider order | Fixed: Seedance → Kling → Wan     | Predictability > optimasi speed/cost saat darurat |
| Error handling shot     | Retry 2x per shot, stitch partial | User tetap dapat hasil walau 1-2 shot gagal       |

### Open Questions (masih relevan)

1. FFmpeg stitching pakai binary server, wasm, atau service terpisah?
2. Semua output template wajib masuk R2/Blob sejak MVP, atau boleh signed URL provider langsung?
3. Template authoring: admin-only dulu, atau community workflow dengan review?
4. Credit policy: flat fee per template atau per shot?
5. Realtime job update: polling/SSE cukup, atau butuh WebSocket?

---

## 📋 Backlog / Roadmap Masa Depan (belum mulai, urutan setelah P0-P2 beres)

- **Visual Prompt Builder**: drag-drop scene builder, shot list generator dari script, real-time low-res preview
- **Team Workspace**: multi-user roles (Owner/Admin/Creator/Viewer), project folders, comments & approval workflow, shared asset library
- **Public API & Developer Platform**: REST API, SDK (TS/Python/Go), webhooks, API key management
- **Billing & Subscription**: Stripe (Free/Pro/UMKM/Enterprise), credit system, usage dashboard, invoice + PPN Indonesia
- **Export & Distribution**: multi-format export (MP4/WebM/GIF/MOV/ProRes), auto-crop aspect ratio, direct publish ke TikTok/Reels/Shorts, CDN signed URL

---

**Updated**: 2026-07-20 — All P0, P1, P2 completed. Production hardening done (Upstash Redis, Sentry). UI/UX polish done (toast notifications). Ready for Supabase deployment.

> **Arsip**: versi lengkap sebelumnya (dengan seluruh histori phase 8-12 dan dump kode) disimpan sebagai `implementation-plan-ARCHIVE.md` untuk referensi historis. Dokumen ini (`implementation-plan.md`) adalah source of truth aktif — jangan tambahkan dump kode besar lagi di sini, cukup pointer ke file + status.
