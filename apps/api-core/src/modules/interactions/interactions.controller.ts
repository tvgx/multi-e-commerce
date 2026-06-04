import { Controller, Get, Post, Body, Req, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { ToggleWishlistDto, AddSearchHistoryDto, CreateReviewDto, GetReviewsDto } from './dto/interactions.dto';
import { Public } from '../auth/decorators/public.decorator';
import { StorefrontAuthGuard } from '../storefront-auth/guards/storefront-auth.guard';

@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @UseGuards(StorefrontAuthGuard)
  @Post('wishlist/toggle')
  toggleWishlist(@Req() req: any, @Body() dto: ToggleWishlistDto) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Authentication required');
    return this.interactionsService.toggleWishlist(customerId, dto);
  }

  @UseGuards(StorefrontAuthGuard)
  @Get('wishlist')
  getWishlist(@Req() req: any) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Authentication required');
    return this.interactionsService.getWishlist(customerId);
  }

  @UseGuards(StorefrontAuthGuard)
  @Post('search-history')
  addSearchHistory(@Req() req: any, @Body() dto: AddSearchHistoryDto) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Authentication required');
    return this.interactionsService.addSearchHistory(customerId, dto);
  }

  @UseGuards(StorefrontAuthGuard)
  @Get('search-history')
  getSearchHistory(@Req() req: any) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Authentication required');
    return this.interactionsService.getSearchHistory(customerId);
  }

  @UseGuards(StorefrontAuthGuard)
  @Post('reviews')
  createReview(@Req() req: any, @Body() dto: CreateReviewDto) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Authentication required');
    return this.interactionsService.createReview(customerId, dto);
  }

  @Public()
  @Get('reviews')
  getReviews(@Query() query: GetReviewsDto) {
    return this.interactionsService.getReviews(query);
  }
}

