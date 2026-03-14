import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ShopTemplate } from '@ecommerce/database';
import { mergeLayouts } from './merger.utils';
import {
  FashionTemplate,
  HomeAppliancesTemplate,
  MomAndBabyTemplate,
  ReadyToEatTemplate,
} from '@ecommerce/master-templates';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';

@Injectable()
export class LayoutService {
  private readonly logger = new Logger(LayoutService.name);

  constructor(private readonly prisma: PrismaService) {}

  async publishLayout(ownerId: string, shopId: string, tenantDelta: any): Promise<BaseResponseDto<any>> {
    try {
      // 1. Auth check
      const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) throw new CustomException(ResponseCodes.URL_USER_IS_EXIST, 'Shop not found', HttpStatus.NOT_FOUND);
      if (shop.ownerId !== ownerId) throw new CustomException(ResponseCodes.NOT_ACCESS, 'Not access.', HttpStatus.FORBIDDEN);

      // 2. Resolve Master Template
      let masterTemplate: any = {};
      if (tenantDelta.baseLayoutId) {
        switch (tenantDelta.baseLayoutId) {
          case 'MASTER_FASHION': masterTemplate = FashionTemplate; break;
          case 'MASTER_HOME_APPLIANCES': masterTemplate = HomeAppliancesTemplate; break;
          case 'MASTER_MOM_AND_BABY': masterTemplate = MomAndBabyTemplate; break;
          case 'MASTER_READY_TO_EAT': masterTemplate = ReadyToEatTemplate; break;
        }
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

      return BaseResponseDto.success({ published: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(ResponseCodes.EXCEPTION_ERROR, 'Exception error.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getLayoutByDomain(domain: string): Promise<BaseResponseDto<any>> {
    const shop = await this.prisma.shop.findUnique({
      where: { domain },
      include: { mergedLayoutsCache: true },
    });

    if (!shop || !shop.mergedLayoutsCache) {
      throw new CustomException(ResponseCodes.URL_USER_IS_EXIST, 'Domain is not exist.', HttpStatus.NOT_FOUND);
    }

    return BaseResponseDto.success(shop.mergedLayoutsCache.layoutJson);
  }

  async getCompiledLayout(shopId: string): Promise<BaseResponseDto<any>> {
    const cache = await this.prisma.mergedLayoutsCache.findUnique({
      where: { shopId },
    });

    if (!cache) {
      throw new CustomException(ResponseCodes.NO_DATA_END_OF_LIST, 'No Data', HttpStatus.NOT_FOUND);
    }

    return BaseResponseDto.success(cache.layoutJson);
  }
}
