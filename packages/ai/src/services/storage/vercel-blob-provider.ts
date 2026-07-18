/**
 * Vercel Blob Storage Provider Implementation
 * Uses @vercel/blob SDK
 */

import { put, del, head, list } from "@vercel/blob";
import {
  StorageProvider,
  UploadResult,
  SignedUrlOptions,
} from "@klipai/core/storage";

export interface VercelBlobConfig {
  token: string; // BLOB_READ_WRITE_TOKEN
}

export class VercelBlobStorageProvider implements StorageProvider {
  private token: string;

  constructor(config: VercelBlobConfig) {
    this.token = config.token;
  }

  /**
   * Upload a file to Vercel Blob
   * @param key - Object key (e.g., generations/user123/gen456/output.mp4)
   * @param data - File data as Buffer
   * @param contentType - MIME type (e.g., video/mp4)
   * @returns Upload result with public URL (Vercel Blob provides public URLs by default)
   */
  async upload(
    key: string,
    data: Buffer,
    contentType: string,
  ): Promise<UploadResult> {
    const blob = await put(key, data, {
      access: "public", // Public access for generated content
      contentType,
      token: this.token,
    });

    return {
      url: blob.url,
      key: blob.pathname,
      provider: "vercel-blob",
    };
  }

  /**
   * Delete a file from Vercel Blob
   * @param key - Object key
   */
  async delete(key: string): Promise<void> {
    await del(key, { token: this.token });
  }

  /**
   * Get a signed URL for private access
   * Note: Vercel Blob doesn't natively support signed URLs for private access
   * For private access, you'd need to use a different approach (e.g., signed cookies, edge functions)
   * This returns the public URL as a fallback
   * @param key - Object key
   * @param options - Signed URL options (not fully supported by Vercel Blob)
   * @returns Public URL (Vercel Blob doesn't support signed URLs natively)
   */
  async getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    // Vercel Blob doesn't support signed URLs natively
    // We can only return the public URL or use an edge function for signed access
    // For now, try to get the blob metadata to construct the URL
    try {
      const blobs = await list({ prefix: key, token: this.token });
      const blob = blobs.blobs.find((b) => b.pathname === key);
      if (blob) {
        return blob.url;
      }
    } catch {
      // If listing fails, construct URL from known pattern
    }

    // Fallback: construct URL (this may not work if blob doesn't exist)
    // Vercel Blob URLs follow pattern: https://<store-id>.public.blob.vercel-storage.com/<key>
    return `https://${this.getStoreId()}.public.blob.vercel-storage.com/${key}`;
  }

  /**
   * Extract store ID from token (format: vercel_blob_rw_<storeId>_<secret>)
   * @returns Store ID or empty string
   */
  private getStoreId(): string {
    const match = this.token.match(/vercel_blob_rw_([^_]+)_/);
    return match ? match[1] : "";
  }

  /**
   * Check if Vercel Blob is properly configured
   * @returns true if configured
   */
  isConfigured(): boolean {
    return !!this.token && this.token.startsWith("vercel_blob_rw_");
  }
}
