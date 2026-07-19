# Implementation Plan: Klip-AI Remaining Work

> **Status Aktual (Re-audit langsung ke kode, 2026-07-19)**: Fondasi arsitektur **kuat**, layer AI **sehat secara desain**, tetapi ada **1 bug kritis yang membuat kredit user bisa hilang tanpa hasil**, plus beberapa error type-check asli yang belum dibereskan.
> **Perubahan dari audit sebelumnya**: beberapa klaim di versi plan lama sudah **usang/salah** setelah dicek ulang langsung ke kode (clone, install, build, type-check). Detail ada di bagian "Koreksi vs Audit Sebelumnya".
> **Updated**: 2026-07-19

---

## 🚀 Baca Ini Dulu (Onboarding Tim Baru)

### Ringkasan Eksekutif

- Monorepo Turborepo + pnpm dengan pemisahan benar: `apps/web`, `apps/api`, `packages/*`
- Layer AI orchestration (`packages/ai`) paling matang secara desain, tapi type-check-nya **tidak hijau**
- Risiko produk #1 saat ini: **template generation memotong kredit user tapi tidak pernah benar-benar generate apa pun** (lihat P0 di bawah)
- Kesimpulan jujur: **strong pre-production system**, belum production-ready, dan ada satu bug yang bisa langsung merugikan user secara finansial (kredit) kalau fitur ini dianggap live

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

**Ini prioritas nomor satu, di atas semua yang lain.**

- `packages/ai/src/services/template-orchestrator.ts` **sudah diimplementasikan penuh** (± 1000 baris): job creation, hybrid batch shot generation, retry, FFmpeg stitching, upload hasil ke storage. Class `TemplateOrchestrator` dan singleton `templateOrchestrator` di file ini sudah nyata, bukan pseudocode.
- Tapi `templateOrchestrator` **tidak dipanggil di mana pun di repo** (sudah di-grep, satu-satunya referensi selain file itu sendiri ada di test `prompt-enhancer.test.ts` yang tidak ada hubungannya).
- `apps/api/src/app/api/templates/generate/route.ts` alurnya: validasi → cek template published → cek kredit user → **buat `TemplateGenerationJob` dengan status `QUEUED`** → **decrement kredit user langsung** → return `jobId`. Setelah itu **tidak ada apa pun** yang memproses job tersebut. Tidak ada pemanggilan orchestrator, tidak ada queue consumer, tidak ada cron/worker.
- **Dampak**: user yang generate dari template akan kepotong kredit dan job-nya nyangkut selamanya di status `QUEUED`, karena eksekusi asli tidak pernah ter-trigger.

**Fix yang dibutuhkan** (bukan "bikin orchestrator baru" — orchestrator-nya sudah ada, tinggal disambungkan):

1. Panggil `templateOrchestrator.generateFromTemplate(...)` dari route `POST /api/templates/generate` — baik langsung (async, fire-and-forget dengan try/catch + rollback kredit kalau gagal total) atau lewat job queue kalau mau non-blocking yang lebih aman.
2. Pastikan kegagalan orchestrator mengembalikan kredit (refund) atau minimal update status job jadi `FAILED` supaya user tidak menunggu selamanya.
3. Tambahkan test integrasi end-to-end: create job → orchestrator jalan → job selesai dengan `resultUrl` terisi.
4. Sebelum ini beres, **jangan expose fitur "generate dari template" sebagai live** ke user production.

---

## 🟠 P1 — Type-check repo belum hijau (temuan yang sudah diverifikasi ulang)

Perlu dijalankan lewat `pnpm run type-check` di root (pakai Turbo, bukan `pnpm --filter <pkg> type-check` langsung — filter langsung skip dependency graph `^build` dan bisa memberi hasil yang menyesatkan, misalnya seolah `packages/ui` rusak padahal cuma belum di-build).

**Error asli yang terverifikasi** (bukan artefak environment):

- `packages/ai/src/services/upscaler-service.ts:566` — parameter `job` implicit `any` pada `.map((job) => ...)`
- `apps/api/src/app/api/templates/route.ts:179` — parameter `tx` implicit `any`
- `apps/api/src/app/api/templates/[slug]/reviews/route.ts:90,94,97` — parameter `s`/`sum` implicit `any` (reduce/map tanpa tipe)
- `apps/web/src/app/(dashboard)/templates/[slug]/page.tsx:66` — parameter `s` implicit `any`
- `apps/web/src/app/(dashboard)/templates/[slug]/customize/page.tsx:76,89` — parameter `s`/`bk` implicit `any`

