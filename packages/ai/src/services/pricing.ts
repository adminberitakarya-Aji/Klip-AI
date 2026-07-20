/**
 * Pricing Calculator for Template Generation
 *
 * Hitung biaya credits berdasarkan:
 * - Jumlah shot
 * - Tipe generation (text-to-video, image-to-video, etc)
 * - Resolution (720p, 1080p, 4K)
 * - Upscale/no upscale
 * - Retry buffer (20%)
 */

import { GenerationType } from "../types";

export interface PricingParams {
  shotCount: number;
  generationType: GenerationType;
  duration: number;
  resolution: "720p" | "1080p" | "4k";
  hasUpscale: boolean;
}

export interface PricingResult {
  baseCost: number; // Cost sebelum buffer
  retryBuffer: number; // 20% buffer untuk retry
  totalCredits: number; // Total credits yang akan di-charge
  breakdown: {
    perShotCost: number;
    generationMultiplier: number;
    resolutionMultiplier: number;
    upscaleMultiplier: number;
    retryMultiplier: number;
  };
}

/**
 * Provider cost multipliers (relative to base)
 * More expensive providers = higher multiplier
 */
const PROVIDER_MULTIPLIERS: Record<string, number> = {
  "text-to-video": 1.0,
  "image-to-video": 1.2,
  "video-to-video": 1.5,
  "text-to-image": 0.5,
  "image-to-image": 0.6,
  "video-to-video-style-transfer": 1.8,
  "inpainting-outpainting": 1.5,
  "depth-normal-control": 1.3,
  "multi-shot-storyboard": 1.2,
  "motion-control": 1.1,
};

/**
 * Resolution cost multipliers
 */
const RESOLUTION_MULTIPLIERS: Record<string, number> = {
  "720p": 1.0,
  "1080p": 1.5,
  "4k": 2.5,
};

/**
 * Base cost per shot (in credits)
 * This is the base unit - actual cost depends on multipliers
 */
const BASE_COST_PER_SHOT = 1;

/**
 * Retry buffer percentage (20%)
 * Extra credits allocated for retries on failure
 */
const RETRY_BUFFER_PERCENTAGE = 0.2;

/**
 * Calculate the cost for a template generation
 *
 * Formula:
 * baseCost = shots × baseCostPerShot × providerMultiplier × resolutionMultiplier × upscaleMultiplier
 * retryBuffer = baseCost × retryBufferPercentage
 * totalCredits = baseCost + retryBuffer
 *
 * @example
 * // 3 shots, text-to-video, 1080p, no upscale
 * calculateTemplateCost({
 *   shotCount: 3,
 *   generationType: GenerationType.TEXT_TO_VIDEO,
 *   duration: 30,
 *   resolution: "1080p",
 *   hasUpscale: false,
 * });
 * // Returns: { totalCredits: 6, ... }
 */
export function calculateTemplateCost(params: PricingParams): PricingResult {
  const { shotCount, generationType, duration, resolution, hasUpscale } =
    params;

  // Normalize generation type to string
  const genTypeString = generationType.toLowerCase().replace(/_/g, "-");

  // Get multipliers
  const generationMultiplier = PROVIDER_MULTIPLIERS[genTypeString] || 1.0;
  const resolutionMultiplier = RESOLUTION_MULTIPLIERS[resolution] || 1.0;
  const upscaleMultiplier = hasUpscale ? 1.3 : 1.0;

  // Calculate per-shot cost
  const perShotCost =
    BASE_COST_PER_SHOT *
    generationMultiplier *
    resolutionMultiplier *
    upscaleMultiplier;

  // Calculate base cost
  const baseCost = Math.ceil(perShotCost * shotCount);

  // Calculate retry buffer (20% of base cost)
  const retryBuffer = Math.ceil(baseCost * RETRY_BUFFER_PERCENTAGE);

  // Total credits (rounded up)
  const totalCredits = baseCost + retryBuffer;

  return {
    baseCost,
    retryBuffer,
    totalCredits,
    breakdown: {
      perShotCost,
      generationMultiplier,
      resolutionMultiplier,
      upscaleMultiplier,
      retryMultiplier: 1 + RETRY_BUFFER_PERCENTAGE,
    },
  };
}

/**
 * Calculate cost for a single generation (non-template)
 */
export function calculateGenerationCost(params: {
  generationType: GenerationType;
  resolution: "720p" | "1080p" | "4k";
  hasUpscale: boolean;
}): number {
  const result = calculateTemplateCost({
    shotCount: 1,
    generationType: params.generationType,
    duration: 5, // default duration
    resolution: params.resolution,
    hasUpscale: params.hasUpscale,
  });

  return result.totalCredits;
}

/**
 * Calculate cost for upscaler job
 * Upscale cost is proportional to input duration
 */
export function calculateUpscalerCost(params: {
  durationSeconds: number;
  resolution: "720p" | "1080p" | "4k";
}): number {
  const { durationSeconds, resolution } = params;

  // Base cost per 10 seconds
  const baseCostPer10Sec = 1;
  const resolutionMultiplier = RESOLUTION_MULTIPLIERS[resolution] || 1.0;

  // Calculate cost (rounded up)
  const durationFactor = Math.ceil(durationSeconds / 10);
  const totalCost = Math.ceil(
    baseCostPer10Sec * durationFactor * resolutionMultiplier,
  );

  return totalCost;
}

/**
 * Format price for display (IDR)
 */
export function formatPriceIdr(priceInCents: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceInCents);
}

/**
 * Get credit packages pricing reference
 */
export const CREDIT_PACKAGE_PRICING = {
  starter: {
    credits: 20,
    priceIdr: 50000,
    perCredit: 2500, // Rp 2.500 per credit
  },
  pro: {
    credits: 100,
    priceIdr: 200000,
    perCredit: 2000, // Rp 2.000 per credit
    popular: true,
  },
  business: {
    credits: 500,
    priceIdr: 800000,
    perCredit: 1600, // Rp 1.600 per credit
  },
} as const;

/**
 * FREE credits for new users (one-time)
 */
export const FREE_CREDITS_AMOUNT = 10;

/**
 * Check if price is worth it (discount calculation)
 */
export function calculateDiscount(
  credits: number,
  priceIdr: number,
): {
  discountPercentage: number;
  perCreditPrice: number;
  savingsVsStarter: number;
} {
  const perCreditPrice = Math.ceil(priceIdr / credits);
  const starterPerCredit = CREDIT_PACKAGE_PRICING.starter.perCredit;

  const discountPercentage = Math.round(
    (1 - perCreditPrice / starterPerCredit) * 100,
  );
  const savingsVsStarter = Math.max(0, starterPerCredit * credits - priceIdr);

  return {
    discountPercentage,
    perCreditPrice,
    savingsVsStarter,
  };
}
