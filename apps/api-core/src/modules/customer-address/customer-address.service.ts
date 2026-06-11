import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/customer-address.dto';

@Injectable()
export class CustomerAddressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  async findAll(customerId: string) {
    const shopId = this.getShopId();
    const items = await this.prisma.customerAddress.findMany({
      where: { shopId, customerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return { data: items };
  }

  async create(customerId: string, dto: CreateAddressDto) {
    const shopId = this.getShopId();

    // App không bật global ValidationPipe nên DTO decorators không chạy — check tay
    for (const field of ['fullName', 'phone', 'addressLine1', 'city', 'province'] as const) {
      if (!dto[field] || typeof dto[field] !== 'string') {
        throw new BadRequestException(`${field} is required`);
      }
    }

    const existingCount = await this.prisma.customerAddress.count({
      where: { shopId, customerId },
    });
    // Địa chỉ đầu tiên luôn là mặc định
    const isDefault = existingCount === 0 ? true : !!dto.isDefault;

    const address = await this.prisma.$transaction(async (tx) => {
      if (isDefault && existingCount > 0) {
        await tx.customerAddress.updateMany({
          where: { shopId, customerId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.customerAddress.create({
        data: {
          shopId,
          customerId,
          fullName: dto.fullName,
          phone: dto.phone,
          addressLine1: dto.addressLine1,
          city: dto.city,
          province: dto.province,
          postalCode: dto.postalCode,
          isDefault,
        },
      });
    });

    return { status: 'created', address };
  }

  async update(customerId: string, id: string, dto: UpdateAddressDto) {
    const shopId = this.getShopId();
    const existing = await this.prisma.customerAddress.findFirst({
      where: { id, shopId, customerId },
    });
    if (!existing) throw new NotFoundException('Address not found');

    const address = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true && !existing.isDefault) {
        await tx.customerAddress.updateMany({
          where: { shopId, customerId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.customerAddress.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          addressLine1: dto.addressLine1,
          city: dto.city,
          province: dto.province,
          postalCode: dto.postalCode,
          isDefault: dto.isDefault,
        },
      });
    });

    return { status: 'updated', address };
  }

  async remove(customerId: string, id: string) {
    const shopId = this.getShopId();
    const existing = await this.prisma.customerAddress.findFirst({
      where: { id, shopId, customerId },
    });
    if (!existing) throw new NotFoundException('Address not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.customerAddress.delete({ where: { id } });

      // Xoá địa chỉ mặc định: đưa địa chỉ mới nhất còn lại lên làm mặc định
      if (existing.isDefault) {
        const next = await tx.customerAddress.findFirst({
          where: { shopId, customerId },
          orderBy: { createdAt: 'desc' },
        });
        if (next) {
          await tx.customerAddress.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return { status: 'deleted', id };
  }

  async setDefault(customerId: string, id: string) {
    const shopId = this.getShopId();
    const existing = await this.prisma.customerAddress.findFirst({
      where: { id, shopId, customerId },
    });
    if (!existing) throw new NotFoundException('Address not found');

    const address = await this.prisma.$transaction(async (tx) => {
      await tx.customerAddress.updateMany({
        where: { shopId, customerId, isDefault: true },
        data: { isDefault: false },
      });
      return tx.customerAddress.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    return { status: 'updated', address };
  }
}
