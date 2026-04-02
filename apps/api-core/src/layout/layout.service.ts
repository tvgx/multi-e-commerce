import { Injectable, HttpStatus, Logger } from '@nestjs/common'; // trigger rebuild
import { PrismaService } from '../database/prisma.service';
import { ShopTemplate } from '@ecommerce/database';
import { mergeLayouts } from './merger.utils';
import { MinioService } from '../storage/minio.service';
import {
  StandardTemplate,
  VisualTemplate,
  TechnicalTemplate,
  ServiceTemplate,
} from '@ecommerce/master-templates';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';

@Injectable()
export class LayoutService {
  private readonly logger = new Logger(LayoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  async publishLayout(ownerId: string, shopId: string, tenantDelta: any): Promise<BaseResponseDto<any>> {
    try {
      // 1. Auth check
      const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) throw new CustomException(ResponseCodes.URL_USER_IS_EXIST, 'Shop not found', HttpStatus.NOT_FOUND);
      if (shop.ownerId !== ownerId) throw new CustomException(ResponseCodes.NOT_ACCESS, 'Not access.', HttpStatus.FORBIDDEN);

      // 2. Resolve Master Template based on templateType
      let masterTemplate: any = {};
      const templateType = tenantDelta.templateType || shop.templateType || 'standard';

      switch (templateType) {
        case 'standard': masterTemplate = StandardTemplate; break;
        case 'visual': masterTemplate = VisualTemplate; break;
        case 'technical': masterTemplate = TechnicalTemplate; break;
        case 'service': masterTemplate = ServiceTemplate; break;
        default: masterTemplate = StandardTemplate;
      }

      // 3. Merge
      const finalLayout = mergeLayouts(masterTemplate, tenantDelta);

      // 4. Update MongoDB
      await ShopTemplate.updateOne(
        { shopId },
        { $set: { publishedData: tenantDelta, lastPublishedAt: new Date() } },
        { upsert: true }
      );

      // 5. Update Postgres L2 Cache
      await this.prisma.mergedLayoutsCache.upsert({
        where: { shopId },
        update: { layoutJson: finalLayout as any, lastSyncedAt: new Date() },
        create: { shopId, layoutJson: finalLayout as any },
      });

      // 6. Tích hợp MinIO Storage
      // Đẩy JSON đã compiled trực tiếp lên MinIO S3
      await this.minioService.saveLayout(shopId, finalLayout).catch(err => {
        this.logger.error(`[publishLayout] Failed to save layout to MinIO for shop ${shopId}`, err?.stack || err);
        // Không block flow chính nếu MinIO sập, chỉ log lỗi. Postgres Cache đã lưu an toàn.
      });

      return BaseResponseDto.success({ published: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(ResponseCodes.EXCEPTION_ERROR, 'Exception error.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getLayoutByDomain(domain: string): Promise<BaseResponseDto<any>> {
    // 1. Phân giải domain ra shopId (truy vấn DB rất nhanh do index Unique Domain)
    const shop = await this.prisma.shop.findUnique({
      where: { domain },
      select: { id: true }
    });

    if (!shop) {
      throw new CustomException(ResponseCodes.URL_USER_IS_EXIST, 'Domain is not exist.', HttpStatus.NOT_FOUND);
    }

    // 2. Chuyển hướng lấy Layout bằng shopId (đã tối ưu MinIO S3)
    return this.getCompiledLayout(shop.id);
  }

  async getCompiledLayout(shopId: string): Promise<BaseResponseDto<any>> {
    // Step 1: Ưu tiên truy xuất Layout từ MinIO Storage cho hiệu năng cao nhất
    try {
      const minioLayout = await this.minioService.getLayout(shopId);
      if (minioLayout) {
        return BaseResponseDto.success(minioLayout);
      }
    } catch (e) {
      this.logger.warn(`[getCompiledLayout] MinIO miss or error for shopId: ${shopId}, falling back to Postgres DB Cache.`, e);
    }

    // Step 2: Fallback an toàn về Backend Database Cache (PostgreSQL L2)
    const cache = await this.prisma.mergedLayoutsCache.findUnique({
      where: { shopId },
    });

    if (!cache) {
      throw new CustomException(ResponseCodes.NO_DATA_END_OF_LIST, 'No Data', HttpStatus.NOT_FOUND);
    }

    // Step 3: "Tự Phục Hồi" (Self-heal) MinIO bất đồng bộ để các request sau lấy thẳng từ S3
    this.minioService.saveLayout(shopId, cache.layoutJson as object).catch((e) => {
      this.logger.error(`[getCompiledLayout - Self-heal] Failed to refill MinIO for shopId: ${shopId}`, e);
    });

    return BaseResponseDto.success(cache.layoutJson);
  }
}
