import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { BaseResponseDto } from '../../common/dto/base-response.dto';

@UseGuards(BetterAuthGuard, RolesGuard)
@Controller('catalog/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get()
  async findAll() {
    const result = await this.categoryService.findAll();
    return BaseResponseDto.success(result);
  }

  @Public()
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const result = await this.categoryService.findBySlug(slug);
    return BaseResponseDto.success(result);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.categoryService.findOne(id);
    return BaseResponseDto.success(result);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    const result = await this.categoryService.create(dto);
    return BaseResponseDto.success(result);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const result = await this.categoryService.update(id, dto);
    return BaseResponseDto.success(result);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.categoryService.remove(id);
    return BaseResponseDto.success(result);
  }
}
