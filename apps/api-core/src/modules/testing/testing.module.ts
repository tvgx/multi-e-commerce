import { Module } from '@nestjs/common';
import { TestingController } from './testing.controller';
import { TestingService } from './testing.service';
import { TestingGuard } from './testing.guard';

/**
 * Dev-only module powering the in-app test runner. Registered conditionally in
 * AppModule (never in production) — see app.module.ts.
 */
@Module({
  controllers: [TestingController],
  providers: [TestingService, TestingGuard],
})
export class TestingModule {}
