import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EmailService } from '../email/email.service';
import {
  CreateShippingMethodDto,
  UpdateShippingMethodDto,
  ShippingQuoteDto,
  UpdateShipmentDto,
} from './dto/shipping.dto';

// Trạng thái shipment hợp lệ và các bước chuyển tiếp cho phép
const SHIPMENT_TRANSITIONS: Record<string, string[]> = {
  pending: ['ready', 'shipped', 'canceled'],
  ready: ['shipped', 'canceled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  returned: [],
  canceled: [],
};

@Injectable()
export class ShippingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly emailService: EmailService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  /** Phí ship của một phương thức theo subtotal (áp dụng ngưỡng freeship nếu có) */
  static computeFee(method: { baseFee: number; freeThreshold: number | null }, subtotal: number): number {
    if (method.freeThreshold != null && subtotal >= method.freeThreshold) return 0;
    return method.baseFee;
  }

  // ==========================================
  // Shipping methods — storefront
  // ==========================================

  async getActiveMethods() {
    const shopId = this.getShopId();
    const methods = await this.prisma.shippingMethod.findMany({
      where: { shopId, active: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    return { data: methods };
  }

  async quote(dto: ShippingQuoteDto) {
    const shopId = this.getShopId();
    const method = await this.prisma.shippingMethod.findFirst({
      where: { id: dto.shippingMethodId, shopId, active: true },
    });
    if (!method) throw new NotFoundException('Shipping method not found');

    return {
      shippingMethodId: method.id,
      fee: ShippingService.computeFee(method, dto.subtotal),
      freeThreshold: method.freeThreshold,
      estimatedDays: method.estimatedDays,
    };
  }

  // ==========================================
  // Shipping methods — admin CRUD
  // ==========================================

  async getAllMethods() {
    const shopId = this.getShopId();
    const methods = await this.prisma.shippingMethod.findMany({
      where: { shopId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    return { data: methods };
  }

  async createMethod(dto: CreateShippingMethodDto) {
    const shopId = this.getShopId();
    return this.prisma.shippingMethod.create({
      data: {
        shopId,
        name: dto.name,
        description: dto.description,
        baseFee: dto.baseFee,
        freeThreshold: dto.freeThreshold,
        estimatedDays: dto.estimatedDays,
        active: dto.active ?? true,
        position: dto.position ?? 0,
      },
    });
  }

  async updateMethod(id: string, dto: UpdateShippingMethodDto) {
    const shopId = this.getShopId();
    const existing = await this.prisma.shippingMethod.findFirst({ where: { id, shopId } });
    if (!existing) throw new NotFoundException('Shipping method not found');

    return this.prisma.shippingMethod.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        baseFee: dto.baseFee,
        freeThreshold: dto.freeThreshold,
        estimatedDays: dto.estimatedDays,
        active: dto.active,
        position: dto.position,
      },
    });
  }

  async deleteMethod(id: string) {
    const shopId = this.getShopId();
    const existing = await this.prisma.shippingMethod.findFirst({ where: { id, shopId } });
    if (!existing) throw new NotFoundException('Shipping method not found');

    const usedByOrders = await this.prisma.order.count({ where: { shippingMethodId: id } });
    if (usedByOrders > 0) {
      // Đơn cũ còn tham chiếu — chỉ ẩn đi thay vì xoá để giữ lịch sử
      return this.prisma.shippingMethod.update({ where: { id }, data: { active: false } });
    }
    return this.prisma.shippingMethod.delete({ where: { id } });
  }

  // ==========================================
  // Shipments — admin fulfillment
  // ==========================================

  async findShipments(query: { orderId?: string; state?: string; page?: number; limit?: number }) {
    const shopId = this.getShopId();
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const where: any = { shopId };
    if (query.orderId) where.orderId = query.orderId;
    if (query.state) where.state = query.state;

    const [items, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, number: true, customerId: true, recipientName: true } },
          shippingMethod: { select: { id: true, name: true } },
        },
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateShipment(id: string, dto: UpdateShipmentDto) {
    const shopId = this.getShopId();
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, shopId },
      include: { order: true },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');

    const data: any = {};
    if (dto.carrier !== undefined) data.carrier = dto.carrier;
    if (dto.trackingNumber !== undefined) data.trackingNumber = dto.trackingNumber;
    if (dto.note !== undefined) data.note = dto.note;

    if (dto.state && dto.state !== shipment.state) {
      const allowed = SHIPMENT_TRANSITIONS[shipment.state] || [];
      if (!allowed.includes(dto.state)) {
        throw new BadRequestException(`Cannot transition shipment from ${shipment.state} to ${dto.state}`);
      }
      data.state = dto.state;
      if (dto.state === 'shipped') data.shippedAt = new Date();
      if (dto.state === 'delivered') data.deliveredAt = new Date();
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.shipment.update({ where: { id }, data });

      // Đồng bộ shipmentState (và state nếu hợp lệ) trên Order
      if (data.state) {
        const orderData: any = { shipmentState: data.state };
        if (data.state === 'shipped' && ['confirmed', 'processing'].includes(shipment.order.state)) {
          orderData.state = 'shipped';
        }
        if (data.state === 'delivered' && shipment.order.state === 'shipped') {
          orderData.state = 'delivered';
        }
        await tx.order.update({ where: { id: shipment.orderId }, data: orderData });
      }

      return result;
    });

    if (data.state) {
      const titles: Record<string, [string, string]> = {
        ready: ['Order Ready', `Your order ${shipment.order.number} is packed and ready to ship.`],
        shipped: ['Order Shipped', `Your order ${shipment.order.number} has been shipped${dto.trackingNumber || shipment.trackingNumber ? ` (tracking: ${dto.trackingNumber || shipment.trackingNumber})` : ''}.`],
        delivered: ['Order Delivered', `Your order ${shipment.order.number} has been delivered.`],
        returned: ['Order Returned', `Your order ${shipment.order.number} has been returned.`],
        canceled: ['Shipment Canceled', `Shipment for order ${shipment.order.number} has been canceled.`],
      };
      const [title, body] = titles[data.state] || [];
      if (title) {
        this.notificationsGateway.notifyUser(
          shopId,
          shipment.order.customerId,
          'CUSTOMER',
          'SHIPMENT_UPDATED',
          title,
          body,
          { orderId: shipment.orderId, shipmentId: id, state: data.state },
        ).catch(err => console.error('Notification error', err));
      }

      if (data.state === 'shipped') {
        const customer = await this.prisma.customer.findUnique({ where: { id: shipment.order.customerId } });
        if (customer?.email) {
          this.emailService.sendOrderShipped(customer.email, shipment.order).catch(console.error);
        }
      }
    }

    return updated;
  }

  // ==========================================
  // Tracking — buyer
  // ==========================================

  async trackOrder(orderId: string, customerId: string) {
    const shopId = this.getShopId();
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, shopId, customerId },
      select: { id: true, number: true, state: true, shipmentState: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const shipments = await this.prisma.shipment.findMany({
      where: { orderId, shopId },
      orderBy: { createdAt: 'asc' },
      include: { shippingMethod: { select: { name: true, estimatedDays: true } } },
    });

    return { order, shipments };
  }
}
