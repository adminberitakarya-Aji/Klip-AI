-- ============================================
-- Klip-AI Supabase Manual Seed: Indonesian UMKM Templates
-- Run this in Supabase SQL Editor after running Prisma migrations
-- ============================================

-- First, ensure the tables exist (run Prisma migrations first: pnpm db:push)
-- This seed assumes tables: storyboard_template, template_shot are already created

-- ============================================
-- TEMPLATE 1: Showcase Produk UMKM - 30 Detik
-- ============================================
INSERT INTO "storyboard_template" (
  id, name, slug, description, category, tags, industry, format, style,
  "totalDuration", "aspectRatio", "shotCount", "previewThumbnailUrl", "previewVideoUrl",
  "referenceStyleUrl", "referenceStyleType", "brandKitSlots", "creditsCost",
  "isPublished", "isOfficial", "authorId", "createdAt", "updatedAt", "publishedAt"
) VALUES (
  'template_umkm_produk_showcase_30s',
  'Showcase Produk UMKM - 30 Detik',
  'umkm-produk-showcase-30s',
  'Template showcase produk UMKM klasik 30 detik untuk Instagram Reels/TikTok. Cocok untuk makanan, fashion, skincare, dan aksesoris. Struktur: Hook (3s) → Product Demo (12s) → Benefit (10s) → CTA (5s).',
  'UMKM',
  ARRAY['produk', 'showcase', 'reels', 'tiktok', '30s', 'indonesia'],
  'E-commerce',
  'REELS',
  'Commercial',
  30, '9:16', 5, NULL, NULL, NULL, NULL,
  '{
    "logo": {"positions": ["bottom-right"], "required": true},
    "colors": {"required": true, "minCount": 2, "maxCount": 3},
    "font": {"required": true, "suggestions": ["Inter", "Poppins", "Montserrat"]},
    "jingle": {"required": false},
    "textPlaceholders": [
      {"key": "product_name", "label": "Nama Produk", "required": true, "maxLength": 30},
      {"key": "price", "label": "Harga", "required": false, "defaultValue": "Mulai Rp 49.000"},
      {"key": "promo", "label": "Kode Promo", "required": false},
      {"key": "cta", "label": "Call to Action", "required": true, "defaultValue": "Beli Sekarang"}
    ]
  }'::jsonb,
  5, true, true, NULL, NOW(), NOW(), NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Shots for Template 1
INSERT INTO "template_shot" (
  id, "templateId", index, "timeRange", duration, description, prompt, "negativePrompt",
  camera, lighting, "generationType", resolution, fps, "cameraMotion", "motionStrength",
  seed, "referenceImageUrl", "referenceRole", "referenceWeight", "brandKitOverlays",
  "createdAt", "updatedAt"
) VALUES
-- Shot 0: Hook
(
  'shot_umkm_produk_30s_0', 'template_umkm_produk_showcase_30s', 0, '0-3s', 3,
  'Hook visual - close up produk dengan lighting dramatis',
  'Ultra close-up premium product shot, dramatic rim lighting, shallow depth of field, cinematic color grading, 4k, commercial photography style',
  'blur, low quality, watermark, text, logo, oversaturated, distorted',
  'Macro lens 100mm, f/2.8, ISO 100',
  'Three-point lighting with strong rim light from behind, soft key light from front-left',
  'TEXT_TO_VIDEO', '1080p', 30, 'slow-zoom-in', 0.3, 12345, NULL, NULL, NULL,
  '{"logo": {"position": "bottom-right", "opacity": 0.9, "scale": 1.0}}'::jsonb,
  NOW(), NOW()
),
-- Shot 1: Product Demo
(
  'shot_umkm_produk_30s_1', 'template_umkm_produk_showcase_30s', 1, '3-15s', 12,
  'Product demo - menunjukkan fitur & texture produk',
  'Product demonstration video, smooth rotation showing all angles, texture close-ups, material details visible, professional product videography, clean background',
  'hands, fingers, messy background, clutter, low resolution, shaky camera',
  'Orbit camera 360°, 50mm equivalent, f/4',
  'Softbox key light, fill light, subtle rim light for separation',
  'TEXT_TO_VIDEO', '1080p', 30, 'orbit', 0.4, 12346, NULL, NULL, NULL,
  '{}'::jsonb, NOW(), NOW()
),
-- Shot 2: Benefit Shots
(
  'shot_umkm_produk_30s_2', 'template_umkm_produk_showcase_30s', 2, '15-22s', 7,
  'Benefit shots - lifestyle penggunaan produk',
  'Lifestyle shot of product being used naturally, happy Indonesian user, authentic moment, warm lighting, relatable setting, aspirational but attainable',
  'staged, fake smiles, western models only, luxury mansion, overly polished',
  'Handheld natural movement, 35mm, f/2.0',
  'Natural window light, golden hour ambience',
  'TEXT_TO_VIDEO', '1080p', 30, 'handheld', 0.5, 12347, NULL, NULL, NULL,
  '{"text": {"content": "{benefit_1}", "position": "bottom-center", "fontSize": 48, "color": "#FFFFFF", "fontWeight": "medium", "backgroundColor": "#000000AA", "padding": 12, "borderRadius": 8}}'::jsonb,
  NOW(), NOW()
),
-- Shot 3: Social Proof
(
  'shot_umkm_produk_30s_3', 'template_umkm_produk_showcase_30s', 3, '22-27s', 5,
  'Social proof / testimonial singkat',
  'Quick testimonial style shot, satisfied customer holding product, genuine smile, Indonesian setting, trustworthy authentic vibe',
  'scripted, acting, fake enthusiasm, studio backdrop',
  'Medium shot, 50mm, eye level',
  'Soft natural indoor lighting',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0.1, 12348, NULL, NULL, NULL,
  '{"text": {"content": "⭐⭐⭐⭐⭐ {rating} - {customer_name}", "position": "top-center", "fontSize": 36, "color": "#FFD700", "fontWeight": "bold"}}'::jsonb,
  NOW(), NOW()
),
-- Shot 4: CTA
(
  'shot_umkm_produk_30s_4', 'template_umkm_produk_showcase_30s', 4, '27-30s', 3,
  'CTA kuat dengan promo & brand logo',
  'Clean end card with product packshot, promo code text, CTA button animation, brand logo reveal, professional commercial ending',
  'cluttered, too much text, small font, busy background',
  'Static, centered composition',
  'Clean studio lighting, even illumination',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0, 12349, NULL, NULL, NULL,
  '{"logo": {"position": "center", "opacity": 1.0, "scale": 1.2}, "text": {"content": "{promo}\n{cta}", "position": "bottom-center", "fontSize": 56, "color": "#FFFFFF", "fontWeight": "bold", "backgroundColor": "#E53E3E", "padding": 20, "borderRadius": 12}}'::jsonb,
  NOW(), NOW()
);

