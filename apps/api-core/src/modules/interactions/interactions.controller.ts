import { Controller, Get, Post, Patch, Delete, Body, Param, Req, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { ToggleWishlistDto, AddSearchHistoryDto, CreateReviewDto, UpdateReviewDto, GetReviewsDto, GetAdminReviewsDto, UpdateReviewStatusDto } from './dto/interactions.dto';
import { Public } from '../auth/decorators/public.decorator';
import { StorefrontAuthGuard } from '../storefront-auth/guards/storefront-auth.guard';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';

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
  @Delete('wishlist/:productId')
  removeWishlistItem(@Req() req: any, @Param('productId') productId: string) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Authentication required');
    return this.interactionsService.removeWishlistItem(customerId, productId);
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
  @Delete('search-history')
  clearSearchHistory(@Req() req: any) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Authentication required');
    return this.interactionsService.clearSearchHistory(customerId);
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

  // Seller moderation: xem mọi review (kể cả pending/hidden) của shop
  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get('reviews/admin')
  getAdminReviews(@Query() query: GetAdminReviewsDto) {
    return this.interactionsService.getAdminReviews(query);
  }

  // Seller moderation: ẩn / công khai review
  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Patch('reviews/:id/status')
  updateReviewStatus(@Param('id') id: string, @Body() dto: UpdateReviewStatusDto) {
    return this.interactionsService.updateReviewStatus(id, dto);
  }

  @UseGuards(StorefrontAuthGuard)
  @Patch('reviews/:id')
  updateReview(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Authentication required');
    return this.interactionsService.updateReview(customerId, id, dto);
  }

  @UseGuards(StorefrontAuthGuard)
  @Delete('reviews/:id')
  deleteReview(@Req() req: any, @Param('id') id: string) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Authentication required');
    return this.interactionsService.deleteReview(customerId, id);
  }
}

