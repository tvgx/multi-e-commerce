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
