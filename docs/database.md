# Klip-AI Database Documentation

## Overview

PostgreSQL 15+ database managed via Prisma ORM. Single schema with models for auth, users, generations, and billing.

---

## Prisma Schema (`packages/db/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTH MODELS (NextAuth v5 compatible)
// ============================================

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
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ============================================
// USER & SUBSCRIPTION MODELS
// ============================================

enum Role {
  USER
  ADMIN
}

enum Subscription {
  FREE
  PRO
  UMKM
  ENTERPRISE
}

model User {
  id            String       @id @default(cuid())
  email         String       @unique
  emailVerified DateTime?
  name          String?
  image         String?
  passwordHash  String?
  role          Role         @default(USER)
  subscription  Subscription @default(FREE)
  credits       Int          @default(30)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  accounts      Account[]
  sessions      Session[]
  generations   Generation[]
  creditsLogs   CreditLog[]

  @@index([email])
  @@index([subscription])
}

model CreditLog {
  id          String   @id @default(cuid())
  userId      String
  amount      Int      // Positive for credit, negative for debit
  reason      String   // "generation", "purchase", "refund", "bonus", "admin_adjustment"
  generationId String?
  description String?
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, createdAt])
  @@index([generationId])
}

// ============================================
// GENERATION MODELS
// ============================================

enum GenerationStatus {
  IDLE
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
}

enum GenerationType {
  TEXT_TO_VIDEO
  IMAGE_TO_VIDEO
  VIDEO_TO_VIDEO
  TEXT_TO_IMAGE
  IMAGE_TO_IMAGE
  MOTION_CONTROL
  VIDEO_TO_VIDEO_STYLE_TRANSFER
  INPAINTING_OUTPAINTING
  DEPTH_NORMAL_CONTROL
  MULTI_SHOT_STORYBOARD
}

model Generation {
  id              String           @id @default(cuid())
  userId          String
  prompt          String           @db.Text
  type            GenerationType
  status          GenerationStatus @default(QUEUED)
  progress        Int              @default(0)
  resultUrl       String?
  error           String?          @db.Text
  options         Json?            // Type-specific options (camera, motion, etc.)
  images          String[]         @default([]) // Reference images
  video           String?          // Reference video
  referenceImages Json?            // Phase 11.1: Structured reference images
  motionBrush     Json?            // Phase 11.2: Motion brush config
  cameraControl   Json?            // Phase 11.2: Camera control config
  physics         Json?            // Phase 11.2: Physics simulation config
  postProcessing  Json?            // Phase 11.3: Post-processing pipeline
  retryCount      Int              @default(0)
  lastFailedAt    DateTime?
  completedAt     DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, createdAt])
  @@index([status])
  @@index([type])
  @@index([retryCount])
}

// ============================================
// BILLING MODELS (Stripe integration)
// ============================================

