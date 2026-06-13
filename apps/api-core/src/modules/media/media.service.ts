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
  'theme',
]);

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

  async uploadFile(file: any, dto: UploadMediaDto) {
    const shopId = this.getShopId();
    const buffer = file.buffer;

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
    const mimeType = typeInfo.mime;

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
    const { bucket, key } = await this.buildObjectLocation(
      shopId,
      dto,
      typeInfo.ext,
    );
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
          size: file.size,
          width,
          height,
          blurHash,
          alt: file.originalname,
        },
      });

      await tx.shop.update({
        where: { id: shopId },
        data: {
          storageUsedBytes: { increment: file.size },
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
