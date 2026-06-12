import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OptionTypeService } from './option-type.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('OptionTypeService', () => {
  let service: OptionTypeService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };

  const SHOP = 'shop-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptionTypeService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
      ],
    }).compile();

    service = module.get(OptionTypeService);
  });

  describe('findOne', () => {
    it('throws NotFound when the option type is not in this shop', async () => {
      prisma.optionType.findFirst.mockResolvedValue(null);
      await expect(service.findOne('ot1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates an option type scoped to the shop', async () => {
      prisma.optionType.create.mockResolvedValue({ id: 'ot1' });
      await service.create({ name: 'Size', presentation: 'Size' } as any);
      expect(prisma.optionType.create).toHaveBeenCalledWith({
        data: { shopId: SHOP, name: 'Size', presentation: 'Size' },
      });
    });
  });

  describe('update', () => {
    it('verifies ownership before updating', async () => {
      prisma.optionType.findFirst.mockResolvedValue(null);
      await expect(
        service.update('ot1', { name: 'X' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.optionType.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('verifies ownership before deleting', async () => {
      prisma.optionType.findFirst.mockResolvedValue(null);
      await expect(service.remove('ot1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.optionType.delete).not.toHaveBeenCalled();
    });
  });
});
