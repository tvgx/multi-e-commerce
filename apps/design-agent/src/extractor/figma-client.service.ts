import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FigmaNode } from './node-tree-reducer';

export interface FigmaFileResponse {
  /** Root DOCUMENT node; its children are CANVAS (page) nodes. */
  document: FigmaNode;
  /** Monotonic file version id — stored as `figma_version`. */
  version: string;
  name: string;
}

/**
 * Thin wrapper over the Figma REST API. Uses Node's global `fetch` (Node 22),
 * so there is no axios/http dependency. Token comes from `FIGMA_TOKEN` and the
 * default file key from `FIGMA_FILE_KEY` via ConfigModule.
 */
@Injectable()
export class FigmaClient {
  private readonly logger = new Logger(FigmaClient.name);
  private readonly baseUrl = 'https://api.figma.com/v1';

  constructor(private readonly config: ConfigService) {}

  private get token(): string {
    const token = this.config.get<string>('FIGMA_TOKEN');
    if (!token) {
      throw new Error('FIGMA_TOKEN is not set');
    }
    return token;
  }

  /** Default file key from env, used when the CLI doesn't pass `--file-key`. */
  get defaultFileKey(): string | undefined {
    return this.config.get<string>('FIGMA_FILE_KEY');
  }

  /** GET /v1/files/:key — full document tree + version. */
  async getFile(fileKey: string): Promise<FigmaFileResponse> {
    const res = await fetch(`${this.baseUrl}/files/${fileKey}`, {
      headers: { 'X-Figma-Token': this.token },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        `Figma getFile(${fileKey}) failed: ${res.status} ${res.statusText} ${body}`,
      );
    }

    return (await res.json()) as FigmaFileResponse;
  }

  /**
   * GET /v1/images/:key — render the given nodes to images and return a
   * map of nodeId -> rendered image URL. Used optionally (`--with-images`) to
   * give Claude a visual reference alongside the structural tree.
   */
  async getImages(
    fileKey: string,
    nodeIds: string[],
    format: 'png' | 'svg' | 'jpg' = 'png',
  ): Promise<Record<string, string | null>> {
    if (nodeIds.length === 0) return {};
    const ids = encodeURIComponent(nodeIds.join(','));
    const res = await fetch(
      `${this.baseUrl}/images/${fileKey}?ids=${ids}&format=${format}`,
      { headers: { 'X-Figma-Token': this.token } },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.warn(
        `Figma getImages failed: ${res.status} ${res.statusText} ${body}`,
      );
      return {};
    }

    const data = (await res.json()) as { images?: Record<string, string | null> };
    return data.images ?? {};
  }

  /**
   * GET /v1/files/:key/images — map of `imageRef` -> original uploaded image
   * URL for every IMAGE fill in the file. Used by the asset pipeline to fetch
   * the real source asset behind a node's image fill (vs the flattened node
   * render from {@link getImages}). The URLs are short-lived S3 links, so the
   * pipeline downloads + re-hosts them on MinIO.
   */
  async getImageFills(fileKey: string): Promise<Record<string, string>> {
    const res = await fetch(`${this.baseUrl}/files/${fileKey}/images`, {
      headers: { 'X-Figma-Token': this.token },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.warn(
        `Figma getImageFills failed: ${res.status} ${res.statusText} ${body}`,
      );
      return {};
    }

    const data = (await res.json()) as {
      meta?: { images?: Record<string, string> };
    };
    return data.meta?.images ?? {};
  }
}
