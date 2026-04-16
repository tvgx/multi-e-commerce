import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Inject,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto, UpdateShopDto, RegisterTenantDto } from './dto/shop-zod.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';

@Controller('api')
export class ShopController {
  constructor(
    @Inject(ShopService)
    private readonly shopService: ShopService,
  ) {
    this.registerTenant = this.registerTenant.bind(this);
    this.createShop = this.createShop.bind(this);
    this.getMyShops = this.getMyShops.bind(this);
    this.resolveShop = this.resolveShop.bind(this);
    this.getShopSettings = this.getShopSettings.bind(this);
    this.updateShop = this.updateShop.bind(this);
    this.getOnboarding = this.getOnboarding.bind(this);
    this.completeOnboardingStep = this.completeOnboardingStep.bind(this);
    this.getSystemAllShops = this.getSystemAllShops.bind(this);
  }

  // UC-01: Tenant Registration (New spec-compliant endpoint)
  @Post('v1/tenants/register')
  async registerTenant(
    @Body() dto: RegisterTenantDto,
  ): Promise<BaseResponseDto<object>> {
    return this.shopService.registerTenant(dto);
  }

  // Legacy endpoint (kept for backward compatibility during migration period)
  @Post('shops')
  async createShop(
    @Body() dto: CreateShopDto,
  ): Promise<BaseResponseDto<object>> {
    const userId = 'dev-user-123';
    return this.shopService.createShop(userId, dto);
  }

  @Get('shops/my-shops')
  async getMyShops(): Promise<BaseResponseDto<object[]>> {
    const userId = 'dev-user-123';
    return this.shopService.getMyShops(userId);
  }

  @Get('shops/resolve/:identifier')
  async resolveShop(
    @Param('identifier') identifier: string,
  ): Promise<BaseResponseDto<object>> {
    return this.shopService.resolveShop(identifier);
  }

  @Get('shops/:id')
  async getShopSettings(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<object>> {
    return this.shopService.getShopSettings(id);
  }

  @Put('shops/:id')
  async updateShop(
    @Param('id') id: string,
    @Body() dto: UpdateShopDto,
  ): Promise<BaseResponseDto<object>> {
    const userId = 'dev-user-123';
    return this.shopService.updateShop(userId, id, dto);
  }

  @Get('shops/:id/onboarding')
  async getOnboarding(@Param('id') id: string): Promise<BaseResponseDto<any>> {
    return this.shopService.getOnboardingProgress(id);
  }

  @Put('shops/:id/onboarding/complete/:step')
  async completeOnboardingStep(
    @Param('id') id: string,
    @Param('step') step: string,
  ): Promise<BaseResponseDto<any>> {
    return this.shopService.completeStep(id, parseInt(step));
  }

  @Get('shops/system/all-shops')
  async getSystemAllShops(): Promise<BaseResponseDto<object[]>> {
    return this.shopService.getAllShops();
  }
}
