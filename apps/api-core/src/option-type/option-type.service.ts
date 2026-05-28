import { Injectable, HttpStatus, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOptionTypeDto, UpdateOptionTypeDto } from './dto/option-type-zod.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { TenantService } from '../common/services/tenant.service';

@Injectable()
export class OptionTypeService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TenantService) private readonly tenantService: TenantService,
  ) {}

  /**
   * Tạo OptionType mới đi kèm với các OptionValue
   */
  async createOptionType(ownerId: string, dto: CreateOptionTypeDto) {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Tenant identity unknown',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Xác nhận quyền sở hữu Shop
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop || shop.ownerId !== ownerId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Unauthorized to manage options for this shop',
        HttpStatus.FORBIDDEN,
      );
    }

    // Kiểm tra trùng tên OptionType trong cùng một shop
    const existing = await this.prisma.optionType.findFirst({
      where: {
        shopId,
        name: dto.name,
      },
    });

    if (existing) {
      throw new BadRequestException(`OptionType with name "${dto.name}" already exists for this shop`);
    }

    return this.prisma.optionType.create({
      data: {
        shopId,
        name: dto.name,
        presentation: dto.presentation,
        optionValues: {
          create: dto.values || [],
        },
      },
      include: {
        optionValues: true,
      },
    });
  }

  /**
   * Lấy toàn bộ danh sách OptionType của cửa hàng
   */
  async getAllOptionTypes(shopId?: string) {
    const targetShopId = shopId || this.tenantService.getTenantId();
    if (!targetShopId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Tenant identity unknown',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.optionType.findMany({
      where: { shopId: targetShopId },
      include: {
        optionValues: true,
      },
      orderBy: { name: 'asc' as any },
    });
  }

  /**
   * Cập nhật OptionType và đồng bộ an toàn các OptionValue
   */
  async updateOptionType(ownerId: string, id: string, dto: UpdateOptionTypeDto) {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Tenant identity unknown',
        HttpStatus.BAD_REQUEST,
      );
    }

    const optionType = await this.prisma.optionType.findUnique({
      where: { id },
      include: { optionValues: true },
    });

    if (!optionType) {
      throw new CustomException(
        ResponseCodes.NO_DATA_END_OF_LIST,
        'OptionType not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const shop = await this.prisma.shop.findUnique({
      where: { id: optionType.shopId },
    });

    if (!shop || shop.ownerId !== ownerId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Unauthorized to modify this option type',
        HttpStatus.FORBIDDEN,
      );
    }

    // Nếu thay đổi tên, check trùng tên
    if (dto.name && dto.name !== optionType.name) {
      const existing = await this.prisma.optionType.findFirst({
        where: {
          shopId,
          name: dto.name,
          id: { not: id },
        },
      });
      if (existing) {
        throw new BadRequestException(`OptionType with name "${dto.name}" already exists for this shop`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật thông tin cơ bản
      await tx.optionType.update({
        where: { id },
        data: {
          name: dto.name || undefined,
          presentation: dto.presentation || undefined,
        },
      });

      // 2. Đồng bộ danh sách các OptionValue nếu có truyền lên
      if (dto.values) {
        const existingValues = optionType.optionValues;
        const newValues = dto.values;

        // Xác định các giá trị cần xóa (có trong DB cũ nhưng không có trong dto mới)
        const newNames = newValues.map((v: any) => v.name);
        const valuesToDelete = existingValues.filter((v: any) => !newNames.includes(v.name));

        if (valuesToDelete.length > 0) {
          await tx.optionValue.deleteMany({
            where: {
              id: { in: valuesToDelete.map((v: any) => v.id) },
            },
          });
        }

        // Tạo mới hoặc cập nhật các giá trị trong DTO
        for (const val of newValues) {
          const matched = existingValues.find((v: any) => v.name === val.name);
          if (matched) {
            // Cập nhật presentation nếu có thay đổi
            await tx.optionValue.update({
              where: { id: matched.id },
              data: { presentation: val.presentation },
            });
          } else {
            // Tạo mới giá trị tùy chọn
            await tx.optionValue.create({
              data: {
                optionTypeId: id,
                name: val.name,
                presentation: val.presentation,
              },
            });
          }
        }
      }

      return tx.optionType.findUnique({
        where: { id },
        include: { optionValues: true },
      });
    });
  }
}
