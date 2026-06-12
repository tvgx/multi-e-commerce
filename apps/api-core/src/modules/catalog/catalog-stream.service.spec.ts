import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CatalogStreamService } from './catalog-stream.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('CatalogStreamService', () => {
  let service: CatalogStreamService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };

  const SHOP = 'shop-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogStreamService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
      ],
    }).compile();

    service = module.get(CatalogStreamService);
  });

  it('throws BadRequest with no tenant context', async () => {
    tenant.getTenantId.mockReturnValue(undefined);
    await expect(service.streamProductsJsonl()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('streams products as JSONL and paginates by cursor until empty', async () => {
    prisma.product.findMany
      .mockResolvedValueOnce([{ id: 'p1' }, { id: 'p2' }])
      .mockResolvedValueOnce([]); // terminates the loop

    const stream = await service.streamProductsJsonl();
    const chunks: string[] = [];
    for await (const c of stream) chunks.push(c.toString());

    const lines = chunks.join('').trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).id).toBe('p1');
    expect(JSON.parse(lines[1]).id).toBe('p2');

    // Second page must continue after the last id via cursor + skip
    const secondCall = prisma.product.findMany.mock.calls[1][0];
    expect(secondCall.cursor).toEqual({ id: 'p2' });
    expect(secondCall.skip).toBe(1);
  });
});
