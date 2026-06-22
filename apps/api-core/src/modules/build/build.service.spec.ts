import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  BuildService,
  SHOP_BUILD_QUEUE,
  STALE_BUILD_MS,
} from './build.service';
import { PrismaService } from '../../database/prisma.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

/**
 * BUILD-1: a build job stuck in RUNNING (worker crashed mid-build) must not
 * block the shop forever. enqueueBuild dedupes on an active job only while it is
 * still making progress (`updatedAt` fresh); once it goes stale past
 * STALE_BUILD_MS it is failed and a new job is enqueued.
 */
describe('BuildService — stale-job re-enqueue (BUILD-1)', () => {
  let service: BuildService;
  let prisma: MockPrisma;
  let queue: { add: jest.Mock };

  const SHOP = 'shop-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    queue = { add: jest.fn().mockResolvedValue({ id: 'bull-99' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuildService,
        { provide: PrismaService, useValue: prisma },
        { provide: getQueueToken(SHOP_BUILD_QUEUE), useValue: queue },
      ],
    }).compile();

    service = module.get(BuildService);
    prisma.shop.findUnique.mockResolvedValue({ id: SHOP });
  });

  it('rejects a missing shopId', async () => {
    await expect(service.enqueueBuild('')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws NotFound when the shop does not exist', async () => {
    prisma.shop.findUnique.mockResolvedValue(null);
    await expect(service.enqueueBuild(SHOP)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('dedupes to the active job while it is still making progress', async () => {
    prisma.shopBuildJob.findFirst.mockResolvedValue({
      id: 'rec-1',
      jobId: 'bull-1',
      status: 'RUNNING',
      updatedAt: new Date(Date.now() - 30_000), // 30s ago → fresh
    });

    const res = await service.enqueueBuild(SHOP);

    expect(res).toEqual({ jobId: 'bull-1', status: 'RUNNING' });
    expect(prisma.shopBuildJob.create).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
    expect(prisma.shopBuildJob.update).not.toHaveBeenCalled();
  });

  it('fails a stale RUNNING job and enqueues a fresh one', async () => {
    prisma.shopBuildJob.findFirst.mockResolvedValue({
      id: 'rec-stale',
      jobId: 'bull-1',
      status: 'RUNNING',
      updatedAt: new Date(Date.now() - STALE_BUILD_MS - 60_000), // past threshold
    });
    prisma.shopBuildJob.create.mockResolvedValue({ id: 'rec-new' });

    const res = await service.enqueueBuild(SHOP);

    // Old job marked FAILED so it stops blocking dedupe.
    expect(prisma.shopBuildJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rec-stale' },
        data: expect.objectContaining({ status: 'FAILED' }),
      }),
    );
    // A brand new job was created + queued.
    expect(prisma.shopBuildJob.create).toHaveBeenCalledWith({
      data: { shopId: SHOP, status: 'QUEUED', percent: 0 },
    });
    expect(queue.add).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ jobId: 'bull-99', status: 'QUEUED' });
  });

  it('creates a new job when none is active', async () => {
    prisma.shopBuildJob.findFirst.mockResolvedValue(null);
    prisma.shopBuildJob.create.mockResolvedValue({ id: 'rec-new' });

    const res = await service.enqueueBuild(SHOP);

    expect(prisma.shopBuildJob.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
    );
    expect(queue.add).toHaveBeenCalledTimes(1);
    // jobId backfilled onto the record after the Bull job is created.
    expect(prisma.shopBuildJob.update).toHaveBeenCalledWith({
      where: { id: 'rec-new' },
      data: { jobId: 'bull-99' },
    });
    expect(res).toEqual({ jobId: 'bull-99', status: 'QUEUED' });
  });
});
