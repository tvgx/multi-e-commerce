import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SystemCacheService } from '../system/cache/cache.service';

@Injectable()
export class StorageQuotaService {
  private readonly DEFAULT_LIMIT = BigInt(1024 * 1024 * 1024); // 1GB
  private readonly CHUNK_SIZE = BigInt(16 * 1024 * 1024); // 16MB

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SystemCacheService)
    private readonly cacheService: SystemCacheService,
  ) {}

  /**
   * Kiểm tra xem shop còn đủ dung lượng để upload hay không
   */
  async checkQuota(shopId: string, bytesToAdd: number): Promise<void> {
    const cacheKey = `storage-quota:${shopId}`;
    let usage = await this.cacheService.get<any>(cacheKey);

    if (!usage) {
      const shop = await this.prisma.shop.findUnique({
        where: { id: shopId },
        select: {
          storageUsedBytes: true,
          storageTotalLimit: true,
        },
      });
      if (shop) {
        usage = {
          usedBytes: shop.storageUsedBytes.toString(),
          totalLimit: shop.storageTotalLimit.toString(),
        };
        // Cache for 5 minutes
        await this.cacheService.set(cacheKey, usage, 300000);
      }
    }

    const currentUsed = usage ? BigInt(usage.usedBytes) : BigInt(0);
    const limit = usage ? BigInt(usage.totalLimit) : this.DEFAULT_LIMIT;

    if (currentUsed + BigInt(bytesToAdd) > limit) {
      throw new BadRequestException(
        `Storage quota exceeded. Used: ${this.formatBytes(currentUsed)}, Remaining: ${this.formatBytes(limit - currentUsed)}`,
      );
    }
  }

  /**
   * Cập nhật dung lượng đã sử dụng sau khi upload thành công
   */
  async recordUpload(shopId: string, bytesUsed: number): Promise<void> {
    const shop = await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        storageUsedBytes: { increment: BigInt(bytesUsed) },
      },
      select: {
        storageUsedBytes: true,
      },
    });

    // Recalculate chunks
    const currentTotal = shop.storageUsedBytes;
    const newChunkCount = Math.ceil(
      Number(currentTotal) / Number(this.CHUNK_SIZE),
    );

    await this.prisma.shop.update({
      where: { id: shopId },
      data: { storageChunkCount: newChunkCount },
    });

    await this.cacheService.del(`storage-quota:${shopId}`);
  }

  /**
   * Trừ dung lượng khi xóa file
   */
  async recordDeletion(shopId: string, bytesRemoved: number): Promise<void> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        storageUsedBytes: true,
      },
    });

    if (!shop) return;

    let newUsed = shop.storageUsedBytes - BigInt(bytesRemoved);
    if (newUsed < BigInt(0)) newUsed = BigInt(0);

    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        storageUsedBytes: newUsed,
        storageChunkCount: Math.ceil(Number(newUsed) / Number(this.CHUNK_SIZE)),
      },
    });

    await this.cacheService.del(`storage-quota:${shopId}`);
  }

  private formatBytes(bytes: bigint): string {
    const mb = Number(bytes) / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }
}
