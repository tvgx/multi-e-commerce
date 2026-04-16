import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpStatus,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto, UpdateShopDto } from './dto/shop-zod.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';

@Controller('api/shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  async createShop(
    @Body() dto: CreateShopDto,
  ): Promise<BaseResponseDto<object>> {
    const userId = 'dev-user-123';
    return this.shopService.createShop(userId, dto);
  }

  @Get('my-shops')
  async getMyShops(): Promise<BaseResponseDto<object[]>> {
    const userId = 'dev-user-123';
    return this.shopService.getMyShops(userId);
  }

  @Get('resolve/:identifier')
  async resolveShop(
    @Param('identifier') identifier: string,
  ): Promise<BaseResponseDto<object>> {
    return this.shopService.resolveShop(identifier);
  }

  @Get(':id')
  async getShopSettings(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<object>> {
    return this.shopService.getShopSettings(id);
  }

  @Put(':id')
  async updateShop(
    @Param('id') id: string,
    @Body() dto: UpdateShopDto,
  ): Promise<BaseResponseDto<object>> {
    const userId = 'dev-user-123';
    return this.shopService.updateShop(userId, id, dto);
  }

  @Get(':id/onboarding')
  async getOnboarding(@Param('id') id: string): Promise<BaseResponseDto<any>> {
    return this.shopService.getOnboardingProgress(id);
  }

  @Put(':id/onboarding/complete/:step')
  async completeOnboardingStep(
    @Param('id') id: string,
    @Param('step') step: string,
  ): Promise<BaseResponseDto<any>> {
    return this.shopService.completeStep(id, parseInt(step));
  }

  @Get('system/all-shops')
  async getSystemAllShops(): Promise<BaseResponseDto<object[]>> {
    return this.shopService.getAllShops();
  }
}