-- ============================================
-- TEMPLATE 2: Tutorial/How-to UMKM - 60 Detik
-- ============================================
INSERT INTO "storyboard_template" (
  id, name, slug, description, category, tags, industry, format, style,
  "totalDuration", "aspectRatio", "shotCount", "previewThumbnailUrl", "previewVideoUrl",
  "referenceStyleUrl", "referenceStyleType", "brandKitSlots", "creditsCost",
  "isPublished", "isOfficial", "authorId", "createdAt", "updatedAt", "publishedAt"
) VALUES (
  'template_umkm_tutorial_howto_60s',
  'Tutorial/How-to UMKM - 60 Detik',
  'umkm-tutorial-howto-60s',
  'Template tutorial/how-to 60 detik untuk produk UMKM yang perlu edukasi pengguna. Cocok untuk skincare, masakan, DIY, tech accessories. Struktur: Problem (5s) → Solusi/Produk (10s) → Step-by-step (30s) → Result (10s) → CTA (5s).',
  'UMKM',
  ARRAY['tutorial', 'howto', 'edukasi', 'skincare', 'masak', 'diy', '60s', 'indonesia'],
  'Education/E-commerce',
  'REELS',
  'Educational',
  60, '9:16', 7, NULL, NULL, NULL, NULL,
  '{
    "logo": {"positions": ["top-right", "bottom-right"], "required": true},
    "colors": {"required": true, "minCount": 2, "maxCount": 4},
    "font": {"required": true, "suggestions": ["Inter", "DM Sans", "Plus Jakarta Sans"]},
    "textPlaceholders": [
      {"key": "problem", "label": "Masalah", "required": true, "maxLength": 40},
      {"key": "product_name", "label": "Nama Produk", "required": true, "maxLength": 30},
      {"key": "step_1", "label": "Langkah 1", "required": true, "maxLength": 35},
      {"key": "step_2", "label": "Langkah 2", "required": true, "maxLength": 35},
      {"key": "step_3", "label": "Langkah 3", "required": true, "maxLength": 35},
      {"key": "result", "label": "Hasil", "required": true, "maxLength": 40},
      {"key": "cta", "label": "Call to Action", "required": true, "defaultValue": "Coba Sekarang"}
    ]
  }'::jsonb,
  7, true, true, NULL, NOW(), NOW(), NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Shots for Template 2
INSERT INTO "template_shot" (
  id, "templateId", index, "timeRange", duration, description, prompt, "negativePrompt",
  camera, lighting, "generationType", resolution, fps, "cameraMotion", "motionStrength",
  seed, "referenceImageUrl", "referenceRole", "referenceWeight", "brandKitOverlays",
  "createdAt", "updatedAt"
) VALUES
-- Shot 0: Problem Hook
(
  'shot_umkm_tutorial_60s_0', 'template_umkm_tutorial_howto_60s', 0, '0-5s', 5,
  'Problem hook - relatable pain point',
  'Relatable problem scenario, Indonesian person looking frustrated/confused, authentic expression, cinematic lighting',
  'overacted, fake, too dramatic, western setting',
  'Close-up, 85mm',
  'Dramatic side lighting for mood',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0.1, 20001, NULL, NULL, NULL,
  '{"text": {"content": "{problem}", "position": "center", "fontSize": 48, "color": "#FFFFFF", "backgroundColor": "#E53E3E", "padding": 16, "borderRadius": 12}}'::jsonb,
  NOW(), NOW()
),
-- Shot 1: Product Intro
(
  'shot_umkm_tutorial_60s_1', 'template_umkm_tutorial_howto_60s', 1, '5-15s', 10,
  'Introduksi produk sebagai solusi',
  'Product reveal as solution, clean transition from problem, bright lighting, hopeful mood, product hero shot',
  'dark, gloomy, problem still visible',
  'Medium, 50mm',
  'Bright even lighting, high key',
  'TEXT_TO_VIDEO', '1080p', 30, 'slow-zoom-in', 0.3, 20002, NULL, NULL, NULL,
  '{"logo": {"position": "top-right"}, "text": {"content": "Solusi: {product_name}", "position": "bottom-center", "fontSize": 40, "color": "#2F855A"}}'::jsonb,
  NOW(), NOW()
),
-- Shot 2: Step 1
(
  'shot_umkm_tutorial_60s_2', 'template_umkm_tutorial_howto_60s', 2, '15-25s', 10,
  'Step 1 - demonstrasi jelas',
  'Clear step-by-step demonstration, hands showing action, top-down or 45° angle, instructional style, slow pace',
  'rushed, unclear, blurry, too far',
  'Top-down 45°, 35mm',
  'Bright shadowless lighting',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0.2, 20003, NULL, NULL, NULL,
  '{"text": {"content": "1️⃣ {step_1}", "position": "bottom-center", "fontSize": 36, "color": "#FFFFFF", "backgroundColor": "#2B6CB0", "padding": 12, "borderRadius": 8}}'::jsonb,
  NOW(), NOW()
),
-- Shot 3: Step 2
(
  'shot_umkm_tutorial_60s_3', 'template_umkm_tutorial_howto_60s', 3, '25-35s', 10,
  'Step 2 - detail teknik',
  'Close up technique detail, precise movements, educational focus, clear visibility of method',
  'shaky, out of focus, too fast',
  'Macro close-up, 100mm',
  'Focused task lighting',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0.1, 20004, NULL, NULL, NULL,
  '{"text": {"content": "2️⃣ {step_2}", "position": "bottom-center", "fontSize": 36, "color": "#FFFFFF", "backgroundColor": "#2B6CB0", "padding": 12, "borderRadius": 8}}'::jsonb,
  NOW(), NOW()
),
-- Shot 4: Step 3
(
  'shot_umkm_tutorial_60s_4', 'template_umkm_tutorial_howto_60s', 4, '35-45s', 10,
  'Step 3 - finishing touch',
  'Final step completion, satisfying result reveal, clean finished state, sense of accomplishment',
  'messy, incomplete, confusing',
  'Medium wide, 35mm',
  'Natural bright lighting',
  'TEXT_TO_VIDEO', '1080p', 30, 'slow-pan', 0.2, 20005, NULL, NULL, NULL,
  '{"text": {"content": "3️⃣ {step_3}", "position": "bottom-center", "fontSize": 36, "color": "#FFFFFF", "backgroundColor": "#2B6CB0", "padding": 12, "borderRadius": 8}}'::jsonb,
  NOW(), NOW()
),
-- Shot 5: Result Reveal
(
  'shot_umkm_tutorial_60s_5', 'template_umkm_tutorial_howto_60s', 5, '45-55s', 10,
  'Result reveal - before/after atau hasil akhir',
  'Dramatic result reveal, before/after split or transformation, glowing satisfied user, product in use successfully',
  'subtle, unclear difference, fake',
  'Split screen or transition, 50mm',
  'Bright confident lighting',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0.1, 20006, NULL, NULL, NULL,
  '{"text": {"content": "✨ {result}", "position": "center", "fontSize": 52, "color": "#2F855A", "fontWeight": "bold"}}'::jsonb,
  NOW(), NOW()
),
-- Shot 6: CTA
(
  'shot_umkm_tutorial_60s_6', 'template_umkm_tutorial_howto_60s', 6, '55-60s', 5,
  'CTA dengan brand reinforcement',
  'Clean end frame with product, logo, CTA button, website/social handle, consistent brand colors',
  'cluttered, multiple CTAs, small text',
  'Static centered',
  'Even studio lighting',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0, 20007, NULL, NULL, NULL,
  '{"logo": {"position": "center", "scale": 1.5}, "text": {"content": "{cta}\n{website}", "position": "bottom-center", "fontSize": 42, "color": "#FFFFFF", "backgroundColor": "#1A202C", "padding": 20, "borderRadius": 12}}'::jsonb,
  NOW(), NOW()
);

