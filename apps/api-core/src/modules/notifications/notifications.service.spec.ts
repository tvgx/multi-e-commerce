import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };

  const SHOP = 'shop-1';
  const USER = 'user-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  describe('getNotifications', () => {
    it('returns notifications scoped to shop + recipient with meta', async () => {
      prisma.notification.findMany.mockResolvedValue([{ id: 'n1' }]);
      prisma.notification.count.mockResolvedValue(1);
      const res = await service.getNotifications(USER, {} as any);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { shopId: SHOP, recipientId: USER } }),
      );
      expect(res.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });
  });

  describe('markAsRead', () => {
    it('throws when the notification is not the user’s', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);
      await expect(service.markAsRead(USER, 'n1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('stamps readAt for an owned notification', async () => {
      prisma.notification.findFirst.mockResolvedValue({ id: 'n1' });
      const res = await service.markAsRead(USER, 'n1');
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { readAt: expect.any(Date) },
      });
      expect(res).toEqual({ status: 'marked_as_read' });
    });
  });

  describe('markAllAsRead', () => {
    it('marks every unread notification read', async () => {
      const res = await service.markAllAsRead(USER);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { shopId: SHOP, recipientId: USER, readAt: null },
        data: { readAt: expect.any(Date) },
      });
      expect(res).toEqual({ status: 'all_marked_as_read' });
    });
  });

  describe('deleteNotification', () => {
    it('throws when nothing was deleted (not owned)', async () => {
      prisma.notification.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.deleteNotification(USER, 'n1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('deletes an owned notification', async () => {
      prisma.notification.deleteMany.mockResolvedValue({ count: 1 });
      const res = await service.deleteNotification(USER, 'n1');
      expect(res).toEqual({ status: 'deleted', id: 'n1' });
    });
  });

  describe('createNotification', () => {
    it('maps payload to the data column', async () => {
      prisma.notification.create.mockResolvedValue({ id: 'n1' });
      await service.createNotification({
        shopId: SHOP,
        recipientId: USER,
        recipientType: 'CUSTOMER',
        type: 'ORDER_CREATED',
        title: 'T',
        body: 'B',
        payload: { orderId: 'o1' },
      });
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'ORDER_CREATED', data: { orderId: 'o1' } }),
      });
    });
  });
});
