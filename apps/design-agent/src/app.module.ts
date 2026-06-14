import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as path from 'path';
import { ExtractorModule } from './extractor/extractor.module';
import { RagModule } from './rag/rag.module';
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // Resolve the monorepo root .env (shared with api-core).
      envFilePath: path.resolve(__dirname, '../../../.env'),
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGO_DB_ATLAS') ||
          'mongodb://localhost:27017/ecommerce',
        serverSelectionTimeoutMS: 5000,
        autoIndex: true, // small CLI; building the unique index is fine
      }),
    }),
    ExtractorModule,
    RagModule,
    ChatbotModule,
  ],
})
export class AppModule {}
