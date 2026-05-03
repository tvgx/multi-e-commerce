import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { TaxService } from './tax.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get()
  async getSettings(
    @Query('shopId') shopId?: string,
  ): Promise<BaseResponseDto<any>> {
    return this.taxService.getTaxSettings(shopId);
  }

  @Put()
  async updateSettings(@Body() body: any): Promise<BaseResponseDto<any>> {
    const userId = 'dev-user-123';
    return this.taxService.updateTaxSettings(userId, body);
  }
}