-- ============================================
-- TEMPLATE 3: Promo Flash Sale UMKM - 15 Detik
-- ============================================
INSERT INTO "storyboard_template" (
  id, name, slug, description, category, tags, industry, format, style,
  "totalDuration", "aspectRatio", "shotCount", "previewThumbnailUrl", "previewVideoUrl",
  "referenceStyleUrl", "referenceStyleType", "brandKitSlots", "creditsCost",
  "isPublished", "isOfficial", "authorId", "createdAt", "updatedAt", "publishedAt"
) VALUES (
  'template_umkm_flash_sale_15s',
  'Promo Flash Sale UMKM - 15 Detik',
  'umkm-flash-sale-15s',
  'Template promo flash sale 15 detik super cepat untuk Story/Reels. Urgensi tinggi, timer countdown, diskon besar. Cocok untuk hari spesial (11.11, 12.12, Hari UMKM, Anniversary).',
  'UMKM',
  ARRAY['flash-sale', 'promo', 'diskon', 'urgency', '15s', 'story', 'reels', 'indonesia'],
  'E-commerce',
  'STORY',
  'Commercial',
  15, '9:16', 4, NULL, NULL, NULL, NULL,
  '{
    "logo": {"positions": ["top-left", "bottom-center"], "required": true},
    "colors": {"required": true, "minCount": 2, "maxCount": 3},
    "textPlaceholders": [
      {"key": "discount", "label": "Diskon %", "required": true, "defaultValue": "50%"},
      {"key": "promo_code", "label": "Kode Promo", "required": true, "defaultValue": "UMKM50"},
      {"key": "deadline", "label": "Batas Waktu", "required": true, "defaultValue": "Hari Ini 23:59"},
      {"key": "cta", "label": "CTA", "required": true, "defaultValue": "Beli Sekarang"}
    ]
  }'::jsonb,
  4, true, true, NULL, NOW(), NOW(), NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Shots for Template 3
INSERT INTO "template_shot" (
  id, "templateId", index, "timeRange", duration, description, prompt, "negativePrompt",
  camera, lighting, "generationType", resolution, fps, "cameraMotion", "motionStrength",
  seed, "referenceImageUrl", "referenceRole", "referenceWeight", "brandKitOverlays",
  "createdAt", "updatedAt"
) VALUES
-- Shot 0: Hook Discount
(
  'shot_umkm_flash_15s_0', 'template_umkm_flash_sale_15s', 0, '0-3s', 3,
  'Hook - big discount number animasi',
  'Huge animated discount number ''50%'' bursting onto screen, energetic particles, Indonesian festival vibe, bold typography',
  'static, boring, small text, dull colors',
  'Static, centered',
  'High contrast, vibrant colors',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0.8, 30001, NULL, NULL, NULL,
  '{"text": {"content": "{discount} OFF!", "position": "center", "fontSize": 96, "color": "#FFFFFF", "fontWeight": "bold", "backgroundColor": "#E53E3E", "padding": 24, "borderRadius": 16}}'::jsonb,
  NOW(), NOW()
),
-- Shot 1: Product Grid
(
  'shot_umkm_flash_15s_1', 'template_umkm_flash_sale_15s', 1, '3-8s', 5,
  'Product grid cepat - 3-4 produk bestseller',
  'Fast-paced product grid montage, 3-4 bestseller products quick cuts, smooth transitions, Indonesian UMKM products variety',
  'slow, boring transitions, single product',
  'Quick cuts, various angles',
  'Bright commercial lighting',
  'TEXT_TO_VIDEO', '1080p', 30, 'fast-cut', 0.9, 30002, NULL, NULL, NULL,
  '{"logo": {"position": "top-left"}}'::jsonb,
  NOW(), NOW()
),
-- Shot 2: Timer + Promo Code
(
  'shot_umkm_flash_15s_2', 'template_umkm_flash_sale_15s', 2, '8-12s', 4,
  'Timer countdown + kode promo',
  'Animated countdown timer ticking down, promo code prominently displayed, urgency visual cues, FOMO atmosphere',
  'calm, no urgency, small timer',
  'Static',
  'High contrast red/black theme',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0.3, 30003, NULL, NULL, NULL,
  '{"text": {"content": "⏰ {deadline}\n🔥 KODE: {promo_code}", "position": "center", "fontSize": 40, "color": "#FFFFFF", "fontWeight": "bold", "backgroundColor": "#C53030", "padding": 16, "borderRadius": 12}}'::jsonb,
  NOW(), NOW()
),
-- Shot 3: Final CTA
(
  'shot_umkm_flash_15s_3', 'template_umkm_flash_sale_15s', 3, '12-15s', 3,
  'CTA final - swipe up/link bio',
  'Strong final CTA, swipe up animation or link in bio pointer, brand logo, urgent but friendly tone',
  'weak CTA, no direction, boring',
  'Static',
  'Brand colors theme',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0.2, 30004, NULL, NULL, NULL,
  '{"logo": {"position": "top-left"}, "text": {"content": "{cta} 👆\nLink di Bio", "position": "bottom-center", "fontSize": 48, "color": "#FFFFFF", "fontWeight": "bold", "backgroundColor": "#2D3748", "padding": 20, "borderRadius": 12}}'::jsonb,
  NOW(), NOW()
);

-- ============================================
-- TEMPLATE 4: Brand Story UMKM - 90 Detik
-- ============================================
INSERT INTO "storyboard_template" (
  id, name, slug, description, category, tags, industry, format, style,
  "totalDuration", "aspectRatio", "shotCount", "previewThumbnailUrl", "previewVideoUrl",
  "referenceStyleUrl", "referenceStyleType", "brandKitSlots", "creditsCost",
  "isPublished", "isOfficial", "authorId", "createdAt", "updatedAt", "publishedAt"
) VALUES (
  'template_umkm_brand_story_90s',
  'Brand Story UMKM - 90 Detik',
  'umkm-brand-story-90s',
  'Template brand story 90 detik untuk membangun koneksi emosional. Cerita pendiri, proses produksi, nilai-nilai brand, komunitas. Cocok untuk About Us page, website hero, investor pitch, atau brand awareness campaign.',
  'UMKM',
  ARRAY['brand-story', 'founder', 'documentary', 'emosional', '90s', 'branding', 'indonesia'],
  'Branding',
  'LANDSCAPE',
  'Documentary',
  90, '16:9', 9, NULL, NULL, NULL, NULL,
  '{
    "logo": {"positions": ["bottom-right", "end-card"], "required": true},
    "colors": {"required": true, "minCount": 3, "maxCount": 5},
    "font": {"required": true, "suggestions": ["Merriweather", "Playfair Display", "Crimson Text", "Lora"]},
    "jingle": {"required": true, "duration": 5},
    "textPlaceholders": [
      {"key": "founder_name", "label": "Nama Pendiri", "required": true},
      {"key": "brand_name", "label": "Nama Brand", "required": true},
      {"key": "year_founded", "label": "Tahun Berdiri", "required": false},
      {"key": "mission", "label": "Misi Brand", "required": true, "maxLength": 80},
      {"key": "tagline", "label": "Tagline", "required": true, "maxLength": 50}
    ]
  }'::jsonb,
  9, true, true, NULL, NOW(), NOW(), NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Shots for Template 4
