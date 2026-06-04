import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  
  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const shopId = client.handshake.query.shopId as string;
    const role = client.handshake.query.role as string || 'customer';

    if (!userId || !shopId) {
      this.logger.warn(`Client disconnected due to missing auth info: ${client.id}`);
      client.disconnect();
      return;
    }

    client.join(`chat_${shopId}_${userId}`);
    if (role === 'admin') {
      client.join(`chat_admin_${shopId}`);
    }

    this.logger.log(`Client connected: ${client.id} (User: ${userId}, Shop: ${shopId}, Role: ${role})`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { conversationId?: string; content: string; shopId: string; userId: string; role: string },
    @ConnectedSocket() client: Socket
  ) {
    const { conversationId, content, shopId, userId, role } = data;
    
    // In a real application, you'd want to authenticate this action properly
    const result = await this.chatService.sendMessage(userId, { conversationId, content });
    
    // Broadcast to the customer room and admin room
    const targetCustomerRoom = `chat_${shopId}_${userId}`;
    const targetAdminRoom = `chat_admin_${shopId}`;
    
    this.server.to(targetCustomerRoom).emit('new_message', result.data);
    this.server.to(targetAdminRoom).emit('new_message', result.data);
    
    return result.data;
  }
}
