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
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { CreateShopDto, UpdateShopDto } from './dto/shop-zod.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';

@Controller('api/shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  async createShop(
    @Session() session: UserSession,
    @Body() dto: CreateShopDto,
  ): Promise<BaseResponseDto<object>> {
    if (!session) {
      throw new CustomException(
        ResponseCodes.TOKEN_INVALID,
        'invalid token',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.shopService.createShop(session.user.id, dto);
  }

  @Get('my-shops')
  async getMyShops(
    @Session() session: UserSession,
  ): Promise<BaseResponseDto<object[]>> {
    if (!session) {
      throw new CustomException(
        ResponseCodes.TOKEN_INVALID,
        'invalid token',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.shopService.getMyShops(session.user.id);
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
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateShopDto,
  ): Promise<BaseResponseDto<object>> {
    if (!session) {
      throw new CustomException(
        ResponseCodes.TOKEN_INVALID,
        'invalid token',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.shopService.updateShop(session.user.id, id, dto);
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
