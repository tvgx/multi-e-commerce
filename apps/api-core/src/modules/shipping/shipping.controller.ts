import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import {
  CreateShippingMethodDto,
  UpdateShippingMethodDto,
  ShippingQuoteDto,
  UpdateShipmentDto,
} from './dto/shipping.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { StorefrontAuthGuard } from '../storefront-auth/guards/storefront-auth.guard';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  // ===== Storefront (public theo tenant) =====

  @Get('methods')
  getActiveMethods() {
    return this.shippingService.getActiveMethods();
  }

  @Post('quote')
  quote(@Body() dto: ShippingQuoteDto) {
    return this.shippingService.quote(dto);
  }

  // ===== Buyer =====

  @UseGuards(StorefrontAuthGuard)
  @Get('track/:orderId')
  track(@Req() req: any, @Param('orderId') orderId: string) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Customer authentication required');
    return this.shippingService.trackOrder(orderId, customerId);
  }

  // ===== Admin =====

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get('methods/all')
  getAllMethods() {
    return this.shippingService.getAllMethods();
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Post('methods')
  createMethod(@Body() dto: CreateShippingMethodDto) {
    return this.shippingService.createMethod(dto);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Patch('methods/:id')
  updateMethod(@Param('id') id: string, @Body() dto: UpdateShippingMethodDto) {
    return this.shippingService.updateMethod(id, dto);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Delete('methods/:id')
  deleteMethod(@Param('id') id: string) {
    return this.shippingService.deleteMethod(id);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get('shipments')
  findShipments(@Query() query: { orderId?: string; state?: string; page?: number; limit?: number }) {
    return this.shippingService.findShipments(query);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Patch('shipments/:id')
  updateShipment(@Param('id') id: string, @Body() dto: UpdateShipmentDto) {
    return this.shippingService.updateShipment(id, dto);
  }
}
