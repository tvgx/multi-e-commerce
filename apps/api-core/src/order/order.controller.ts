import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/order.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Controller('api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async checkout(@Body() dto: CreateOrderDto): Promise<BaseResponseDto<any>> {
    return this.orderService.createOrder(dto);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string): Promise<BaseResponseDto<any>> {
    return this.orderService.getOrder(id);
  }

  @Get('shop/:shopId/customer/:email')
  async getOrdersByCustomer(
    @Param('shopId') shopId: string,
    @Param('email') email: string,
  ): Promise<BaseResponseDto<any>> {
    return this.orderService.getOrdersByCustomerEmail(shopId, email);
  }

  @Get('shop/:shopId')
  async getOrdersByShop(@Param('shopId') shopId: string): Promise<BaseResponseDto<any>> {
    return this.orderService.getOrdersByShop(shopId);
  }

  @Post(':id/state')
  async updateOrderState(@Param('id') id: string, @Body('state') state: string): Promise<BaseResponseDto<any>> {
    return this.orderService.updateOrderState(id, state);
  }
}
