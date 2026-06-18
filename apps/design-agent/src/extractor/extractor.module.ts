import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FigmaClient } from './figma-client.service';
import { ClaudeExtractorService } from './claude-extractor.service';
import { ComponentMapperService } from './component-mapper.service';
import { ComponentPropReader } from './component-prop.reader';
import { AssetPipelineService } from './asset-pipeline.service';
import { MongoRepository } from './mongo.repository';
import { ThemeRepository } from './theme.repository';
import { ExtractorService } from './extractor.service';
import { ExtractorController } from './extractor.controller';
import { ExtractCommand } from './commands/extract.command';
import { PromoteThemeCommand } from './commands/promote-theme.command';
import { PageLayout, PageLayoutSchema } from './schemas/page-layout.schema';
import {
  ThemeTemplate,
  ThemeTemplateSchema,
} from './schemas/theme-template.schema';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PageLayout.name, schema: PageLayoutSchema },
      { name: ThemeTemplate.name, schema: ThemeTemplateSchema },
    ]),
    RagModule,
  ],
  controllers: [ExtractorController],
  providers: [
    FigmaClient,
    ClaudeExtractorService,
    ComponentMapperService,
    ComponentPropReader,
    AssetPipelineService,
    MongoRepository,
    ThemeRepository,
    ExtractorService,
    ExtractCommand,
    PromoteThemeCommand,
  ],
})
export class ExtractorModule {}
