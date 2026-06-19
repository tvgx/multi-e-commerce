import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomerAddressService } from './customer-address.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('CustomerAddressService', () => {
  let service: CustomerAddressService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };

  const CUSTOMER = 'cust-1';
  const validDto = {
    fullName: 'Alice',
    phone: '0900000000',
    addressLine1: '1 Main St',
    city: 'HCMC',
    province: 'HCM',
  };

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue('shop-1') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerAddressService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
      ],
    }).compile();

    service = module.get(CustomerAddressService);
  });

  describe('findAll', () => {
    it('lists addresses scoped to shop + customer, default first', async () => {
      prisma.customerAddress.findMany.mockResolvedValue([{ id: 'a1' }]);
      const res = await service.findAll(CUSTOMER);
      expect(prisma.customerAddress.findMany).toHaveBeenCalledWith({
        where: { shopId: 'shop-1', customerId: CUSTOMER },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
      expect(res.data).toEqual([{ id: 'a1' }]);
    });
  });

  describe('create', () => {
    it('throws BadRequest when shop context is missing', async () => {
      tenant.getTenantId.mockReturnValue(undefined);
      await expect(service.create(CUSTOMER, validDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it.each(['fullName', 'phone', 'addressLine1', 'city', 'province'])(
      'throws BadRequest when %s is missing',
      async (field) => {
        const dto = { ...validDto, [field]: '' };
        await expect(service.create(CUSTOMER, dto as any)).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it('forces the first address to be default regardless of dto.isDefault', async () => {
      prisma.customerAddress.count.mockResolvedValue(0);
      prisma.customerAddress.create.mockResolvedValue({ id: 'a1', isDefault: true });

      const res = await service.create(CUSTOMER, { ...validDto, isDefault: false });

      // No reset of existing defaults since there are none.
      expect(prisma.customerAddress.updateMany).not.toHaveBeenCalled();
      expect(prisma.customerAddress.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isDefault: true }) }),
      );
      expect(res).toEqual({ status: 'created', address: { id: 'a1', isDefault: true } });
    });

    it('clears prior defaults when creating a new default address', async () => {
      prisma.customerAddress.count.mockResolvedValue(2);
      prisma.customerAddress.create.mockResolvedValue({ id: 'a3', isDefault: true });

      await service.create(CUSTOMER, { ...validDto, isDefault: true });

      expect(prisma.customerAddress.updateMany).toHaveBeenCalledWith({
        where: { shopId: 'shop-1', customerId: CUSTOMER, isDefault: true },
        data: { isDefault: false },
      });
    });

    it('does not clear defaults when creating a non-default address', async () => {
      prisma.customerAddress.count.mockResolvedValue(2);
      prisma.customerAddress.create.mockResolvedValue({ id: 'a3', isDefault: false });

      await service.create(CUSTOMER, { ...validDto, isDefault: false });

      expect(prisma.customerAddress.updateMany).not.toHaveBeenCalled();
      expect(prisma.customerAddress.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isDefault: false }) }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFound when the address does not belong to the customer', async () => {
      prisma.customerAddress.findFirst.mockResolvedValue(null);
      await expect(
        service.update(CUSTOMER, 'a1', { isDefault: true }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('promotes to default and clears other defaults when previously non-default', async () => {
      prisma.customerAddress.findFirst.mockResolvedValue({ id: 'a1', isDefault: false });
      prisma.customerAddress.update.mockResolvedValue({ id: 'a1', isDefault: true });

      await service.update(CUSTOMER, 'a1', { isDefault: true });

      expect(prisma.customerAddress.updateMany).toHaveBeenCalledWith({
        where: { shopId: 'shop-1', customerId: CUSTOMER, isDefault: true },
        data: { isDefault: false },
      });
      expect(prisma.customerAddress.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'a1' } }),
      );
    });

    it('does not reshuffle defaults when the address was already default', async () => {
      prisma.customerAddress.findFirst.mockResolvedValue({ id: 'a1', isDefault: true });
      prisma.customerAddress.update.mockResolvedValue({ id: 'a1' });

      await service.update(CUSTOMER, 'a1', { isDefault: true });

      expect(prisma.customerAddress.updateMany).not.toHaveBeenCalled();
    });

    it('refuses to clear the flag on the sole default address (ADDR-1)', async () => {
      prisma.customerAddress.findFirst.mockResolvedValue({ id: 'a1', isDefault: true });
      prisma.customerAddress.update.mockResolvedValue({ id: 'a1', isDefault: true });

      await service.update(CUSTOMER, 'a1', { isDefault: false, fullName: 'Bob' });

      // The other fields still update, but isDefault is left untouched (undefined)
      // so the customer is never left with zero default addresses.
      const data = prisma.customerAddress.update.mock.calls[0][0].data;
      expect(data.isDefault).toBeUndefined();
      expect(data.fullName).toBe('Bob');
      expect(prisma.customerAddress.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFound when the address is absent', async () => {
      prisma.customerAddress.findFirst.mockResolvedValue(null);
      await expect(service.remove(CUSTOMER, 'a1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('promotes the most recent remaining address when deleting the default', async () => {
      prisma.customerAddress.findFirst
        .mockResolvedValueOnce({ id: 'a1', isDefault: true }) // the lookup in remove()
        .mockResolvedValueOnce({ id: 'a2' }); // the "next" inside the tx

      const res = await service.remove(CUSTOMER, 'a1');

      expect(prisma.customerAddress.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
      expect(prisma.customerAddress.update).toHaveBeenCalledWith({
        where: { id: 'a2' },
        data: { isDefault: true },
      });
      expect(res).toEqual({ status: 'deleted', id: 'a1' });
    });

    it('does not promote anyone when deleting a non-default address', async () => {
      prisma.customerAddress.findFirst.mockResolvedValue({ id: 'a2', isDefault: false });
      await service.remove(CUSTOMER, 'a2');
      expect(prisma.customerAddress.update).not.toHaveBeenCalled();
    });

    it('handles deleting the last (default) address with nothing left to promote', async () => {
      prisma.customerAddress.findFirst
        .mockResolvedValueOnce({ id: 'a1', isDefault: true })
        .mockResolvedValueOnce(null);
      await service.remove(CUSTOMER, 'a1');
      expect(prisma.customerAddress.update).not.toHaveBeenCalled();
    });
  });

  describe('setDefault', () => {
    it('throws NotFound when the address is absent', async () => {
      prisma.customerAddress.findFirst.mockResolvedValue(null);
      await expect(service.setDefault(CUSTOMER, 'a1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('clears existing defaults then marks the target as default', async () => {
      prisma.customerAddress.findFirst.mockResolvedValue({ id: 'a1' });
      prisma.customerAddress.update.mockResolvedValue({ id: 'a1', isDefault: true });

      const res = await service.setDefault(CUSTOMER, 'a1');

      expect(prisma.customerAddress.updateMany).toHaveBeenCalledWith({
        where: { shopId: 'shop-1', customerId: CUSTOMER, isDefault: true },
        data: { isDefault: false },
      });
      expect(prisma.customerAddress.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { isDefault: true },
      });
      expect(res).toEqual({ status: 'updated', address: { id: 'a1', isDefault: true } });
    });
  });
});
