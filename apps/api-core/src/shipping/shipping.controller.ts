import { Controller, Get, Put, Body, UseGuards, Query } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { BetterAuthGuard } from '../modules/auth/guards/better-auth.guard';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';
import { Public } from '../modules/auth/decorators/public.decorator';

@Controller('shipping')
@UseGuards(BetterAuthGuard)
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Public()
  @Get()
  async getSettings(
    @Query('shopId') shopId?: string,
  ): Promise<BaseResponseDto<any>> {
    return this.shippingService.getShippingSettings(shopId);
  }

  @Put()
  async updateSettings(
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<BaseResponseDto<any>> {
    return this.shippingService.updateShippingSettings(user.id, body);
  }
}