model StripeCustomer {
  id            String   @id @default(cuid())
  userId        String   @unique
  stripeCustomerId String @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Subscription {
  id                   String   @id @default(cuid())
  userId               String   @unique
  stripeSubscriptionId String   @unique
  stripePriceId        String
  stripeCurrentPeriodEnd DateTime
  cancelAtPeriodEnd    Boolean  @default(false)
  status               String   // active, trialing, past_due, canceled, incomplete
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([stripeSubscriptionId])
  @@index([userId])
}

model Invoice {
  id              String   @id @default(cuid())
  userId          String
  stripeInvoiceId String   @unique
  amount          Int      // In cents
  currency        String   @default("idr")
  status          String   // draft, open, paid, void, uncollectible
  invoiceUrl      String?
  invoicePdf      String?
  periodStart     DateTime
  periodEnd       DateTime
  createdAt       DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([stripeInvoiceId])
}

// ============================================
// WEBHOOK EVENTS (Idempotency)
// ============================================

model WebhookEvent {
  id            String   @id @default(cuid())
  stripeEventId String   @unique
  type          String
  processed     Boolean  @default(false)
  payload       Json
  error         String?
  createdAt     DateTime @default(now())
  processedAt   DateTime?

  @@index([type])
  @@index([processed])
  @@index([createdAt])
}
```

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌──────────────────┐
│    User     │◄──────│  Account    │       │    Generation    │
├─────────────┤       ├─────────────┤       ├──────────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)          │
│ email       │       │ userId (FK) │       │ userId (FK)      │
│ name        │       │ provider    │       │ prompt           │
│ role        │       │ providerAcc │       │ type             │
│ subscription│       │ tokens...   │       │ status           │
│ credits     │       └─────────────┘       │ progress         │
└──────┬──────┘                               │ resultUrl        │
       │                                      │ options (JSON)   │
       │         ┌─────────────┐              │ images[]         │
       ├────────►│    Session  │              │ video            │
       │         ├─────────────┤              │ referenceImages  │
       │         │ id (PK)     │              │ motionBrush      │
       │         │ userId (FK) │              │ cameraControl    │
       │         │ sessionTok  │              │ physics          │
       │         │ expires     │              │ postProcessing   │
       │         └─────────────┘              │ retryCount       │
       │                                      │ lastFailedAt     │
       │         ┌─────────────┐              └────────┬─────────┘
       ├────────►│ CreditLog   │                       │
       │         ├─────────────┤                       │
       │         │ id (PK)     │                       │
       │         │ userId (FK) │                       │
       │         │ amount      │                       │
       │         │ reason      │                       │
       │         │ generationId│                       │
       │         └─────────────┘                       │
       │                                               │
       │         ┌─────────────┐       ┌─────────────┐ │
       └────────►│StripeCustomer│      │ Subscription  │ │
                 ├─────────────┤       ├─────────────┤ │
                 │ id (PK)     │       │ id (PK)     │ │
                 │ userId (FK) │       │ userId (FK) │ │
                 │stripeCustId │       │stripeSubId  │ │
                 └─────────────┘       │stripePriceId│ │
                                       │periodEnd    │ │
                                       │status       │ │
                                       └─────────────┘ │
                                                       │
                 ┌─────────────┐       ┌─────────────┐ │
                 │  Invoice    │       │ WebhookEvent│ │
                 ├─────────────┤       ├─────────────┤ │
                 │ id (PK)     │       │ id (PK)     │ │
                 │ userId (FK) │       │stripeEventId│ │
                 │stripeInvId  │       │ type        │ │
                 │ amount      │       │ processed   │ │
                 │ status      │       │ payload     │ │
                 └─────────────┘       └─────────────┘ │
                                                       │
                                                       ▼
                                              (Generation complete)
```

---

## Indexes Summary

| Table            | Index                             | Purpose               |
| ---------------- | --------------------------------- | --------------------- |
| `User`           | `@@index([email])`                | Auth lookup           |
| `User`           | `@@index([subscription])`         | Billing queries       |
| `Account`        | `@@index([userId])`               | User sessions         |
| `Session`        | `@@index([userId])`               | Active sessions       |
| `Generation`     | `@@index([userId])`               | User history          |
| `Generation`     | `@@index([userId, createdAt])`    | Paginated history     |
| `Generation`     | `@@index([status])`               | Queue processing, DLQ |
| `Generation`     | `@@index([type])`                 | Analytics by type     |
| `Generation`     | `@@index([retryCount])`           | Dead letter queue     |
| `CreditLog`      | `@@index([userId])`               | User credit history   |
| `CreditLog`      | `@@index([userId, createdAt])`    | Paginated logs        |
| `CreditLog`      | `@@index([generationId])`         | Trace generation cost |
| `StripeCustomer` | `@@unique([stripeCustomerId])`    | Webhook lookup        |
| `Subscription`   | `@@index([stripeSubscriptionId])` | Webhook sync          |
| `Invoice`        | `@@index([stripeInvoiceId])`      | Webhook sync          |
| `WebhookEvent`   | `@@index([type])`                 | Debug by event type   |
| `WebhookEvent`   | `@@index([processed])`            | Retry unprocessed     |
| `WebhookEvent`   | `@@index([createdAt])`            | Cleanup old events    |

---

## Migrations

### Initial Migration (Baseline)

```bash
# Generate migration from schema
pnpm db:migrate --name init

# Or push directly (dev only)
pnpm db:push
```

### Migration History

| Migration                            | Description                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| `20240101000000_init`                | Initial schema: User, Account, Session, VerificationToken, Generation                  |
| `20240115000000_billing`             | Add StripeCustomer, Subscription, Invoice, CreditLog, WebhookEvent                     |
| `20240601000000_advanced_generation` | Add referenceImages, motionBrush, cameraControl, physics, postProcessing to Generation |
| `20240615000000_retry_dlq`           | Add retryCount, lastFailedAt to Generation                                             |

### Running Migrations

```bash
# Development (with dev DB)
pnpm db:migrate dev

# Production (CI/CD)
pnpm db:migrate deploy

# Generate client after schema changes
pnpm db:generate
```

---

## Common Queries

### Get User with Credit Balance

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, email: true, credits: true, subscription: true },
});
```

### Create Generation + Deduct Credit (Atomic)

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Check & decrement credits
  const updatedUser = await tx.user.update({
    where: { id: userId, credits: { gt: 0 } },
    data: { credits: { decrement: 1 } },
    select: { credits: true },
  });

  if (!updatedUser) throw new Error("INSUFFICIENT_CREDITS");

  // Create generation record
  const generation = await tx.generation.create({
    data: {
      userId,
      prompt,
      type: generationType,
      status: "QUEUED",
      options: options as any,
      images: images || [],
      video: video || null,
      referenceImages: referenceImages as any,
      motionBrush: motionBrush as any,
      cameraControl: cameraControl as any,
      physics: physics as any,
      postProcessing: postProcessing as any,
    },
  });

  // Log credit deduction
  await tx.creditLog.create({
    data: {
      userId,
      amount: -1,
      reason: "generation",
      generationId: generation.id,
      description: `Generated ${generationType}`,
    },
  });

  return { generationId: generation.id, credits: updatedUser.credits };
});
```

