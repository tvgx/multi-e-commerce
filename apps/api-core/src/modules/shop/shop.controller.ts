import { Controller, Get, Post, Patch, Body, UseGuards, Req, Param } from '@nestjs/common';
import { ShopService } from './shop.service';
import type { CreateShopDto } from './shop.service';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { UpdatePaymentMethodsDto } from './dto/update-payment-methods.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) { }

  // ─── PUBLIC endpoints (Storefront) ───────────────────────────────

  @Public()
  @Get('resolve/:identifier')
  async resolveShop(@Param('identifier') identifier: string): Promise<BaseResponseDto<any>> {
    const shop = await this.shopService.resolveShop(identifier);
    return BaseResponseDto.success(shop);
  }

  @Public()
  @Get('bootstrap/:identifier')
  async getShopBootstrapData(@Param('identifier') identifier: string): Promise<BaseResponseDto<any>> {
    const data = await this.shopService.getShopBootstrapData(identifier);
    return BaseResponseDto.success(data);
  }

  // ─── AUTHENTICATED endpoints (Admin) ─────────────────────────────

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get('my-shops')
  async getMyShops(@Req() req: any): Promise<BaseResponseDto<any>> {
    const shops = await this.shopService.getMyShops(req.user?.id);
    return BaseResponseDto.success(shops);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Post()
  async createShop(@Req() req: any, @Body() dto: CreateShopDto): Promise<BaseResponseDto<any>> {
    const shop = await this.shopService.createShop(req.user?.id, dto);
    return BaseResponseDto.success(shop);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get('current')
  async getCurrentShop(): Promise<BaseResponseDto<any>> {
    const shop = await this.shopService.getCurrentShop();
    return BaseResponseDto.success(shop);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Patch('current')
  async updateCurrentShop(@Body() dto: UpdateShopDto): Promise<BaseResponseDto<any>> {
    const shop = await this.shopService.updateCurrentShop(dto);
    return BaseResponseDto.success(shop);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Patch('bank-account')
  async updateBankAccount(@Body() dto: UpdateBankDto): Promise<BaseResponseDto<any>> {
    const account = await this.shopService.updateBankAccount(dto);
    return BaseResponseDto.success(account);
  }

  // ─── DYNAMIC PARAMETER endpoints (MUST BE AT THE END) ────────────

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get(':shopId/onboarding')
  async getOnboardingProgress(@Param('shopId') shopId: string): Promise<BaseResponseDto<any>> {
    const data = await this.shopService.getOnboardingProgress(shopId);
    return BaseResponseDto.success(data);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Patch(':shopId/onboarding/complete/:step')
  async completeOnboardingStep(@Param('shopId') shopId: string, @Param('step') step: string): Promise<BaseResponseDto<any>> {
    const data = await this.shopService.completeOnboardingStep(shopId, parseInt(step, 10));
    return BaseResponseDto.success(data);
  }

  // Địa chỉ kho hàng mặc định (trang Billing & Shipping)
  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Patch(':shopId/warehouse')
  async updateWarehouse(@Param('shopId') shopId: string, @Body() dto: UpdateWarehouseDto): Promise<BaseResponseDto<any>> {
    const data = await this.shopService.upsertWarehouse(shopId, dto);
    return BaseResponseDto.success(data);
  }

  // Bật/tắt phương thức thanh toán cơ bản (COD, Chuyển khoản)
  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Patch(':shopId/payment-methods')
  async updatePaymentMethods(@Param('shopId') shopId: string, @Body() dto: UpdatePaymentMethodsDto): Promise<BaseResponseDto<any>> {
    const data = await this.shopService.setPaymentMethods(shopId, dto);
    return BaseResponseDto.success(data);
  }

  @Public()
  @Get(':shopId')
  async getShopById(@Param('shopId') shopId: string): Promise<BaseResponseDto<any>> {
    const shop = await this.shopService.getShopById(shopId);
    return BaseResponseDto.success(shop);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Patch(':shopId')
  async updateShopById(@Param('shopId') shopId: string, @Body() dto: UpdateShopDto): Promise<BaseResponseDto<any>> {
    const shop = await this.shopService.updateShopById(shopId, dto);
    return BaseResponseDto.success(shop);
  }
}


