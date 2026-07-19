import { z } from "zod";

// ============================================
// TEMPLATE ZOD SCHEMAS
// ============================================

// Brand Kit Overlay per shot
export const brandKitOverlaySchema = z.object({
  logo: z
    .object({
      position: z
        .enum([
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
          "center",
        ])
        .optional(),
      opacity: z.number().min(0).max(1).optional(),
      scale: z.number().min(0.1).max(2).optional(),
    })
    .optional(),
  text: z
    .object({
      content: z.string().optional(), // Template string: "Rp {price}", "{tagline}"
      position: z
        .enum([
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
          "center",
          "top-center",
          "bottom-center",
        ])
        .optional(),
      fontSize: z.number().min(8).max(200).optional(),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      fontWeight: z.enum(["normal", "bold", "light", "medium"]).optional(),
      backgroundColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      padding: z.number().min(0).max(50).optional(),
      borderRadius: z.number().min(0).max(50).optional(),
    })
    .optional(),
  colorFilter: z
    .object({
      enabled: z.boolean().optional(),
      intensity: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

// Template Shot Schema
export const templateShotSchema = z.object({
  index: z.number().int().min(0).max(9),
  timeRange: z.string().regex(/^\d+-\d+s$/), // "0-3s", "3-6s"
  duration: z.number().int().min(1).max(15),
  description: z.string().min(1).max(200),
  prompt: z.string().min(10).max(2000),
  negativePrompt: z.string().max(1000).optional(),
  camera: z.string().min(1).max(200),
  lighting: z.string().min(1).max(200),

  generationType: z.enum([
    "TEXT_TO_VIDEO",
    "IMAGE_TO_VIDEO",
    "VIDEO_TO_VIDEO",
    "TEXT_TO_IMAGE",
    "IMAGE_TO_IMAGE",
    "MOTION_CONTROL",
  ]),
  resolution: z.enum(["720p", "1080p", "4k"]),
  fps: z.union([z.literal(24), z.literal(30)]),
  cameraMotion: z.enum([
    "static",
    "pan",
    "zoom",
    "orbit",
    "handheld",
    "dolly",
    "crane",
  ]),
  motionStrength: z.number().min(0.1).max(1.0).optional(),
  seed: z.number().int().optional(),

  referenceImageUrl: z.string().url().optional(),
  referenceRole: z
    .enum(["character", "subject", "style", "structure", "face", "pose"])
    .optional(),
  referenceWeight: z.number().min(0.1).max(1.0).optional(),

  brandKitOverlays: brandKitOverlaySchema.optional(),
});

export type TemplateShot = z.infer<typeof templateShotSchema>;

// Brand Kit Slots (template-level placeholders)
export const brandKitSlotsSchema = z.object({
  logo: z
    .object({
      positions: z
        .array(
          z.enum([
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "center",
          ]),
        )
        .optional(),
      required: z.boolean().optional(),
    })
    .optional(),
  colors: z
    .object({
      required: z.boolean().optional(),
      minCount: z.number().int().min(1).max(5).optional(),
      maxCount: z.number().int().min(1).max(5).optional(),
    })
    .optional(),
  font: z
    .object({
      required: z.boolean().optional(),
      suggestions: z.array(z.string()).optional(),
    })
    .optional(),
  jingle: z
    .object({
      required: z.boolean().optional(),
      duration: z.number().int().min(1).max(10).optional(),
    })
    .optional(),
  textPlaceholders: z
    .array(
      z.object({
        key: z.string(), // "price", "tagline", "cta", "product_name"
        label: z.string(),
        required: z.boolean(),
        defaultValue: z.string().optional(),
        maxLength: z.number().int().optional(),
      }),
    )
    .optional(),
});

export type BrandKitSlots = z.infer<typeof brandKitSlotsSchema>;

// Shot Preview (generated at publish time)
export const shotPreviewSchema = z.object({
  shotIndex: z.number().int().min(0).max(9),
  url: z.string().url(),
  duration: z.number().int(),
  generatedAt: z.number().int(), // timestamp
});

export type ShotPreview = z.infer<typeof shotPreviewSchema>;

// Create Template Input
export const createTemplateSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().min(20).max(2000),
  category: z.string().min(1).max(50),
  tags: z.array(z.string().min(1).max(30)).min(1).max(10),
  industry: z.string().max(50).optional(),
  format: z.enum(["REELS", "TIKTOK", "STORY", "SHORTS", "FEED", "LANDSCAPE"]),
  style: z.enum([
    "Cinematic",
    "UGC",
    "Commercial",
    "Educational",
    "Documentary",
    "Vlog",
    "Music Video",
    "Minimalist",
  ]),

  totalDuration: z.number().int().min(5).max(60),
  aspectRatio: z.enum([
    "9:16",
    "16:9",
    "1:1",
    "4:3",
    "3:4",
    "4:5",
    "2:3",
    "21:9",
  ]),
  shotCount: z.number().int().min(3).max(10),

  referenceStyleUrl: z.string().url().optional(),
  referenceStyleType: z.enum(["image", "video"]).optional(),

  brandKitSlots: brandKitSlotsSchema.optional(),
  creditsCost: z.number().int().min(1).max(50).default(5),

  shots: z.array(templateShotSchema).min(3).max(10),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

// Update Template Input (partial)
export const updateTemplateSchema = createTemplateSchema.partial().extend({
  version: z.number().int().min(1).optional(),
  isPublished: z.boolean().optional(),
  isOfficial: z.boolean().optional(),
});

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

// Template Query Filters
export const templateQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.string().optional(),
  format: z.string().optional(),
  style: z.string().optional(),
  industry: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  search: z.string().optional(),
  sortBy: z
    .enum(["newest", "oldest", "popular", "rating", "duration"])
    .default("newest"),
  isOfficial: z.coerce.boolean().optional(),
});

export type TemplateQuery = z.infer<typeof templateQuerySchema>;

// Template Generate Input (user customizations)
export const templateGenerateSchema = z.object({
  templateId: z.string().cuid(),
  brandKitId: z.string().cuid().optional(),
  customizations: z
    .object({
      shotOverrides: z
        .record(
          z.string(), // shot index as string
          z.object({
            prompt: z.string().max(2000).optional(),
            negativePrompt: z.string().max(1000).optional(),
            camera: z.string().max(200).optional(),
            lighting: z.string().max(200).optional(),
            referenceImageUrl: z.string().url().optional(),
            brandKitOverlays: brandKitOverlaySchema.optional(),
          }),
        )
        .optional(),
      referenceStyleUrl: z.string().url().optional(),
      brandKitOverrides: z
        .object({
          logoUrl: z.string().url().optional(),
          logoPosition: z
            .enum([
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
              "center",
            ])
            .optional(),
          logoOpacity: z.number().min(0).max(1).optional(),
          colorPalette: z
            .array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
            .optional(),
          primaryFont: z.string().optional(),
          secondaryFont: z.string().optional(),
          jingleUrl: z.string().url().optional(),
          textValues: z.record(z.string()).optional(), // {price: "Rp 99.000", tagline: "Glowing Skin"}
        })
        .optional(),
    })
    .optional(),
});

export type TemplateGenerateInput = z.infer<typeof templateGenerateSchema>;

// Template Generation Job Status Response
export const templateJobStatusSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  templateId: z.string().cuid(),
  brandKitId: z.string().cuid().nullable(),
  status: z.enum([
    "QUEUED",
    "PREPARING",
    "GENERATING_SHOTS",
    "STITCHING",
    "COMPLETED",
    "FAILED",
    "PARTIAL_SUCCESS",
  ]),
  progress: z.number().int().min(0).max(100),
  currentShot: z.number().int().min(0),
  totalShots: z.number().int().min(1),
  customizations: z.unknown().nullable(),
  shotResults: z
    .array(
      z.object({
        shotIndex: z.number().int(),
        generationId: z.string().cuid().optional(),
        status: z.enum([
          "PENDING",
          "QUEUED",
          "PROCESSING",
          "COMPLETED",
          "FAILED",
        ]),
        url: z.string().url().optional(),
        error: z.string().optional(),
        startedAt: z.number().int().optional(),
        completedAt: z.number().int().optional(),
      }),
    )
    .optional(),
  stitchedVideoUrl: z.string().url().nullable().optional(),
  error: z.string().nullable().optional(),
  creditsUsed: z.number().int(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  completedAt: z.number().int().nullable().optional(),
});

export type TemplateJobStatus = z.infer<typeof templateJobStatusSchema>;

// Template Response (with shots)
export const templateResponseSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  industry: z.string().nullable(),
  format: z.string(),
  style: z.string(),
  totalDuration: z.number().int(),
  aspectRatio: z.string(),
  shotCount: z.number().int(),
  referenceStyleUrl: z.string().nullable(),
  referenceStyleType: z.string().nullable(),
  brandKitSlots: z.unknown().nullable(),
  version: z.number().int(),
  isPublished: z.boolean(),
  isOfficial: z.boolean(),
  authorId: z.string().nullable(),
  previewThumbnailUrl: z.string().nullable(),
  previewVideoUrl: z.string().nullable(),
  shotPreviews: z.unknown().nullable(),
  creditsCost: z.number().int(),
  usageCount: z.number().int(),
  rating: z.number().nullable(),
  reviewCount: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
  publishedAt: z.date().nullable(),
  shots: z.array(
    templateShotSchema.extend({
      previewUrl: z.string().nullable().optional(),
      previewGeneratedAt: z.date().nullable().optional(),
    }),
  ),
});

