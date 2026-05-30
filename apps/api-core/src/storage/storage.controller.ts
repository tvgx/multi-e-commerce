import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  UseGuards,
  Req,
  Query,
  Inject,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MinioService } from './minio.service';
import { StorageQuotaService } from './storage-quota.service';
import { MediaService } from './media.service';
import { BetterAuthGuard } from '../modules/auth/guards/better-auth.guard';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Controller('storage')
export class StorageController {
  constructor(
    private readonly minioService: MinioService,
    private readonly storageQuotaService: StorageQuotaService,
    @Inject(MediaService) private readonly mediaService: MediaService,
  ) {}

  @Post('presigned-url')
  @UseGuards(BetterAuthGuard)
  async getPresignedUrl(
    @Req() req: any,
    @Body()
    body: {
      fileName: string;
      contentType: string;
      isPublic?: boolean;
      size?: number;
    },
  ) {
    const { fileName, contentType, isPublic = true, size } = body;
    const shopId = (req.headers['x-shop-id'] as string) || req.user?.shopId || 'default-shop';

    if (size) {
      await this.storageQuotaService.checkQuota(shopId, size);
    }

    const result = await this.minioService.getUploadPresignedUrl(
      shopId,
      fileName,
      contentType,
      isPublic,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Post('confirm-upload')
  @UseGuards(BetterAuthGuard)
  async confirmUpload(
    @Req() req: any,
    @Body()
    body: {
      key: string;
      size: number;
      bucket: string;
      mimeType?: string;
      width?: number;
      height?: number;
      alt?: string;
    },
  ) {
    const shopId = (req.headers['x-shop-id'] as string) || req.user?.shopId || 'default-shop';
    await this.storageQuotaService.recordUpload(shopId, body.size);

    const endpoint = process.env.MINIO_ENDPOINT ?? 'localhost';
    const port = process.env.MINIO_PORT ?? '9000';
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const url = `${protocol}://${endpoint}:${port}/${body.bucket}/${body.key}`;

    const media = await this.mediaService.createMediaRecord(shopId, {
      url,
      key: body.key,
      bucket: body.bucket,
      mimeType: body.mimeType || 'image/webp',
      size: body.size,
      width: body.width,
      height: body.height,
      alt: body.alt,
    });

    return BaseResponseDto.success(media);
  }

  @Post('upload')
  @UseGuards(BetterAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(
            new BadRequestException(
              'Only JPG, PNG and WebP files are allowed!',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadMedia(
    @Req() req: any,
    @UploadedFile() file: any,
    @Query('type') uploadType?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    let shopId = (req.headers['x-shop-id'] as string) || req.user?.shopId || 'default-shop';

    // Check quota
    await this.storageQuotaService.checkQuota(shopId, file.size);

    let minioPath = shopId;

    // Nếu upload type là avatar của customer
    if (uploadType === 'avatar') {
      const userId = req.user?.id || 'unknown-user';
      minioPath = `${shopId}/customers/${userId}`;
    }

    const uploadResult = await this.minioService.uploadMedia(
      minioPath,
      file.buffer,
      file.originalname,
    );

    // Record optimized physical storage usage (must use original shopId for DB)
    await this.storageQuotaService.recordUpload(shopId, uploadResult.size);

    // Save metadata registry in DB (must use original shopId for DB)
    const media = await this.mediaService.createMediaRecord(shopId, uploadResult);

    return BaseResponseDto.success(media);
  }

  @Post('upload/batch')
  @UseGuards(BetterAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      // Max 10 files
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(
            new BadRequestException(
              'Only JPG, PNG and WebP files are allowed!',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadMediaBatch(
    @Req() req: any,
    @UploadedFiles() files: any[],
    @Query('type') uploadType?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required');
    }

    let shopId = (req.headers['x-shop-id'] as string) || req.user?.shopId || 'default-shop';

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    await this.storageQuotaService.checkQuota(shopId, totalSize);

    let minioPath = shopId;

    if (uploadType === 'avatar') {
      const userId = req.user?.id || 'unknown-user';
      minioPath = `${shopId}/customers/${userId}`;
    }

    const uploadPromises = files.map((file) =>
      this.minioService.uploadMedia(minioPath, file.buffer, file.originalname),
    );

    const uploadResults = await Promise.all(uploadPromises);

    // Record total optimized physical size (must use original shopId for DB)
    const totalOptimizedSize = uploadResults.reduce((acc, r) => acc + r.size, 0);
    await this.storageQuotaService.recordUpload(shopId, totalOptimizedSize);

    // Save all metadata registries to DB (must use original shopId for DB)
    const mediaPromises = uploadResults.map((result) =>
      this.mediaService.createMediaRecord(shopId, result),
    );
    const mediaList = await Promise.all(mediaPromises);

    return BaseResponseDto.success(mediaList);
  }

  @Get('media')
  @UseGuards(BetterAuthGuard)
  async getMediaList(
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const shopId = (req.headers['x-shop-id'] as string) || req.user?.shopId || 'default-shop';
    return this.mediaService.getMediaList(
      shopId,
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0,
    );
  }

  @Delete('media/:id')
  @UseGuards(BetterAuthGuard)
  async deleteMedia(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.mediaService.deleteMedia(req.user?.id, id);
  }
}
