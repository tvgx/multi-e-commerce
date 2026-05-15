import {
  Injectable,
  HttpStatus,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TenantService } from '../common/services/tenant.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { CreatePageDto, UpdatePageDto } from './dto/pages-zod.dto';
import { LayoutService } from '../layout/layout.service';
import { PageLayout } from '@ecommerce/database';

@Injectable()
export class PagesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TenantService) private readonly tenantService: TenantService,
    @Inject(LayoutService) private readonly layoutService: LayoutService,
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
      const existing = await this.prisma.shopPage.findUnique({
        where: { shopId_slug: { shopId, slug: dto.slug } },
      });
      if (existing) {
        throw new CustomException(
          ResponseCodes.URL_USER_IS_EXIST,
          'Slug already exists for this shop',
          HttpStatus.CONFLICT,
        );
      }

      // 1. Create Metadata in Postgres (Registry)
      const page = await this.prisma.shopPage.create({
        data: {
          title: dto.title,
          slug: dto.slug,
          isVisible: dto.isVisible,
          shopId,
        },
      });

      // 2. Create/Publish Content in MongoDB using LayoutService
      await this.layoutService.publishPageLayout(ownerId, shopId, 'custom_page', {
        pageType: 'custom_page',
        slug: dto.slug,
        components: dto.sections || [],
      } as any);

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

    // Fetch content from MongoDB using shared model
    const layout = await PageLayout.findOne({
      shopId: targetShopId,
      pageType: 'custom_page',
      slug,
    }).lean();

    return BaseResponseDto.success({
      ...page,
      sections: layout?.publishedData?.['components'] || [],
    });
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

      // 1. Update Metadata in Postgres
      const updated = await this.prisma.shopPage.update({
        where: { id },
        data: {
          title: dto.title,
          slug: dto.slug,
          isVisible: dto.isVisible,
        },
      });

      // 2. Update Content in MongoDB if sections provided
      if (dto.sections || (dto.slug && dto.slug !== page.slug)) {
        await this.layoutService.publishPageLayout(ownerId, page.shopId, 'custom_page', {
          pageType: 'custom_page',
          slug: dto.slug || page.slug,
          components: dto.sections || [],
        } as any);
        
        // If slug changed, we should probably delete the old layout in Mongo
        if (dto.slug && dto.slug !== page.slug) {
            await PageLayout.deleteOne({ shopId: page.shopId, pageType: 'custom_page', slug: page.slug });
        }
      }

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
