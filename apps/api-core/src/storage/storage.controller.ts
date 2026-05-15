import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MinioService } from './minio.service';
import { StorageQuotaService } from './storage-quota.service';
import { BetterAuthGuard } from '../modules/auth/guards/better-auth.guard';

@Controller('storage')
export class StorageController {
  constructor(
    private readonly minioService: MinioService,
    private readonly storageQuotaService: StorageQuotaService,
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
    const shopId = req.user?.shopId || 'default-shop';

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
    @Body() body: { key: string; size: number; bucket: string },
  ) {
    const shopId = req.user?.shopId || 'default-shop';
    await this.storageQuotaService.recordUpload(shopId, body.size);

    return {
      success: true,
      message: 'Upload confirmed and quota updated',
    };
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

    let shopId = req.user?.shopId || 'default-shop';

    // Check quota
    await this.storageQuotaService.checkQuota(shopId, file.size);

    // Nếu upload type là avatar của customer
    if (uploadType === 'avatar') {
      const userId = req.user?.id || 'unknown-user';
      shopId = `${shopId}/customers/${userId}`;
    }

    const url = await this.minioService.uploadMedia(
      shopId,
      file.buffer,
      file.originalname,
    );

    // Record usage
    await this.storageQuotaService.recordUpload(shopId, file.size);

    return {
      success: true,
      url,
      message: 'File uploaded successfully',
    };
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

    let shopId = req.user?.shopId || 'default-shop';

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    await this.storageQuotaService.checkQuota(shopId, totalSize);

    if (uploadType === 'avatar') {
      const userId = req.user?.id || 'unknown-user';
      shopId = `${shopId}/customers/${userId}`;
    }

    const uploadPromises = files.map((file) =>
      this.minioService.uploadMedia(shopId, file.buffer, file.originalname),
    );

    const urls = await Promise.all(uploadPromises);

    // Record total usage
    await this.storageQuotaService.recordUpload(shopId, totalSize);

    return {
      success: true,
      urls,
      message: `${files.length} files uploaded successfully`,
    };
  }
}
