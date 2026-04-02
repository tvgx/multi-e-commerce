import { Controller, Get, Put, Body, UseGuards, Param, Query } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { Session } from '@thallesp/nestjs-better-auth';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get()
  async getSettings(
    @Session() session: any,
    @Query('shopId') shopId?: string,
  ): Promise<BaseResponseDto<any>> {
    return this.shippingService.getShippingSettings(shopId);
  }

  @Put()
  async updateSettings(
    @Session() session: any,
    @Body() body: any,
  ): Promise<BaseResponseDto<any>> {
    return this.shippingService.updateShippingSettings(session.user.id, body);
  }
}
