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
import { PagesService } from './pages.service';
import { CreatePageDto, UpdatePageDto } from './dto/pages-zod.dto';
import { BetterAuthGuard } from '../modules/auth/guards/better-auth.guard';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';
import { Public } from '../modules/auth/decorators/public.decorator';

@Controller('pages')
@UseGuards(BetterAuthGuard)
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Public()
  @Get()
  async getAllPages(@Query('shopId') shopId?: string) {
    return this.pagesService.getAllPagesByShop(shopId);
  }

  @Public()
  @Get(':slug')
  async getPage(@Param('slug') slug: string, @Query('shopId') shopId?: string) {
    return this.pagesService.getPageBySlug(slug, shopId);
  }

  @Post()
  async createPage(@CurrentUser() user: any, @Body() dto: CreatePageDto) {
    return this.pagesService.createPage(user.id, dto);
  }

  @Put(':id')
  async updatePage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdatePageDto,
  ) {
    return this.pagesService.updatePage(user.id, id, dto);
  }
}
