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

@Injectable()
export class ShippingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  async getShippingSettings(shopId?: string): Promise<BaseResponseDto<any>> {
    const targetShopId = shopId || this.tenantService.getTenantId();
    // Implementation placeholder for Step 7
    return BaseResponseDto.success({
      enabled: true,
      methods: [
        { id: 'standard', name: 'Standard Shipping', price: 30000 },
        { id: 'express', name: 'Express Shipping', price: 50000 },
      ],
    });
  }

  async calculateShipping(
    totalWeightKg: number,
    methodId: string,
    shopId: string,
  ): Promise<number> {
    const settings = await this.getShippingSettings(shopId);
    const method =
      settings.data.methods.find((m: any) => m.id === methodId) ||
      settings.data.methods[0];
    const basePrice = method?.price || 30000;

    let weightSurcharge = 0;
    if (totalWeightKg > 1) {
      weightSurcharge = Math.ceil(totalWeightKg - 1) * 5000;
    }

    return basePrice + weightSurcharge;
  }

  async updateShippingSettings(
    ownerId: string,
    data: any,
  ): Promise<BaseResponseDto<any>> {
    const shopId = this.tenantService.getTenantId();
    // Update shop onboarding status when settings are saved
    const shop = await (this.prisma as any).shop.findUnique({
      where: { id: shopId },
    });
    await (this.prisma as any).shop.update({
      where: { id: shopId },
      data: {
        onboardingStatus: {
          ...(shop?.onboardingStatus || {}),
          step7: 'COMPLETED',
        },
      },
    });
    return BaseResponseDto.success({ success: true });
  }
}
