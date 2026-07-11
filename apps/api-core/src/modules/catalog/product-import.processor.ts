import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { fileTypeFromBuffer } from 'file-type';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { CatalogService } from './catalog.service';
import { MinioService, PUBLIC_BUCKET } from '../../common/services/minio.service';
import type { ImportRow, ImportRowError } from './product-import.service';

const IMAGE_TIMEOUT_MS = 10_000;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Chặn SSRF cơ bản: chỉ http/https và không trỏ vào dải IP nội bộ. */
async function assertSafeUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`URL scheme not allowed: ${url.protocol}`);
  }
  const host = url.hostname;
  const ip = isIP(host) ? host : (await lookup(host)).address;
  if (
    /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip) ||
    ip === '::1' ||
    ip.startsWith('fc') ||
    ip.startsWith('fd') ||
    ip.startsWith('fe80')
  ) {
    throw new Error(`URL resolves to a private address: ${host}`);
  }
}

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'san-pham';
}

@Processor('product-import')
export class ProductImportProcessor {
  private readonly logger = new Logger(ProductImportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    private readonly catalogService: CatalogService,
    private readonly minioService: MinioService,
  ) {}

  @Process('import-products')
  async handleImport(job: Job<{ shopId: string; rows: ImportRow[] }>) {
    const { shopId, rows } = job.data;
    const errors: ImportRowError[] = [];
    let processed = 0;
    let succeeded = 0;

    // CatalogService đọc shopId từ AsyncLocalStorage (request scope) — worker
    // không có request nên phải tự bọc tenant context.
    const inTenant = <T>(fn: () => Promise<T>): Promise<T> =>
      this.tenantService.run({ shopId }, fn);

    // Cache danh mục theo tên để không upsert lặp trong cùng file.
    const categoryIdByName = new Map<string, string>();

    for (const row of rows) {
      try {
        const categoryId = row.category
          ? await this.resolveCategory(shopId, row.category, categoryIdByName)
          : undefined;

        const slug = await this.uniqueSlug(shopId, slugify(row.name));
        const sku = row.sku || `${slug}-${Date.now().toString(36)}`.slice(0, 40);

        const product = await inTenant(() =>
          this.catalogService.createProduct({
            name: row.name,
            slug,
            description: row.description,
            categoryId,
            status: row.status,
            variants: [{ sku, price: row.price, inStock: row.stock }],
          }),
        );

        // Tải ảnh từ URL → MinIO theo convention <shopId>/<productId>-<n>.<ext>.
        // Ảnh lỗi chỉ ghi warning, không fail cả dòng.
        const uploadedUrls: string[] = [];
        for (let i = 0; i < row.images.length; i++) {
          try {
            const url = await this.mirrorImage(shopId, product.id, i + 1, row.images[i]);
            uploadedUrls.push(url);
          } catch (err: any) {
            errors.push({ line: row.line, message: `Ảnh ${i + 1} lỗi: ${err.message}` });
          }
        }
        if (uploadedUrls.length > 0) {
          await this.prisma.product.update({
            where: { id: product.id },
            data: { images: uploadedUrls, imageUrl: uploadedUrls[0] },
          });
        }

        succeeded++;
      } catch (err: any) {
        this.logger.warn(`Import row ${row.line} failed: ${err.message}`);
        errors.push({ line: row.line, message: err.message || 'Unknown error' });
      } finally {
        processed++;
        await job.progress({ processed, errors });
      }
    }

    return { processed, succeeded, failed: processed - succeeded, errors };
  }

  private async resolveCategory(
    shopId: string,
    name: string,
    cache: Map<string, string>,
  ): Promise<string> {
    const key = name.toLowerCase();
    const cached = cache.get(key);
    if (cached) return cached;

    let category = await this.prisma.category.findFirst({
      where: { shopId, name: { equals: name, mode: 'insensitive' } },
    });
    if (!category) {
      category = await this.prisma.category.create({
        data: { shopId, name, slug: await this.uniqueCategorySlug(shopId, slugify(name)) },
      });
    }
    cache.set(key, category.id);
    return category.id;
  }

  private async uniqueSlug(shopId: string, base: string): Promise<string> {
    let slug = base;
    for (let i = 2; ; i++) {
      const exists = await this.prisma.product.findUnique({
        where: { shopId_slug: { shopId, slug } },
        select: { id: true },
      });
      if (!exists) return slug;
      slug = `${base}-${i}`;
    }
  }

  private async uniqueCategorySlug(shopId: string, base: string): Promise<string> {
    let slug = base;
    for (let i = 2; ; i++) {
      const exists = await this.prisma.category.findFirst({
        where: { shopId, slug },
        select: { id: true },
      });
      if (!exists) return slug;
      slug = `${base}-${i}`;
    }
  }

  /** Tải 1 ảnh từ URL công khai và đẩy lên MinIO, trả public URL. */
  private async mirrorImage(
    shopId: string,
    productId: string,
    index: number,
    sourceUrl: string,
  ): Promise<string> {
    await assertSafeUrl(sourceUrl);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(sourceUrl, { signal: controller.signal, redirect: 'follow' });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > IMAGE_MAX_BYTES) throw new Error('Ảnh vượt 5MB');

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > IMAGE_MAX_BYTES) throw new Error('Ảnh vượt 5MB');

    const typeInfo = await fileTypeFromBuffer(buffer);
    if (!typeInfo || !typeInfo.mime.startsWith('image/')) {
      throw new Error('Nội dung không phải ảnh');
    }

    const key = `${shopId}/${productId}-${index}.${typeInfo.ext}`;
    return this.minioService.uploadFile(buffer, key, typeInfo.mime, PUBLIC_BUCKET);
  }
}
