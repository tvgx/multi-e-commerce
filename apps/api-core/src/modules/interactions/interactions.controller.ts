import { Controller, Get, Post, Body, Req, Query, UseGuards } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { ToggleWishlistDto, AddSearchHistoryDto, CreateReviewDto, GetReviewsDto } from './dto/interactions.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post('wishlist/toggle')
  toggleWishlist(@Req() req: any, @Body() dto: ToggleWishlistDto) {
    const customerId = req.user?.id || 'mock-customer-id';
    return this.interactionsService.toggleWishlist(customerId, dto);
  }

  @Get('wishlist')
  getWishlist(@Req() req: any) {
    const customerId = req.user?.id || 'mock-customer-id';
    return this.interactionsService.getWishlist(customerId);
  }

  @Post('search-history')
  addSearchHistory(@Req() req: any, @Body() dto: AddSearchHistoryDto) {
    const customerId = req.user?.id || 'mock-customer-id';
    return this.interactionsService.addSearchHistory(customerId, dto);
  }

  @Get('search-history')
  getSearchHistory(@Req() req: any) {
    const customerId = req.user?.id || 'mock-customer-id';
    return this.interactionsService.getSearchHistory(customerId);
  }

  @Post('reviews')
  createReview(@Req() req: any, @Body() dto: CreateReviewDto) {
    const customerId = req.user?.id || 'mock-customer-id';
    return this.interactionsService.createReview(customerId, dto);
  }

  @Public()
  @Get('reviews')
  getReviews(@Query() query: GetReviewsDto) {
    return this.interactionsService.getReviews(query);
  }
}

