import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UpdateBankDto } from './dto/update-bank.dto';

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  async getCurrentShop() {
    const shopId = this.getShopId();
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: { bankAccount: true },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  async updateCurrentShop(dto: UpdateShopDto) {
    const shopId = this.getShopId();
    return this.prisma.shop.update({
      where: { id: shopId },
      data: dto,
    });
  }

  async updateBankAccount(dto: UpdateBankDto) {
    const shopId = this.getShopId();
    return this.prisma.shopBankAccount.upsert({
      where: { shopId },
      create: {
        shopId,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountHolder: dto.accountHolder,
      },
      update: {
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountHolder: dto.accountHolder,
      },
    });
  }
}

