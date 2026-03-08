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
import * as Minio from 'minio';

const LAYOUT_BUCKET = 'shop-layouts';

@Injectable()
export class MinioService implements OnModuleInit {
    private readonly logger = new Logger(MinioService.name);
    private client: Minio.Client;

    constructor() {
        this.client = new Minio.Client({
            endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
            port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
            useSSL: process.env.MINIO_USE_SSL === 'true',
            accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
            secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
        });
    }

    async onModuleInit() {
        await this.ensureBucketExists(LAYOUT_BUCKET);
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

        await this.client.putObject(
            LAYOUT_BUCKET,
            objectKey,
            buffer,
            buffer.byteLength,
            { 'Content-Type': 'application/json' },
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
            const stream = await this.client.getObject(LAYOUT_BUCKET, objectKey);

            return new Promise<T>((resolve, reject) => {
                const chunks: Buffer[] = [];
                stream.on('data', (chunk: Buffer) => chunks.push(chunk));
                stream.on('end', () => {
                    try {
                        const json = Buffer.concat(chunks).toString('utf-8');
                        resolve(JSON.parse(json) as T);
                    } catch (e) {
                        reject(e);
                    }
                });
                stream.on('error', reject);
            });
        } catch (err: any) {
            // MinIO throws a NoSuchKey error (code S3Error) when object doesn't exist
            if (err?.code === 'NoSuchKey' || err?.message?.includes('does not exist')) {
                return null;
            }
            this.logger.error(`[MinIO] getLayout failed for shopId=${shopId}`, err);
            throw err;
        }
    }

    /**
     * Deletes the layout object for a shop (e.g. when a shop is deleted).
     */
    async deleteLayout(shopId: string): Promise<void> {
        await this.client.removeObject(LAYOUT_BUCKET, `${shopId}.json`);
        this.logger.log(`[MinIO] Deleted layout for shopId=${shopId}`);
    }

    // ─────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────

    private async ensureBucketExists(bucket: string): Promise<void> {
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
            await this.client.makeBucket(bucket, 'us-east-1');
            this.logger.log(`[MinIO] Created bucket: ${bucket}`);
        } else {
            this.logger.log(`[MinIO] Bucket ready: ${bucket}`);
        }
    }
}
