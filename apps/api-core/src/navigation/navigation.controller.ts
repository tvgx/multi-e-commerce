import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NavigationService } from './navigation.service';
import {
  CreateNavigationDto,
  UpdateNavigationDto,
} from './dto/navigation-zod.dto';
import { BetterAuthGuard } from '../modules/auth/guards/better-auth.guard';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';
import { Public } from '../modules/auth/decorators/public.decorator';

@Controller('navigation')
@UseGuards(BetterAuthGuard)
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Public()
  @Get()
  async getAllMenus(@Query('shopId') shopId?: string) {
    return this.navigationService.getAllMenusByShop(shopId);
  }

  @Public()
  @Get(':handle')
  async getMenu(
    @Param('handle') handle: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.navigationService.getMenuByHandle(handle, shopId);
  }

  @Post()
  async createMenu(@CurrentUser() user: any, @Body() dto: CreateNavigationDto) {
    return this.navigationService.createMenu(user.id, dto);
  }

  @Put(':id')
  async updateMenu(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateNavigationDto,
  ) {
    return this.navigationService.updateMenu(user.id, id, dto);
  }
}
