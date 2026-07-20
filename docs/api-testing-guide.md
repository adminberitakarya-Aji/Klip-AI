# API Testing Guide

## Prerequisites

1. Start the API server:

```bash
cd apps/api && pnpm dev
```

2. Make sure database is running and seeded with credit packages

## Test Endpoints

### 1. Health Check

```bash
curl http://localhost:3001/api/health
```

### 2. Get Credit Packages (No Auth Required)

```bash
curl http://localhost:3001/api/credits/packages
```

Expected response:

```json
{
  "success": true,
  "packages": [
    {
      "id": "...",
      "name": "Starter",
      "credits": 20,
      "price": { "idr": 50000 }
    },
    { "id": "...", "name": "Pro", "credits": 100, "isPopular": true }
  ]
}
```

### 3. Get Credit Balance (Auth Required)

First, get a valid auth token from the web app login flow, then:

```bash
curl http://localhost:3001/api/credits/balance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Create Payment (Auth Required)

```bash
curl -X POST http://localhost:3001/api/credits/purchase \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"packageSlug": "pro"}'
```

Expected response:

```json
{
  "success": true,
  "orderId": "KLIP_PRO_userxxx_1234567890",
  "snapToken": "mock-snap-token-12345",
  "redirectUrl": "https://app.sandbox.midtrans.com/..."
}
```

### 5. Webhook Test (No Auth, but requires valid signature)

```bash
# Get a real orderId from step 4, then test webhook:
curl -X POST http://localhost:3001/api/credits/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "KLIP_PRO_userxxx_1234567890",
    "status_code": "200",
    "gross_amount": "200000",
    "signature_key": "CALCULATED_SHA512_SIGNATURE"
  }'
```

**Note**: Replace `signature_key` with the correct SHA512 hash:

```
SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
```

### 6. Test Webhook with Invalid Signature (Should Return 403)

```bash
curl -X POST http://localhost:3001/api/credits/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test-order",
    "status_code": "200",
    "gross_amount": "50000",
    "signature_key": "invalid-signature"
  }'
```

Expected: `{"success": false, "error": "Invalid signature"}` with status 403

### 7. Get Transaction History (Auth Required)

```bash
curl http://localhost:3001/api/credits/history?limit=10&offset=0 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 8. Template Generation (Auth Required)

```bash
curl -X POST http://localhost:3001/api/templates/generate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "TEMPLATE_ID_FROM_DB",
    "customizations": {}
  }'
```

### 9. Check Generation Job Status

```bash
curl http://localhost:3001/api/templates/generations/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### "Midtrans not configured"

- Check that `MIDTRANS_SERVER_KEY` is set in .env
- Restart the API server after changing env

### "Unauthorized"

- Check that auth token is valid and not expired
- Token format: `Bearer YOUR_NEXTAUTH_TOKEN`

### Database connection errors

- Check `DATABASE_URL` in .env
- Run migrations: `pnpm --filter @klipai/db db:push`
- Seed credit packages: `cd packages/db && npx tsx prisma/seed-credits.ts`
