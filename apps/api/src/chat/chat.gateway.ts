// apps/api/src/chat/chat.gateway.ts
// W1-008: WebSocket (Socket.io) Echoサーバー

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedClients = 0;

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(
      `Client connected: ${client.id} | Total: ${this.connectedClients}`,
    );

    // 接続成功通知
    client.emit('connected', {
      message: 'WebSocket接続成功',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(
      `Client disconnected: ${client.id} | Total: ${this.connectedClients}`,
    );
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ): string {
    this.logger.log(`Message from ${client.id}: ${payload}`);
    const echo = `Echo: ${payload}`;

    // Echoメッセージをクライアントに返す
    return echo;
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): string {
    this.logger.debug(`Ping from ${client.id}`);
    return 'pong';
  }

  @SubscribeMessage('broadcast')
  handleBroadcast(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ): void {
    this.logger.log(`Broadcast from ${client.id}: ${payload}`);
    // 送信者以外全員にブロードキャスト
    client.broadcast.emit('message', `[Broadcast] ${payload}`);
  }
}
