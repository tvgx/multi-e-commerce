import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationDocument = Conversation & Document;

/** One stored turn. `content` is the plain text shown to/produced by the user. */
@Schema({ _id: false })
export class ConversationMessage {
  @Prop({ type: String, enum: ['user', 'assistant'], required: true })
  role: 'user' | 'assistant';

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export const ConversationMessageSchema =
  SchemaFactory.createForClass(ConversationMessage);

/**
 * Chat history for the design-agent assistant. One document per
 * `conversation_id`; messages are appended in order. `tenant_id` is stored on
 * the conversation so history can never leak across tenants — a conversation is
 * always loaded with both keys.
 */
@Schema({ timestamps: true, collection: 'design_agent_conversations' })
export class Conversation {
  @Prop({ type: String, required: true, unique: true, index: true })
  conversation_id: string;

  @Prop({ type: String, default: null, index: true })
  tenant_id: string | null;

  @Prop({ type: [ConversationMessageSchema], default: [] })
  messages: ConversationMessage[];
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
