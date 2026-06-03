import { Test, TestingModule } from '@nestjs/testing';
import { SystemService } from './system.service';
import { PrismaService } from '../database/prisma.service';

describe('SystemService', () => {
  let service: SystemService;

  beforeEach(async () => {
    const mockPrismaService = {
      shop: {
        count: jest.fn().mockResolvedValue(0),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SystemService>(SystemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
