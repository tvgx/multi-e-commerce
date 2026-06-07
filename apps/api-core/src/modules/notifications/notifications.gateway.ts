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
import { AuthService } from '../auth/auth.service';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  
  // Mapping of userId to their active socket ids
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly authService: AuthService
  ) {}

  async handleConnection(client: Socket) {
    // Determine user session from cookies/tokens via Better Auth
    const requestLike = { headers: client.handshake.headers } as any;
    let session = await this.authService.getOwnerSession(requestLike);
    let userId = session?.user?.id as string | undefined;

    if (!userId) {
      const customerSession = await this.authService.getCustomerSession(requestLike);
      userId = customerSession?.user?.id as string | undefined;
    }

    const shopId = client.handshake.auth?.shopId || client.handshake.query?.shopId;

    if (!userId) {
      this.logger.warn(`Client disconnected due to missing auth info: ${client.id}`);
      client.disconnect();
      return;
    }

    // Store the connection
    client.data.userId = userId;
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    // Join a room specific to the user for easy broadcasting
    client.join(`user_${userId}`);
    // Join a room specific to the shop
    client.join(`shop_${shopId}`);

    this.logger.log(`Client connected: ${client.id} (User: ${userId}, Shop: ${shopId})`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string;
    if (userId && this.userSockets.has(userId)) {
      const userSockets = this.userSockets.get(userId)!;
      userSockets.delete(client.id);
      if (userSockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Broadcasts a notification to a specific user and saves it to the database
   */
  async notifyUser(
    shopId: string,
    recipientId: string,
    recipientType: 'CUSTOMER' | 'OWNER',
    type: string,
    title: string,
    body: string,
    payload?: any
  ) {
    // Save to DB
    const notification = await this.notificationsService.createNotification({
      shopId,
      recipientId,
      recipientType,
      type,
      title,
      body,
      payload
    });

    // Broadcast via WS
    this.server.to(`user_${recipientId}`).emit('new_notification', notification);
    
    return notification;
  }
}
