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
import {
  CreateNavigationDto,
  UpdateNavigationDto,
} from './dto/navigation-zod.dto';

@Injectable()
export class NavigationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  async createMenu(
    ownerId: string,
    dto: CreateNavigationDto,
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

      const menu = await (this.prisma as any).navigationMenu.create({
        data: {
          shopId,
          handle: dto.handle,
          title: dto.title,
          items: dto.items,
        },
      });

      return BaseResponseDto.success(menu);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException(
        'Failed to create navigation menu',
      );
    }
  }

  async getMenuByHandle(
    handle: string,
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

    const menu = await (this.prisma as any).navigationMenu.findUnique({
      where: { shopId_handle: { shopId: targetShopId, handle } },
    });

    if (!menu) {
      throw new CustomException(
        ResponseCodes.NO_DATA_END_OF_LIST,
        'Menu not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return BaseResponseDto.success(menu);
  }

  async updateMenu(
    ownerId: string,
    id: string,
    dto: UpdateNavigationDto,
  ): Promise<BaseResponseDto<any>> {
    try {
      const menu = await this.prisma.navigationMenu.findUnique({
        where: { id },
        include: { shop: true },
      });

      if (!menu)
        throw new CustomException(
          ResponseCodes.NO_DATA_END_OF_LIST,
          'Menu not found',
          HttpStatus.NOT_FOUND,
        );
      if (menu.shop.ownerId !== ownerId)
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Not access.',
          HttpStatus.FORBIDDEN,
        );

      const updated = await (this.prisma as any).navigationMenu.update({
        where: { id },
        data: {
          title: dto.title,
          items: dto.items,
        },
      });

      return BaseResponseDto.success(updated);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException(
        'Failed to update navigation menu',
      );
    }
  }

  async getAllMenusByShop(shopId?: string): Promise<BaseResponseDto<any[]>> {
    const targetShopId = shopId || this.tenantService.getTenantId();
    if (!targetShopId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Tenant identity unknown',
        HttpStatus.BAD_REQUEST,
      );
    }

    const menus = await (this.prisma as any).navigationMenu.findMany({
      where: { shopId: targetShopId },
    });

    return BaseResponseDto.success(menus);
  }
}
