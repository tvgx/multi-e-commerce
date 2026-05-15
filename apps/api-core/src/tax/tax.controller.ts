import { Controller, Get, Put, Body, UseGuards, Query } from '@nestjs/common';
import { TaxService } from './tax.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { BetterAuthGuard } from '../modules/auth/guards/better-auth.guard';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';
import { Public } from '../modules/auth/decorators/public.decorator';

@Controller('tax')
@UseGuards(BetterAuthGuard)
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Public()
  @Get()
  async getSettings(
    @Query('shopId') shopId?: string,
  ): Promise<BaseResponseDto<any>> {
    return this.taxService.getTaxSettings(shopId);
  }

  @Put()
  async updateSettings(
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<BaseResponseDto<any>> {
    return this.taxService.updateTaxSettings(user.id, body);
  }
}
