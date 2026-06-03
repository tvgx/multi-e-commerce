import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto, UpdatePromotionDto, ValidatePromotionDto } from './dto/promotion.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@UseGuards(BetterAuthGuard, RolesGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @RequireRoles('ADMIN', 'OWNER')
  @Get()
  findAll() {
    return this.promotionsService.findAll();
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Post()
  create(@Body() createPromotionDto: CreatePromotionDto) {
    return this.promotionsService.create(createPromotionDto);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePromotionDto: UpdatePromotionDto) {
    return this.promotionsService.update(id, updatePromotionDto);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }

  @Public()
  @Post('validate')
  validate(@Body() validatePromotionDto: ValidatePromotionDto) {
    return this.promotionsService.validate(validatePromotionDto);
  }
}
