import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

/**
 * Dual entrypoint:
 *   - `serve`            → boot the HTTP server (chatbot at POST /design-agent/chat)
 *   - extract|build-index|rag-query|… → run the nest-commander CLI and exit
 */
async function bootstrap(): Promise<void> {
  if (process.argv.includes('serve')) {
    // Fail-fast on the shared server-to-server secret: without it, the
    // /design-agent/extract-theme endpoint rejects EVERY import with a 401 that
    // surfaces in the admin UI only as a vague "Import thất bại" (THEME-3). The
    // key must be IDENTICAL to api-core's INTERNAL_API_KEY (both read the root
    // .env in this monorepo; on a split deploy you must set it on both).
    if (!process.env.INTERNAL_API_KEY?.trim()) {
      throw new Error(
        'INTERNAL_API_KEY is not set — design-agent serve mode requires it for ' +
          'the internal extract-theme endpoint. It must match api-core exactly.',
      );
    }
    const app = await NestFactory.create(AppModule);
    const port = Number(process.env.DESIGN_AGENT_PORT ?? 3100);
    await app.listen(port);
    new Logger('Bootstrap').log(
      `design-agent HTTP server listening on :${port} (POST /design-agent/chat)`,
    );
    return;
  }

  await CommandFactory.run(AppModule, ['warn', 'error', 'log']);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
