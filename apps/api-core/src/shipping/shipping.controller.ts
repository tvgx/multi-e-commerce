import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get()
  async getSettings(
    @Query('shopId') shopId?: string,
  ): Promise<BaseResponseDto<any>> {
    return this.shippingService.getShippingSettings(shopId);
  }

  @Put()
  async updateSettings(@Body() body: any): Promise<BaseResponseDto<any>> {
    const userId = 'dev-user-123';
    return this.shippingService.updateShippingSettings(userId, body);
  }
}
