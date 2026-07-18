/**
 * Storage Provider Abstraction Layer
 * Provides a unified interface for cloud storage providers (Cloudflare R2, Vercel Blob)
 */

export interface SignedUrlOptions {
  expiresIn?: number; // seconds, default 3600 (1 hour)
  method?: "GET" | "PUT";
}

export interface UploadResult {
  url: string; // public URL (R2 custom domain) or signed URL
  key: string; // object key
  provider: "r2" | "vercel-blob";
}

export interface StorageProvider {
  /**
   * Upload a file to storage
   * @param key - Object key (path)
   * @param data - File data as Buffer
   * @param contentType - MIME type
   * @returns Upload result with public/signed URL
   */
  upload(key: string, data: Buffer, contentType: string): Promise<UploadResult>;

  /**
   * Delete a file from storage
   * @param key - Object key (path)
   */
  delete(key: string): Promise<void>;

  /**
   * Get a signed URL for private access
   * @param key - Object key (path)
   * @param options - Signed URL options
   * @returns Signed URL
   */
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;

  /**
   * Check if the provider is properly configured
   * @returns true if configured, false otherwise
   */
  isConfigured(): boolean;
}

/**
 * Null provider - no-op implementation for when no storage is configured
 * Returns the original URL without uploading
 */
export class NullStorageProvider implements StorageProvider {
  upload(
    key: string,
    data: Buffer,
    contentType: string,
  ): Promise<UploadResult> {
    return Promise.resolve({
      url: "", // Return empty, caller should use original URL
      key,
      provider: "r2" as const, // placeholder
    });
  }

  delete(key: string): Promise<void> {
    return Promise.resolve();
  }

  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    return Promise.resolve("");
  }

  isConfigured(): boolean {
    return false;
  }
}
