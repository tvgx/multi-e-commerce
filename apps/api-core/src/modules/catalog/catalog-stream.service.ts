import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { Readable } from 'stream';

@Injectable()
export class CatalogStreamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  // Returns a readable stream of products in JSON Lines (JSONL) format
  async streamProductsJsonl(): Promise<Readable> {
    const shopId = this.getShopId();
    const batchSize = 100;
    
    // Create an async generator that fetches chunks from the database
    async function* generateData(prisma: PrismaService) {
      let cursor: string | undefined = undefined;
      let hasMore = true;

      while (hasMore) {
        const query: any = {
          where: { shopId },
          take: batchSize,
          orderBy: { id: 'asc' },
          include: { variants: true }
        };

        if (cursor) {
          query.cursor = { id: cursor };
          query.skip = 1; // skip the cursor itself
        }

        const batch = await prisma.product.findMany(query);
        
        if (batch.length === 0) {
          hasMore = false;
        } else {
          cursor = batch[batch.length - 1].id;
          // Yield each item as a JSONL string
          for (const item of batch) {
            yield JSON.stringify(item) + '\n';
          }
        }
      }
    }

    // Convert async generator to a Node.js Readable stream
    return Readable.from(generateData(this.prisma));
  }
}
