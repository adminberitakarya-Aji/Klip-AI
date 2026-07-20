-- ============================================
-- Credit System Seed Data for Supabase
-- Run this after migration: Run query in Supabase SQL Editor
-- ============================================

-- Insert Credit Packages (Upsert - safe to run multiple times)
INSERT INTO credit_packages (id, name, slug, credits, price_idr, price_usd, description, features, is_active, is_popular, sort_order, created_at, updated_at)
VALUES
  (
    gen_random_uuid()::text,
    'Starter Pack',
    'starter',
    20,
    50000,
    3.0,
    'Cocok untuk coba-coba. Dapatkan 20 credits untuk mulai membuat video.',
    ARRAY['20 Credits', 'Semua template', 'Support via email']::text[],
    true,
    false,
    1,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'Pro Pack',
    'pro',
    100,
    200000,
    12.0,
    'Paket paling populer untuk kreator konten aktif.',
    ARRAY['100 Credits', 'Semua template', 'Priority support', 'Akses early feature']::text[],
    true,
    true,
    2,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'Business Pack',
    'business',
    500,
    800000,
    48.0,
    'Untuk agency dan bisnis yang butuh volume tinggi.',
    ARRAY['500 Credits', 'Semua template', 'Priority support', 'Volume discount', 'Custom integration']::text[],
    true,
    false,
    3,
    NOW(),
    NOW()
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  credits = EXCLUDED.credits,
  price_idr = EXCLUDED.price_idr,
  price_usd = EXCLUDED.price_usd,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  is_popular = EXCLUDED.is_popular,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Verify
SELECT name, slug, credits, price_idr, is_popular FROM credit_packages ORDER BY sort_order;