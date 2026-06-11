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
import { EmailService } from '../email/email.service';
import { WalletService, WALLET_PAYMENT_TYPE } from '../wallet/wallet.service';
import { ShippingService } from '../shipping/shipping.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    private readonly inventoryService: InventoryService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly emailService: EmailService,
    private readonly walletService: WalletService,
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

    // Shipping: tính phí và snapshot địa chỉ trước khi mở transaction
    let shippingMethod = null;
    let shipmentTotal = 0;
    if (dto.shippingMethodId) {
      shippingMethod = await this.prisma.shippingMethod.findFirst({
        where: { id: dto.shippingMethodId, shopId, active: true }
      });
      if (!shippingMethod) throw new BadRequestException('Invalid shipping method for this shop');
      shipmentTotal = ShippingService.computeFee(shippingMethod, subtotal);
      totalAmount += shipmentTotal;
    }

    const addr = dto.shippingAddress;

    const orderNumber = `ORD-${Date.now()}`;
    const orderId = randomUUID(); // pre-generate ID for inventory service reference

    // Validate payment method before opening the transaction — keeps the
    // stock-locking window as short as possible.
    const validPaymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id: dto.paymentMethodId, shopId }
    });
    if (!validPaymentMethod) throw new BadRequestException('Invalid payment method for this shop');
    const isWalletPayment = validPaymentMethod.type === WALLET_PAYMENT_TYPE;

    // 3. Transaction: Lock Stock -> Create Order -> Apply Promo
    const txOrder = await this.prisma.$transaction(async (tx) => {
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
      
      // 3.3 Thanh toán bằng ví: trừ tiền trước khi tạo đơn — nếu không đủ
      // số dư thì rollback toàn bộ (kể cả stock đã trừ)
      if (isWalletPayment) {
        const wallet = await this.walletService.getOrCreate(customerId, shopId, tx);
        await this.walletService.debit(tx, wallet.id, shopId, totalAmount, 'payment', {
          orderId,
          note: `Thanh toán đơn hàng ${orderNumber}`,
          createdBy: 'customer',
        });
      }

      // 3.4 Create Order
      const order = await tx.order.create({
        data: {
          id: orderId,
          number: orderNumber,
          shopId,
          customerId,
          totalAmount,
          itemTotal: subtotal,
          promoTotal: discountAmount,
          shipmentTotal,
          state: isWalletPayment ? 'confirmed' : 'checkout',
          paymentState: isWalletPayment ? 'paid' : 'balance_due',
          shippingMethodId: shippingMethod?.id,
          recipientName: addr?.fullName,
          recipientPhone: addr?.phone,
          shippingAddress: addr?.addressLine1,
          shippingCity: addr?.city,
          shippingProvince: addr?.province,
          shippingNote: addr?.note,
          lineItems: {
            create: lineItemsData
          },
        },
        include: { lineItems: true }
      });

      // 3.5 Create Payment Record
      const payment = await tx.payment.create({
        data: {
          orderId,
          paymentMethodId: validPaymentMethod.id,
          amount: totalAmount,
          state: isWalletPayment ? 'completed' : 'checkout'
        }
      });

      // 3.6 Tạo shipment ban đầu cho đơn (admin sẽ cập nhật tracking sau)
      await tx.shipment.create({
        data: {
          orderId,
          shopId,
          shippingMethodId: shippingMethod?.id,
          state: 'pending',
        }
      });

      let confirmUrl = null;

      // 3.7 Bank Transfer confirm token (QR rendering happens after commit)
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

         const STOREFRONT_BASE = process.env.STOREFRONT_URL || 'http://localhost:3002';
         confirmUrl = `${STOREFRONT_BASE}/payment/confirm/${token}`;
      }

      return {
        ...order,
        confirmUrl
      };
    });

    // Generate the QR code outside the transaction — it's pure CPU work and
    // was extending the stock-row lock window for every bank-transfer order.
    const finalOrder = {
      ...txOrder,
      qrCodeUrl: txOrder.confirmUrl ? await QRCode.toDataURL(txOrder.confirmUrl) : null,
    };

    // Notify customer
    this.notificationsGateway.notifyUser(
      shopId,
      customerId,
      'CUSTOMER',
      'ORDER_CREATED',
      'Order Received',
      isWalletPayment
        ? `Your order ${finalOrder.number} has been received and paid with your wallet.`
        : `Your order ${finalOrder.number} has been received and is pending payment.`,
      { orderId: finalOrder.id }
    ).catch(err => console.error('Notification error', err));

    // Send Email
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (customer?.email) {
      this.emailService.sendOrderConfirmation(customer.email, finalOrder).catch(console.error);
    }

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
    // /orders/my truyền customerId — bắt buộc lọc để khách chỉ thấy đơn của mình
    if ((query as any).customerId) where.customerId = (query as any).customerId;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        include: {
          customer: true,
          payments: true,
          shippingMethod: { select: { id: true, name: true } },
          shipments: true,
          lineItems: {
            include: { variant: { include: { product: { select: { name: true } } } } },
          },
        },
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
      include: {
        lineItems: {
          include: { variant: { include: { product: { select: { name: true } } } } },
        },
        payments: { include: { paymentMethod: { select: { name: true, type: true } } } },
        customer: true,
        shippingMethod: { select: { id: true, name: true, estimatedDays: true } },
        shipments: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getAnalytics(period: string) {
    const shopId = this.getShopId();
    const days = period === '7d' ? 7 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const [revenueRaw, ordersByState, topProducts] = await Promise.all([
      this.prisma.order.aggregate({
        where: { shopId, state: { notIn: ['canceled'] }, createdAt: { gte: since } },
        _sum: { totalAmount: true },
        _count: true
      }),
      this.prisma.order.groupBy({
        by: ['state'],
        where: { shopId, createdAt: { gte: since } },
        _count: true
      }),
      this.prisma.lineItem.groupBy({
        by: ['variantId'],
        where: { order: { shopId, state: { notIn: ['canceled'] }, createdAt: { gte: since } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      })
    ]);
    
    // Populate product info for top products in a single query
    const topVariants = await this.prisma.variant.findMany({
      where: { id: { in: topProducts.map((tp) => tp.variantId) } },
      include: { product: { select: { name: true } } },
    });
    const variantById = new Map(topVariants.map((v) => [v.id, v]));
    const populatedProducts = topProducts.map((tp) => {
      const variant = variantById.get(tp.variantId);
      return {
        variantId: tp.variantId,
        soldQuantity: tp._sum.quantity,
        name: variant?.product?.name || variant?.sku || tp.variantId
      };
    });

    // Revenue per day for chart
    // We group orders by day in JS as prisma doesn't support Date grouping natively easily across DBs
    const ordersForChart = await this.prisma.order.findMany({
      where: { shopId, state: { notIn: ['canceled'] }, createdAt: { gte: since } },
      select: { createdAt: true, totalAmount: true }
    });

    const revenueByDay: Record<string, number> = {};
    ordersForChart.forEach(o => {
      const dateStr = o.createdAt.toISOString().split('T')[0];
      revenueByDay[dateStr] = (revenueByDay[dateStr] || 0) + o.totalAmount;
    });

    const chartData = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { 
      revenue: revenueRaw._sum.totalAmount || 0,
      orderCount: revenueRaw._count || 0,
      ordersByState: ordersByState.reduce((acc, curr) => ({...acc, [curr.state]: curr._count}), {}), 
      topProducts: populatedProducts,
      chartData
    };
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

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // Đồng bộ shipment khi admin chuyển trạng thái đơn ở cấp order
      if (dto.status === 'shipped') {
        await tx.shipment.updateMany({
          where: { orderId: id, shopId, state: { in: ['pending', 'ready'] } },
          data: { state: 'shipped', shippedAt: new Date() },
        });
      } else if (dto.status === 'delivered') {
        await tx.shipment.updateMany({
          where: { orderId: id, shopId, state: 'shipped' },
          data: { state: 'delivered', deliveredAt: new Date() },
        });
      } else if (dto.status === 'returned') {
        await tx.shipment.updateMany({
          where: { orderId: id, shopId, state: { in: ['shipped', 'delivered'] } },
          data: { state: 'returned' },
        });
      } else if (dto.status === 'canceled') {
        await tx.shipment.updateMany({
          where: { orderId: id, shopId, state: { in: ['pending', 'ready'] } },
          data: { state: 'canceled' },
        });
      }

      const shipmentStateByOrderStatus: Record<string, string> = {
        shipped: 'shipped',
        delivered: 'delivered',
        returned: 'returned',
      };

      return tx.order.update({
        where: { id, shopId },
        data: {
          state: dto.status,
          ...(shipmentStateByOrderStatus[dto.status]
            ? { shipmentState: shipmentStateByOrderStatus[dto.status] }
            : {}),
        },
      });
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

    if (dto.status === 'shipped') {
      if (order.customer?.email) {
        this.emailService.sendOrderShipped(order.customer.email, order).catch(console.error);
      }
    }

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

    const wasPaid = order.paymentState === 'paid';

    const canceledOrder = await this.prisma.$transaction(async (tx) => {
       const updated = await tx.order.update({
          where: { id },
          data: {
            state: 'canceled',
            ...(wasPaid ? { paymentState: 'refunded' } : {}),
          }
       });

       // Restore stock
       await this.inventoryService.restoreStock(id, tx);

       // Huỷ shipment chưa giao
       await tx.shipment.updateMany({
         where: { orderId: id, shopId, state: { in: ['pending', 'ready'] } },
         data: { state: 'canceled' },
       });

       // Đơn đã thanh toán: hoàn tiền vào ví khách (store credit)
       if (wasPaid) {
         await this.refundToWallet(tx, order, 'system');
       }

       return updated;
    });

    if (wasPaid) {
      this.notifyWalletRefund(shopId, order);
    }

    return canceledOrder;
  }

  async refundOrder(id: string) {
    const shopId = this.getShopId();
    const order = await this.findOneOrder(id);

    if (order.paymentState === 'refunded') {
      throw new BadRequestException('Order has already been refunded');
    }
    const wasPaid = order.paymentState === 'paid';

    const refunded = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { paymentState: 'refunded', state: 'canceled' },
      });

      await tx.payment.updateMany({
        where: { orderId: id, state: 'completed' },
        data: { state: 'refunded' },
      });

      // Đơn đã thu tiền: hoàn vào ví khách (store credit)
      if (wasPaid) {
        await this.refundToWallet(tx, order, 'admin');
      }

      return updated;
    });

    if (wasPaid) {
      this.notifyWalletRefund(shopId, order);
    }

    return refunded;
  }

  /** Cộng lại tiền đơn hàng vào ví khách. Gọi bên trong transaction. */
  private async refundToWallet(tx: any, order: { id: string; number: string; customerId: string; totalAmount: number }, createdBy: string) {
    const shopId = this.getShopId();
    if (order.totalAmount <= 0) return;
    const wallet = await this.walletService.getOrCreate(order.customerId, shopId, tx);
    await this.walletService.credit(tx, wallet.id, shopId, order.totalAmount, 'refund', {
      orderId: order.id,
      note: `Hoàn tiền đơn hàng ${order.number}`,
      createdBy,
    });
  }

  private notifyWalletRefund(shopId: string, order: { id: string; number: string; customerId: string; totalAmount: number }) {
    this.notificationsGateway.notifyUser(
      shopId,
      order.customerId,
      'CUSTOMER',
      'ORDER_REFUNDED',
      'Order Refunded',
      `${order.totalAmount.toLocaleString('vi-VN')}đ for order ${order.number} has been refunded to your wallet.`,
      { orderId: order.id }
    ).catch(err => console.error('Notification error', err));
  }
}