INSERT INTO "template_shot" (
  id, "templateId", index, "timeRange", duration, description, prompt, "negativePrompt",
  camera, lighting, "generationType", resolution, fps, "cameraMotion", "motionStrength",
  seed, "referenceImageUrl", "referenceRole", "referenceWeight", "brandKitOverlays",
  "createdAt", "updatedAt"
) VALUES
-- Shot 0: Opening Landscape
(
  'shot_umkm_brand_90s_0', 'template_umkm_brand_story_90s', 0, '0-10s', 10,
  'Opening - landscape Indonesia / workshop',
  'Cinematic wide shot of Indonesian landscape or artisanal workshop, golden hour, establishing shot, sense of place and origin',
  'modern city, generic stock footage',
  'Drone wide or 24mm wide',
  'Golden hour natural light',
  'TEXT_TO_VIDEO', '1080p', 24, 'slow-drone-pan', 0.3, 40001, NULL, NULL, NULL,
  '{}'::jsonb, NOW(), NOW()
),
-- Shot 1: Founder Portrait
(
  'shot_umkm_brand_90s_1', 'template_umkm_brand_story_90s', 1, '10-20s', 10,
  'Pendiri - potret & wawancara visual',
  'Portrait of founder working passionately, authentic candid moments, hands crafting, eyes focused, Indonesian entrepreneur pride',
  'posed, stiff, corporate headshot',
  'Medium close-up, 85mm',
  'Natural window light, Rembrandt style',
  'TEXT_TO_VIDEO', '1080p', 24, 'static', 0.1, 40002, NULL, NULL, NULL,
  '{"text": {"content": "{founder_name}\nPendiri {brand_name}", "position": "lower-third", "fontSize": 32, "color": "#FFFFFF", "backgroundColor": "#00000080", "padding": 8, "borderRadius": 4}}'::jsonb,
  NOW(), NOW()
),
-- Shot 2: Flashback/Origin
(
  'shot_umkm_brand_90s_2', 'template_umkm_brand_story_90s', 2, '20-30s', 10,
  'Flashback/awal mula - foto lama style',
  'Vintage film look, old photos coming to life, humble beginnings, small kitchen/garage startup, nostalgic warm tones',
  'modern, crisp, digital look',
  'Vintage 16mm film aesthetic',
  'Warm tungsten, film grain',
  'TEXT_TO_VIDEO', '1080p', 24, 'slow-zoom', 0.2, 40003, NULL, NULL, NULL,
  '{"text": {"content": "Sejak {year_founded}", "position": "center", "fontSize": 48, "color": "#F6E05E", "fontWeight": "light"}}'::jsonb,
  NOW(), NOW()
),
-- Shot 3: Production Process
(
  'shot_umkm_brand_90s_3', 'template_umkm_brand_story_90s', 3, '30-42s', 12,
  'Proses produksi - craftsmanship detail',
  'Detailed craftsmanship process, hands making product, traditional techniques, quality focus, slow motion details, pride in work',
  'industrial, factory, automated',
  'Macro + medium, 50-100mm',
  'Directional craft lighting',
  'TEXT_TO_VIDEO', '1080p', 24, 'slow-dolly', 0.2, 40004, NULL, NULL, NULL,
  '{}'::jsonb, NOW(), NOW()
),
-- Shot 4: Local Ingredients
(
  'shot_umkm_brand_90s_4', 'template_umkm_brand_story_90s', 4, '42-52s', 10,
  'Bahan baku lokal / sourcing',
  'Local ingredients sourcing, Indonesian farmers/suppliers, fresh natural materials, community connection, sustainable',
  'imported, factory, sterile',
  'Documentary handheld',
  'Natural outdoor light',
  'TEXT_TO_VIDEO', '1080p', 24, 'handheld', 0.3, 40005, NULL, NULL, NULL,
  '{"text": {"content": "100% Bahan Lokal Indonesia", "position": "lower-third", "fontSize": 28, "color": "#2F855A", "backgroundColor": "#F0FFF4", "padding": 8, "borderRadius": 4}}'::jsonb,
  NOW(), NOW()
),
-- Shot 5: Team & Community
(
  'shot_umkm_brand_90s_5', 'template_umkm_brand_story_90s', 5, '52-62s', 10,
  'Tim & komunitas - togetherness',
  'Team working together, laughter, collaboration, Indonesian workplace culture, gotong royong spirit, diverse ages',
  'corporate, staged, unhappy',
  'Wide group shot, 35mm',
  'Warm inclusive lighting',
  'TEXT_TO_VIDEO', '1080p', 24, 'slow-pan', 0.2, 40006, NULL, NULL, NULL,
  '{"text": {"content": "Tim yang Penuh Semangat", "position": "lower-third", "fontSize": 28, "color": "#FFFFFF", "backgroundColor": "#00000080", "padding": 8, "borderRadius": 4}}'::jsonb,
  NOW(), NOW()
),
-- Shot 6: Happy Customers
(
  'shot_umkm_brand_90s_6', 'template_umkm_brand_story_90s', 6, '62-75s', 13,
  'Pelanggan senik / testimoni visual',
  'Happy customers using product, genuine smiles, diverse Indonesian faces, lifestyle moments, trust and satisfaction',
  'models, fake, paid actors',
  'Candid lifestyle, 35-50mm',
  'Natural lifestyle lighting',
  'TEXT_TO_VIDEO', '1080p', 24, 'static', 0.1, 40007, NULL, NULL, NULL,
  '{"text": {"content": "{mission}", "position": "center", "fontSize": 36, "color": "#FFFFFF", "fontWeight": "medium", "backgroundColor": "#00000060", "padding": 16, "borderRadius": 8}}'::jsonb,
  NOW(), NOW()
),
-- Shot 7: Future Vision
(
  'shot_umkm_brand_90s_7', 'template_umkm_brand_story_90s', 7, '75-85s', 10,
  'Visi masa depan / scale up',
  'Forward-looking vision, modern facility or expansion, growth trajectory, Indonesian pride, global ambition',
  'small, limited, unambitious',
  'Wide establishing, drone pull back',
  'Bright optimistic morning light',
  'TEXT_TO_VIDEO', '1080p', 24, 'crane-up', 0.4, 40008, NULL, NULL, NULL,
  '{"text": {"content": "Menuju {tagline}", "position": "center", "fontSize": 44, "color": "#FFFFFF", "fontWeight": "bold"}}'::jsonb,
  NOW(), NOW()
),
-- Shot 8: End Card
(
  'shot_umkm_brand_90s_8', 'template_umkm_brand_story_90s', 8, '85-90s', 5,
  'End card - logo, tagline, kontak',
  'Clean brand end card, logo animation, tagline, website, social handles, jingle audio sync',
  'cluttered, too much info',
  'Static',
  'Brand color gradient background',
  'TEXT_TO_VIDEO', '1080p', 24, 'static', 0, 40009, NULL, NULL, NULL,
  '{"logo": {"position": "center", "scale": 2.0}, "text": {"content": "{brand_name}\n{tagline}\n{website} | @{instagram}", "position": "bottom-center", "fontSize": 32, "color": "#FFFFFF"}}'::jsonb,
  NOW(), NOW()
);

