'use client';

// apps/web/app/test-websocket/page.tsx
// W1-008: WebSocket テストページ

import { useEffect, useState, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Message {
  id: string;
  text: string;
  type: 'sent' | 'received' | 'system';
  timestamp: string;
}

export default function TestWebSocketPage() {
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const addMessage = (text: string, type: Message['type']) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      type,
      timestamp: new Date().toLocaleTimeString('ja-JP'),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // メッセージ末尾への自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      setConnected(true);
      addMessage('✅ WebSocket接続確立', 'system');
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      addMessage(`❌ 切断: ${reason}`, 'system');
    });

    socket.on('connected', (data: { message: string; clientId: string }) => {
      addMessage(`🔗 ${data.message} (ID: ${data.clientId.substring(0, 8)}...)`, 'system');
    });

    socket.on('message', (data: string) => {
      addMessage(data, 'received');
    });

    socket.on('connect_error', (error: Error) => {
      addMessage(`🔴 接続エラー: ${error.message}`, 'system');
    });

    socket.connect();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connected');
      socket.off('message');
      socket.off('connect_error');
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;

    const socket = getSocket();
    socket.emit('message', message);
    addMessage(`You: ${message}`, 'sent');
    setMessage('');
  };

  const sendPing = () => {
    const socket = getSocket();
    const startTime = Date.now();

    socket.emit('ping', null, (response: string) => {
      const elapsed = Date.now() - startTime;
      setLatency(elapsed);
      addMessage(`🏓 Ping → Pong (${elapsed}ms)`, 'system');
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="container max-w-2xl py-8 mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">WebSocket テスト (W1-008)</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Socket.io Echo テスト</span>
            <div className="flex items-center gap-3">
              {latency !== null && (
                <span className="text-sm font-normal text-muted-foreground">
                  遅延: {latency}ms
                </span>
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm font-normal text-muted-foreground">
                  {connected ? '接続中' : '切断'}
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* メッセージ表示エリア */}
          <div className="h-64 overflow-y-auto border rounded-md p-4 space-y-2 bg-muted/20">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-8">
                接続を待っています...
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`text-sm flex gap-2 ${
                  msg.type === 'system'
                    ? 'text-muted-foreground italic'
                    : msg.type === 'sent'
                      ? 'text-blue-600'
                      : 'text-green-600'
                }`}
              >
                <span className="text-xs opacity-60 shrink-0">{msg.timestamp}</span>
                <span>{msg.text}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 入力エリア */}
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力... (Enter送信)"
              disabled={!connected}
            />
            <Button onClick={sendMessage} disabled={!connected || !message.trim()}>
              送信
            </Button>
          </div>

          {/* テストボタン */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={sendPing} disabled={!connected} size="sm">
              Ping テスト
            </Button>
            <Button
              variant="outline"
              onClick={() => addMessage('--- ログクリア ---', 'system')}
              size="sm"
            >
              ログクリア
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
