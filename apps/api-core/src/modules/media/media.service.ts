import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TenantService } from '../../common/services/tenant.service';
import { UploadMediaDto } from './dto/media.dto';
import {
  MinioService,
  LAYOUT_BUCKET,
  PUBLIC_BUCKET,
} from '../../common/services/minio.service';
import { PrismaService } from '../../database/prisma.service';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { encode } from 'blurhash';
import { randomUUID } from 'node:crypto';

// Các entityType là ảnh giao diện → bucket shop-layouts
const LAYOUT_ENTITY_TYPES = new Set([
  'layout',
  'layout_image',
  'shop_logo',
  'shop_favicon',
  'theme',
]);

// TODO 17: kích thước chuẩn hoá cho icon/favicon/logo khi upload.
const FAVICON_MAIN_SIZE = 48;
const FAVICON_EXTRA_SIZES = [32, 180]; // 32 tab thường, 180 apple-touch-icon
const LOGO_MAX_WIDTH = 512;

@Injectable()
export class MediaService {
  constructor(
    private readonly tenantService: TenantService,
    private readonly minioService: MinioService,
    private readonly prisma: PrismaService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  // Ảnh sản phẩm phải tên theo id sản phẩm: <productId>-1, <productId>-2, ...
  // — đếm tiếp từ ảnh đã có trong MinIO để không ghi đè.
  private async buildObjectLocation(
    shopId: string,
    dto: UploadMediaDto,
    ext: string,
  ): Promise<{ bucket: string; key: string }> {
    if (dto.entityType && LAYOUT_ENTITY_TYPES.has(dto.entityType)) {
      return { bucket: LAYOUT_BUCKET, key: `${shopId}/${randomUUID()}.${ext}` };
    }

    if (dto.entityType === 'product') {
      if (!dto.entityId) {
        throw new BadRequestException(
          'entityId (product id) is required for product images',
        );
      }
      const prefix = `${shopId}/${dto.entityId}-`;
      const existing = await this.minioService.listKeys(prefix, PUBLIC_BUCKET);
      const maxIndex = existing.reduce((max, k) => {
        const match = k.slice(prefix.length).match(/^(\d+)\./);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
      return { bucket: PUBLIC_BUCKET, key: `${prefix}${maxIndex + 1}.${ext}` };
    }

    return { bucket: PUBLIC_BUCKET, key: `${shopId}/${randomUUID()}.${ext}` };
  }

  /**
   * TODO 17: chuẩn hoá icon/favicon/logo lúc upload thay vì lưu file gốc:
   *  - shop_favicon → PNG vuông 48×48 (bản chính) + bản phụ 32/180 cạnh nó.
   *  - shop_logo    → thu về tối đa 512px ngang, nén WebP (giữ alpha).
   * Ảnh khác giữ nguyên. SVG (không decode được bằng sharp) cũng giữ nguyên.
   */
  private async preprocessImage(
    buffer: Buffer,
    mimeType: string,
    entityType?: string,
  ): Promise<{ buffer: Buffer; mimeType: string; ext: string } | null> {
    if (!mimeType.startsWith('image/') || mimeType === 'image/svg+xml') return null;
    try {
      if (entityType === 'shop_favicon') {
        const out = await sharp(buffer)
          .resize(FAVICON_MAIN_SIZE, FAVICON_MAIN_SIZE, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();
        return { buffer: out, mimeType: 'image/png', ext: 'png' };
      }
      if (entityType === 'shop_logo') {
        const out = await sharp(buffer)
          .resize({ width: LOGO_MAX_WIDTH, withoutEnlargement: true })
          .webp({ quality: 90 })
          .toBuffer();
        return { buffer: out, mimeType: 'image/webp', ext: 'webp' };
      }
    } catch (err) {
      console.warn(`Could not preprocess ${entityType} image, keeping original`, err);
    }
    return null;
  }

  /** Upload các bản favicon phụ (32, 180) cạnh bản chính — best-effort. */
  private async uploadFaviconVariants(shopId: string, original: Buffer) {
    for (const size of FAVICON_EXTRA_SIZES) {
      try {
        const out = await sharp(original)
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        await this.minioService.uploadFile(
          out,
          `${shopId}/favicon-${size}.png`,
          'image/png',
          LAYOUT_BUCKET,
        );
      } catch (err) {
        console.warn(`Could not upload favicon variant ${size}px`, err);
      }
    }
  }

  async uploadFile(file: any, dto: UploadMediaDto) {
    const shopId = this.getShopId();
    let buffer = file.buffer;

    // 1. File size limit (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // 2. MIME type validation from magic bytes
    const typeInfo = await fileTypeFromBuffer(buffer);
    if (!typeInfo) {
      throw new BadRequestException('Could not determine file type');
    }
    let mimeType = typeInfo.mime;
    let ext = typeInfo.ext;
    let fileSize = file.size;

    // 2b. Chuẩn hoá favicon/logo (TODO 17) — trước blurhash để metadata khớp bản lưu.
    const processed = await this.preprocessImage(buffer, mimeType, dto.entityType);
    if (processed) {
      if (dto.entityType === 'shop_favicon') {
        await this.uploadFaviconVariants(shopId, buffer);
      }
      buffer = processed.buffer;
      mimeType = processed.mimeType;
      ext = processed.ext;
      fileSize = buffer.length;
    }

    let blurHash = null;
    let width = null;
    let height = null;

    // 3. Generate BlurHash if image
    if (mimeType.startsWith('image/')) {
      try {
        const image = sharp(buffer);
        const metadata = await image.metadata();
        width = metadata.width;
        height = metadata.height;

        const { data, info } = await image
          .raw()
          .ensureAlpha()
          .resize(32, 32, { fit: 'inside' })
          .toBuffer({ resolveWithObject: true });

        blurHash = encode(
          new Uint8ClampedArray(data),
          info.width,
          info.height,
          4,
          4,
        );
      } catch (err) {
        console.warn('Could not generate blurhash for image', err);
      }
    }

    // 4. Upload to MinIO — bucket + key theo loại ảnh:
    //    - giao diện  → shop-layouts/<shopId>/<uuid>.<ext>
    //    - sản phẩm   → shop-public/<shopId>/<productId>-<n>.<ext>
    //    - còn lại    → shop-public/<shopId>/<uuid>.<ext>
    const { bucket, key } = await this.buildObjectLocation(shopId, dto, ext);
    const publicUrl = await this.minioService.uploadFile(
      buffer,
      key,
      mimeType,
      bucket,
    );

    // 5. Save Media and Update Storage transactionally
    const media = await this.prisma.$transaction(async (tx) => {
      const mediaRecord = await tx.media.create({
        data: {
          shopId,
          url: publicUrl,
          key,
          bucket,
          mimeType,
          size: fileSize,
          width,
          height,
          blurHash,
          alt: file.originalname,
        },
      });

      await tx.shop.update({
        where: { id: shopId },
        data: {
          storageUsedBytes: { increment: fileSize },
        },
      });

      return mediaRecord;
    });

    return media;
  }

  async deleteMedia(id: string) {
    const shopId = this.getShopId();

    const media = await this.prisma.media.findFirst({
      where: { id, shopId },
    });
    if (!media) throw new NotFoundException('Media not found');

    // Xoá record + hoàn quota trước, xoá object MinIO sau khi commit —
    // nếu MinIO lỗi thì chỉ còn file mồ côi, không bao giờ có record treo
    await this.prisma.$transaction(async (tx) => {
      await tx.media.delete({ where: { id: media.id } });

      // Clamp về 0 để quota không âm nếu accounting từng bị lệch
      await tx.$executeRaw`
        UPDATE "shops"
        SET "storageUsedBytes" = GREATEST("storageUsedBytes" - ${media.size}, 0)
        WHERE "id" = ${shopId}
      `;
    });

    try {
      await this.minioService.deleteFile(media.key, media.bucket);
    } catch (err) {
      console.warn(
        `Media ${id} deleted from DB but MinIO object ${media.bucket}/${media.key} could not be removed`,
        err,
      );
    }

    return { status: 'deleted', id: media.id };
  }
}
