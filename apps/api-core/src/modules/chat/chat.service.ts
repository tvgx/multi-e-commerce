import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TenantService } from '../../common/services/tenant.service';
import { SendMessageDto, GetMessagesDto } from './dto/chat.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ChatSession, ChatSessionDocument, ChatMessage, ChatMessageDocument } from '../../database/schemas/chat.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatSession.name) private chatSessionModel: Model<ChatSessionDocument>,
    @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessageDocument>,
    private readonly tenantService: TenantService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  async getConversations(userId: string, query: PaginationDto) {
    const shopId = this.getShopId();
    // For customers, return their own sessions. For admins, return all sessions in the shop.
    // Let's assume this is the customer endpoint
    const page = query.page || 1;
    const limit = query.limit || 20;

    const sessions = await this.chatSessionModel.find({ shopId, customerId: userId })
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await this.chatSessionModel.countDocuments({ shopId, customerId: userId });

    return { data: sessions, meta: { total, page, limit } };
  }

  async getMessages(userId: string, query: GetMessagesDto) {
    const shopId = this.getShopId();
    let sessionId = query.conversationId;
    const page = query.page || 1;
    const limit = query.limit || 20;

    if (!sessionId) {
      // Find or create session for the user
      let session = await this.chatSessionModel.findOne({ shopId, customerId: userId, status: 'active' });
      if (!session) {
        session = await this.chatSessionModel.create({
          shopId,
          customerId: userId,
          status: 'active',
          lastMessage: '',
        });
      }
      sessionId = session._id.toString();
    }

    const messages = await this.chatMessageModel.find({ sessionId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await this.chatMessageModel.countDocuments({ sessionId });

    return { 
      data: messages.reverse(), 
      meta: { total, page, limit, sessionId } 
    };
  }

  async sendMessage(userId: string, dto: SendMessageDto) {
    const shopId = this.getShopId();
    let sessionId = dto.conversationId;

    if (!sessionId) {
      let session = await this.chatSessionModel.findOne({ shopId, customerId: userId, status: 'active' });
      if (!session) {
        session = await this.chatSessionModel.create({
          shopId,
          customerId: userId,
          status: 'active',
          lastMessage: dto.content,
          lastMessageAt: new Date(),
        });
      }
      sessionId = session._id.toString();
    } else {
      await this.chatSessionModel.findByIdAndUpdate(sessionId, {
        lastMessage: dto.content,
        lastMessageAt: new Date(),
      });
    }

    const message = await this.chatMessageModel.create({
      sessionId,
      senderRole: 'customer', // Default to customer for this endpoint
      senderId: userId,
      content: dto.content,
    });

    return { status: 'sent', data: message };
  }
}

