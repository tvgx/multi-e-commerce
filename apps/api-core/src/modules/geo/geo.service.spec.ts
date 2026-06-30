import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GeoService } from './geo.service';
import { PrismaService } from '../../database/prisma.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('GeoService', () => {
  let service: GeoService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(GeoService);
  });

  describe('listProvinces', () => {
    it('returns provinces ordered by name with a code+name projection', async () => {
      const rows = [
        { code: '01', name: 'An Giang' },
        { code: '79', name: 'Thành phố Hồ Chí Minh' },
      ];
      prisma.province.findMany.mockResolvedValue(rows);

      const res = await service.listProvinces();

      expect(prisma.province.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
        select: { code: true, name: true },
      });
      expect(res).toEqual(rows);
    });
  });

  describe('listWards', () => {
    it('returns wards filtered by provinceCode and ordered by name', async () => {
      const rows = [
        { code: '0001', name: 'Phường 1', provinceCode: '79' },
        { code: '0002', name: 'Phường 2', provinceCode: '79' },
      ];
      prisma.ward.findMany.mockResolvedValue(rows);

      const res = await service.listWards('79');

      expect(prisma.ward.findMany).toHaveBeenCalledWith({
        where: { provinceCode: '79' },
        orderBy: { name: 'asc' },
        select: { code: true, name: true, provinceCode: true },
      });
      expect(res).toEqual(rows);
    });

    it('throws BadRequestException when provinceCode is missing', () => {
      expect(() => service.listWards('')).toThrow(BadRequestException);
      expect(prisma.ward.findMany).not.toHaveBeenCalled();
    });
  });
});
