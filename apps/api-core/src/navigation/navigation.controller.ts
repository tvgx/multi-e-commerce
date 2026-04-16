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
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
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
    @Session() session: UserSession,
    @Body() dto: CreateNavigationDto,
  ) {
    if (!session)
      throw new CustomException(
        ResponseCodes.TOKEN_INVALID,
        'invalid token',
        HttpStatus.UNAUTHORIZED,
      );
    return this.navigationService.createMenu(session.user.id, dto);
  }

  @Put(':id')
  async updateMenu(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateNavigationDto,
  ) {
    if (!session)
      throw new CustomException(
        ResponseCodes.TOKEN_INVALID,
        'invalid token',
        HttpStatus.UNAUTHORIZED,
      );
    return this.navigationService.updateMenu(session.user.id, id, dto);
  }
}
