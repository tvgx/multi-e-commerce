import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class StorageQuotaService {
  private readonly DEFAULT_LIMIT = BigInt(1024 * 1024 * 1024); // 1GB
  private readonly CHUNK_SIZE = BigInt(16 * 1024 * 1024); // 16MB

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kiểm tra xem shop còn đủ dung lượng để upload hay không
   */
  async checkQuota(shopId: string, bytesToAdd: number): Promise<void> {
    const usage = await this.prisma.storageUsage.findUnique({
      where: { shopId },
    });

    const currentUsed = usage?.usedBytes || BigInt(0);
    const limit = usage?.totalLimit || this.DEFAULT_LIMIT;

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
    const usage = await this.prisma.storageUsage.upsert({
      where: { shopId },
      create: {
        shopId,
        usedBytes: BigInt(bytesUsed),
        chunkCount: Math.ceil(bytesUsed / Number(this.CHUNK_SIZE)),
      },
      update: {
        usedBytes: { increment: BigInt(bytesUsed) },
      },
    });

    // Recalculate chunks
    const currentTotal = usage.usedBytes;
    const newChunkCount = Math.ceil(Number(currentTotal) / Number(this.CHUNK_SIZE));

    await this.prisma.storageUsage.update({
      where: { shopId },
      data: { chunkCount: newChunkCount },
    });
  }

  /**
   * Trừ dung lượng khi xóa file
   */
  async recordDeletion(shopId: string, bytesRemoved: number): Promise<void> {
    const usage = await this.prisma.storageUsage.findUnique({
      where: { shopId },
    });

    if (!usage) return;

    let newUsed = usage.usedBytes - BigInt(bytesRemoved);
    if (newUsed < BigInt(0)) newUsed = BigInt(0);

    await this.prisma.storageUsage.update({
      where: { shopId },
      data: {
        usedBytes: newUsed,
        chunkCount: Math.ceil(Number(newUsed) / Number(this.CHUNK_SIZE)),
      },
    });
  }

  private formatBytes(bytes: bigint): string {
    const mb = Number(bytes) / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }
}
