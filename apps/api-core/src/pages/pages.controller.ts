import { Controller, Get, Post, Put, Body, Param, HttpStatus, Query } from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreatePageDto, UpdatePageDto } from './dto/pages-zod.dto';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
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
  async createPage(@Session() session: UserSession, @Body() dto: CreatePageDto) {
    if (!session) throw new CustomException(ResponseCodes.TOKEN_INVALID, 'invalid token', HttpStatus.UNAUTHORIZED);
    return this.pagesService.createPage(session.user.id, dto);
  }

  @Put(':id')
  async updatePage(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdatePageDto,
  ) {
    if (!session) throw new CustomException(ResponseCodes.TOKEN_INVALID, 'invalid token', HttpStatus.UNAUTHORIZED);
    return this.pagesService.updatePage(session.user.id, id, dto);
  }
}
