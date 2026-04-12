import {
  Injectable,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TenantService } from '../common/services/tenant.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { CreatePageDto, UpdatePageDto } from './dto/pages-zod.dto';

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  async createPage(
    ownerId: string,
    dto: CreatePageDto,
  ): Promise<BaseResponseDto<any>> {
    try {
      const shopId = this.tenantService.getTenantId();
      if (!shopId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Tenant identity unknown',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verify ownership
      const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop || shop.ownerId !== ownerId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Not access.',
          HttpStatus.FORBIDDEN,
        );
      }

      // Check slug uniqueness
      const existing = await (this.prisma as any).shopPage.findUnique({
        where: { shopId_slug: { shopId, slug: dto.slug } },
      });
      if (existing) {
        throw new CustomException(
          ResponseCodes.URL_USER_IS_EXIST,
          'Slug already exists for this shop',
          HttpStatus.CONFLICT,
        );
      }

      const page = await (this.prisma as any).shopPage.create({
        data: {
          ...dto,
          shopId,
          sections: dto.sections,
        },
      });

      return BaseResponseDto.success(page);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to create shop page');
    }
  }

  async getPageBySlug(
    slug: string,
    shopId?: string,
  ): Promise<BaseResponseDto<any>> {
    const targetShopId = shopId || this.tenantService.getTenantId();
    if (!targetShopId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Tenant identity unknown',
        HttpStatus.BAD_REQUEST,
      );
    }

    const page = await this.prisma.shopPage.findUnique({
      where: { shopId_slug: { shopId: targetShopId, slug } },
    });

    if (!page || (!page.isVisible && !shopId)) {
      throw new CustomException(
        ResponseCodes.NO_DATA_END_OF_LIST,
        'Page not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return BaseResponseDto.success(page);
  }

  async updatePage(
    ownerId: string,
    id: string,
    dto: UpdatePageDto,
  ): Promise<BaseResponseDto<any>> {
    try {
      const page = await this.prisma.shopPage.findUnique({
        where: { id },
        include: { shop: true },
      });

      if (!page)
        throw new CustomException(
          ResponseCodes.NO_DATA_END_OF_LIST,
          'Page not found',
          HttpStatus.NOT_FOUND,
        );
      if (page.shop.ownerId !== ownerId)
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Not access.',
          HttpStatus.FORBIDDEN,
        );

      const updated = await this.prisma.shopPage.update({
        where: { id },
        data: {
          ...dto,
          sections: dto.sections,
        },
      });

      return BaseResponseDto.success(updated);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to update shop page');
    }
  }

  async getAllPagesByShop(shopId?: string): Promise<BaseResponseDto<any[]>> {
    const targetShopId = shopId || this.tenantService.getTenantId();
    if (!targetShopId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Tenant identity unknown',
        HttpStatus.BAD_REQUEST,
      );
    }

    const pages = await this.prisma.shopPage.findMany({
      where: { shopId: targetShopId },
    });

    return BaseResponseDto.success(pages);
  }
}
