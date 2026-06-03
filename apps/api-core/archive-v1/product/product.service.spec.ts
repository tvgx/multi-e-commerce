import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { PrismaService } from '../database/prisma.service';
import { TenantService } from '../common/services/tenant.service';
import { getModelToken } from '@nestjs/mongoose';
import { ProductLayout } from './schemas/product-layout.schema';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(async () => {
    const mockPrismaService = {
      product: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const mockTenantService = {
      getTenant: jest.fn(),
    };

    const mockProductLayoutModel = {
      create: jest.fn(),
      findById: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
        {
          provide: getModelToken(ProductLayout.name),
          useValue: mockProductLayoutModel,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
