# ============================================
# Klip-AI API Dockerfile
# Production-ready dengan FFmpeg untuk video stitching
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

# Install pnpm globally
RUN npm install -g pnpm@9

WORKDIR /app

# Copy root workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc* ./

# Copy ALL package.json files, preserving directory structure so pnpm
# can resolve the workspace graph before installing
COPY packages/db/package.json       ./packages/db/package.json
COPY packages/ai/package.json       ./packages/ai/package.json
COPY packages/config/package.json   ./packages/config/package.json
COPY packages/core/package.json     ./packages/core/package.json
COPY packages/tsconfig/package.json ./packages/tsconfig/package.json
COPY packages/ui/package.json       ./packages/ui/package.json
COPY apps/api/package.json          ./apps/api/package.json
COPY apps/web/package.json          ./apps/web/package.json

# Install all dependencies (including devDeps for prisma CLI + tsc)
# pnpm install will set up the .pnpm store + symlinks correctly
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

RUN npm install -g pnpm@9

WORKDIR /app

# Accept DATABASE_URL as build arg (needed for prisma generate)
ARG DATABASE_URL
# prisma generate only needs a syntactically valid URL — no real DB needed
ENV DATABASE_URL=${DATABASE_URL:-"postgresql://user:pass@localhost:5432/db"}

# Copy the ENTIRE node_modules (including .pnpm store & symlinks) from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy full monorepo source
COPY . .

# Generate Prisma Client
RUN pnpm --filter @klipai/db db:generate

# Build Next.js application with standalone output for Docker
ENV NEXT_OUTPUT_STANDALONE=true
RUN pnpm --filter @klipai/api build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Install FFmpeg dan utilities
RUN apk add --no-cache \
    ffmpeg \
    dumb-init \
    curl

# Create non-root user untuk security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set environment variables
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV NODE_ENV=production

# The standalone output bundles everything needed to run the server.
# The structure is: .next/standalone/apps/api/server.js
COPY --from=builder /app/apps/api/.next/standalone ./
COPY --from=builder /app/apps/api/.next/static     ./apps/api/.next/static
COPY --from=builder /app/apps/api/public           ./apps/api/public

# Copy Prisma schema for runtime migrations
COPY --from=builder /app/packages/db/prisma        ./packages/db/prisma
# Copy generated Prisma engine binaries
COPY --from=builder /app/node_modules/.prisma      ./node_modules/.prisma

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Use dumb-init untuk proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "apps/api/server.js"]