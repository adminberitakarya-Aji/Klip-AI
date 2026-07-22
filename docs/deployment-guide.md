# Deployment Guide - Klip-AI

## Overview

Panduan deployment untuk Klip-AI production menggunakan Docker.

## Prerequisites

1. Docker & Docker Compose
2. GitHub account dengan akses ke repository
3. Account di services berikut:
   - [Supabase](https://supabase.com) - Database
   - [Upstash](https://console.upstash.com) - Redis (rate limiting)
   - [Midtrans](https://dashboard.midtrans.com) - Payment gateway
   - [Sentry](https://sentry.io) - Error tracking
   - [Cloudflare](https://dash.cloudflare.com) - R2 Storage (optional)

## Environment Variables Setup

### 1. Create GitHub Secrets

Go to repository **Settings > Secrets and variables > Actions** and add:

```bash
# Database (Supabase)
# Runtime — Connection Pooling (Transaction mode), port 6543, ?pgbouncer=true
DATABASE_URL=postgresql://postgres:xxx@aws-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
# Prisma CLI only (db push/migrate) — Direct connection, port 5432, no pgbouncer
DIRECT_URL=postgresql://postgres:xxx@aws-xxx.supabase.co:5432/postgres

# Auth
NEXTAUTH_SECRET=your-32-character-minimum-secret-key
NEXTAUTH_URL=https://api.klip.ai

# AI Providers (Seedance, Kling, Wan)
SEEDANCE_API_KEY=xxx
SEEDANCE_BASE_URL=https://api.seedance.com
KLING_API_KEY=xxx
KLING_BASE_URL=https://api.kling.com
WAN_API_KEY=xxx
WAN_BASE_URL=https://api.wan.com

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=klip-ai-generations
R2_PUBLIC_URL=https://cdn.klip.ai

# Midtrans Payment
MIDTRANS_SERVER_KEY=xxx
MIDTRANS_CLIENT_KEY=xxx
MIDTRANS_IS_PRODUCTION=false  # true for production

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx

# Turbo (for remote caching)
TURBO_TOKEN=xxx
TURBO_TEAM=your-team-name
```

### 2. Supabase Setup

1. Create new project at https://supabase.com
2. Get **both** connection strings from **Settings > Database > Connection string**:
   - **Transaction pooler** (port 6543, `?pgbouncer=true`) → `DATABASE_URL` — used by the running app
   - **Direct connection** (port 5432, no pgbouncer) → `DIRECT_URL` — used only by Prisma CLI (`db:push`/`db:migrate`), since PgBouncer's transaction mode doesn't reliably support DDL statements
3. Set both `DATABASE_URL` and `DIRECT_URL` in `apps/api/.env`, `apps/web/.env`, and `packages/db/.env` (Prisma CLI commands run from `packages/db` and read `.env` there, not from the apps' `.env` files)
4. Run migrations:
   ```bash
   pnpm --filter @klipai/db db:push
   ```
5. Seed credit packages:
   ```bash
   cd packages/db && npx tsx prisma/seed-credits.ts
   ```

### 3. Upstash Redis Setup

1. Create new Redis database at https://console.upstash.com
2. Copy **REST URL** and **REST Token**
3. Add to GitHub secrets

### 4. Sentry Setup

1. Create new project at https://sentry.io
2. Copy DSN URL
3. Add to GitHub secrets

### 5. Midtrans Setup

1. Create account at https://dashboard.midtrans.com
2. Get **Server Key** and **Client Key**
3. For production: request production access
4. Configure webhook URL: `https://api.klip.ai/api/credits/webhook`

## Deployment Steps

### Automatic (via GitHub Actions)

1. Merge to `main` branch triggers:
   - Docker build & push to GHCR
   - Type check
   - Run tests
   - Security scan (Trivy)
   - Deploy (if configured)

2. Manual trigger:
   - Go to **Actions > Build and Push Docker Image**
   - Click **Run workflow**
   - Select environment: staging/production

### Manual Deployment

1. Pull latest image:

   ```bash
   docker pull ghcr.io/adminberitakarya-aji/klip-ai:latest
   ```

2. Create `.env` file:

   ```bash
   cp .env.example .env
   # Fill in all values
   ```

3. Run with docker-compose:
   ```bash
   docker-compose up -d
   ```

## Docker Compose Production Setup

```yaml
# docker-compose.prod.yml
services:
  api:
    image: ghcr.io/adminberitakarya-aji/klip-ai:latest
    restart: always
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      MIDTRANS_SERVER_KEY: ${MIDTRANS_SERVER_KEY}
      MIDTRANS_CLIENT_KEY: ${MIDTRANS_CLIENT_KEY}
      UPSTASH_REDIS_REST_URL: ${UPSTASH_REDIS_REST_URL}
      UPSTASH_REDIS_REST_TOKEN: ${UPSTASH_REDIS_REST_TOKEN}
      # ... other vars
```

## Monitoring

### Sentry Dashboard

View errors at https://sentry.io/organizations/your-org/projects/klip-ai

### Health Check

```bash
curl https://api.klip.ai/api/health
```

## Rollback Procedure

1. Go to GitHub Actions
2. Find successful previous deployment
3. Click **Re-run jobs**
4. Or manually pull specific tag:
   ```bash
   docker pull ghcr.io/adminberitakarya-aji/klip-ai:v1.2.3
   ```
