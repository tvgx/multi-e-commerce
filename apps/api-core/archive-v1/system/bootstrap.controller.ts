import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import { LayoutService } from '../layout/layout.service';
import { NavigationService } from '../navigation/navigation.service';
import { PrismaService } from '../database/prisma.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { ShopGlobalLayout, ShopPageLayout, PageType } from '@ecommerce/schema';

@Controller('system/bootstrap')
export class SystemBootstrapController {
  constructor(
    private readonly layoutService: LayoutService,
    private readonly navigationService: NavigationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async bootstrap(
    @Query('domain') domain: string,
    @Query('pageType') pageType?: string,
    @Query('pageSlug') pageSlug?: string,
  ): Promise<BaseResponseDto<any>> {
    if (!domain) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Domain is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 1. Resolve Shop and Cache Domain mapping
    const normalizedDomain = domain.toLowerCase();
    const shop = await this.prisma.shop.findUnique({
      where: { domain: normalizedDomain },
      select: {
        id: true,
        name: true,
        domain: true,
        status: true,
        templateType: true,
      },
    });

    if (!shop) {
      throw new CustomException(
        ResponseCodes.URL_USER_IS_EXIST,
        'Shop not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // 2. Fetch Global Layout and Menus in parallel
    const [globalLayoutRes, menusRes] = await Promise.all([
      this.layoutService.getGlobalLayout(shop.id),
      this.navigationService.getAllMenusByShop(shop.id),
    ]);

    // 3. Optional Page Layout fetch
    let pageLayout = null;
    if (pageType) {
      const pageRes = await this.layoutService.getPageLayout(
        shop.id,
        pageType as PageType,
        pageSlug,
      );
      pageLayout = pageRes.data;
    }

    return BaseResponseDto.success({
      shop,
      globalLayout: globalLayoutRes.data,
      navigationMenus: menusRes.data,
      pageLayout,
    });
  }
}
