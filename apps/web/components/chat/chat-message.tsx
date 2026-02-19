// apps/web/components/chat/chat-message.tsx
// チャットメッセージコンポーネント

import { ChatMessage } from '@/hooks/use-chat';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* アバター */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground',
        )}
      >
        {isUser ? 'あ' : '🤖'}
      </div>

      {/* バブル */}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {/* 信頼度インジケーター (アシスタントのみ) */}
        {!isUser && message.confidence !== undefined && message.confidence < 0.6 && (
          <p className="mt-1 text-xs opacity-60">
            ※ 正確な情報はスタッフにご確認ください
          </p>
        )}

        <p
          className={cn(
            'mt-1 text-xs',
            isUser ? 'text-primary-foreground/60' : 'text-muted-foreground',
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
