import { Controller, Get, Param, HttpStatus } from '@nestjs/common';
import { ShopService } from './shop.service';
import { LayoutService } from '../layout/layout.service';
import { NavigationService } from '../navigation/navigation.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';

@Controller('shops/bootstrap')
export class ShopBootstrapController {
  constructor(
    private readonly shopService: ShopService,
    private readonly layoutService: LayoutService,
    private readonly navigationService: NavigationService,
  ) {}

  @Get(':identifier')
  async getBootstrapData(
    @Param('identifier') identifier: string,
  ): Promise<BaseResponseDto<any>> {
    // 1. Resolve Shop
    const shopRes = await this.shopService.resolveShop(identifier);
    if (shopRes.code !== '1000') return shopRes;
    const shop: any = shopRes.data;

    // 2. Fetch Data in Parallel
    const [globalLayoutRes, menusRes] = await Promise.all([
      this.layoutService.getGlobalLayout(shop.id),
      this.navigationService.getAllMenusByShop(shop.id),
    ]);

    const menus = (menusRes.code === '1000' ? menusRes.data : []) || [];
    const mainMenu =
      menus.find((m: any) => m.handle === 'main-menu') || menus[0] || null;
    const footerMenu =
      menus.find((m: any) => m.handle === 'footer-menu') ||
      menus.find((m: any) => m.handle !== 'main-menu') ||
      null;

    return BaseResponseDto.success({
      shop,
      globalLayout:
        globalLayoutRes.code === '1000' ? globalLayoutRes.data : null,
      navigation: {
        mainMenu,
        footerMenu,
        allMenus: menus,
      },
    });
  }
}
