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
} from '@aws-sdk/client-s3';

const LAYOUT_BUCKET = 'shop-layouts';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: S3Client;

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
    await this.ensureBucketExists(LAYOUT_BUCKET).catch((err) => {
      this.logger.warn(
        `[MinIO] Failed to connect or create bucket. MinIO features will be disabled locally. Error: ${err.message || err}`,
      );
    });
  }

  // ─────────────────────────────────────────
  // Layout-specific helpers
  // ─────────────────────────────────────────

  /**
   * Saves (upserts) a layout JSON for a single shop.
   * File size is tiny (< 10KB per shop) so this is very cheap.
   */
  async saveLayout(shopId: string, layout: object): Promise<void> {
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

  private async ensureBucketExists(bucket: string): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
      this.logger.log(`[MinIO] Bucket ready: ${bucket}`);
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
      this.logger.log(`[MinIO] Created bucket: ${bucket}`);
    }
  }
}
