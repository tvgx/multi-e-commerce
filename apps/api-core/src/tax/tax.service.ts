import {
  Injectable,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TenantService } from '../common/services/tenant.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Injectable()
export class TaxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  async getTaxSettings(shopId?: string): Promise<BaseResponseDto<any>> {
    const targetShopId = shopId || this.tenantService.getTenantId();
    // Implementation placeholder for Step 7
    return BaseResponseDto.success({
      taxIncluded: true,
      rates: [{ country: 'VN', rate: 10 }],
    });
  }

  async calculateTax(
    itemTotal: number,
    shopId: string,
  ): Promise<{ taxTotal: number; taxIncluded: boolean; rate: number }> {
    const settings = await this.getTaxSettings(shopId);
    const rate = settings.data.rates[0]?.rate || 10;
    const taxIncluded = settings.data.taxIncluded;

    let taxTotal = 0;
    if (taxIncluded) {
      taxTotal = itemTotal - itemTotal / (1 + rate / 100);
    } else {
      taxTotal = itemTotal * (rate / 100);
    }

    return {
      taxTotal: Math.round(taxTotal * 100) / 100, // round to 2 decimal places
      taxIncluded,
      rate,
    };
  }

  async updateTaxSettings(
    ownerId: string,
    data: any,
  ): Promise<BaseResponseDto<any>> {
    const shopId = this.tenantService.getTenantId();
    // Update shop onboarding status
    const shop = await (this.prisma as any).shop.findUnique({
      where: { id: shopId },
    });
    await (this.prisma as any).shop.update({
      where: { id: shopId },
      data: {
        onboardingStatus: {
          ...(shop?.onboardingStatus || {}),
          step7_tax: 'COMPLETED',
        },
      },
    });
    return BaseResponseDto.success({ success: true });
  }
}
