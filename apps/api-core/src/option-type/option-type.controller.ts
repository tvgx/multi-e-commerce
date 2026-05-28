import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OptionTypeService } from './option-type.service';
import { CreateOptionTypeDto, UpdateOptionTypeDto } from './dto/option-type-zod.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { BetterAuthGuard } from '../modules/auth/guards/better-auth.guard';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';

@Controller('api/option-types')
@UseGuards(BetterAuthGuard)
export class OptionTypeController {
  constructor(private readonly optionTypeService: OptionTypeService) {}

  @Post()
  async createOptionType(
    @CurrentUser() user: any,
    @Body() dto: CreateOptionTypeDto,
  ): Promise<BaseResponseDto<any>> {
    const data = await this.optionTypeService.createOptionType(user.id, dto);
    return BaseResponseDto.success(data);
  }

  @Get()
  async getAllOptionTypes(
    @CurrentUser() user: any,
  ): Promise<BaseResponseDto<any[]>> {
    const data = await this.optionTypeService.getAllOptionTypes();
    return BaseResponseDto.success(data);
  }

  @Put(':id')
  async updateOptionType(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateOptionTypeDto,
  ): Promise<BaseResponseDto<any>> {
    const data = await this.optionTypeService.updateOptionType(user.id, id, dto);
    return BaseResponseDto.success(data);
  }
}
