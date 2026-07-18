/**
 * Cloudflare R2 Storage Provider Implementation
 * Uses @aws-sdk/client-s3 (S3-compatible API)
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  StorageProvider,
  UploadResult,
  SignedUrlOptions,
} from "@klipai/core/storage";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string; // Custom domain (e.g., https://cdn.klip.ai)
  region?: string; // Default: "auto"
}

export class R2StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrl?: string;

  constructor(config: R2Config) {
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;

    this.client = new S3Client({
      region: config.region || "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * Upload a file to R2
   * @param key - Object key (e.g., generations/user123/gen456/output.mp4)
   * @param data - File data as Buffer
   * @param contentType - MIME type (e.g., video/mp4)
   * @returns Upload result with public or signed URL
   */
  async upload(
    key: string,
    data: Buffer,
    contentType: string,
  ): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    });

    await this.client.send(command);

    // Use public URL if custom domain is configured, otherwise generate signed URL
    let url: string;
    if (this.publicUrl) {
      // Remove trailing slash from publicUrl and leading slash from key
      const baseUrl = this.publicUrl.replace(/\/$/, "");
      const cleanKey = key.replace(/^\//, "");
      url = `${baseUrl}/${cleanKey}`;
    } else {
      url = await this.getSignedUrl(key, { expiresIn: 3600 });
    }

    return {
      url,
      key,
      provider: "r2",
    };
  }

  /**
   * Delete a file from R2
   * @param key - Object key
   */
  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }

  /**
   * Get a signed URL for private access
   * @param key - Object key
   * @param options - Signed URL options (expiresIn, method)
   * @returns Signed URL
   */
  async getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const expiresIn = options?.expiresIn || 3600; // Default 1 hour
    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Check if R2 is properly configured
   * @returns true if configured
   */
  isConfigured(): boolean {
    return !!(this.client && this.bucket && this.client.config.credentials);
  }
}
