import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { TenantService } from '../../common/services/tenant.service';
import { ChatSession, ChatMessage } from '../../database/schemas/chat.schema';

/** A `.find().sort().skip().limit()` chain that resolves to `result`. */
function findChain(result: unknown) {
  const c: any = {};
  c.sort = jest.fn().mockReturnValue(c);
  c.skip = jest.fn().mockReturnValue(c);
  c.limit = jest.fn().mockResolvedValue(result);
  return c;
}

describe('ChatService', () => {
  let service: ChatService;
  let tenant: { getTenantId: jest.Mock };
  let sessionModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    countDocuments: jest.Mock;
  };
  let messageModel: { find: jest.Mock; create: jest.Mock; countDocuments: jest.Mock };

  const SHOP = 'shop-1';
  const USER = 'user-1';

  beforeEach(async () => {
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };
    sessionModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn().mockResolvedValue({}),
      countDocuments: jest.fn().mockResolvedValue(0),
    };
    messageModel = {
      find: jest.fn(),
      create: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: TenantService, useValue: tenant },
        { provide: getModelToken(ChatSession.name), useValue: sessionModel },
        { provide: getModelToken(ChatMessage.name), useValue: messageModel },
      ],
    }).compile();

    service = module.get(ChatService);
  });

  describe('getConversations', () => {
    it('throws BadRequest with no tenant context', async () => {
      tenant.getTenantId.mockReturnValue(undefined);
      await expect(service.getConversations(USER, {} as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('returns the customer’s sessions with meta', async () => {
      sessionModel.find.mockReturnValue(findChain([{ _id: 's1' }]));
      sessionModel.countDocuments.mockResolvedValue(1);
      const res = await service.getConversations(USER, {} as any);
      expect(sessionModel.find).toHaveBeenCalledWith({ shopId: SHOP, customerId: USER });
      expect(res.meta).toEqual({ total: 1, page: 1, limit: 20 });
    });
  });

  describe('getMessages', () => {
    it('finds-or-creates a session when no conversationId is given', async () => {
      sessionModel.findOne.mockResolvedValue(null);
      sessionModel.create.mockResolvedValue({ _id: { toString: () => 'sess-new' } });
      messageModel.find.mockReturnValue(findChain([{ _id: 'm1' }]));
      messageModel.countDocuments.mockResolvedValue(1);

      const res = await service.getMessages(USER, {} as any);

      expect(sessionModel.create).toHaveBeenCalled();
      expect(res.meta.sessionId).toBe('sess-new');
      expect(res.data).toEqual([{ _id: 'm1' }]);
    });

    it('uses the provided conversationId without creating a session', async () => {
      messageModel.find.mockReturnValue(findChain([]));
      const res = await service.getMessages(USER, { conversationId: 'sess-x' } as any);
      expect(sessionModel.create).not.toHaveBeenCalled();
      expect(res.meta.sessionId).toBe('sess-x');
    });
  });

  describe('sendMessage', () => {
    it('creates a session and message on the first message', async () => {
      sessionModel.findOne.mockResolvedValue(null);
      sessionModel.create.mockResolvedValue({ _id: { toString: () => 'sess-new' } });
      messageModel.create.mockResolvedValue({ _id: 'm1' });

      const res = await service.sendMessage(USER, { content: 'hi' } as any);

      expect(messageModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: 'sess-new', senderRole: 'customer', content: 'hi' }),
      );
      expect(res.status).toBe('sent');
    });

    it('bumps lastMessage on an existing conversation', async () => {
      messageModel.create.mockResolvedValue({ _id: 'm2' });
      await service.sendMessage(USER, { conversationId: 'sess-x', content: 'yo' } as any);
      expect(sessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'sess-x',
        expect.objectContaining({ lastMessage: 'yo' }),
      );
      expect(messageModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: 'sess-x' }),
      );
    });
  });
});