**Bukan bug kode, tapi gap tooling yang bikin error di atas kelihatan lebih parah dari aslinya**:

- `turbo.json` task `type-check` depends on `^build`, tapi **tidak depend ke `db:generate`**. Kalau Prisma client belum pernah di-generate di environment (fresh clone, atau CI yang belum setup DB), `packages/ai` gagal type-check dengan error `Module "@prisma/client" has no exported member 'BrandKit'` — padahal model `BrandKit` memang ada di schema, cuma client-nya belum di-generate. Rekomendasi: tambahkan `db:generate` sebagai dependency eksplisit sebelum `type-check`/`build` di `turbo.json`, atau minimal dokumentasikan sebagai langkah wajib pertama di CI.

**Sudah dikonfirmasi TIDAK bermasalah** (klaim lama di plan sebelumnya sudah usang):

- Import `@klipai/ui/components/*` di `apps/web` — sempat kelihatan gagal total (26 error) saat `packages/ui` belum di-build, tapi setelah `pnpm --filter @klipai/ui build`, hilang semua. Ini bekerja normal lewat `pnpm run type-check` di root.

---

## 📌 Legenda Status

- **VERIFIED** = dicek langsung ke kode aktual, perilakunya konsisten dengan klaim
- **PARTIAL** = ada implementasi, tapi belum utuh / belum aman dianggap selesai
- **BROKEN** = ada implementasinya tapi tidak berfungsi end-to-end (lihat P0)
- **PLANNED** = masih desain/roadmap, belum ada kode

## Status Nyata Per Area

| Area                                | Status              | Catatan                                                                                                                                                              |
| ----------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo structure                  | VERIFIED            | Pembagian app/package benar, Turbo pipeline benar (kecuali gap `db:generate`)                                                                                        |
| AI orchestration (generation biasa) | PARTIAL             | Desain kuat, tapi ada implicit-any bug asli di `upscaler-service.ts`                                                                                                 |
| Template generation                 | **BROKEN**          | Orchestrator lengkap tapi orphaned — lihat P0                                                                                                                        |
| Web UX/marketing                    | PARTIAL             | Visual kuat, beberapa halaman template ada implicit-any                                                                                                              |
| Auth boundary                       | VERIFIED            | Web issue JWT, API verify JWT                                                                                                                                        |
| Template data model (Prisma)        | VERIFIED            | Schema kaya (`StoryboardTemplate`, `TemplateShot`, `BrandKit`, `TemplateGenerationJob`, dll)                                                                         |
| Type safety repo                    | PARTIAL             | Root `pnpm run type-check` gagal di `@klipai/ai` dulu (blocking), belum sampai ke `web`/`api` dalam satu run bersih                                                  |
| Docs accuracy                       | Diperbaiki hari ini | Plan versi sebelumnya melaporkan orchestrator sebagai "belum ada", padahal sudah ada tapi orphaned — kesalahan yang lebih berisiko dari sekadar "belum implementasi" |

---

## Koreksi vs Audit Sebelumnya

Plan versi lama (arsip lengkap di git history / `implementation-plan-OLD-backup.md`) mengklaim:

> "`TemplateOrchestrator` dalam bentuk di bawah masih harus diperlakukan sebagai desain/pseudocode. Belum ditemukan implementasi worker nyata."

Ini **tidak akurat lagi** per hari ini. File-nya sudah ada dan lengkap (dicek: `class TemplateOrchestrator`, method `generateFromTemplate`, `executeHybridBatch`, `stitchShots`, semuanya berisi implementasi asli, bukan komentar TODO). Masalah sebenarnya bukan "belum dibuat", tapi **"sudah dibuat, tidak pernah dipanggil"** — root cause yang berbeda dan butuh fix yang berbeda (wiring, bukan development dari nol).

Pelajaran untuk proses ke depan: klaim "belum diimplementasi" di dokumen harus selalu diverifikasi dengan `grep` penggunaan nyata (siapa yang memanggil fungsi ini?), bukan cuma cek keberadaan file.

