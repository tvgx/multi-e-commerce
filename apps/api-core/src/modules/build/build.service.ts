import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { BuildStatusDto, EnqueueBuildResultDto } from './dto/build.dto';

export const SHOP_BUILD_QUEUE = 'shop-build';
export const SHOP_BUILD_JOB = 'build-shop';

// Worker cập nhật `updatedAt` mỗi bước tiến độ (onProgress → status RUNNING).
// Một job QUEUED/RUNNING không nhúc nhích quá ngưỡng này coi như worker đã chết
// giữa chừng → cho enqueue lại thay vì kẹt dedupe vĩnh viễn (BUILD-1).
export const STALE_BUILD_MS = 15 * 60 * 1000; // 15 phút

/**
 * Producer + status reader cho build shop nền.
 * Việc compile thật do worker độc lập /scripts/shop-builder xử lý (consumer).
 * api-core CHỈ enqueue job + đọc tiến độ từ bảng shop_build_jobs (source-of-truth).
 */
@Injectable()
export class BuildService {
  private readonly logger = new Logger(BuildService.name);

  constructor(
    @InjectQueue(SHOP_BUILD_QUEUE) private readonly buildQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async enqueueBuild(shopId: string): Promise<EnqueueBuildResultDto> {
    if (!shopId) throw new BadRequestException('shopId is required');
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true },
    });
    if (!shop) throw new NotFoundException('Shop not found');

    // Dedupe: nếu đã có build đang chạy thì trả lại job đó (tránh double-click xếp chồng).
    const active = await this.prisma.shopBuildJob.findFirst({
      where: { shopId, status: { in: ['QUEUED', 'RUNNING'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (active) {
      const ageMs = Date.now() - active.updatedAt.getTime();
      // Job còn "sống" (worker vừa cập nhật tiến độ) → dedupe trả lại job hiện tại.
      if (ageMs < STALE_BUILD_MS) {
        return { jobId: active.jobId ?? active.id, status: active.status };
      }
      // Quá lâu không có cập nhật → worker nhiều khả năng đã chết giữa chừng. Đánh
      // dấu FAILED để giải phóng dedupe rồi enqueue job mới bên dưới (nếu không sẽ
      // kẹt RUNNING vĩnh viễn, shop không bao giờ build lại được).
      this.logger.warn(
        `Build job ${active.jobId ?? active.id} (shop=${shopId}, status=${active.status}) ` +
          `stale ${Math.round(ageMs / 60000)}m without progress; marking FAILED and re-enqueuing.`,
      );
      await this.prisma.shopBuildJob.update({
        where: { id: active.id },
        data: {
          status: 'FAILED',
          error: `Build coi như thất bại: không có cập nhật tiến độ sau ${Math.round(
            STALE_BUILD_MS / 60000,
          )} phút (worker có thể đã dừng).`,
        },
      });
    }

    const record = await this.prisma.shopBuildJob.create({
      data: { shopId, status: 'QUEUED', percent: 0 },
    });

    const job = await this.buildQueue.add(
      SHOP_BUILD_JOB,
      { shopId, recordId: record.id },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: false,
      },
    );

    await this.prisma.shopBuildJob.update({
      where: { id: record.id },
      data: { jobId: String(job.id) },
    });

    return { jobId: String(job.id), status: 'QUEUED' };
  }

  async getLatestStatus(shopId: string): Promise<BuildStatusDto> {
    if (!shopId) throw new BadRequestException('shopId is required');
    const row = await this.prisma.shopBuildJob.findFirst({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });

    // Chưa có row (UI vào ?finalizing=true trước khi enqueue commit) → trả QUEUED 0%
    // để thanh tiến trình khởi động mượt, không 404.
    if (!row) {
      return {
        shopId,
        jobId: null,
        status: 'QUEUED',
        percent: 0,
        stage: null,
        storefrontUrl: null,
        error: null,
        updatedAt: null,
      };
    }

    return {
      shopId,
      jobId: row.jobId,
      status: row.status,
      percent: row.percent,
      stage: row.stage,
      storefrontUrl: row.storefrontUrl,
      error: row.error,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
