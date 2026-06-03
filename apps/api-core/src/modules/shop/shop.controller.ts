import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ShopService } from './shop.service';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';

@UseGuards(BetterAuthGuard, RolesGuard)
@RequireRoles('ADMIN', 'OWNER')
@Controller('shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('current')
  getCurrentShop() {
    return this.shopService.getCurrentShop();
  }

  @Patch('current')
  updateCurrentShop(@Body() dto: UpdateShopDto) {
    return this.shopService.updateCurrentShop(dto);
  }

  @Patch('bank-account')
  updateBankAccount(@Body() dto: UpdateBankDto) {
    return this.shopService.updateBankAccount(dto);
  }
}

