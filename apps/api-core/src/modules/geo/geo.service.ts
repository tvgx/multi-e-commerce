import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Dữ liệu hành chính VN 2 cấp (Tỉnh/Thành → Phường/Xã). Tham chiếu toàn cục,
 * KHÔNG scope theo tenant. Seed bằng `npm run seed:geo`.
 */
@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  listProvinces() {
    return this.prisma.province.findMany({
      orderBy: { name: 'asc' },
      select: { code: true, name: true },
    });
  }

  listWards(provinceCode: string) {
    if (!provinceCode) throw new BadRequestException('provinceCode is required');
    return this.prisma.ward.findMany({
      where: { provinceCode },
      orderBy: { name: 'asc' },
      select: { code: true, name: true, provinceCode: true },
    });
  }
}
