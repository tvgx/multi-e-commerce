import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import { FigmaClient } from './figma-client.service';
import { collectImageNodes, ReducedNode } from './node-tree-reducer';

/**
 * MinIO bucket for layout/theme imagery — same bucket api-core's MediaService
 * uses for builder/theme assets (`LAYOUT_BUCKET`). Theme assets live under a
 * reserved `_themes/<fileKey>/` namespace so they don't collide with any
 * `<shopId>/` prefix.
 */
const LAYOUT_BUCKET = 'shop-layouts';

const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

/**
 * Resolves a Figma frame's image fills into permanent MinIO URLs.
 *
 * Figma's image-fill URLs (and node renders) are short-lived S3 links that
 * expire, so we download the bytes and re-host them on MinIO, keyed by content
 * hash (idempotent: identical bytes are uploaded once). Returns a map of Figma
 * node id -> permanent MinIO URL, which the extractor injects into the Claude
 * prompt so the model can place each image on the matching section prop.
 *
 * Self-contained S3 client (mirrors api-core's MinioService config) because
 * design-agent is an isolated app and must not import the api-core Nest graph.
 */
@Injectable()
export class AssetPipelineService {
  private readonly logger = new Logger(AssetPipelineService.name);
  private _s3?: S3Client;
  private cdnBaseUrl!: string;

  constructor(
    private readonly config: ConfigService,
    private readonly figma: FigmaClient,
  ) {}

  /** Lazily built so bootstrap/dry-runs don't require MinIO env to be present. */
  private get s3(): S3Client {
    if (!this._s3) {
      const endpoint = this.config.get<string>('MINIO_ENDPOINT', 'localhost');
      const port = this.config.get<string>('MINIO_PORT', '9000');
      const endpointUrl = `http://${endpoint}:${port}`;
      this.cdnBaseUrl = this.config.get<string>('CDN_BASE_URL', endpointUrl);
      this._s3 = new S3Client({
        endpoint: endpointUrl,
        region: 'us-east-1',
        credentials: {
          accessKeyId: this.config.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
          secretAccessKey: this.config.get<string>(
            'MINIO_SECRET_KEY',
            'minioadmin',
          ),
        },
        forcePathStyle: true,
        maxAttempts: 3,
      });
    }
    return this._s3;
  }

  /**
   * For each node in `frame` with an image fill, fetch the source asset and
   * re-host it on MinIO. Returns `{ [figmaNodeId]: minioUrl }`. Best-effort:
   * a node that fails to resolve is skipped (logged), never throws — extraction
   * must still succeed without imagery.
   */
  async resolveAssets(
    fileKey: string,
    frame: ReducedNode,
  ): Promise<Record<string, string>> {
    const imageNodes = collectImageNodes(frame);
    if (imageNodes.length === 0) return {};

    const fills = await this.figma.getImageFills(fileKey);
    const result: Record<string, string> = {};
    // Cache imageRef -> minioUrl so multiple nodes sharing a fill upload once.
    const byRef: Record<string, string> = {};

    for (const { id, imageRef } of imageNodes) {
      try {
        if (byRef[imageRef]) {
          result[id] = byRef[imageRef];
          continue;
        }
        const sourceUrl = fills[imageRef];
        if (!sourceUrl) {
          this.logger.warn(`No source URL for imageRef ${imageRef} (node ${id}).`);
          continue;
        }
        const url = await this.rehost(fileKey, sourceUrl);
        if (url) {
          byRef[imageRef] = url;
          result[id] = url;
        }
      } catch (err) {
        this.logger.warn(
          `Failed to rehost image for node ${id}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    return result;
  }

  /** Download bytes from a (short-lived) URL and upload to MinIO; idempotent. */
  private async rehost(fileKey: string, sourceUrl: string): Promise<string | null> {
    const res = await fetch(sourceUrl);
    if (!res.ok) {
      this.logger.warn(`Download failed (${res.status}) for ${sourceUrl}`);
      return null;
    }
    const mime = res.headers.get('content-type') ?? 'image/png';
    const ext = MIME_EXT[mime.split(';')[0].trim()] ?? 'png';
    const bytes = Buffer.from(await res.arrayBuffer());
    const hash = crypto.createHash('sha1').update(bytes).digest('hex');
    const key = `_themes/${fileKey}/${hash}.${ext}`;

    if (!(await this.exists(key))) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: LAYOUT_BUCKET,
          Key: key,
          Body: bytes,
          ContentType: mime,
        }),
      );
      this.logger.log(`Re-hosted theme asset ${key}`);
    }

    return `${this.cdnBaseUrl}/${LAYOUT_BUCKET}/${key}`;
  }

  private async exists(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({ Bucket: LAYOUT_BUCKET, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