### Get User Generations (Paginated)

```typescript
const [items, total] = await Promise.all([
  prisma.generation.findMany({
    where: { userId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      prompt: true,
      type: true,
      status: true,
      progress: true,
      resultUrl: true,
      error: true,
      createdAt: true,
      completedAt: true,
    },
  }),
  prisma.generation.count({
    where: { userId, ...(status ? { status } : {}) },
  }),
]);

return { items, total, page, pageSize: limit, hasMore: page * limit < total };
```

### Dead Letter Queue (Failed Generations Eligible for Retry)

```typescript
const dlq = await prisma.generation.findMany({
  where: {
    status: "FAILED",
    retryCount: { lt: 3 },
    ...(userId ? { userId } : {}),
  },
  orderBy: { updatedAt: "desc" },
  select: {
    id: true,
    prompt: true,
    type: true,
    error: true,
    retryCount: true,
    lastFailedAt: true,
  },
});

return dlq.map((g) => ({
  ...g,
  retryable: g.retryCount < 3,
}));
```

### Retry Failed Generation

```typescript
await prisma.generation.update({
  where: { id: generationId },
  data: {
    status: "QUEUED",
    progress: 0,
    error: null,
    retryCount: { increment: 1 },
  },
});
```

### Get Generation by ID (with User)

```typescript
const generation = await prisma.generation.findUnique({
  where: { id: generationId },
  include: { user: { select: { id: true, email: true, credits: true } } },
});
```

### Update Generation Progress

```typescript
await prisma.generation.update({
  where: { id: generationId },
  data: {
    status: "PROCESSING",
    progress: 40,
    // resultUrl/error set on completion
  },
});
```

### Complete Generation

```typescript
await prisma.generation.update({
  where: { id: generationId },
  data: {
    status: "COMPLETED",
    progress: 100,
    resultUrl: cdnUrl,
    completedAt: new Date(),
  },
});
```

### Fail Generation

```typescript
await prisma.generation.update({
  where: { id: generationId },
  data: {
    status: "FAILED",
    error: errorMessage,
    lastFailedAt: new Date(),
  },
});
```

---

## Connection Pooling

### Prisma Client Singleton (`packages/db/src/client.ts`)

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Pool Configuration (via DATABASE_URL)

