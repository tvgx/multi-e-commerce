import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { OptionTypeService } from './option-type.service';
import { CreateOptionTypeDto, UpdateOptionTypeDto } from './dto/option-type.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@UseGuards(BetterAuthGuard, RolesGuard)
@Controller('catalog/option-types')
export class OptionTypeController {
  constructor(private readonly optionTypeService: OptionTypeService) {}

  @Public()
  @Get()
  findAll() {
    return this.optionTypeService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.optionTypeService.findOne(id);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Post()
  create(@Body() createOptionTypeDto: CreateOptionTypeDto) {
    return this.optionTypeService.create(createOptionTypeDto);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOptionTypeDto: UpdateOptionTypeDto) {
    return this.optionTypeService.update(id, updateOptionTypeDto);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.optionTypeService.remove(id);
  }
}
