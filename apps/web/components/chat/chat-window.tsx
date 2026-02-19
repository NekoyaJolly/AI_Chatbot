'use client';

// apps/web/components/chat/chat-window.tsx
// W3-005: チャットウィンドウコンポーネント

import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/use-chat';
import { ChatMessageItem } from './chat-message';
import { ChatInput } from './chat-input';
import { Card } from '@/components/ui/card';

interface ChatWindowProps {
  tenantId: string;
  customerId?: string;
  height?: string;
}

export function ChatWindow({ tenantId, customerId, height = '600px' }: ChatWindowProps) {
  const { messages, sendMessage, isConnected, isTyping, isEscalated, error } = useChat({
    tenantId,
    customerId,
    channel: 'web',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <Card className="flex flex-col overflow-hidden" style={{ height }}>
      {/* ヘッダー */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="font-semibold text-sm">AI チャットサポート</h3>
        </div>
        <div className="flex items-center gap-2">
          {isEscalated && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              スタッフ対応中
            </span>
          )}
          <div
            className={`h-2 w-2 rounded-full transition-colors ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {isConnected ? '接続中' : '切断'}
          </span>
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isConnected && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            サーバーに接続中...
          </div>
        )}

        {messages.map((message) => (
          <ChatMessageItem key={message.id} message={message} />
        ))}

        {/* タイピングインジケーター */}
        {isTyping && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm">
              🤖
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2 text-sm">
              <div className="flex gap-1 items-center h-5">
                <span
                  className="animate-bounce h-1.5 w-1.5 bg-muted-foreground rounded-full"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="animate-bounce h-1.5 w-1.5 bg-muted-foreground rounded-full"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="animate-bounce h-1.5 w-1.5 bg-muted-foreground rounded-full"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs shrink-0">
          ⚠️ {error}
        </div>
      )}

      {/* 入力エリア */}
      <div className="shrink-0 border-t p-4">
        <ChatInput
          onSend={sendMessage}
          disabled={!isConnected}
          placeholder={isEscalated ? 'スタッフが対応中です...' : 'ご質問をどうぞ...'}
        />
      </div>
    </Card>
  );
}
