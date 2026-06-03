import { Test, TestingModule } from '@nestjs/testing';
import { ShopService } from './shop.service';
import { PrismaService } from '../database/prisma.service';
import { TenantService } from '../common/services/tenant.service';
import { DomainVerifyService } from './domain-verify.service';

describe('ShopService', () => {
  let service: ShopService;

  beforeEach(async () => {
    const mockPrismaService = {
      shop: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockTenantService = {
      createTenant: jest.fn(),
      getTenant: jest.fn(),
    };

    const mockDomainVerifyService = {
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
        {
          provide: DomainVerifyService,
          useValue: mockDomainVerifyService,
        },
      ],
    }).compile();

    service = module.get<ShopService>(ShopService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
