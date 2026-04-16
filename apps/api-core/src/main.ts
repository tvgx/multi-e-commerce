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
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
