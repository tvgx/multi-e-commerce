import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { GetNotificationsDto } from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  async getNotifications(userId: string, query: GetNotificationsDto) {
    const shopId = this.getShopId();
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      shopId,
      recipientId: userId
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.notification.count({ where })
    ]);

    return { 
      data: items, 
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) } 
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const shopId = this.getShopId();
    
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, shopId, recipientId: userId }
    });

    if (!notification) {
      throw new BadRequestException('Notification not found or access denied');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() }
    });

    return { status: 'marked_as_read' };
  }

  async markAllAsRead(userId: string) {
    const shopId = this.getShopId();
    await this.prisma.notification.updateMany({
      where: { shopId, recipientId: userId, readAt: null },
      data: { readAt: new Date() }
    });
    return { status: 'all_marked_as_read' };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const shopId = this.getShopId();
    const { count } = await this.prisma.notification.deleteMany({
      where: { id: notificationId, shopId, recipientId: userId },
    });
    if (count === 0) {
      throw new BadRequestException('Notification not found or access denied');
    }
    return { status: 'deleted', id: notificationId };
  }

  async createNotification(data: {
    shopId: string;
    recipientId: string;
    recipientType: 'CUSTOMER' | 'OWNER';
    type: string;
    title: string;
    body: string;
    payload?: any;
  }) {
    return this.prisma.notification.create({
      data: {
        shopId: data.shopId,
        recipientId: data.recipientId,
        recipientType: data.recipientType,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.payload || {}
      }
    });
  }
}