```env
# Supabase / Neon / Railway - add pooler params
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=10"

# Or configure in Prisma schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Recommended Pool Size:**

- Development: 5-10 connections
- Production (single instance): 10-20
- Production (serverless): Use PgBouncer (Supabase/Neon) or Prisma Data Proxy

---

## Seeding (`prisma/seed.ts`)

```typescript
import { PrismaClient, Role, Subscription } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@klip.ai" },
    update: {},
    create: {
      email: "admin@klip.ai",
      name: "Admin",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      subscription: Subscription.ENTERPRISE,
      credits: 10000,
      emailVerified: new Date(),
    },
  });

  // Create test user
  const userPassword = await hash("user123", 12);
  await prisma.user.upsert({
    where: { email: "user@klip.ai" },
    update: {},
    create: {
      email: "user@klip.ai",
      name: "Test User",
      passwordHash: userPassword,
      role: Role.USER,
      subscription: Subscription.FREE,
      credits: 30,
      emailVerified: new Date(),
    },
  });

  console.log("✅ Database seeded");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
```

Run: `pnpm db:seed`

---

## Backup & Restore

### Backup (pg_dump)

```bash
# Full backup
pg_dump -h localhost -U postgres -d klipai > backup_$(date +%Y%m%d).sql

# Schema only
pg_dump -h localhost -U postgres -d klipai --schema-only > schema_$(date +%Y%m%d).sql

# Data only
pg_dump -h localhost -U postgres -d klipai --data-only > data_$(date +%Y%m%d).sql
```

### Restore

```bash
# Restore full backup
psql -h localhost -U postgres -d klipai < backup_20240718.sql

# Or create new DB and restore
createdb -h localhost -U postgres klipai_restore
psql -h localhost -U postgres -d klipai_restore < backup_20240718.sql
```

### Automated Daily Backup (cron)

```bash
# /etc/cron.daily/klipai-backup
#!/bin/bash
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > /backups/klipai_$(date +%Y%m%d).sql.gz
# Keep last 30 days
find /backups -name "klipai_*.sql.gz" -mtime +30 -delete
```

---

## Performance Tuning

### Query Optimization

- Always use `select` to fetch only needed fields
- Use `include` sparingly (causes JOINs)
- Paginate with `skip`/`take` + `count` for total
- Add `@@index` for frequently filtered columns

### Connection Management

- Reuse singleton PrismaClient (see `packages/db/src/client.ts`)
- For serverless: use external pooler (PgBouncer, Prisma Accelerate)
- Set `connection_limit` in DATABASE_URL for pooler

### Long-Running Transactions

- Keep transactions short (credit deduction + generation create < 100ms)
- Avoid API calls inside transactions
- Use `prisma.$transaction` with timeout option

---

## Security

### Row-Level Security (Future)

```sql
-- Enable RLS on Generation table
ALTER TABLE "Generation" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own generations
CREATE POLICY user_generations ON "Generation"
  FOR ALL TO application_role
  USING ("userId" = current_setting('app.current_user_id'));
```

### Sensitive Data

- `passwordHash` - bcrypt, never logged
- Stripe keys - only in env, never in DB
- Webhook payloads - stored in `WebhookEvent.payload` (JSON), auto-purged after 30 days

---

## Monitoring Queries

### Slow Query Log (PostgreSQL)

```sql
-- Enable in postgresql.conf
log_min_duration_statement = 1000  # Log queries > 1s
log_statement = 'none'
log_duration = off
```

### Key Metrics to Alert On

| Metric                  | Warning    | Critical   |
| ----------------------- | ---------- | ---------- |
| Connection pool usage   | > 70%      | > 90%      |
| Query latency (p95)     | > 500ms    | > 2s       |
| Failed generations/hour | > 5%       | > 15%      |
| Dead letter queue size  | > 10       | > 50       |
| Credit log growth/day   | > 10k rows | > 50k rows |

---

## Troubleshooting

### P2003: Foreign Key Constraint Failed

- User deleted but generations exist → Add `onDelete: Cascade` or soft-delete users

### P2024: Connection Pool Timeout

- Increase pool size or add PgBouncer
- Check for connection leaks (missing `$disconnect`)

### P2034: Transaction Conflict

- Retry with exponential backoff (3 attempts)
- Shorten transaction scope

### Migration Drift

```bash
# Reset dev DB to match schema
pnpm db:migrate reset --force

# Or baseline production
pnpm db:migrate resolve --applied <migration_name>
```
