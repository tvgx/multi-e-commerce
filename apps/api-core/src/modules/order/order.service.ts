import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { CheckoutDto } from './dto/create-order.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  async createOrder(customerId: string, dto: CheckoutDto) {
    const shopId = this.getShopId();
    // Complex logic for price calculation, stock reduction goes here
    const orderNumber = `ORD-${Date.now()}`;

    return this.prisma.order.create({
      data: {
        number: orderNumber,
        shopId,
        customerId,
        totalAmount: 0, // Should be calculated in real app
        state: 'checkout',
        lineItems: {
          create: dto.lineItems.map(li => ({
            variantId: li.variantId,
            quantity: li.quantity,
            price: 0, // Should be fetched from variant
          })),
        },
      },
      include: { lineItems: true },
    });
  }

  async findAllOrders(query: GetOrdersDto) {
    const shopId = this.getShopId();
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC', state, paymentState, shipmentState } = query;
    const skip = (page - 1) * limit;

    const where: any = { shopId };
    if (state) where.state = state;
    if (paymentState) where.paymentState = paymentState;
    if (shipmentState) where.shipmentState = shipmentState;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        include: { customer: true, payments: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneOrder(id: string) {
    const shopId = this.getShopId();
    const order = await this.prisma.order.findFirst({
      where: { id, shopId },
      include: { lineItems: true, payments: true, customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const shopId = this.getShopId();
    await this.findOneOrder(id);
    return this.prisma.order.update({
      where: { id },
      data: { state: dto.status },
    });
  }

  async refundOrder(id: string) {
    const shopId = this.getShopId();
    await this.findOneOrder(id);
    return this.prisma.order.update({
      where: { id },
      data: { paymentState: 'refunded', state: 'canceled' },
    });
  }
}

