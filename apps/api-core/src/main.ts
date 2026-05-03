import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { CustomExceptionFilter } from './common/exceptions/custom-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Global Exception Filter
  app.useGlobalFilters(new CustomExceptionFilter());
  // Graceful shutdown
  app.enableShutdownHooks();
  // Enable CORS for frontend integration
  app.enableCors({
    origin: true, // This allows any origin and automatically sets Access-Control-Allow-Origin to the requested origin
    credentials: true,
  });
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const logger = new Logger('Infrastructure');
  logger.log(`=================================================`);
  logger.log(`🚀 API Core is running on: http://localhost:${port}`);

  // Supabase (Postgres)
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.includes('supabase')) {
    logger.log(
      `🐘 Postgres (Supabase): Connected to pooler -> ${dbUrl.split('@')[1] || 'Supabase'}`,
    );
  }

  // MongoDB Atlas
  const mongoUrl = process.env.MONGO_DB_ATLAS || '';
  if (mongoUrl.includes('mongodb.net')) {
    logger.log(
      `🍃 MongoDB (Atlas): Connected to cluster -> ${mongoUrl.split('@')[1]?.split('/')[0] || 'Atlas'}`,
    );
  }

  // MinIO
  const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const minioPort = process.env.MINIO_PORT || '9000';
  logger.log(
    `🪣 MinIO Storage: http://${minioEndpoint}:${minioPort} (Console typically on port 9001)`,
  );
  logger.log(`=================================================`);
}
bootstrap();