export type TemplateResponse = z.infer<typeof templateResponseSchema>;

// Template List Item (lightweight for grid)
export const templateListItemSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  industry: z.string().nullable(),
  format: z.string(),
  style: z.string(),
  totalDuration: z.number().int(),
  aspectRatio: z.string(),
  shotCount: z.number().int(),
  previewThumbnailUrl: z.string().nullable(),
  previewVideoUrl: z.string().nullable(),
  creditsCost: z.number().int(),
  usageCount: z.number().int(),
  rating: z.number().nullable(),
  isOfficial: z.boolean(),
  createdAt: z.date(),
});

export type TemplateListItem = z.infer<typeof templateListItemSchema>;

// ============================================
// PRESET PACK ZOD SCHEMAS (Phase 12.1)
// ============================================

export const presetPackSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().min(10).max(2000),
  category: z.enum(["style", "industry", "format"]),
  thumbnailUrl: z.string().url().nullable().optional(),
  isOfficial: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PresetPack = z.infer<typeof presetPackSchema>;

export const createPresetPackSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().min(10).max(2000),
  category: z.enum(["style", "industry", "format"]),
  thumbnailUrl: z.string().url().optional(),
  isOfficial: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  templateIds: z.array(z.string().cuid()).optional(),
});

export type CreatePresetPackInput = z.infer<typeof createPresetPackSchema>;

export const updatePresetPackSchema = createPresetPackSchema.partial().extend({
  id: z.string().cuid(),
});

export type UpdatePresetPackInput = z.infer<typeof updatePresetPackSchema>;

// ============================================
// TEMPLATE REVIEW ZOD SCHEMAS (Phase 12.1)
// ============================================

export const templateReviewSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  templateId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).nullable().optional(),
  content: z.string().max(2000).nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: z
    .object({
      id: z.string().cuid(),
      name: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
    })
    .optional(),
});

export type TemplateReview = z.infer<typeof templateReviewSchema>;

export const createReviewSchema = z.object({
  templateId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().max(2000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = createReviewSchema.partial().extend({
  id: z.string().cuid(),
});

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
});

export type ReviewQuery = z.infer<typeof reviewQuerySchema>;

export const reviewStatsSchema = z.object({
  averageRating: z.number().nullable(),
  totalReviews: z.number().int(),
  ratingDistribution: z.record(
    z.number().int().min(1).max(5),
    z.number().int(),
  ),
});
