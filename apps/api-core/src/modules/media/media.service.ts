import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantService } from '../../common/services/tenant.service';
import { UploadMediaDto } from './dto/media.dto';
import { MinioService } from '../../common/services/minio.service';
import { PrismaService } from '../../database/prisma.service';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { encode } from 'blurhash';

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

         blurHash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
       } catch (err) {
         console.warn('Could not generate blurhash for image', err);
       }
    }

    // 4. Upload to MinIO
    // minioService.uploadFile expects (buffer, filename, mimetype)
    const publicUrl = await this.minioService.uploadFile(buffer, file.originalname, mimeType);

    // Extract filename/key from publicUrl assuming it's the last part
    const key = publicUrl.split('/').pop() || file.originalname;

    // 5. Save Media and Update Storage transactionally
    const media = await this.prisma.$transaction(async (tx) => {
       const mediaRecord = await tx.media.create({
         data: {
           shopId,
           url: publicUrl,
           key,
           bucket: this.minioService.getBucketName(),
           mimeType,
           size: file.size,
           width,
           height,
           blurHash,
           alt: file.originalname,
         }
       });

       await tx.shop.update({
         where: { id: shopId },
         data: {
           storageUsedBytes: { increment: file.size }
         }
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
      console.warn(`Media ${id} deleted from DB but MinIO object ${media.bucket}/${media.key} could not be removed`, err);
    }

    return { status: 'deleted', id: media.id };
  }
}

