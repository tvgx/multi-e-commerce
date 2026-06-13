import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import Queue from 'bull';
import type { Job } from 'bull';

import { WorkerAppModule } from '../../apps/api-core/src/worker.module';
import { LayoutService } from '../../apps/api-core/src/modules/layout/layout.service';
import { PrismaService } from '../../apps/api-core/src/database/prisma.service';

import { extractData } from './pipeline/01-data-extractor';
import { assemblePages } from './pipeline/02-page-assembler';
import { compileLayout } from './pipeline/03-layout-compiler';
import { publishStorage } from './pipeline/04-storage-publisher';

/**
 * Worker độc lập compile/publish shop (script-plan.md).
 * Producer là api-core (BuildService) — đẩy job 'build-shop' vào queue 'shop-build'.
 * Worker này pull job ra, chạy pipeline 01→04 và cập nhật % tiến độ vào shop_build_jobs.
 *
 * Chạy:  npm run worker:shop-builder
 * (Bull + Redis phải khớp api-core: cùng host/port + prefix 'bull' + queue 'shop-build'.)
 */

const QUEUE_NAME = 'shop-build';
const JOB_NAME = 'build-shop';
const CONCURRENCY = Number(process.env.SHOP_BUILD_CONCURRENCY || 4);

type BuildJobData = { shopId: string; recordId: string };

async function main() {
  const app = await NestFactory.createApplicationContext(WorkerAppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const layoutService = app.get(LayoutService);
  const prisma = app.get(PrismaService);

  const redis = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  };
  const queue = new Queue<BuildJobData>(QUEUE_NAME, { redis });

  // eslint-disable-next-line no-console
  console.log(
    `[shop-builder] listening "${QUEUE_NAME}" (concurrency=${CONCURRENCY}) on redis ${redis.host}:${redis.port}`,
  );

  queue.process(JOB_NAME, CONCURRENCY, async (job: Job<BuildJobData>) => {
    const { shopId, recordId } = job.data;

    const onProgress = async (percent: number, stage: string) => {
      await prisma.shopBuildJob
        .update({ where: { id: recordId }, data: { status: 'RUNNING', percent, stage } })
        .catch(() => undefined);
      await job.progress(percent);
    };

    try {
      // eslint-disable-next-line no-console
      console.log(`[shop-builder] build start shop=${shopId} record=${recordId}`);
      const cache = new Map<string, string>();

      await onProgress(10, 'extract');
      const extracted = await extractData(layoutService, shopId);
      await onProgress(30, 'parse');

      await onProgress(40, 'assemble');
      const assembled = assemblePages(layoutService, extracted);
      await onProgress(60, 'assemble');

      await onProgress(70, 'compile');
      const compiled = await compileLayout(layoutService, shopId, assembled, cache);
      await onProgress(80, 'compile');

      await onProgress(90, 'db-save');
      const storefrontUrl = await publishStorage(layoutService, shopId, compiled);
      await onProgress(95, 'minio');

      await prisma.shopBuildJob.update({
        where: { id: recordId },
        data: { status: 'COMPLETED', percent: 100, stage: 'published', storefrontUrl, error: null },
      });
      // eslint-disable-next-line no-console
      console.log(`[shop-builder] build done shop=${shopId} -> ${storefrontUrl}`);
    } catch (err: any) {
      const msg = (err?.message ?? 'Build failed').slice(0, 500);
      // eslint-disable-next-line no-console
      console.error(`[shop-builder] build FAILED shop=${shopId}: ${msg}`);
      await prisma.shopBuildJob
        .update({
          where: { id: recordId },
          data: { status: 'FAILED', error: msg, attempts: { increment: 1 } },
        })
        .catch(() => undefined);
      throw err; // để Bull retry theo cấu hình attempts/backoff
    }
  });

  const shutdown = async () => {
    // eslint-disable-next-line no-console
    console.log('[shop-builder] shutting down...');
    try {
      await queue.close();
      await app.close();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('[shop-builder] fatal', e);
  process.exit(1);
});
