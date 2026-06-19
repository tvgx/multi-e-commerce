import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TopupRequestDto, ResolveTopupDto, AdjustWalletDto, ToggleWalletPaymentDto } from './dto/wallet.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { StorefrontAuthGuard } from '../storefront-auth/guards/storefront-auth.guard';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  private requireCustomerId(req: any): string {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Customer authentication required');
    return customerId;
  }

  // ===== Buyer =====

  @UseGuards(StorefrontAuthGuard)
  @Get('me')
  getMyWallet(@Req() req: any) {
    return this.walletService.getMyWallet(this.requireCustomerId(req));
  }

  @UseGuards(StorefrontAuthGuard)
  @Get('me/transactions')
  getMyTransactions(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.walletService.getMyTransactions(
      this.requireCustomerId(req),
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @UseGuards(StorefrontAuthGuard)
  @Post('topup')
  requestTopup(@Req() req: any, @Body() dto: TopupRequestDto) {
    return this.walletService.requestTopup(this.requireCustomerId(req), dto);
  }

  // ===== Admin =====
  // Xác nhận "đã nhận tiền" là hành động của merchant → chỉ qua route admin có guard
  // (POST /wallet/admin/topups/:id/resolve). KHÔNG có đường confirm-bằng-token công khai:
  // token nằm trong tay người mua nên không thể dùng nó để uỷ quyền hành động merchant.

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get('admin/summary')
  walletSummary() {
    return this.walletService.getWalletSummary();
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get('admin/wallets')
  listWallets(@Query() query: { search?: string; page?: number; limit?: number }) {
    return this.walletService.listWallets(query);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get('admin/wallets/:id/transactions')
  walletTransactions(@Param('id') id: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.walletService.getWalletTransactionsAdmin(id, Number(page) || 1, Number(limit) || 20);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Post('admin/adjust')
  adjust(@Body() dto: AdjustWalletDto) {
    return this.walletService.adjust(dto);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get('admin/topups')
  listTopups(@Query('status') status?: string) {
    return this.walletService.listTopups(status);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Post('admin/topups/:id/resolve')
  resolveTopup(@Param('id') id: string, @Body() dto: ResolveTopupDto) {
    return this.walletService.resolveTopupById(id, dto.action);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get('admin/payment-method')
  getWalletPaymentMethod() {
    return this.walletService.getWalletPaymentMethod();
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Post('admin/payment-method')
  toggleWalletPaymentMethod(@Body() dto: ToggleWalletPaymentDto) {
    return this.walletService.toggleWalletPaymentMethod(!!dto.active);
  }
}