-- ============================================
-- TEMPLATE 5: UGC Style Testimoni Pelanggan - 20 Detik
-- ============================================
INSERT INTO "storyboard_template" (
  id, name, slug, description, category, tags, industry, format, style,
  "totalDuration", "aspectRatio", "shotCount", "previewThumbnailUrl", "previewVideoUrl",
  "referenceStyleUrl", "referenceStyleType", "brandKitSlots", "creditsCost",
  "isPublished", "isOfficial", "authorId", "createdAt", "updatedAt", "publishedAt"
) VALUES (
  'template_umkm_ugc_testimoni_20s',
  'UGC Style Testimoni Pelanggan - 20 Detik',
  'umkm-ugc-testimoni-20s',
  'Template UGC (User Generated Content) style testimoni 20 detik. Authentic, raw, relatable - seperti konten asli pelanggan. Cocok untuk social proof, whatsapp marketing, retargeting ads. Format vertikal 9:16.',
  'UMKM',
  ARRAY['ugc', 'testimoni', 'review', 'authentic', '20s', 'reels', 'tiktok', 'social-proof', 'indonesia'],
  'Social Proof',
  'REELS',
  'UGC',
  20, '9:16', 4, NULL, NULL, NULL, NULL,
  '{
    "logo": {"positions": ["bottom-right"], "required": false},
    "colors": {"required": false},
    "textPlaceholders": [
      {"key": "customer_name", "label": "Nama Pelanggan", "required": true, "maxLength": 20},
      {"key": "product_name", "label": "Produk", "required": true, "maxLength": 25},
      {"key": "rating", "label": "Rating (1-5)", "required": true, "defaultValue": "5"},
      {"key": "key_benefit", "label": "Manfaat Utama", "required": true, "maxLength": 30},
      {"key": "cta", "label": "CTA", "required": true, "defaultValue": "Cek Link Bio"}
    ]
  }'::jsonb,
  4, true, true, NULL, NOW(), NOW(), NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Shots for Template 5
INSERT INTO "template_shot" (
  id, "templateId", index, "timeRange", duration, description, prompt, "negativePrompt",
  camera, lighting, "generationType", resolution, fps, "cameraMotion", "motionStrength",
  seed, "referenceImageUrl", "referenceRole", "referenceWeight", "brandKitOverlays",
  "createdAt", "updatedAt"
) VALUES
-- Shot 0: Hook Unboxing
(
  'shot_umkm_ugc_20s_0', 'template_umkm_ugc_testimoni_20s', 0, '0-3s', 3,
  'Hook - unboxing / first reaction',
  'Authentic unboxing moment, genuine surprise/excitement, phone camera POV, raw lighting, Indonesian home setting',
  'professional lighting, staged, perfect',
  'Phone POV, wide selfie angle',
  'Room light, natural',
  'TEXT_TO_VIDEO', '1080p', 30, 'handheld', 0.6, 50001, NULL, NULL, NULL,
  '{"text": {"content": "Pesan {product_name} 📦", "position": "top-center", "fontSize": 36, "color": "#FFFFFF", "backgroundColor": "#00000080", "padding": 8, "borderRadius": 8}}'::jsonb,
  NOW(), NOW()
),
-- Shot 1: Real Usage Closeup
(
  'shot_umkm_ugc_20s_1', 'template_umkm_ugc_testimoni_20s', 1, '3-10s', 7,
  'Penggunaan real - close up texture/detail',
  'Close up product texture/application, real usage, honest demonstration, imperfections welcome, relatable',
  'perfect, sterile, commercial',
  'Phone close-up, shaky',
  'Available light',
  'TEXT_TO_VIDEO', '1080p', 30, 'handheld', 0.5, 50002, NULL, NULL, NULL,
  '{"text": {"content": "⭐⭐⭐⭐⭐ {rating}/5", "position": "top-right", "fontSize": 28, "color": "#FFD700"}}'::jsonb,
  NOW(), NOW()
),
-- Shot 2: Honest Testimonial
(
  'shot_umkm_ugc_20s_2', 'template_umkm_ugc_testimoni_20s', 2, '10-17s', 7,
  'Testimoni jujur - talking to camera',
  'Person talking to camera naturally, Indonesian colloquial, genuine review, not scripted feeling, subtle gestures',
  'scripted, teleprompter, robotic',
  'Selfie mode, eye level',
  'Ring light or window',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0.1, 50003, NULL, NULL, NULL,
  '{"text": {"content": "\"{key_benefit}\"", "position": "bottom-center", "fontSize": 32, "color": "#FFFFFF", "backgroundColor": "#1A202CCC", "padding": 12, "borderRadius": 12}}'::jsonb,
  NOW(), NOW()
),
-- Shot 3: Casual CTA
(
  'shot_umkm_ugc_20s_3', 'template_umkm_ugc_testimoni_20s', 3, '17-20s', 3,
  'CTA casual - link bio / kode',
  'Casual sign off, pointing to caption/bio, friendly wave, authentic ending',
  'professional sign-off, salesy',
  'Selfie, pulled back',
  'Same as before',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0.1, 50004, NULL, NULL, NULL,
  '{"text": {"content": "{customer_name} | {cta} 👇", "position": "bottom-center", "fontSize": 30, "color": "#FFFFFF", "backgroundColor": "#2D3748", "padding": 10, "borderRadius": 8}}'::jsonb,
  NOW(), NOW()
);

