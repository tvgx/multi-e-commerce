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
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, this should be restricted
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  
  // Mapping of userId to their active socket ids
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(private readonly notificationsService: NotificationsService) {}

  async handleConnection(client: Socket) {
    // In a real app, verify the token from client.handshake.auth.token
    // Here we'll just extract a 'userId' and 'shopId' from the query for demonstration
    const userId = client.handshake.query.userId as string;
    const shopId = client.handshake.query.shopId as string;

    if (!userId || !shopId) {
      this.logger.warn(`Client disconnected due to missing auth info: ${client.id}`);
      client.disconnect();
      return;
    }

    // Store the connection
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
    const userId = client.handshake.query.userId as string;
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
