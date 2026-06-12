import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CategoryService } from './category.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('CategoryService', () => {
  let service: CategoryService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };

  const SHOP = 'shop-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
      ],
    }).compile();

    service = module.get(CategoryService);
  });

  describe('findOne / findBySlug', () => {
    it('throws NotFound when the category is not in this shop', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      await expect(service.findOne('c1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFound for an unknown slug', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.findBySlug('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('rejects when the parent category is not found', async () => {
      prisma.category.findFirst.mockResolvedValue(null); // verifyParent miss
      await expect(
        service.create({ name: 'Sub', slug: 'sub', parentId: 'p1' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates with defaults (position 0, active true)', async () => {
      prisma.category.create.mockResolvedValue({ id: 'c1' });
      await service.create({ name: 'Cat', slug: 'cat' } as any);
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ shopId: SHOP, position: 0, isActive: true }),
      });
    });
  });

  describe('update', () => {
    it('rejects a category set as its own parent', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'c1' }); // findOne ownership ok
      await expect(
        service.update('c1', { parentId: 'c1' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('verifies ownership first', async () => {
      prisma.category.findFirst.mockResolvedValue(null); // findOne throws
      await expect(
        service.update('c1', { name: 'X' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.category.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('verifies ownership before deleting', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      await expect(service.remove('c1')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it('deletes an owned category', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'c1' });
      await service.remove('c1');
      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });
  });
});
