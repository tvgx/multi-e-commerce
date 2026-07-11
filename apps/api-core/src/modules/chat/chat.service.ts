import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TenantService } from '../../common/services/tenant.service';
import { PrismaService } from '../../database/prisma.service';
import { SendMessageDto, GetMessagesDto } from './dto/chat.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ChatSession, ChatSessionDocument, ChatMessage, ChatMessageDocument } from '../../database/schemas/chat.schema';

/** Người gửi tin — buyer (storefront JWT) hoặc seller (better-auth owner). */
export interface ChatSender {
  role: 'customer' | 'admin';
  id: string;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatSession.name) private chatSessionModel: Model<ChatSessionDocument>,
    @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessageDocument>,
    private readonly tenantService: TenantService,
    private readonly prisma: PrismaService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  async getConversations(userId: string, query: PaginationDto) {
    const shopId = this.getShopId();
    const page = query.page || 1;
    const limit = query.limit || 20;

    const sessions = await this.chatSessionModel.find({ shopId, customerId: userId })
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await this.chatSessionModel.countDocuments({ shopId, customerId: userId });

    return { data: sessions, meta: { total, page, limit } };
  }

  /** Seller: mọi phiên chat của shop, kèm tên khách (Mongo không join được Postgres). */
  async getShopSessions(query: PaginationDto) {
    const shopId = this.getShopId();
    const page = query.page || 1;
    const limit = query.limit || 50;

    const sessions = await this.chatSessionModel.find({ shopId })
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await this.chatSessionModel.countDocuments({ shopId });

    const customerIds = [...new Set(sessions.map((s: any) => s.customerId).filter(Boolean))];
    const customers = customerIds.length
      ? await this.prisma.customer.findMany({
          where: { id: { in: customerIds as string[] } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const byId = new Map(customers.map((c) => [c.id, c]));

    return {
      data: sessions.map((s: any) => ({
        ...s,
        customerName: byId.get(s.customerId)?.name || null,
        customerEmail: byId.get(s.customerId)?.email || null,
      })),
      meta: { total, page, limit },
    };
  }

  /** Buyer: message của chính mình (tự find-or-create session). */
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

  /** Seller: message của một phiên bất kỳ thuộc shop. */
  async getSessionMessages(sessionId: string, query: PaginationDto) {
    const shopId = this.getShopId();
    const session = await this.chatSessionModel.findById(sessionId).lean();
    if (!session || (session as any).shopId !== shopId) {
      throw new NotFoundException('Chat session not found');
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    const messages = await this.chatMessageModel.find({ sessionId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await this.chatMessageModel.countDocuments({ sessionId });

    return { data: messages.reverse(), meta: { total, page, limit, sessionId } };
  }

  /**
   * Gửi tin có xác thực (TODO 18). Buyer không cần conversationId (find-or-create
   * theo customerId); seller BẮT BUỘC conversationId của shop mình. senderRole
   * lấy từ auth chứ không tin payload client như bản socket cũ.
   */
  async sendMessageAs(sender: ChatSender, dto: SendMessageDto) {
    const shopId = this.getShopId();
    let session: any;

    if (sender.role === 'customer') {
      session = await this.chatSessionModel.findOne({ shopId, customerId: sender.id, status: 'active' });
      if (!session) {
        session = await this.chatSessionModel.create({
          shopId,
          customerId: sender.id,
          status: 'active',
          lastMessage: dto.content,
          lastMessageAt: new Date(),
        });
      } else {
        await this.chatSessionModel.findByIdAndUpdate(session._id, {
          lastMessage: dto.content,
          lastMessageAt: new Date(),
        });
      }
    } else {
      if (!dto.conversationId) throw new BadRequestException('conversationId is required');
      session = await this.chatSessionModel.findById(dto.conversationId);
      if (!session || session.shopId !== shopId) throw new NotFoundException('Chat session not found');
      await this.chatSessionModel.findByIdAndUpdate(session._id, {
        lastMessage: dto.content,
        lastMessageAt: new Date(),
      });
    }

    const message = await this.chatMessageModel.create({
      sessionId: session._id.toString(),
      senderRole: sender.role,
      senderId: sender.id,
      content: dto.content,
    });

    return {
      status: 'sent',
      data: message,
      sessionId: session._id.toString(),
      customerId: session.customerId as string,
    };
  }

  /** @deprecated giữ cho tương thích — buyer path của sendMessageAs. */
  async sendMessage(userId: string, dto: SendMessageDto) {
    return this.sendMessageAs({ role: 'customer', id: userId }, dto);
  }
}
