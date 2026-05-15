import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import {
  CreateShopDto,
  UpdateShopDto,
  RegisterTenantDto,
} from './dto/shop-zod.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { BetterAuthGuard } from '../modules/auth/guards/better-auth.guard';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';
import { Public } from '../modules/auth/decorators/public.decorator';

@Controller('api')
@UseGuards(BetterAuthGuard)
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
  @Public()
  @Post('v1/tenants/register')
  async registerTenant(
    @Body() dto: RegisterTenantDto,
  ): Promise<BaseResponseDto<object>> {
    return this.shopService.registerTenant(dto);
  }

  // Legacy endpoint (kept for backward compatibility during migration period)
  @Post('shops')
  async createShop(
    @CurrentUser() user: any,
    @Body() dto: CreateShopDto,
  ): Promise<BaseResponseDto<object>> {
    return this.shopService.createShop(user.id, dto);
  }

  @Get('shops/my-shops')
  async getMyShops(
    @CurrentUser() user: any,
  ): Promise<BaseResponseDto<object[]>> {
    return this.shopService.getMyShops(user.id);
  }

  @Public()
  @Get('shops/resolve/:identifier')
  async resolveShop(
    @Param('identifier') identifier: string,
  ): Promise<BaseResponseDto<object>> {
    return this.shopService.resolveShop(identifier);
  }

  @Public()
  @Get('shops/:id')
  async getShopSettings(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<object>> {
    return this.shopService.getShopSettings(id);
  }

  @Put('shops/:id')
  async updateShop(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateShopDto,
  ): Promise<BaseResponseDto<object>> {
    return this.shopService.updateShop(user.id, id, dto);
  }

  @Get('shops/:id/onboarding')
  async getOnboarding(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<BaseResponseDto<any>> {
    return this.shopService.getOnboardingProgress(user.id, id);
  }

  @Put('shops/:id/onboarding/complete/:step')
  async completeOnboardingStep(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('step') step: string,
  ): Promise<BaseResponseDto<any>> {
    return this.shopService.completeStep(user.id, id, parseInt(step));
  }

  @Get('shops/system/all-shops')
  async getSystemAllShops(): Promise<BaseResponseDto<object[]>> {
    return this.shopService.getAllShops();
  }
}
