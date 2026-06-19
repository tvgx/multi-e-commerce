import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { OrderService } from './order.service';
import { CheckoutDto } from './dto/create-order.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { StorefrontAuthGuard } from '../storefront-auth/guards/storefront-auth.guard';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Customer endpoint
  @UseGuards(StorefrontAuthGuard)
  @Post('checkout')
  create(@Req() req: any, @Body() dto: CheckoutDto) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Customer authentication required');
    return this.orderService.createOrder(customerId, dto);
  }

  // Customer endpoint: GET /orders/my
  @UseGuards(StorefrontAuthGuard)
  @Get('my')
  findMyOrders(@Req() req: any, @Query() query: GetOrdersDto) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Customer authentication required');
    return this.orderService.findAllOrders({ ...query, customerId } as any);
  }

  // Customer endpoint: POST /orders/:id/cancel
  @UseGuards(StorefrontAuthGuard)
  @Post(':id/cancel')
  cancelMyOrder(@Req() req: any, @Param('id') id: string) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Customer authentication required');
    return this.orderService.cancelOrder(id, customerId);
  }

  // Customer endpoint: POST /orders/:id/received — confirm delivery completes order
  @UseGuards(StorefrontAuthGuard)
  @Post(':id/received')
  confirmReceived(@Req() req: any, @Param('id') id: string) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Customer authentication required');
    return this.orderService.confirmReceived(id, customerId);
  }

  // Customer endpoint: POST /orders/:id/reorder — re-add this order's items to cart
  @UseGuards(StorefrontAuthGuard)
  @Post(':id/reorder')
  reorder(@Req() req: any, @Param('id') id: string) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Customer authentication required');
    return this.orderService.reorder(id, customerId);
  }

  // Customer endpoint: POST /orders/:id/resend-payment — fresh bank-transfer link/QR
  @UseGuards(StorefrontAuthGuard)
  @Post(':id/resend-payment')
  resendPayment(@Req() req: any, @Param('id') id: string) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Customer authentication required');
    return this.orderService.resendPaymentLink(id, customerId);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get()
  findAll(@Query() query: GetOrdersDto) {
    return this.orderService.findAllOrders(query);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOneOrder(id);
  }

  // Admin endpoint: GET /orders/:id/timeline — full lifecycle event feed
  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get(':id/timeline')
  timeline(@Param('id') id: string) {
    return this.orderService.getOrderTimeline(id);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateOrderStatus(id, dto);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Post(':id/refund')
  refund(@Param('id') id: string) {
    return this.orderService.refundOrder(id);
  }
}

