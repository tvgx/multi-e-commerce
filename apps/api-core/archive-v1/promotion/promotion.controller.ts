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
import { PromotionService } from './promotion.service';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion-zod.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { BetterAuthGuard } from '../modules/auth/guards/better-auth.guard';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';
import { Public } from '../modules/auth/decorators/public.decorator';

@Controller('promotions')
@UseGuards(BetterAuthGuard)
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post()
  async createPromotion(
    @CurrentUser() user: any,
    @Body() dto: CreatePromotionDto,
  ): Promise<BaseResponseDto<any>> {
    const data = await this.promotionService.createPromotion(user.id, dto);
    return BaseResponseDto.success(data);
  }

  @Get()
  async getAllPromotions(
    @CurrentUser() user: any,
  ): Promise<BaseResponseDto<any[]>> {
    const data = await this.promotionService.getAllPromotions();
    return BaseResponseDto.success(data);
  }

  @Put(':id')
  async updatePromotion(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdatePromotionDto,
  ): Promise<BaseResponseDto<any>> {
    const data = await this.promotionService.updatePromotion(user.id, id, dto);
    return BaseResponseDto.success(data);
  }

  @Public()
  @Get('validate')
  async validatePromotion(
    @Query('shopId') shopId: string,
    @Query('code') code: string,
    @Query('itemTotal') itemTotal: number,
  ): Promise<BaseResponseDto<any>> {
    const data = await this.promotionService.validatePromotion(
      shopId,
      code,
      Number(itemTotal),
    );
    return BaseResponseDto.success(data);
  }
}
