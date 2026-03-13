import { Controller, Get, Param } from '@nestjs/common';
import { ShopService } from './shop.service';

@Controller('api/shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  getAllShops() {
    return this.shopService.getAllShops();
  }

  @Get(':id')
  getShopSettings(@Param('id') id: string) {
    return this.shopService.getShopSettings(id);
  }
}
