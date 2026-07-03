import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { SubscribeDto, BillingConfirmDto } from './dto/billing.dto';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';

/**
 * Platform billing (owner SaaS subscription). Owner được resolve từ
 * req.user.id (BetterAuthGuard) — endpoint cấp platform, không cần x-shop-id.
 * Hai endpoint token-info/confirm là public (token là credential) để trang
 * xác nhận mở từ QR trên điện thoại hoạt động không cần đăng nhập — mirror
 * pattern /payments/confirm.
 */
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  private getUserId(req: any): string {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Authentication required');
    return userId;
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get('plans')
  async listPlans() {
    return BaseResponseDto.success(await this.billingService.listPlans());
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get('subscription')
  async getSubscription(@Req() req: any) {
    return BaseResponseDto.success(
      await this.billingService.getSubscription(this.getUserId(req)),
    );
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Post('subscribe')
  async subscribe(@Req() req: any, @Body() dto: SubscribeDto) {
    return BaseResponseDto.success(
      await this.billingService.subscribe(this.getUserId(req), dto),
    );
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Post('cancel')
  async cancel(@Req() req: any) {
    return BaseResponseDto.success(
      await this.billingService.cancel(this.getUserId(req)),
    );
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get('invoices')
  async listInvoices(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return BaseResponseDto.success(
      await this.billingService.listInvoices(
        this.getUserId(req),
        Number(page) || 1,
        Number(limit) || 20,
      ),
    );
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get('invoices/:id')
  async getInvoice(@Req() req: any, @Param('id') id: string) {
    return BaseResponseDto.success(
      await this.billingService.getInvoice(this.getUserId(req), id),
    );
  }

  // Public token endpoints (QR confirm page) — token itself is the credential.

  @Get('token-info/:token')
  async tokenInfo(@Param('token') token: string) {
    return BaseResponseDto.success(await this.billingService.getTokenInfo(token));
  }

  @Post('confirm')
  async confirm(@Body() dto: BillingConfirmDto) {
    return BaseResponseDto.success(
      await this.billingService.confirm(dto?.token, dto?.action ?? 'confirm'),
    );
  }
}