---

## 🎯 Immediate Next Steps (Priority Order) — Direvisi 2026-07-19

1. **[P0] Sambungkan `templateOrchestrator` ke route `/api/templates/generate`** — ini yang paling mendesak karena menyangkut uang (kredit) user
2. **[P1] Perbaiki 6 implicit-any error asli** (list lengkap di atas) — cepat dan berdampak jelas ke kehijauan type-check
3. **[P1] Tambahkan `db:generate` sebagai dependency eksplisit di `turbo.json`** sebelum `build`/`type-check`, supaya error Prisma client yang membingungkan tidak muncul lagi di environment baru
4. **[P2] Sinkronkan `GenerationType` di `@klipai/core`, route API, dan Prisma schema** — masih ada drift dari audit sebelumnya, belum sempat diverifikasi ulang hari ini
5. **[P2] Rapikan wiring produk**: navigasi template, CTA, komponen 3D yang siap tapi belum terpasang
6. **[P3] Roadmap ekspansi**: advanced UX, team workspace, billing, public API/SDK (lihat Backlog di bawah)

---

## 📅 Onboarding Operasional: Checklist Minggu Pertama

### Hari 1 — Setup dan Peta Sistem

- [ ] Clone repo, `pnpm install`, copy `.env.example`
- [ ] **`pnpm --filter @klipai/db db:generate`** — wajib sebelum type-check, kalau di-skip akan muncul error Prisma yang membingungkan
- [ ] `pnpm run type-check` **di root** (bukan `--filter`, supaya dependency graph Turbo jalan benar)
- [ ] Catat semua error sebagai baseline — bandingkan dengan daftar P1 di atas
- [ ] Scan folder: `apps/web`, `apps/api`, `packages/ai`, `packages/db`

### Hari 2 — Pahami Jantung AI Pipeline

- [ ] Baca `packages/ai/src/services/prompt-enhancer.ts`, `provider-router.ts`, `pipeline-orchestrator.ts`, `generation-service.ts`
- [ ] Baca `packages/ai/src/services/template-orchestrator.ts` — pahami kenapa ini file paling penting untuk fix P0
- [ ] Jalankan `pnpm --filter @klipai/ai test`

### Hari 3 — Pahami Boundary Web, API, dan Auth

- [ ] Baca `apps/web/src/lib/auth.ts`, `apps/api/src/lib/session.ts`
- [ ] Baca `apps/api/src/app/api/generate/[type]/route.ts` (flow generation biasa — ini yang **berfungsi**)
- [ ] Baca `apps/api/src/app/api/templates/generate/route.ts` (flow template — ini yang **rusak**, bandingkan keduanya)

### Hari 4 — Pahami Model Data dan Template System

- [ ] Baca `packages/db/prisma/schema.prisma`, fokus `Generation`, `StoryboardTemplate`, `TemplateShot`, `BrandKit`, `TemplateGenerationJob`
- [ ] Baca `packages/db/prisma/seed-templates.ts`

### Hari 5 — First Fix Sprint

- [ ] Ambil P0 (wiring orchestrator) atau 1-2 item P1 (implicit-any)
- [ ] PR kecil, review, merge

### Hari 6-7 — Validasi & Handshake

- [ ] Uji manual: generate dari template end-to-end sampai dapat `resultUrl`
- [ ] Tulis ringkasan temuan + sprint plan berikutnya berbasis status aktual

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

**Updated**: 2026-07-19 — Re-audit langsung ke kode (clone, install, build, type-check nyata). Ditemukan bug P0 baru (template orchestrator orphaned) yang lebih kritis dari yang dilaporkan audit sebelumnya. Dokumen dipadatkan dari 1602 baris menjadi versi ini — histori kode lengkap (interface, pseudocode lama) diarsipkan terpisah agar tidak lagi jadi sumber drift dokumentasi vs kode aktual.

> **Arsip**: versi lengkap sebelumnya (dengan seluruh histori phase 8-12 dan dump kode) disimpan sebagai `implementation-plan-ARCHIVE.md` untuk referensi historis. Dokumen ini (`implementation-plan.md`) adalah source of truth aktif — jangan tambahkan dump kode besar lagi di sini, cukup pointer ke file + status.
