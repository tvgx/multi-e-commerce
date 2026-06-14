import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FigmaClient } from './figma-client.service';
import { ClaudeExtractorService } from './claude-extractor.service';
import { ComponentMapperService } from './component-mapper.service';
import { MongoRepository } from './mongo.repository';
import { ExtractCommand } from './commands/extract.command';
import { PageLayout, PageLayoutSchema } from './schemas/page-layout.schema';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PageLayout.name, schema: PageLayoutSchema },
    ]),
    RagModule,
  ],
  providers: [
    FigmaClient,
    ClaudeExtractorService,
    ComponentMapperService,
    MongoRepository,
    ExtractCommand,
  ],
})
export class ExtractorModule {}
