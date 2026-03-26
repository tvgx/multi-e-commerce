import { Injectable, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ShopTemplate } from '@ecommerce/database';
import { CreateShopDto, UpdateShopDto } from './dto/shop.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { TenantService } from '../common/services/tenant.service';

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  async createShop(ownerId: string, dto: CreateShopDto): Promise<BaseResponseDto<object>> {
    try {
      // 1. Check domain availability
      if (dto.domain) {
        const existing = await this.prisma.shop.findUnique({
          where: { domain: dto.domain },
        });
        if (existing) {
          throw new CustomException(ResponseCodes.URL_USER_IS_EXIST, "Url User's is exist.", HttpStatus.CONFLICT);
        }
      }

      // 2. Create in Postgres
      const shop = await this.prisma.shop.create({
        data: {
          name: dto.name,
          domain: dto.domain,
          ownerId: ownerId,
          status: 'DRAFT',
          productsPerPage: dto.productsPerPage ?? 30,
        },
      });

      // 3. Initialize in MongoDB (Zero-file Layout Engine)
      const template = new ShopTemplate({
        shopId: shop.id,
        publishedData: {},
        draftData: {},
      });
      await template.save();

      return BaseResponseDto.success(shop);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to create shop');
    }
  }

  async updateShop(ownerId: string, shopId: string, dto: UpdateShopDto): Promise<BaseResponseDto<object>> {
    try {
      const currentShopId = this.tenantService.getTenantId();
      const targetId = shopId || currentShopId;

      if (!targetId) {
        throw new CustomException(ResponseCodes.NOT_ACCESS, 'Tenant identity unknown', HttpStatus.BAD_REQUEST);
      }

      const shop = await this.prisma.shop.findUnique({ where: { id: targetId } });
      if (!shop) throw new CustomException(ResponseCodes.NO_DATA_END_OF_LIST, 'No Data or end of list data', HttpStatus.NOT_FOUND);

      if (shop.ownerId !== ownerId) {
        throw new CustomException(ResponseCodes.NOT_ACCESS, 'không có quyền truy cập tài nguyên', HttpStatus.FORBIDDEN);
      }

      const updated = await this.prisma.shop.update({
        where: { id: targetId },
        data: { ...dto },
      });

      return BaseResponseDto.success(updated);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to update shop');
    }
  }

  async getShopSettings(shopId: string): Promise<BaseResponseDto<object>> {
    const currentShopId = this.tenantService.getTenantId();
    const targetId = shopId || currentShopId;

    if (!targetId) {
      throw new CustomException(ResponseCodes.NOT_ACCESS, 'Tenant identity unknown', HttpStatus.BAD_REQUEST);
    }

    const shop = await this.prisma.shop.findUnique({
      where: { id: targetId },
      include: {
        owner: {
          select: { fullName: true, email: true },
        },
      },
    });

    if (!shop) {
      throw new CustomException(ResponseCodes.NO_DATA_END_OF_LIST, 'No Data or end of list data', HttpStatus.NOT_FOUND);
    }

    const template = (await ShopTemplate.findOne({ shopId: targetId }, { publishedData: 1, _id: 0 }).lean()) as {
      publishedData?: Record<string, unknown>;
    };

    return BaseResponseDto.success({
      metadata: shop,
      uiStructure: template?.publishedData || null,
    });
  }

  async getMyShops(ownerId: string): Promise<BaseResponseDto<any>> {
    const shops = await this.prisma.shop.findMany({
      where: { ownerId },
    });
    return BaseResponseDto.success(shops);
  }

  async getAllShops(): Promise<BaseResponseDto<any>> {
    const shops = await this.prisma.shop.findMany({
      include: {
        owner: {
          select: { fullName: true, email: true },
        },
      },
    });
    return BaseResponseDto.success(shops);
  }
}
