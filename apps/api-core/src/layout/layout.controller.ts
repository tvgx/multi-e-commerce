import { Controller, Get, Post, Param, Body, HttpStatus } from '@nestjs/common';
import { LayoutService } from './layout.service';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';

@Controller('api')
export class LayoutController {
  constructor(private readonly layoutService: LayoutService) {}

  @Get('storefront/:domain/layout')
  async getStorefrontLayout(@Param('domain') domain: string): Promise<BaseResponseDto<any>> {
    return this.layoutService.getLayoutByDomain(domain);
  }

  @Post('layouts/publish')
  async publishLayout(
    @Session() session: UserSession,
    @Body() payload: any,
  ): Promise<BaseResponseDto<any>> {
    if (!session) throw new CustomException(ResponseCodes.TOKEN_INVALID, 'invalid token', HttpStatus.UNAUTHORIZED);
    
    const { shopId, ...layoutData } = payload;
    if (!shopId) throw new CustomException(ResponseCodes.PARAM_NOT_ENOUGH, 'Parameter is not enought.', HttpStatus.BAD_REQUEST);

    return this.layoutService.publishLayout(session.user.id, shopId, layoutData);
  }

  @Get('layouts/:shopId')
  async getCompiledLayout(@Param('shopId') shopId: string): Promise<BaseResponseDto<any>> {
    return this.layoutService.getCompiledLayout(shopId);
  }
}
