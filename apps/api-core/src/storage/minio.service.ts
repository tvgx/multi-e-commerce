/**
 * minio.service.ts
 *
 * NestJS service wrapping the MinIO S3-compatible client.
 * Used by LayoutService to persist compiled layout JSONs as objects.
 *
 * Bucket: "shop-layouts"
 * Object key: "{shopId}.json"
 *
 * Config via env vars (set in .env or docker-compose):
 *   MINIO_ENDPOINT   e.g. localhost
 *   MINIO_PORT       e.g. 9000
 *   MINIO_USE_SSL    true | false
 *   MINIO_ACCESS_KEY
 *   MINIO_SECRET_KEY
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketCorsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const LAYOUT_BUCKET = 'shop-layouts';
const PUBLIC_BUCKET = 'shop-public';
const PRIVATE_BUCKET = 'shop-private';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: S3Client;
  private isAvailable = false;

  constructor() {
    this.client = new S3Client({
      endpoint: `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT ?? 'localhost'}:${parseInt(process.env.MINIO_PORT ?? '9000', 10)}`,
      region: process.env.MINIO_REGION ?? 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
      },
    });
  }

  async onModuleInit() {
    try {
      await Promise.all([
        this.ensureBucketExists(LAYOUT_BUCKET),
        this.ensureBucketExists(PUBLIC_BUCKET, true),
        this.ensureBucketExists(PRIVATE_BUCKET, false),
      ]);

      // Cấu hình CORS để cho phép upload từ trình duyệt
      await this.ensureCorsConfig(PUBLIC_BUCKET);
      await this.ensureCorsConfig(PRIVATE_BUCKET);

      this.isAvailable = true;
    } catch (err) {
      this.isAvailable = false;
      this.logger.warn(
        '[MinIO] Unavailable at startup; object storage features may be disabled.',
      );
      if (err instanceof Error) {
        this.logger.warn(err.message);
      }
    }
  }

  // ─────────────────────────────────────────
  // Layout-specific helpers
  // ─────────────────────────────────────────

  /**
   * Saves (upserts) a layout JSON for a single shop.
   * File size is tiny (< 10KB per shop) so this is very cheap.
   */
  async saveLayout(shopId: string, layout: object): Promise<void> {
    if (!this.isAvailable) {
      this.logger.warn(
        `[MinIO] Skipping saveLayout for shopId=${shopId} because storage is unavailable.`,
      );
      return;
    }

    const objectKey = `${shopId}.json`;
    const content = JSON.stringify(layout);
    const buffer = Buffer.from(content, 'utf-8');

    await this.client.send(
      new PutObjectCommand({
        Bucket: LAYOUT_BUCKET,
        Key: objectKey,
        Body: buffer,
        ContentType: 'application/json',
      }),
    );

    this.logger.log(`[MinIO] Saved layout → ${LAYOUT_BUCKET}/${objectKey}`);
  }

  /**
   * Reads and parses the layout JSON for a shop.
   * Returns null if the object does not exist yet.
   */
  async getLayout<T = unknown>(shopId: string): Promise<T | null> {
    if (!this.isAvailable) {
      return null;
    }

    const objectKey = `${shopId}.json`;

    try {
      const output = await this.client.send(
        new GetObjectCommand({
          Bucket: LAYOUT_BUCKET,
          Key: objectKey,
        }),
      );

      const body = output.Body;
      if (!body) {
        return null;
      }

      const json = await (
        body as { transformToString: () => Promise<string> }
      ).transformToString();
      return JSON.parse(json) as T;
    } catch (err: unknown) {
      // S3-compatible APIs return NoSuchKey / NotFound when object doesn't exist.
      if (
        (err as Record<string, unknown>)?.name === 'NoSuchKey' ||
        (err as Record<string, unknown>)?.name === 'NotFound' ||
        ((err as Error)?.message &&
          (err as Error).message.includes('does not exist'))
      ) {
        return null;
      }
      this.logger.error(
        `[MinIO] getLayout failed for shopId=${shopId}`,
        err instanceof Error ? err.stack : err,
      );
      throw err;
    }
  }

  /**
   * Deletes the layout object for a shop (e.g. when a shop is deleted).
   */
  async deleteLayout(shopId: string): Promise<void> {
    if (!this.isAvailable) {
      this.logger.warn(
        `[MinIO] Skipping deleteLayout for shopId=${shopId} because storage is unavailable.`,
      );
      return;
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: LAYOUT_BUCKET,
        Key: `${shopId}.json`,
      }),
    );
    this.logger.log(`[MinIO] Deleted layout for shopId=${shopId}`);
  }

  // ─────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────

  private async ensureBucketExists(
    bucket: string,
    isPublic = false,
  ): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
      this.logger.log(`[MinIO] Bucket ready: ${bucket}`);
      if (isPublic) {
        await this.setBucketPolicyPublic(bucket);
      }
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
      this.logger.log(`[MinIO] Created bucket: ${bucket}`);
      if (isPublic) {
        await this.setBucketPolicyPublic(bucket);
      }
    }
  }

  private async setBucketPolicyPublic(bucket: string): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };
    try {
      const { PutBucketPolicyCommand } = await import('@aws-sdk/client-s3');
      await this.client.send(
        new PutBucketPolicyCommand({
          Bucket: bucket,
          Policy: JSON.stringify(policy),
        }),
      );
    } catch (error) {
      this.logger.warn(
        `[MinIO] Could not set public policy for bucket ${bucket}: ${error}`,
      );
    }
  }

  private async ensureCorsConfig(bucket: string): Promise<void> {
    const corsRules = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: ['*'], // Trong thực tế nên giới hạn domain của admin/storefront
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3000,
        },
      ],
    };

    try {
      await this.client.send(
        new PutBucketCorsCommand({
          Bucket: bucket,
          CORSConfiguration: corsRules,
        }),
      );
    } catch (error: any) {
      if (error.name === 'NotImplemented') {
        this.logger.debug(
          `[MinIO] Bucket CORS configuration is not supported via S3 API (expected for MinIO). Configure via MINIO_API_CORS_ALLOW_ORIGIN env var instead.`
        );
        return;
      }
      this.logger.warn(
        `[MinIO] Could not set CORS policy for bucket ${bucket}: ${error.message || error}`,
      );
    }
  }

  // ─────────────────────────────────────────
  // Media Upload (Images)
  // ─────────────────────────────────────────

  /**
   * Tạo Presigned URL để Frontend upload trực tiếp lên MinIO.
   */
  async getUploadPresignedUrl(
    shopId: string,
    fileName: string,
    contentType: string,
    isPublic = true,
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    if (!this.isAvailable) {
      throw new Error('Storage is currently unavailable');
    }

    const bucket = isPublic ? PUBLIC_BUCKET : PRIVATE_BUCKET;
    const fileExtension = fileName.split('.').pop() || 'bin';
    const uniqueId = uuidv4();
    const objectKey = `${shopId}/${uniqueId}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: contentType,
    });

    // URL hết hạn sau 15 phút
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 900,
    });

    const endpoint = process.env.MINIO_ENDPOINT ?? 'localhost';
    const port = process.env.MINIO_PORT ?? '9000';
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';

    // Nếu là public bucket, trả về URL truy cập trực tiếp
    const fileUrl = isPublic
      ? `${protocol}://${endpoint}:${port}/${bucket}/${objectKey}`
      : `private://${bucket}/${objectKey}`; // Private key để Backend xử lý sau

    return { uploadUrl, fileUrl, key: objectKey };
  }

  /**
   * Uploads and optimizes an image to WebP format (Legacy/Server-side).
   */
  async uploadMedia(
    shopId: string,
    fileBuffer: Buffer,
    originalName: string,
  ): Promise<{
    url: string;
    key: string;
    bucket: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
  }> {
    if (!this.isAvailable) {
      throw new Error('Storage is currently unavailable');
    }

    try {
      const sharp = (await import('sharp')).default;
      const optimized = sharp(fileBuffer).webp({ quality: 80 });
      const metadata = await optimized.metadata();
      const optimizedBuffer = await optimized.toBuffer();

      const timestamp = Date.now();
      const cleanName = originalName
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 20);
      const objectKey = `${shopId}/${timestamp}-${cleanName}.webp`;

      await this.client.send(
        new PutObjectCommand({
          Bucket: PUBLIC_BUCKET,
          Key: objectKey,
          Body: optimizedBuffer,
          ContentType: 'image/webp',
        }),
      );

      const endpoint = process.env.MINIO_ENDPOINT ?? 'localhost';
      const port = process.env.MINIO_PORT ?? '9000';
      const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
      const url = `${protocol}://${endpoint}:${port}/${PUBLIC_BUCKET}/${objectKey}`;

      return {
        url,
        key: objectKey,
        bucket: PUBLIC_BUCKET,
        mimeType: 'image/webp',
        size: optimizedBuffer.length,
        width: metadata.width,
        height: metadata.height,
      };
    } catch (error) {
      this.logger.error(`[MinIO] uploadMedia failed`, error);
      throw error;
    }
  }

  /**
   * Xóa một tệp tin vật lý khỏi MinIO/S3.
   */
  async deleteObject(bucket: string, key: string): Promise<void> {
    if (!this.isAvailable) {
      this.logger.warn(
        `[MinIO] Skipping deleteObject for key=${key} because storage is unavailable.`,
      );
      return;
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    this.logger.log(`[MinIO] Deleted object → ${bucket}/${key}`);
  }
}
