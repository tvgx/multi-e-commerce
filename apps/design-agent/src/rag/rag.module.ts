import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PageLayout, PageLayoutSchema } from '../extractor/schemas/page-layout.schema';
import {
  LayoutEmbedding,
  LayoutEmbeddingSchema,
} from './schemas/layout-embedding.schema';
import { LayoutChunkerService } from './chunking.service';
import { EmbeddingService } from './embedding.service';
import { EmbeddingIndexRepository } from './embedding-index.repository';
import { IndexBuilderService } from './index-builder.service';
import { RagRetrievalService } from './rag-retrieval.service';
import { BuildIndexCommand } from './commands/build-index.command';
import { RagQueryCommand } from './commands/rag-query.command';

/**
 * RAG layer over extracted layouts: chunk → embed (Voyage) → store in
 * `layout_embeddings` → retrieve by cosine similarity. Exports
 * {@link IndexBuilderService} (so extraction can auto-refresh the index) and
 * {@link RagRetrievalService} (the chatbot's retrieval entrypoint).
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PageLayout.name, schema: PageLayoutSchema },
      { name: LayoutEmbedding.name, schema: LayoutEmbeddingSchema },
    ]),
  ],
  providers: [
    LayoutChunkerService,
    EmbeddingService,
    EmbeddingIndexRepository,
    IndexBuilderService,
    RagRetrievalService,
    BuildIndexCommand,
    RagQueryCommand,
  ],
  exports: [IndexBuilderService, RagRetrievalService],
})
export class RagModule {}