-- ============================================
-- TEMPLATE 6: Hero Skincare 15s
-- ============================================
INSERT INTO "storyboard_template" (
  id, name, slug, description, category, tags, industry, format, style,
  "totalDuration", "aspectRatio", "shotCount", "previewThumbnailUrl", "previewVideoUrl",
  "referenceStyleUrl", "referenceStyleType", "brandKitSlots", "creditsCost",
  "isPublished", "isOfficial", "authorId", "createdAt", "updatedAt", "publishedAt"
) VALUES (
  'template_hero_skincare_15s',
  'Hero Skincare 15s',
  'hero-skincare-15s',
  'Template hero skincare 15 detik cinematic untuk Reels. Focus pada ingredient hero, texture close-up, glow result. Cocok untuk serum, moisturizer, sunscreen. Struktur: Hook ingredient (3s) → Texture demo (5s) → Application (4s) → Glow reveal (3s).',
  'Product Showcase',
  ARRAY['skincare', 'hero', 'ingredient', 'glow', '15s', 'reels', 'cinematic'],
  'Skincare',
  'REELS',
  'Cinematic',
  15, '9:16', 5, NULL, NULL, NULL, NULL,
  '{
    "logo": {"positions": ["bottom-right"], "required": true},
    "colors": {"required": true, "minCount": 2, "maxCount": 3},
    "font": {"required": true, "suggestions": ["Inter", "DM Sans", "Plus Jakarta Sans"]},
    "textPlaceholders": [
      {"key": "hero_ingredient", "label": "Bahan Hero", "required": true, "maxLength": 25},
      {"key": "product_name", "label": "Nama Produk", "required": true, "maxLength": 30},
      {"key": "benefit", "label": "Manfaat Utama", "required": true, "maxLength": 35},
      {"key": "cta", "label": "Call to Action", "required": true, "defaultValue": "Dapatkan Sekarang"}
    ]
  }'::jsonb,
  5, true, true, NULL, NOW(), NOW(), NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Shots for Template 6: Hero Skincare 15s
INSERT INTO "template_shot" (
  id, "templateId", index, "timeRange", duration, description, prompt, "negativePrompt",
  camera, lighting, "generationType", resolution, fps, "cameraMotion", "motionStrength",
  seed, "referenceImageUrl", "referenceRole", "referenceWeight", "brandKitOverlays",
  "createdAt", "updatedAt"
) VALUES
(
  'shot_hero_skincare_15s_0', 'template_hero_skincare_15s', 0, '0-3s', 3,
  'Hero ingredient reveal - macro shot bahan aktif',
  'Ultra macro cinematic shot of hero skincare ingredient (hyaluronic acid/niacinamide/vitamin C droplets), crystalline structure, prismatic light refraction, scientific beauty, 8k detail, ethereal glow',
  'blur, text, logo, watermark, oversaturated, artificial, plastic look',
  'Macro lens 100mm, f/2.8, extreme close-up',
  'Dark field microscopy lighting, prismatic rim light, bioluminescent glow',
  'TEXT_TO_VIDEO', '1080p', 30, 'slow-zoom-in', 0.2, 60001, NULL, NULL, NULL,
  '{"text": {"content": "{hero_ingredient}", "position": "center", "fontSize": 42, "color": "#FFFFFF", "fontWeight": "light", "backgroundColor": "#00000060", "padding": 12, "borderRadius": 8}}'::jsonb,
  NOW(), NOW()
),
(
  'shot_hero_skincare_15s_1', 'template_hero_skincare_15s', 1, '3-6s', 3,
  'Texture close-up - serum/cream consistency',
  'Luxurious skincare texture visualization, silky serum dripping, cream emulsification, light catching viscosity, slow motion fluid dynamics, premium cosmetic cinematography',
  'watery, runny, cheap, sticky, messy, bubbles, foam',
  'Macro 100mm, high speed 120fps ramped to 30fps',
  'Soft gradient key light, specular highlights on fluid surface',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0.3, 60002, NULL, NULL, NULL,
  '{}'::jsonb, NOW(), NOW()
),
(
  'shot_hero_skincare_15s_2', 'template_hero_skincare_15s', 2, '6-10s', 4,
  'Application demo - gentle massage pada wajah',
  'Elegant skincare application, fingertips gently pressing serum into skin, Indonesian woman 25-30yo, dewy healthy skin, slow mindful movements, spa-like atmosphere, ASMR quality',
  'rubbing, pulling, aggressive, red skin, irritation, fast motion',
  'Medium close-up 85mm, slight angle',
  'Soft ring light, natural window fill, dewy skin enhancement',
  'TEXT_TO_VIDEO', '1080p', 30, 'slow-pan', 0.15, 60003, NULL, NULL, NULL,
  '{"text": {"content": "Apply 2-3 drops", "position": "bottom-center", "fontSize": 32, "color": "#FFFFFF", "backgroundColor": "#00000080", "padding": 10, "borderRadius": 8}}'::jsonb,
  NOW(), NOW()
),
(
  'shot_hero_skincare_15s_3', 'template_hero_skincare_15s', 3, '10-13s', 3,
  'Glow reveal - kulit bersinar sehat',
  'Radiant skin reveal, lit-from-within glow, healthy skin barrier, pore refinement visible, natural Indonesian beauty, confident smile, golden hour lighting',
  'oily, shiny, filtered, plastic, poreless uncanny, heavy makeup',
  'Beauty close-up 85mm, eye level',
  'Golden hour backlight, soft frontal fill, luminous skin rendering',
  'TEXT_TO_VIDEO', '1080p', 30, 'slow-zoom-out', 0.2, 60004, NULL, NULL, NULL,
  '{"text": {"content": "✨ {benefit}", "position": "bottom-center", "fontSize": 36, "color": "#FFD700", "fontWeight": "medium", "backgroundColor": "#00000060", "padding": 10, "borderRadius": 8}}'::jsonb,
  NOW(), NOW()
),
(
  'shot_hero_skincare_15s_4', 'template_hero_skincare_15s', 4, '13-15s', 2,
  'Product packshot + CTA',
  'Clean product hero shot, {product_name} bottle on marble, soft shadow, brand logo, minimal elegant composition, premium skincare packaging photography',
  'clutter, props, text overlay, busy background, cheap packaging',
  'Static, 50mm, centered',
  'Clean studio, soft gradient background',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0, 60005, NULL, NULL, NULL,
  '{"logo": {"position": "top-right", "opacity": 0.9, "scale": 1.0}, "text": {"content": "{product_name}\n{cta}", "position": "bottom-center", "fontSize": 36, "color": "#FFFFFF", "fontWeight": "medium", "backgroundColor": "#1A202C", "padding": 14, "borderRadius": 10}}'::jsonb,
  NOW(), NOW()
);

-- ============================================
-- TEMPLATE 7: Flash Sale TikTok 10s
-- ============================================
INSERT INTO "storyboard_template" (
  id, name, slug, description, category, tags, industry, format, style,
  "totalDuration", "aspectRatio", "shotCount", "previewThumbnailUrl", "previewVideoUrl",
  "referenceStyleUrl", "referenceStyleType", "brandKitSlots", "creditsCost",
  "isPublished", "isOfficial", "authorId", "createdAt", "updatedAt", "publishedAt"
) VALUES (
  'template_flash_sale_tiktok_10s',
  'Flash Sale TikTok 10s',
  'flash-sale-tiktok-10s',
  'Template flash sale TikTok 10 detik viral, high energy. Urgensi ekstrem, jump cuts cepat, musik trending. Cocok untuk F&B & Fashion. Struktur: Hook diskon (2s) → Product flash (4s) → Timer + Code (2s) → CTA (2s).',
  'Social Commerce',
  ARRAY['flash-sale', 'tiktok', 'viral', 'urgency', '10s', 'fashion', 'fnb', 'ugc'],
  'F&B/Fashion',
  'TIKTOK',
  'UGC/Viral',
  10, '9:16', 4, NULL, NULL, NULL, NULL,
  '{
    "logo": {"positions": ["top-left"], "required": false},
    "colors": {"required": true, "minCount": 2, "maxCount": 3},
    "textPlaceholders": [
      {"key": "discount", "label": "Diskon %", "required": true, "defaultValue": "70%"},
      {"key": "promo_code", "label": "Kode Promo", "required": true, "defaultValue": "VIRAL70"},
      {"key": "deadline", "label": "Batas Waktu", "required": true, "defaultValue": "2 Jam Lagi"},
      {"key": "cta", "label": "CTA", "required": true, "defaultValue": "Beli Sekarang!"}
    ]
  }'::jsonb,
  3, true, true, NULL, NOW(), NOW(), NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Shots for Template 7: Flash Sale TikTok 10s
