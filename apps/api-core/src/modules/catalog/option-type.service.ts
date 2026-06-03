import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { CreateOptionTypeDto, UpdateOptionTypeDto } from './dto/option-type.dto';

@Injectable()
export class OptionTypeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) {
      throw new BadRequestException('Shop context is missing');
    }
    return shopId;
  }

  async findAll() {
    const shopId = this.getShopId();
    return this.prisma.optionType.findMany({
      where: { shopId },
      include: { optionValues: true },
    });
  }

  async findOne(id: string) {
    const shopId = this.getShopId();
    const optionType = await this.prisma.optionType.findFirst({
      where: { id, shopId },
      include: { optionValues: true },
    });
    if (!optionType) throw new NotFoundException('OptionType not found');
    return optionType;
  }

  async create(dto: CreateOptionTypeDto) {
    const shopId = this.getShopId();
    return this.prisma.optionType.create({
      data: {
        shopId,
        name: dto.name,
        presentation: dto.presentation,
      },
    });
  }

  async update(id: string, dto: UpdateOptionTypeDto) {
    const shopId = this.getShopId();
    await this.findOne(id); // verify ownership
    return this.prisma.optionType.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const shopId = this.getShopId();
    await this.findOne(id);
    return this.prisma.optionType.delete({
      where: { id },
    });
  }
}
