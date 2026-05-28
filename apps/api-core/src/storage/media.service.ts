import { Injectable, HttpStatus, Inject, BadRequestException, forwardRef } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MinioService } from './minio.service';
import { StorageQuotaService } from './storage-quota.service';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Injectable()
export class MediaService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MinioService) private readonly minioService: MinioService,
    @Inject(StorageQuotaService) private readonly storageQuotaService: StorageQuotaService,
  ) {}

  /**
   * Tạo bản ghi Media trong cơ sở dữ liệu
   */
  async createMediaRecord(
    shopId: string,
    metadata: {
      url: string;
      key: string;
      bucket: string;
      mimeType: string;
      size: number;
      width?: number;
      height?: number;
      alt?: string;
    },
  ) {
    return this.prisma.media.create({
      data: {
        shopId,
        url: metadata.url,
        key: metadata.key,
        bucket: metadata.bucket,
        mimeType: metadata.mimeType,
        size: metadata.size,
        width: metadata.width || null,
        height: metadata.height || null,
        alt: metadata.alt || null,
      },
    });
  }

  /**
   * Lấy danh sách ảnh của Shop (phân trang)
   */
  async getMediaList(
    shopId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<BaseResponseDto<any[]>> {
    const mediaList = await this.prisma.media.findMany({
      where: { shopId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' as any },
    });

    return BaseResponseDto.success(mediaList);
  }

  /**
   * Xóa tài nguyên Media (đồng bộ S3 và hoàn trả quota)
   */
  async deleteMedia(ownerId: string, mediaId: string): Promise<BaseResponseDto<any>> {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: { shop: true },
    });

    if (!media) {
      throw new CustomException(
        ResponseCodes.NO_DATA_END_OF_LIST,
        'Media asset not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Xác nhận quyền sở hữu Shop của Owner
    if (media.shop.ownerId !== ownerId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Unauthorized to delete this media asset',
        HttpStatus.FORBIDDEN,
      );
    }

    // Tiến hành xóa theo quy trình transaction-safe dạng tuần tự
    try {
      // 1. Xóa vật lý trên S3/MinIO
      await this.minioService.deleteObject(media.bucket, media.key);

      // 2. Trừ quota lưu trữ đã dùng của Shop
      await this.storageQuotaService.recordDeletion(media.shopId, media.size);

      // 3. Xóa bản ghi trong DB
      const deleted = await this.prisma.media.delete({
        where: { id: mediaId },
      });

      return BaseResponseDto.success(deleted);
    } catch (error) {
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to delete media asset from storage',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
