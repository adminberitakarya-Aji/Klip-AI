# Midtrans Sandbox Setup Guide

## Overview

Midtrans Sandbox digunakan untuk testing payment flow sebelum production deployment.

## Setup Steps

### 1. Daftar Akun Midtrans

1. Buka https://dashboard.midtrans.com/registration
2. Pilih "Sandbox" untuk development
3. Complete registration

### 2. Dapatkan API Keys

1. Login ke https://dashboard.sandbox.midtrans.com
2. Go to **Settings > Access Keys**
3. Copy **Server Key** dan **Client Key**

### 3. Konfigurasi Environment Variables

```env
# .env.local (development)
MIDTRANS_SERVER_KEY=your_sandbox_server_key
MIDTRANS_CLIENT_KEY=your_sandbox_client_key
MIDTRANS_IS_PRODUCTION=false
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Enable Payment Methods (Sandbox)

Di dashboard Midtrans Sandbox:

1. **Go to Settings > Payment Configuration**
2. Enable methods yang mau ditest:
   - Credit Card (test dengan card number: 4811 1111 1111 1114)
   - Virtual Account (BCA, Mandiri, BNI, BRI)
   - E-Wallet (OVO, GoPay, DANA - simulated)
   - QRIS

### 5. Test Card Numbers

| Card Type | Card Number         | CVV | Exp   |
| --------- | ------------------- | --- | ----- |
| Success   | 4811 1111 1111 1114 | 123 | 12/25 |
| Failure   | 4911 1111 1111 1113 | 123 | 12/25 |

## Testing Payment Flow

### Manual Test Steps:

1. **Start API server**: `cd apps/api && pnpm dev`
2. **Start web**: `cd apps/web && pnpm dev`
3. **Login dan browse templates**
4. **Klik "Beli Credits"** untuk Starter/Pro package
5. **Pilih payment method** dan complete payment
6. **Verify credits bertambah** di dashboard

### Test Scenarios:

| Scenario                     | Expected Result              |
| ---------------------------- | ---------------------------- |
| Payment success (settlement) | Credits +100 for Pro package |
| Payment pending (VA unpaid)  | Status = PENDING, no credits |
| Payment expired              | Status = FAILED, no credits  |
| Payment denied               | Status = FAILED, no credits  |
| Invalid signature webhook    | 403 Forbidden response       |

## Verify Webhook Signature

After setup, test signature verification:

```bash
# Test with invalid signature - should return 403
curl -X POST http://localhost:3001/api/credits/webhook \
  -H "Content-Type: application/json" \
  -d '{"order_id": "test", "signature_key": "invalid"}'
```

## Production Checklist

Before going to production:

- [ ] Switch `MIDTRANS_IS_PRODUCTION=true`
- [ ] Use production Server/Client keys
- [ ] Verify callback URLs use HTTPS
- [ ] Test with real cards (small amount first)
- [ ] Enable 3D Secure on credit card
