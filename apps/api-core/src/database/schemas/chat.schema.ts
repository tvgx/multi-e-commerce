import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatSessionDocument = ChatSession & Document;

@Schema({ timestamps: true, collection: 'chat_sessions' })
export class ChatSession {
  @Prop({ type: String, required: true, index: true })
  shopId: string;

  @Prop({ type: String, required: true, index: true })
  customerId: string;

  @Prop({ type: String, default: 'active' }) // active, closed
  status: string;

  @Prop({ type: String, default: '' })
  lastMessage: string;

  @Prop({ type: Date, default: Date.now })
  lastMessageAt: Date;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ timestamps: true, collection: 'chat_messages' })
export class ChatMessage {
  @Prop({ type: String, required: true, index: true })
  sessionId: string;

  @Prop({ type: String, required: true }) // customer, admin, system
  senderRole: string;

  @Prop({ type: String, required: true })
  senderId: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
