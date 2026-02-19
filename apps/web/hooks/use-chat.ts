'use client';

// apps/web/hooks/use-chat.ts
// W3-005: チャットフック (WebSocket + AI応答)

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  confidence?: number;
  shouldEscalate?: boolean;
  isTyping?: boolean;
}

interface ChatOptions {
  tenantId: string;
  customerId?: string;
  channel?: 'web' | 'widget';
}

export function useChat(options: ChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `${Date.now()}-${Math.random()}` },
    ]);
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = getSocket();

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      // チャット開始
      socket.emit('chat:start', {
        tenantId: options.tenantId,
        customerId: options.customerId,
        channel: options.channel ?? 'web',
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setError('接続に失敗しました');
      setIsConnected(false);
    });

    socket.on('chat:started', (data: { sessionId: string; message: string }) => {
      setSessionId(data.sessionId);
      addMessage({
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        confidence: 1.0,
      });
    });

    socket.on('chat:typing', (data: { isTyping: boolean }) => {
      setIsTyping(data.isTyping);
    });

    socket.on(
      'chat:response',
      (data: {
        sessionId: string;
        content: string;
        confidence: number;
        shouldEscalate: boolean;
        escalationReason?: string;
        timestamp: string;
      }) => {
        setIsTyping(false);
        addMessage({
          role: 'assistant',
          content: data.content,
          timestamp: data.timestamp,
          confidence: data.confidence,
          shouldEscalate: data.shouldEscalate,
        });
      },
    );

    socket.on('chat:escalation', (data: { reason: string; message: string }) => {
      setIsEscalated(true);
      addMessage({
        role: 'system',
        content: `🔔 ${data.message}`,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('chat:error', (data: { message: string }) => {
      setIsTyping(false);
      setError(data.message);
    });

    socket.connect();

    return () => {
      socket.emit('chat:end');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('chat:started');
      socket.off('chat:typing');
      socket.off('chat:response');
      socket.off('chat:escalation');
      socket.off('chat:error');
      socket.disconnect();
      initialized.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.tenantId, options.customerId, options.channel]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || !isConnected) return;

      const socket = getSocket();

      // ローカルに即時追加
      addMessage({
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      });

      socket.emit('chat:message', {
        sessionId,
        tenantId: options.tenantId,
        content,
      });
    },
    [isConnected, sessionId, options.tenantId, addMessage],
  );

  return {
    messages,
    isConnected,
    isTyping,
    isEscalated,
    sessionId,
    error,
    sendMessage,
  };
}