INSERT INTO "template_shot" (
  id, "templateId", index, "timeRange", duration, description, prompt, "negativePrompt",
  camera, lighting, "generationType", resolution, fps, "cameraMotion", "motionStrength",
  seed, "referenceImageUrl", "referenceRole", "referenceWeight", "brandKitOverlays",
  "createdAt", "updatedAt"
) VALUES
(
  'shot_flash_sale_tiktok_10s_0', 'template_flash_sale_tiktok_10s', 0, '0-2s', 2,
  'Hook - big discount number pop-in dengan SFX',
  'TikTok style discount explosion, giant ''70%'' bouncing onto screen, glitch effects, particle burst, trending sound sync, phone screen recording aesthetic, high energy Gen Z vibe',
  'static, boring, corporate, slow, professional, polished',
  'Phone selfie mode, chaotic energy',
  'Ring light, saturated colors, TikTok filter look',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 1.0, 70001, NULL, NULL, NULL,
  '{"text": {"content": "{discount} OFF!! 🔥", "position": "center", "fontSize": 80, "color": "#FF006E", "fontWeight": "bold", "backgroundColor": "#000000", "padding": 20, "borderRadius": 20}}'::jsonb,
  NOW(), NOW()
),
(
  'shot_flash_sale_tiktok_10s_1', 'template_flash_sale_tiktok_10s', 1, '2-6s', 4,
  'Product flash - quick cuts 3-4 produk',
  'Rapid fire product montage, 0.5s per product, jump cuts, trending transition effects (zoom, whip, glitch), mixed F&B and fashion items, UGC style phone footage, chaotic good energy',
  'slow, smooth, cinematic, professional lighting, staged',
  'Phone camera, quick whip pans, snap zooms',
  'Mixed - room light, flash, natural, chaotic',
  'TEXT_TO_VIDEO', '1080p', 30, 'fast-cut', 0.95, 70002, NULL, NULL, NULL,
  '{}'::jsonb, NOW(), NOW()
),
(
  'shot_flash_sale_tiktok_10s_2', 'template_flash_sale_tiktok_10s', 2, '6-8s', 2,
  'Timer countdown + kode promo flashing',
  'Urgent countdown timer 02:00:00 → 00:00:00, promo code flashing neon, screen shake effect, FOMO max level, TikTok red alert aesthetic',
  'calm, slow timer, subtle, elegant, minimal',
  'Static phone screen',
  'High contrast red/black, strobe effect',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0.5, 70003, NULL, NULL, NULL,
  '{"text": {"content": "⏰ {deadline}\n💥 CODE: {promo_code}", "position": "center", "fontSize": 36, "color": "#FFFFFF", "fontWeight": "bold", "backgroundColor": "#FF006E", "padding": 16, "borderRadius": 12}}'::jsonb,
  NOW(), NOW()
),
(
  'shot_flash_sale_tiktok_10s_3', 'template_flash_sale_tiktok_10s', 3, '8-10s', 2,
  'CTA - point ke link bio/shop',
  'Creator pointing down to caption/bio, excited scream expression, ''Link di bio!'' text animation, shop now button pop, chaotic genuine energy, duck face optional',
  'polished, professional, calm, scripted, corporate',
  'Selfie mode, close up, expressive',
  'Ring light, saturated',
  'TEXT_TO_VIDEO', '1080p', 30, 'static', 0.3, 70004, NULL, NULL, NULL,
  '{"text": {"content": "{cta} 👇\nLink di Bio!", "position": "bottom-center", "fontSize": 42, "color": "#FFFFFF", "fontWeight": "bold", "backgroundColor": "#000000", "padding": 16, "borderRadius": 16}}'::jsonb,
  NOW(), NOW()
);

-- ============================================
-- TEMPLATE 8: Founder Story 30s
-- ============================================
INSERT INTO "storyboard_template" (
  id, name, slug, description, category, tags, industry, format, style,
  "totalDuration", "aspectRatio", "shotCount", "previewThumbnailUrl", "previewVideoUrl",
  "referenceStyleUrl", "referenceStyleType", "brandKitSlots", "creditsCost",
  "isPublished", "isOfficial", "authorId", "createdAt", "updatedAt", "publishedAt"
) VALUES (
  'template_founder_story_30s',
  'Founder Story 30s',
  'founder-story-30s',
  'Template founder story 30 detik documentary style untuk Reels. Cerita pendiri singkat tapi impactful: motivation → struggle → breakthrough → vision. Cocok untuk semua industry. Struktur: Why (5s) → Struggle (8s) → Breakthrough (10s) → Vision (7s).',
  'Brand Story',
  ARRAY['founder', 'story', 'documentary', 'inspiration', '30s', 'reels', 'branding'],
  'All',
  'REELS',
  'Documentary',
  30, '9:16', 7, NULL, NULL, NULL, NULL,
  '{
    "logo": {"positions": ["bottom-right"], "required": true},
    "colors": {"required": true, "minCount": 2, "maxCount": 4},
    "font": {"required": true, "suggestions": ["Merriweather", "Playfair Display", "Lora", "Crimson Text"]},
    "textPlaceholders": [
      {"key": "founder_name", "label": "Nama Pendiri", "required": true, "maxLength": 25},
      {"key": "brand_name", "label": "Nama Brand", "required": true, "maxLength": 30},
      {"key": "why", "label": "Mengapa Memulai", "required": true, "maxLength": 50},
      {"key": "struggle", "label": "Tantangan Terbesar", "required": true, "maxLength": 50},
      {"key": "vision", "label": "Visi", "required": true, "maxLength": 50},
      {"key": "cta", "label": "Call to Action", "required": true, "defaultValue": "Kenal Lebih Dekat"}
    ]
  }'::jsonb,
  5, true, true, NULL, NOW(), NOW(), NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Shots for Template 8: Founder Story 30s
