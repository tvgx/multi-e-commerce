import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    path: '/layout-watcher'
})
export class LayoutGateway {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(LayoutGateway.name);

    handleConnection(client: Socket) {
        const token = client.handshake.auth.token;
        if (token === 'dev_watcher_token') {
            this.logger.log(`CLI Watcher connected: ${client.id}`);
        } else {
            client.disconnect(); // Reject unauthorized
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('live-sync')
    handleLiveSync(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
        this.logger.log(`Received Live Sync Event for file: ${data.filePath}`);

        // Feature 4: Live Sync triggered by CLI Watcher mode.
        // In a real implementation: Parse the config TS, validate with Zod, update Preview branch in DB.

        // Then broadcast to the web browser to refresh the Next.js preview frame.
        this.server.emit('preview-updated', { timestamp: Date.now() });
    }
}
