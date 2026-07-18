/**
 * Storage Provider Factory
 * Creates the appropriate storage provider based on environment configuration
 */

import { StorageProvider, NullStorageProvider } from "@klipai/core/storage";
import { R2StorageProvider, R2Config } from "./r2-provider";
import {
  VercelBlobStorageProvider,
  VercelBlobConfig,
} from "./vercel-blob-provider";
import { env } from "@klipai/config";

/**
 * Create a storage provider based on available configuration
 * Priority: R2 > Vercel Blob > Null (no-op)
 */
export function createStorageProvider(): StorageProvider {
  // Priority 1: Cloudflare R2 (primary)
  if (
    env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET
  ) {
    const config: R2Config = {
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucket: env.R2_BUCKET,
      publicUrl: env.R2_PUBLIC_URL,
      region: env.R2_REGION,
    };
    return new R2StorageProvider(config);
  }

  // Priority 2: Vercel Blob (fallback)
  if (env.BLOB_READ_WRITE_TOKEN) {
    const config: VercelBlobConfig = {
      token: env.BLOB_READ_WRITE_TOKEN,
    };
    return new VercelBlobStorageProvider(config);
  }

  // Priority 3: Null provider (no-op, for development without storage)
  return new NullStorageProvider();
}

// Export providers and types for direct usage if needed
export { R2StorageProvider } from "./r2-provider";
export { VercelBlobStorageProvider } from "./vercel-blob-provider";
export { NullStorageProvider } from "@klipai/core/storage";
export type { R2Config } from "./r2-provider";
export type { VercelBlobConfig } from "./vercel-blob-provider";
