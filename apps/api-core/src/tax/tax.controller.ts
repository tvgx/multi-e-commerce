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
import { Session } from '@thallesp/nestjs-better-auth';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get()
  async getSettings(
    @Session() session: any,
    @Query('shopId') shopId?: string,
  ): Promise<BaseResponseDto<any>> {
    return this.taxService.getTaxSettings(shopId);
  }

  @Put()
  async updateSettings(
    @Session() session: any,
    @Body() body: any,
  ): Promise<BaseResponseDto<any>> {
    return this.taxService.updateTaxSettings(session.user.id, body);
  }
}
