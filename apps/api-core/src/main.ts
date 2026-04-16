// Load environment variables from workspace root .env file
// This must happen before any other imports that use process.env
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Try to load .env from workspace root
const rootEnvPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
import "reflect-metadata";
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { CustomExceptionFilter } from './common/exceptions/custom-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Global Exception Filter
  app.useGlobalFilters(new CustomExceptionFilter());
  // Graceful shutdown
  app.enableShutdownHooks();
  // Enable CORS for frontend integration
  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
