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
import { computeShippingFee } from '../shipping/shipping-fee.util';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

/** Đơn tối thiểu cần để huỷ/hoàn — dùng order.shopId nên voidOrder không phụ thuộc tenant context. */
export interface VoidableOrder {
  id: string;
  number: string;
  customerId: string;
  totalAmount: number;
  paymentState: string;
  state?: string;
  shopId?: string;
}

const PAYMENT_TIMEOUT_MS = 15 * 60 * 1000; // 15' chờ xác nhận chuyển khoản

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    private readonly inventoryService: InventoryService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly emailService: EmailService,
    private readonly walletService: WalletService,
    @InjectQueue('payment-timeout') private readonly paymentTimeoutQueue: Queue,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  async createOrder(customerId: string, dto: CheckoutDto) {
    const shopId = this.getShopId();

    // 0. Không truyền lineItems => checkout từ giỏ hàng server-side
    let checkoutLineItems = dto.lineItems;
    let cartId: string | null = null;
    if (!checkoutLineItems || checkoutLineItems.length === 0) {
      const cart = await this.prisma.cart.findUnique({
        where: { shopId_customerId: { shopId, customerId } },
        include: { items: true },
      });
      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty — provide lineItems or add items to your cart');
      }
      cartId = cart.id;
      checkoutLineItems = cart.items.map(i => ({ variantId: i.variantId, quantity: i.quantity }));
    }

    // Validate quantities — the cart path enforces this in addItem (CART-1) but
    // the direct `dto.lineItems` path had no guard, so a non-positive/fractional
    // quantity flowed into pricing (negative totalAmount) and stock math. Also
    // merge duplicate variants: a client sending the same variant across two
    // line items otherwise trips the count check below ("unavailable") even
    // though the variant exists, and would create duplicate order line rows.
    const mergedByVariant = new Map<string, number>();
    for (const li of checkoutLineItems) {
      if (!Number.isInteger(li.quantity) || li.quantity < 1) {
        throw new BadRequestException('Quantity must be a positive integer');
      }
      mergedByVariant.set(
        li.variantId,
        (mergedByVariant.get(li.variantId) ?? 0) + li.quantity,
      );
    }
    checkoutLineItems = [...mergedByVariant.entries()].map(
      ([variantId, quantity]) => ({ variantId, quantity }),
    );

    // 1. Load variant prices from DB. Only variants of a PUBLISHED product are
    // buyable — filtering here blocks ordering DRAFT/ARCHIVED items via the API
    // (ORD-5; status values are DRAFT|PUBLISHED|ARCHIVED, not "ACTIVE").
    const variantIds = checkoutLineItems.map(li => li.variantId);
    const variants = await this.prisma.variant.findMany({
      where: { id: { in: variantIds }, shopId, product: { status: 'PUBLISHED' } }
    });

    if (variants.length !== variantIds.length) {
      throw new BadRequestException('One or more items are unavailable (not found or no longer on sale)');
    }

    let subtotal = 0;
    const lineItemsData = checkoutLineItems.map(li => {
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
      shipmentTotal = computeShippingFee(shippingMethod, subtotal);
      totalAmount += shipmentTotal;
    }

    // Địa chỉ: inline ưu tiên, không có thì lấy từ sổ địa chỉ đã lưu
    let addr = dto.shippingAddress;
    if (!addr && dto.shippingAddressId) {
      const saved = await this.prisma.customerAddress.findFirst({
        where: { id: dto.shippingAddressId, customerId, shopId },
      });
      if (!saved) throw new BadRequestException('Saved address not found');
      addr = {
        fullName: saved.fullName,
        phone: saved.phone,
        addressLine1: saved.addressLine1,
        city: saved.city,
        province: saved.province,
      };
    }

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
      await this.inventoryService.decrementStock(checkoutLineItems, orderId, tx);
      
      // 3.2 Update Promotion Usage — kiểm-tra-và-tăng nguyên tử để chống race.
      // promo được đọc NGOÀI transaction (bước 2), nên nhiều đơn dùng lượt cuối
      // đồng thời đều thấy `usedCount < usageLimit`. Tăng có điều kiện ở mức DB:
      // nếu hết lượt thì updateMany trả count=0 và ta rollback toàn bộ transaction.
      if (promo) {
        if (promo.usageLimit != null) {
          const { count } = await tx.promotion.updateMany({
            where: { id: promo.id, usedCount: { lt: promo.usageLimit } },
            data: { usedCount: { increment: 1 } },
          });
          if (count === 0) {
            throw new BadRequestException('Promotion code usage limit reached');
          }
        } else {
          await tx.promotion.update({
            where: { id: promo.id },
            data: { usedCount: { increment: 1 } },
          });
        }

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

      // 3.6 Checkout từ giỏ server-side: clear giỏ trong cùng transaction
      if (cartId) {
        await tx.cartItem.deleteMany({ where: { cartId } });
      }

      // 3.7 Tạo shipment ban đầu cho đơn (admin sẽ cập nhật tracking sau)
      await tx.shipment.create({
        data: {
          orderId,
          shopId,
          shippingMethodId: shippingMethod?.id,
          state: 'pending',
        }
      });

      let confirmUrl = null;

      // 3.8 Bank Transfer confirm token (QR rendering happens after commit)
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

    // PAY-2: đơn chuyển khoản đã trừ kho lúc checkout nhưng chưa trả tiền — lên lịch
    // tự huỷ (hoàn kho) sau PAYMENT_TIMEOUT_MS nếu không có ai xác nhận. Trước đây
    // schedulePaymentTimeout không nơi nào gọi → đơn treo, giữ kho vĩnh viễn.
    if (validPaymentMethod.type === 'BankTransfer') {
      await this.paymentTimeoutQueue
        .add('check-payment-status', { orderId }, { delay: PAYMENT_TIMEOUT_MS })
        .catch((err) => console.error('Failed to schedule payment timeout', err));
    }

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

  // Columns the client may sort by — anything else would reach Prisma's orderBy
  // verbatim and throw a 500 at runtime (ORD-4). Default + fallback: createdAt.
  private static readonly SORTABLE_ORDER_COLUMNS = ['createdAt', 'totalAmount', 'number'];

  async findAllOrders(query: GetOrdersDto) {
    const shopId = this.getShopId();
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC', state, paymentState, shipmentState } = query;
    const skip = (page - 1) * limit;
    const sortColumn = OrderService.SORTABLE_ORDER_COLUMNS.includes(sortBy)
      ? sortBy
      : 'createdAt';
    const sortDirection = sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';

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
        orderBy: { [sortColumn]: sortDirection },
        // List view only: narrow every relation to the fields the admin orders
        // table and the storefront "my orders" page actually render. This used to
        // pull full customer rows, ALL payment rows, full shipments and full
        // variant rows that no list consumer reads — heavy on a shop with many
        // orders. `payments` is dropped entirely (neither list renders it; the
        // full payment data still comes back from the detail endpoint
        // findOneOrder). Using `include` (not a top-level `select`) keeps every
        // scalar Order column present, so no consumer field silently disappears.
        include: {
          customer: { select: { id: true, name: true, email: true, phoneNumber: true } },
          shippingMethod: { select: { id: true, name: true } },
          shipments: {
            select: {
              id: true,
              state: true,
              carrier: true,
              trackingNumber: true,
              shippedAt: true,
              deliveredAt: true,
            },
          },
          lineItems: {
            select: {
              id: true,
              quantity: true,
              price: true, // rendered by the storefront "my orders" list (item.price * qty)
              variant: { select: { id: true, product: { select: { name: true } } } },
            },
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

    const { updatedOrder, refunded } = await this.prisma.$transaction(async (tx) => {
      // ORD-1: admin huỷ đơn phải hoàn kho + hoàn ví (nếu đã thu tiền) — trước đây
      // updateOrderStatus chỉ đổi state, khách trả ví bị mất tiền và kho không phục hồi.
      if (dto.status === 'canceled') {
        const res = await this.voidOrder(tx, order, { restock: true, refund: true, createdBy: 'admin' });
        return { updatedOrder: res.order, refunded: res.refunded };
      }

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
      }

      const shipmentStateByOrderStatus: Record<string, string> = {
        shipped: 'shipped',
        delivered: 'delivered',
        returned: 'returned',
      };

      const updated = await tx.order.update({
        where: { id, shopId },
        data: {
          state: dto.status,
          ...(shipmentStateByOrderStatus[dto.status]
            ? { shipmentState: shipmentStateByOrderStatus[dto.status] }
            : {}),
        },
      });
      return { updatedOrder: updated, refunded: false };
    });

    if (refunded) {
      this.notifyWalletRefund(shopId, order);
    }

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

    const { order: canceledOrder, refunded } = await this.prisma.$transaction((tx) =>
      this.voidOrder(tx, order, { restock: true, refund: true, createdBy: 'system' }),
    );

    if (refunded) {
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

    // ORD-3: đơn đã `completed` là trạng thái kết thúc (khách đã nhận + chốt) —
    // refund ép state về 'canceled' sẽ bỏ qua state machine và làm sai lịch sử đơn.
    // Đơn hoàn tất muốn trả tiền phải đi qua luồng trả hàng (return) trước.
    if (order.state === 'completed') {
      throw new BadRequestException(
        'Cannot refund a completed order — process a return first',
      );
    }

    // ORD-2: refund giờ cũng hoàn kho như cancelOrder — TRỪ khi hàng đã tới tay khách
    // (delivered/completed/returned) thì giữ nguyên kho (hàng không quay về).
    const goodsWithCustomer = ['delivered', 'completed', 'returned'].includes(order.state);

    const { order: refundedOrder, refunded } = await this.prisma.$transaction((tx) =>
      this.voidOrder(tx, order, { restock: !goodsWithCustomer, refund: true, createdBy: 'admin' }),
    );

    if (refunded) {
      this.notifyWalletRefund(shopId, order);
    }

    return refundedOrder;
  }

  /**
   * Khách xác nhận ĐÃ NHẬN hàng: delivered → completed. Đây là sự kiện chốt đơn
   * từ phía người mua (trước đây chỉ admin mới đẩy được delivered→completed qua
   * updateOrderStatus). Chỉ chủ đơn thao tác được và chỉ khi đơn đang `delivered`.
   */
  async confirmReceived(id: string, customerId: string) {
    const shopId = this.getShopId();
    const order = await this.prisma.order.findFirst({ where: { id, shopId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId !== customerId) {
      throw new BadRequestException('Unauthorized to update this order');
    }
    if (order.state !== 'delivered') {
      throw new BadRequestException(
        `Cannot confirm receipt for an order in ${order.state} state`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { state: 'completed' },
    });

    this.notificationsGateway
      .notifyUser(
        shopId,
        customerId,
        'CUSTOMER',
        'ORDER_COMPLETED',
        'Order Completed',
        `Your order ${order.number} is now complete. Thank you!`,
        { orderId: order.id },
      )
      .catch((err) => console.error('Notification error', err));

    return updated;
  }

  /**
   * Mua lại: nạp các dòng hàng của một đơn cũ vào giỏ hiện tại. Chỉ thêm những
   * variant CÒN bán (PUBLISHED) — số còn lại trả về `skipped` để UI báo khách.
   * Gộp trùng variant + upsert (cộng dồn) nên gọi nhiều lần không nhân đôi sai.
   */
  async reorder(id: string, customerId: string) {
    const shopId = this.getShopId();
    const order = await this.prisma.order.findFirst({
      where: { id, shopId },
      include: { lineItems: { select: { variantId: true, quantity: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId !== customerId) {
      throw new BadRequestException('Unauthorized to reorder this order');
    }

    const wanted = new Map<string, number>();
    for (const li of order.lineItems) {
      wanted.set(li.variantId, (wanted.get(li.variantId) ?? 0) + li.quantity);
    }

    const variantIds = [...wanted.keys()];
    const available = await this.prisma.variant.findMany({
      where: { id: { in: variantIds }, shopId, product: { status: 'PUBLISHED' } },
      select: { id: true },
    });
    const availableIds = new Set(available.map((v) => v.id));
    const skipped = variantIds.filter((vid) => !availableIds.has(vid));
    const added: { variantId: string; quantity: number }[] = [];

    if (availableIds.size > 0) {
      const cart = await this.prisma.cart.upsert({
        where: { shopId_customerId: { shopId, customerId } },
        create: { shopId, customerId },
        update: {},
      });
      for (const [variantId, quantity] of wanted) {
        if (!availableIds.has(variantId)) continue;
        await this.prisma.cartItem.upsert({
          where: { cartId_variantId: { cartId: cart.id, variantId } },
          create: { cartId: cart.id, variantId, quantity },
          update: { quantity: { increment: quantity } },
        });
        added.push({ variantId, quantity });
      }
    }

    return { status: 'reordered', added, skipped };
  }

  /**
   * Gửi lại link/QR xác nhận chuyển khoản cho một đơn còn chờ thanh toán. Tái
   * dùng token còn hạn & chưa dùng nếu có (tránh đẻ thêm row token mỗi lần khách
   * bấm lại — tiết kiệm lưu trữ), không thì mint token mới hạn 24h. Chỉ áp dụng
   * cho đơn BankTransfer đang `checkout` (chưa trả tiền) và thuộc về khách.
   */
  async resendPaymentLink(id: string, customerId: string) {
    const shopId = this.getShopId();
    const order = await this.prisma.order.findFirst({ where: { id, shopId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId !== customerId) {
      throw new BadRequestException('Unauthorized for this order');
    }
    if (order.state !== 'checkout' || order.paymentState === 'paid') {
      throw new BadRequestException('Order is not awaiting bank-transfer payment');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: 'desc' },
    });
    if (!payment) throw new NotFoundException('Payment record not found');

    const now = new Date();
    let token = await this.prisma.paymentConfirmToken.findFirst({
      where: { orderId: order.id, usedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
    if (!token) {
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      token = await this.prisma.paymentConfirmToken.create({
        data: {
          token: randomUUID(),
          orderId: order.id,
          paymentId: payment.id,
          shopId,
          expiresAt,
        },
      });
    }

    const STOREFRONT_BASE = process.env.STOREFRONT_URL || 'http://localhost:3002';
    const confirmUrl = `${STOREFRONT_BASE}/payment/confirm/${token.token}`;
    return {
      orderId: order.id,
      confirmUrl,
      qrCodeUrl: await QRCode.toDataURL(confirmUrl),
      expiresAt: token.expiresAt,
    };
  }

  /**
   * Dòng thời gian sự kiện của đơn — tổng hợp READ-ONLY từ dữ liệu sẵn có (đơn,
   * payments, shipments, stock movements) nên không cần bảng audit riêng. Trả về
   * danh sách event đã sắp theo thời gian cho màn admin theo dõi vòng đời đơn.
   */
  async getOrderTimeline(id: string) {
    const shopId = this.getShopId();
    const order = await this.prisma.order.findFirst({
      where: { id, shopId },
      include: {
        payments: {
          select: { id: true, state: true, amount: true, createdAt: true, updatedAt: true },
        },
        shipments: {
          select: {
            id: true,
            state: true,
            carrier: true,
            trackingNumber: true,
            createdAt: true,
            shippedAt: true,
            deliveredAt: true,
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const movements = await this.prisma.stockMovement.findMany({
      where: { orderId: id },
      select: { reason: true, quantityDelta: true, variantId: true, createdAt: true },
    });

    type TimelineEvent = { at: Date; type: string; label: string; meta?: any };
    const events: TimelineEvent[] = [];

    events.push({
      at: order.createdAt,
      type: 'order_created',
      label: `Order ${order.number} placed`,
      meta: { totalAmount: order.totalAmount },
    });

    for (const p of order.payments) {
      events.push({
        at: p.createdAt,
        type: 'payment_created',
        label: 'Payment record created',
        meta: { paymentId: p.id, amount: p.amount, state: p.state },
      });
      if (
        p.updatedAt &&
        p.updatedAt > p.createdAt &&
        ['completed', 'failed', 'refunded'].includes(p.state)
      ) {
        events.push({
          at: p.updatedAt,
          type: `payment_${p.state}`,
          label: `Payment ${p.state}`,
          meta: { paymentId: p.id },
        });
      }
    }

    for (const m of movements) {
      events.push({
        at: m.createdAt,
        type: m.reason,
        label: m.reason === 'order_refund' ? 'Stock restored' : 'Stock deducted',
        meta: { variantId: m.variantId, quantityDelta: m.quantityDelta },
      });
    }

    for (const s of order.shipments) {
      events.push({
        at: s.createdAt,
        type: 'shipment_created',
        label: 'Shipment created',
        meta: { shipmentId: s.id },
      });
      if (s.shippedAt) {
        events.push({
          at: s.shippedAt,
          type: 'shipment_shipped',
          label: 'Shipped',
          meta: { shipmentId: s.id, carrier: s.carrier, trackingNumber: s.trackingNumber },
        });
      }
      if (s.deliveredAt) {
        events.push({
          at: s.deliveredAt,
          type: 'shipment_delivered',
          label: 'Delivered',
          meta: { shipmentId: s.id },
        });
      }
    }

    events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    return {
      orderId: order.id,
      number: order.number,
      currentState: order.state,
      paymentState: order.paymentState,
      shipmentState: order.shipmentState,
      events,
    };
  }

  /**
   * Đường huỷ đơn DÙNG CHUNG cho mọi nhánh huỷ — khách tự huỷ, admin huỷ,
   * từ chối/timeout thanh toán, refund (chủ đề xuyên suốt #1 trong DIAGNOSTIC-HANDOFF:
   * logic hoàn kho + hoàn ví trước đây chỉ nối vào cancelOrder).
   *
   * PHẢI gọi bên trong một transaction. Dùng order.shopId thay vì tenant context
   * nên gọi được cả từ Bull worker (payment-timeout) không có request scope.
   *
   * @returns { order: hàng đơn đã cập nhật, refunded: có hoàn ví hay không }
   */
  async voidOrder(
    tx: any,
    order: VoidableOrder,
    opts: {
      nextState?: string;     // trạng thái đích, mặc định 'canceled'
      restock?: boolean;      // hoàn kho (idempotent ở InventoryService), mặc định true
      refund?: boolean;       // hoàn ví nếu đơn đã 'paid'
      failPayments?: boolean; // đánh dấu payment đang chờ là 'failed' (reject/timeout)
      createdBy?: string;     // 'system' | 'admin' | 'customer'
    } = {},
  ): Promise<{ order: any; refunded: boolean }> {
    const {
      nextState = 'canceled',
      restock = true,
      refund = false,
      failPayments = false,
      createdBy = 'system',
    } = opts;

    const willRefund = refund && order.paymentState === 'paid' && order.totalAmount > 0;

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        state: nextState,
        ...(willRefund
          ? { paymentState: 'refunded' }
          : failPayments
            ? { paymentState: 'failed' }
            : {}),
      },
    });

    if (restock) {
      await this.inventoryService.restoreStock(order.id, tx);
    }

    // Huỷ shipment chưa giao (shipment đã shipped/delivered giữ nguyên)
    await tx.shipment.updateMany({
      where: { orderId: order.id, shopId: order.shopId, state: { in: ['pending', 'ready'] } },
      data: { state: 'canceled' },
    });

    if (willRefund) {
      // Đơn đã thu tiền: đánh dấu payment đã hoàn + cộng store credit vào ví khách
      await tx.payment.updateMany({
        where: { orderId: order.id, state: 'completed' },
        data: { state: 'refunded' },
      });
      await this.refundToWallet(tx, order, createdBy);
    } else if (failPayments) {
      // Nhánh reject/timeout: đánh dấu payment chưa hoàn tất là thất bại
      await tx.payment.updateMany({
        where: { orderId: order.id, state: { in: ['checkout', 'pending'] } },
        data: { state: 'failed' },
      });
    }

    return { order: updated, refunded: willRefund };
  }

  /** Cộng lại tiền đơn hàng vào ví khách. Gọi bên trong transaction. */
  private async refundToWallet(tx: any, order: VoidableOrder, createdBy: string) {
    // order.shopId khi gọi từ worker (không tenant context); fallback tenant cho request scope.
    const shopId = order.shopId ?? this.getShopId();
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

