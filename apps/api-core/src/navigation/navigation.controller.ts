import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { NavigationService } from './navigation.service';
import {
  CreateNavigationDto,
  UpdateNavigationDto,
} from './dto/navigation-zod.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';

@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Get()
  async getAllMenus(@Query('shopId') shopId?: string) {
    return this.navigationService.getAllMenusByShop(shopId);
  }

  @Get(':handle')
  async getMenu(
    @Param('handle') handle: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.navigationService.getMenuByHandle(handle, shopId);
  }

  @Post()
  async createMenu(
    @Body() dto: CreateNavigationDto,
  ) {
    const userId = 'dev-user-123';
    return this.navigationService.createMenu(userId, dto);
  }

  @Put(':id')
  async updateMenu(
    @Param('id') id: string,
    @Body() dto: UpdateNavigationDto,
  ) {
    const userId = 'dev-user-123';
    return this.navigationService.updateMenu(userId, id, dto);
  }
}
