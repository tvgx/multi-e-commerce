import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * Chat gateway — CHỈ để nhận realtime (TODO 18). Gửi tin đi qua HTTP có xác
 * thực (ChatController): bản cũ nhận `send_message` với userId/role tự khai từ
 * client nên ai cũng giả danh được. Room theo UUID customer (khó đoán) chỉ dùng
 * cho chiều broadcast.
 */
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

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const shopId = client.handshake.query.shopId as string;
    const role = (client.handshake.query.role as string) || 'customer';

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

  /** Phát tin nhắn (đã lưu qua HTTP) tới buyer + seller của shop. */
  broadcastMessage(shopId: string, customerId: string, message: unknown) {
    this.server.to(`chat_${shopId}_${customerId}`).emit('new_message', message);
    this.server.to(`chat_admin_${shopId}`).emit('new_message', message);
  }
}
