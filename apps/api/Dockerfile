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

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json packages/

# Install dependencies (exclude devDependencies untuk production)
RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

RUN npm install -g pnpm@9

WORKDIR /app

# Accept DATABASE_URL as build arg (for prisma generate)
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client (uses --schema to avoid .env lookup issues)
RUN pnpm --filter @klipai/db db:generate

# Build Next.js application
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

# Set FFmpeg path environment variable
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/apps/api/.next/standalone ./
COPY --from=builder /app/apps/api/.next/static ./.next/static
COPY --from=builder /app/apps/api/public ./public

# Copy Prisma schema for migrations
COPY --from=builder /app/packages/db/prisma ./prisma

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
CMD ["node", "server.js"]