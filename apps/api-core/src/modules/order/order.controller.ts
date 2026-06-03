import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { CheckoutDto } from './dto/create-order.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Customer endpoint
  @Post('checkout')
  create(@Req() req: any, @Body() dto: CheckoutDto) {
    const customerId = req.user?.id || 'anonymous-or-mock-id'; // Requires AuthGuard in reality
    return this.orderService.createOrder(customerId, dto);
  }

  // Customer endpoint: GET /orders/my
  @Get('my')
  findMyOrders(@Req() req: any, @Query() query: GetOrdersDto) {
    const customerId = req.user?.id || 'anonymous-or-mock-id';
    return this.orderService.findAllOrders({ ...query, customerId } as any);
  }

  // Customer endpoint: POST /orders/:id/cancel
  @Post(':id/cancel')
  cancelMyOrder(@Req() req: any, @Param('id') id: string) {
    const customerId = req.user?.id || 'anonymous-or-mock-id';
    return this.orderService.cancelOrder(id, customerId);
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