INSERT INTO "template_shot" (
  id, "templateId", index, "timeRange", duration, description, prompt, "negativePrompt",
  camera, lighting, "generationType", resolution, fps, "cameraMotion", "motionStrength",
  seed, "referenceImageUrl", "referenceRole", "referenceWeight", "brandKitOverlays",
  "createdAt", "updatedAt"
) VALUES
(
  'shot_founder_story_30s_0', 'template_founder_story_30s', 0, '0-5s', 5,
  'Why - motivasi memulai (wawancara sit-down)',
  'Intimate documentary interview, founder sitting in workspace, warm lighting, direct to camera, authentic Indonesian founder, thoughtful expression, shallow depth of field, cinematic 16:9 crop to 9:16',
  'scripted, teleprompter, stiff, corporate, fake, studio',
  '85mm, eye level, interview style',
  'Natural window light, Rembrandt, practical lamps visible',
  'TEXT_TO_VIDEO', '1080p', 24, 'static', 0.05, 80001, NULL, NULL, NULL,
  '{"text": {"content": "\"{why}\"", "position": "bottom-center", "fontSize": 32, "color": "#FFFFFF", "fontWeight": "light", "fontStyle": "italic", "backgroundColor": "#00000080", "padding": 14, "borderRadius": 8}}'::jsonb,
  NOW(), NOW()
),
(
  'shot_founder_story_30s_1', 'template_founder_story_30s', 1, '5-10s', 5,
  'Struggle 1 - malam tanpa tidur / workspace sunyi',
  'Late night founder grind, laptop glow on face, messy desk, coffee cups, tired but determined, Indonesian startup reality, solo founder journey, moody cinematic',
  'glamorous, team, party, success, easy, luxury office',
  'Wide 24mm, low angle, silhouetted',
  'Single monitor light, cool blue, practical',
  'TEXT_TO_VIDEO', '1080p', 24, 'slow-dolly', 0.1, 80002, NULL, NULL, NULL,
  '{"text": {"content": "Struggle: {struggle}", "position": "top-center", "fontSize": 28, "color": "#F6E05E", "backgroundColor": "#00000080", "padding": 8, "borderRadius": 6}}'::jsonb,
  NOW(), NOW()
),
(
  'shot_founder_story_30s_2', 'template_founder_story_30s', 2, '10-13s', 3,
  'Struggle 2 - rejection / gagal prototypes',
  'Montage of failed prototypes, rejection emails on screen, crumpled papers, founder frustrated but not giving up, raw authentic struggle, Indonesian resilience',
  'dramatic acting, crying, giving up, melodramatic',
  'Quick cuts, handheld, close-ups',
  'Harsh fluorescent, realistic',
  'TEXT_TO_VIDEO', '1080p', 24, 'handheld', 0.4, 80003, NULL, NULL, NULL,
  '{}'::jsonb, NOW(), NOW()
),
(
  'shot_founder_story_30s_3', 'template_founder_story_30s', 3, '13-18s', 5,
  'Breakthrough moment - first win / product launch',
  'Breakthrough moment, first order notification, product in hand, genuine joy, team high-five (small team), Indonesian startup success, warm golden light, emotional payoff',
  'fake celebration, champagne, huge office, investors, corporate',
  'Medium, handheld, candid',
  'Warm golden hour, natural',
  'TEXT_TO_VIDEO', '1080p', 24, 'static', 0.1, 80004, NULL, NULL, NULL,
  '{"text": {"content": "First breakthrough ✨", "position": "bottom-center", "fontSize": 32, "color": "#2F855A", "fontWeight": "bold", "backgroundColor": "#F0FFF4", "padding": 10, "borderRadius": 8}}'::jsonb,
  NOW(), NOW()
),
(
  'shot_founder_story_30s_4', 'template_founder_story_30s', 4, '18-23s', 5,
  'Product/brand dalam action - real operations',
  'Real operations, packing orders, team working, happy customers, {brand_name} products in use, Indonesian SME pride, authentic workplace, gotong royong',
  'staged, models, corporate, sterile, automated factory',
  'Documentary 35mm, observational',
  'Natural workspace lighting',
  'TEXT_TO_VIDEO', '1080p', 24, 'slow-pan', 0.15, 80005, NULL, NULL, NULL,
  '{"logo": {"position": "bottom-right", "opacity": 0.8, "scale": 0.8}}'::jsonb,
  NOW(), NOW()
),
(
  'shot_founder_story_30s_5', 'template_founder_story_30s', 5, '23-27s', 4,
  'Vision - masa depan yang dibangun',
  'Founder looking out window/horizon, visionary gaze, modern Jakarta skyline or workshop expansion, hopeful ambitious, Indonesian dream, next chapter',
  'daydreaming, vague, small thinking, limited',
  'Wide, back view, silhouette or profile',
  'Morning light, optimistic, expansive',
  'TEXT_TO_VIDEO', '1080p', 24, 'slow-zoom-out', 0.1, 80006, NULL, NULL, NULL,
  '{"text": {"content": "\"{vision}\"", "position": "center", "fontSize": 30, "color": "#FFFFFF", "fontWeight": "medium", "fontStyle": "italic", "backgroundColor": "#00000060", "padding": 14, "borderRadius": 8}}'::jsonb,
  NOW(), NOW()
),
(
  'shot_founder_story_30s_6', 'template_founder_story_30s', 6, '27-30s', 3,
  'End card - brand + CTA',
  'Clean brand end card, {brand_name} logo animation, tagline, website, Instagram handle, documentary film aesthetic, subtle film grain',
  'salesy, cluttered, multiple CTAs, bright commercial',
  'Static, centered',
  'Dark gradient, minimal',
  'TEXT_TO_VIDEO', '1080p', 24, 'static', 0, 80007, NULL, NULL, NULL,
  '{"logo": {"position": "center", "opacity": 1.0, "scale": 1.5}, "text": {"content": "{brand_name}\n{cta}", "position": "bottom-center", "fontSize": 36, "color": "#FFFFFF", "fontWeight": "medium", "backgroundColor": "#1A202C", "padding": 16, "borderRadius": 10}}'::jsonb,
  NOW(), NOW()
);

-- ============================================
-- TEMPLATE 9: Ramadhan Promo 15s
-- ============================================
INSERT INTO "storyboard_template" (
  id, name, slug, description, category, tags, industry, format, style,
  "totalDuration", "aspectRatio", "shotCount", "previewThumbnailUrl", "previewVideoUrl",
  "referenceStyleUrl", "referenceStyleType", "brandKitSlots", "creditsCost",
  "isPublished", "isOfficial", "authorId", "createdAt", "updatedAt", "publishedAt"
) VALUES (
  'template_ramadhan_promo_15s',
  'Ramadhan Promo 15s',
  'ramadhan-promo-15s',
  'Template promo Ramadhan 15 detik warm cinematic untuk Story. Nuansa spiritual, berkah, family gathering. Cocok untuk F&B & Retail. Struktur: Opening spiritual (3s) → Product iftar (5s) → Family moment (4s) → Promo berkah (3s).',
  'Seasonal',
  ARRAY['ramadhan', 'promo', 'iftar', 'berkah', 'family', '15s', 'story', 'seasonal'],
  'F&B/Retail',
  'STORY',
  'Warm/Cinematic',
  15, '9:16', 5, NULL, NULL, NULL, NULL,
  '{
    "logo": {"positions": ["top-center", "bottom-right"], "required": true},
    "colors": {"required": true, "minCount": 2, "maxCount": 4},
    "font": {"required": true, "suggestions": ["Amiri", "Scheherazade", "Noto Nastaliq", "Poppins"]},
    "textPlaceholders": [
      {"key": "promo_name", "label":