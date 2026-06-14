import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PageLayout,
  PageLayoutSchema,
} from '../extractor/schemas/page-layout.schema';
import { RagModule } from '../rag/rag.module';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ConversationRepository } from './conversation.repository';
import {
  Conversation,
  ConversationSchema,
} from './schemas/conversation.schema';
import { ComponentRegistryReader } from './tools/component-registry.reader';
import { MasterTemplateReader } from './tools/master-template.reader';
import { ToolExecutorService } from './tools/tool-executor.service';

/**
 * The design-agent chatbot: a Claude tool-calling assistant over extracted
 * layouts. Imports {@link RagModule} for retrieval and registers the
 * `page_layouts` + `design_agent_conversations` collections.
 */
@Module({
  imports: [
    RagModule,
    MongooseModule.forFeature([
      { name: PageLayout.name, schema: PageLayoutSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    ConversationRepository,
    ToolExecutorService,
    ComponentRegistryReader,
    MasterTemplateReader,
  ],
  exports: [ChatbotService],
})
export class ChatbotModule {}
