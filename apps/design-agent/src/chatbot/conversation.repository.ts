import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
  ConversationMessage,
} from './schemas/conversation.schema';

/** Most recent turns loaded back into the model's context window. */
export const HISTORY_WINDOW = 10;

/**
 * Read/append access to `design_agent_conversations`. Every lookup is scoped by
 * `conversation_id` AND `tenant_id`, so a conversation started under one tenant
 * can never be read or extended under another.
 */
@Injectable()
export class ConversationRepository {
  constructor(
    @InjectModel(Conversation.name)
    private readonly model: Model<ConversationDocument>,
  ) {}

  /** Last {@link HISTORY_WINDOW} messages for a conversation, oldest first. */
  async loadRecent(
    conversationId: string,
    tenantId: string | null,
  ): Promise<ConversationMessage[]> {
    const doc = await this.model
      .findOne(
        { conversation_id: conversationId, tenant_id: tenantId ?? null },
        { messages: { $slice: -HISTORY_WINDOW } },
      )
      .lean()
      .exec();
    return doc?.messages ?? [];
  }

  /** Append a user turn and the assistant's reply in one upsert. */
  async appendTurn(
    conversationId: string,
    tenantId: string | null,
    turns: ConversationMessage[],
  ): Promise<void> {
    await this.model
      .updateOne(
        { conversation_id: conversationId, tenant_id: tenantId ?? null },
        {
          $setOnInsert: {
            conversation_id: conversationId,
            tenant_id: tenantId ?? null,
          },
          $push: { messages: { $each: turns } },
        },
        { upsert: true },
      )
      .exec();
  }
}
