import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { TestingService } from './testing.service';
import { TestingGuard } from './testing.guard';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import type { HttpScenario } from './testing.catalog';

/**
 * Dev-only in-app test runner. Powers the "Testing" tool in the admin GUI:
 * list suites, read/write source files, run Jest (with live SSE logs) and run
 * editable HTTP scenarios. Guarded so it never activates in production.
 */
@UseGuards(TestingGuard)
@Controller('testing')
export class TestingController {
  constructor(private readonly svc: TestingService) {}

  @Get('suites')
  async suites() {
    return BaseResponseDto.success(await this.svc.listSuites());
  }

  @Get('file')
  async readFile(@Query('path') p: string) {
    return BaseResponseDto.success(await this.svc.readFile(p));
  }

  @Put('file')
  async writeFile(@Body() body: { path: string; content: string }) {
    return BaseResponseDto.success(await this.svc.writeFile(body?.path, body?.content));
  }

  @Post('run/jest')
  async runJest(@Body() body: { specPath?: string; testNamePattern?: string }) {
    const result = await this.svc.runJest({
      specPath: body?.specPath,
      testNamePattern: body?.testNamePattern,
    });
    return BaseResponseDto.success(result);
  }

  /** Server-Sent Events: stream jest stderr live, then a final `result` event. */
  @Get('run/jest/stream')
  async streamJest(
    @Query('spec') spec: string,
    @Query('t') t: string,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      (res as unknown as { flush?: () => void }).flush?.();
    };

    try {
      const result = await this.svc.runJest({
        specPath: spec || undefined,
        testNamePattern: t || undefined,
        onLog: (chunk) => send('log', { chunk }),
      });
      send('result', result);
    } catch (e: any) {
      send('error', { message: e?.message || 'Test run failed' });
    } finally {
      res.end();
    }
  }

  @Post('run/http')
  async runHttp(@Body() body: HttpScenario) {
    if (!body || !body.path) {
      throw new BadRequestException('scenario is required');
    }
    return BaseResponseDto.success(await this.svc.runHttp(body));
  }
}
