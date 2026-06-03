import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { CheckoutDto } from './dto/create-order.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import * as QRCode from 'qrcode';
import { randomUUID } from 'crypto';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    private readonly inventoryService: InventoryService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  async createOrder(customerId: string, dto: CheckoutDto) {
    const shopId = this.getShopId();
    
    // 1. Load variant prices from DB
    const variantIds = dto.lineItems.map(li => li.variantId);
    const variants = await this.prisma.variant.findMany({
      where: { id: { in: variantIds }, shopId }
    });
    
    if (variants.length !== variantIds.length) {
      throw new BadRequestException('One or more variants not found in this shop');
    }
    
    let subtotal = 0;
    const lineItemsData = dto.lineItems.map(li => {
      const variant = variants.find(v => v.id === li.variantId);
      const price = variant!.price;
      subtotal += price * li.quantity;
      return {
        variantId: li.variantId,
        quantity: li.quantity,
        price,
      };
    });
    
    let totalAmount = subtotal;
    let discountAmount = 0;
    
    // 2. Validate Promotion if provided
    let promo = null;
    if (dto.promotionCode) {
      promo = await this.prisma.promotion.findFirst({
        where: { shopId, code: dto.promotionCode }
      });
      
      if (!promo || !promo.isActive || (promo.expiresAt && promo.expiresAt < new Date()) || (promo.startsAt && promo.startsAt > new Date())) {
        throw new BadRequestException('Invalid or expired promotion code');
      }
      if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
        throw new BadRequestException('Promotion code usage limit reached');
      }
      
      if (promo.discountType === 'percentage') {
        discountAmount = (subtotal * promo.discountValue) / 100;
      } else {
        discountAmount = promo.discountValue;
      }
      
      totalAmount = Math.max(0, subtotal - discountAmount);
    }

    const orderNumber = `ORD-${Date.now()}`;
    const orderId = randomUUID(); // pre-generate ID for inventory service reference

    // 3. Transaction: Lock Stock -> Create Order -> Apply Promo
    const finalOrder = await this.prisma.$transaction(async (tx) => {
      // 3.1 Decrement stock via InventoryService (pass tx)
      await this.inventoryService.decrementStock(dto.lineItems, orderId, tx);
      
      // 3.2 Update Promotion Usage
      if (promo) {
        await tx.promotion.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } }
        });
        
        await tx.promotionUsage.create({
          data: {
             shopId,
             promotionId: promo.id,
             customerId,
             orderId,
          }
        });
      }
      
      // 3.3 Create Order
      const order = await tx.order.create({
        data: {
          id: orderId,
          number: orderNumber,
          shopId,
          customerId,
          totalAmount,
          state: 'checkout',
          lineItems: {
            create: lineItemsData
          },
        },
        include: { lineItems: true }
      });

      // 3.4 Create Payment Record
      const validPaymentMethod = await tx.paymentMethod.findFirst({
         where: { id: dto.paymentMethodId, shopId }
      });

      if (!validPaymentMethod) throw new BadRequestException('Invalid payment method for this shop');

      const payment = await tx.payment.create({
        data: {
          orderId,
          paymentMethodId: validPaymentMethod.id,
          amount: totalAmount,
          state: 'checkout'
        }
      });
      
      let qrCodeUrl = null;
      let confirmUrl = null;

      // 3.5 Bank Transfer QR Code generation
      if (validPaymentMethod.type === 'BankTransfer') {
         const token = randomUUID();
         const expiresAt = new Date();
         expiresAt.setHours(expiresAt.getHours() + 24); // 24h validity
         
         await tx.paymentConfirmToken.create({
           data: {
             token,
             orderId,
             paymentId: payment.id,
             shopId,
             expiresAt
           }
         });
         
         const shop = await tx.shop.findUnique({ where: { id: shopId } });
         confirmUrl = `https://${shop?.domain || 'unknown-shop.com'}/payment/confirm?token=${token}`;
         qrCodeUrl = await QRCode.toDataURL(confirmUrl);
      }

      return {
        ...order,
        qrCodeUrl,
        confirmUrl
      };
    });

    // Notify customer
    this.notificationsGateway.notifyUser(
      shopId,
      customerId,
      'CUSTOMER',
      'ORDER_CREATED',
      'Order Received',
      `Your order ${finalOrder.number} has been received and is pending payment.`,
      { orderId: finalOrder.id }
    ).catch(err => console.error('Notification error', err));

    return finalOrder;
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
    const order = await this.findOneOrder(id);

    const validTransitions: Record<string, string[]> = {
       'checkout': ['confirmed', 'canceled'],
       'confirmed': ['processing', 'canceled'],
       'processing': ['shipped', 'canceled'],
       'shipped': ['delivered', 'returned'],
       'delivered': ['returned', 'completed'],
       'returned': [],
       'completed': [],
       'canceled': []
    };

    const allowedNext = validTransitions[order.state] || [];
    if (!allowedNext.includes(dto.status)) {
       throw new BadRequestException(`Cannot transition order state from ${order.state} to ${dto.status}`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id, shopId },
      data: { state: dto.status },
    });

    // Notify customer about status change
    this.notificationsGateway.notifyUser(
      shopId,
      order.customerId,
      'CUSTOMER',
      'ORDER_STATUS_UPDATED',
      'Order Status Updated',
      `Your order ${order.number} is now ${dto.status}.`,
      { orderId: order.id, status: dto.status }
    ).catch(err => console.error('Notification error', err));

    return updatedOrder;
  }

  async cancelOrder(id: string, customerId?: string) {
    const shopId = this.getShopId();
    const order = await this.prisma.order.findFirst({ where: { id, shopId } });
    if (!order) throw new NotFoundException('Order not found');
    
    if (customerId && order.customerId !== customerId) {
       throw new BadRequestException('Unauthorized to cancel this order');
    }

    if (['shipped', 'delivered', 'completed', 'canceled'].includes(order.state)) {
       throw new BadRequestException(`Cannot cancel order in ${order.state} state`);
    }

    return this.prisma.$transaction(async (tx) => {
       const canceledOrder = await tx.order.update({
          where: { id },
          data: { state: 'canceled' }
       });

       // Restore stock
       await this.inventoryService.restoreStock(id, tx);
       
       return canceledOrder;
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

