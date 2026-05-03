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
import { PagesService } from './pages.service';
import { CreatePageDto, UpdatePageDto } from './dto/pages-zod.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  async getAllPages(@Query('shopId') shopId?: string) {
    return this.pagesService.getAllPagesByShop(shopId);
  }

  @Get(':slug')
  async getPage(@Param('slug') slug: string, @Query('shopId') shopId?: string) {
    return this.pagesService.getPageBySlug(slug, shopId);
  }

  @Post()
  async createPage(@Body() dto: CreatePageDto) {
    const userId = 'dev-user-123';
    return this.pagesService.createPage(userId, dto);
  }

  @Put(':id')
  async updatePage(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    const userId = 'dev-user-123';
    return this.pagesService.updatePage(userId, id, dto);
  }
}
