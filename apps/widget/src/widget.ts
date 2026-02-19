// apps/widget/src/widget.ts
// W4-006: AI Chatbot 埋め込みウィジェット (Shadow DOM)
// 1行で埋め込み可能:
//   <script src="https://your-cdn.com/chatbot-widget.iife.js"
//           data-tenant-id="YOUR_TENANT_ID"
//           data-api-url="https://your-api.run.app"
//           data-theme-color="#6366f1"
//           data-title="AI アシスタント"
//           data-position="bottom-right">
//   </script>

(function () {
  'use strict';

  // ─── 設定取得 ──────────────────────────────────────────────────────────────
  const currentScript =
    (document.currentScript as HTMLScriptElement) ??
    document.querySelector('script[data-tenant-id]');

  if (!currentScript) {
    console.warn('[AI Chatbot Widget] data-tenant-id が見つかりません');
    return;
  }

  const TENANT_ID = currentScript.getAttribute('data-tenant-id') ?? '';
  const API_URL =
    currentScript.getAttribute('data-api-url') ?? 'https://api.example.com';
  const THEME_COLOR = currentScript.getAttribute('data-theme-color') ?? '#6366f1';
  const TITLE = currentScript.getAttribute('data-title') ?? 'AIアシスタント';
  const POSITION = currentScript.getAttribute('data-position') ?? 'bottom-right';
  const WS_URL = currentScript.getAttribute('data-ws-url') ?? API_URL;

  if (!TENANT_ID) {
    console.warn('[AI Chatbot Widget] data-tenant-id が設定されていません');
    return;
  }

  // ─── 重複初期化防止 ────────────────────────────────────────────────────────
  if (document.getElementById('ai-chatbot-widget-root')) return;

  // ─── 型定義 ────────────────────────────────────────────────────────────────
  interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }

  // ─── Shadow DOM ホスト作成 ──────────────────────────────────────────────────
  const host = document.createElement('div');
  host.id = 'ai-chatbot-widget-root';
  host.setAttribute('aria-label', 'AI Chatbot Widget');
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // ─── スタイル (Shadow DOM 内にスコープ) ─────────────────────────────────────
  const positionStyles =
    POSITION === 'bottom-left'
      ? 'bottom: 20px; left: 20px;'
      : 'bottom: 20px; right: 20px;';

  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

    /* ─── FABボタン ─── */
    #fab {
      position: fixed;
      ${positionStyles}
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${THEME_COLOR};
      color: #fff;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      transition: transform 0.2s, box-shadow 0.2s;
      font-size: 22px;
    }
    #fab:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
    #fab .badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #ef4444;
      color: #fff;
      font-size: 10px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ─── チャットウィンドウ ─── */
    #chat-window {
      position: fixed;
      ${POSITION === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
      bottom: 88px;
      width: 360px;
      height: 520px;
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      transform-origin: bottom ${POSITION === 'bottom-left' ? 'left' : 'right'};
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;
    }
    #chat-window.hidden { transform: scale(0.85); opacity: 0; pointer-events: none; }

    /* ─── ヘッダー ─── */
    #chat-header {
      background: ${THEME_COLOR};
      color: #fff;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    #chat-header .title { font-weight: 600; font-size: 15px; }
    #chat-header .subtitle { font-size: 11px; opacity: 0.85; margin-top: 1px; }
    #close-btn {
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      opacity: 0.8;
      font-size: 20px;
      line-height: 1;
      padding: 4px;
      border-radius: 4px;
      transition: opacity 0.15s, background 0.15s;
    }
    #close-btn:hover { opacity: 1; background: rgba(255,255,255,0.15); }

    /* ─── メッセージエリア ─── */
    #messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #f9fafb;
    }
    #messages::-webkit-scrollbar { width: 4px; }
    #messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }

    .message {
      max-width: 85%;
      padding: 10px 13px;
      border-radius: 12px;
      font-size: 13.5px;
      line-height: 1.55;
      word-break: break-word;
    }
    .message.user {
      align-self: flex-end;
      background: ${THEME_COLOR};
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .message.assistant {
      align-self: flex-start;
      background: #fff;
      color: #1f2937;
      border: 1px solid #e5e7eb;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .message.system {
      align-self: center;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      font-size: 12px;
      text-align: center;
    }
    .message-time { font-size: 10px; opacity: 0.5; margin-top: 4px; }

    /* ─── タイピングインジケーター ─── */
    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 12px 14px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      border-bottom-left-radius: 4px;
      align-self: flex-start;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .typing-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #9ca3af;
      animation: bounce 1.2s infinite;
    }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    /* ─── エスカレーションバナー ─── */
    #escalation-banner {
      background: #fef2f2;
      border-top: 1px solid #fecaca;
      padding: 10px 14px;
      font-size: 12px;
      color: #dc2626;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    #escalation-banner.hidden { display: none; }

    /* ─── 入力エリア ─── */
    #input-area {
      display: flex;
      gap: 8px;
      padding: 12px 14px;
      border-top: 1px solid #e5e7eb;
      background: #fff;
      flex-shrink: 0;
    }
    #message-input {
      flex: 1;
      border: 1px solid #d1d5db;
      border-radius: 22px;
      padding: 9px 14px;
      font-size: 13.5px;
      outline: none;
      resize: none;
      min-height: 38px;
      max-height: 96px;
      overflow-y: auto;
      transition: border-color 0.15s;
      font-family: inherit;
    }
    #message-input:focus { border-color: ${THEME_COLOR}; }
    #send-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: ${THEME_COLOR};
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.15s;
    }
    #send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    #send-btn:hover:not(:disabled) { opacity: 0.9; }

    /* ─── 接続状態 ─── */
    #status-bar {
      height: 2px;
      background: #e5e7eb;
      flex-shrink: 0;
      transition: background 0.3s;
    }
    #status-bar.connected { background: #10b981; }
    #status-bar.disconnected { background: #ef4444; }

    /* ─── フッター ─── */
    #chat-footer {
      padding: 6px 14px 8px;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
      background: #fff;
      flex-shrink: 0;
      border-top: 1px solid #f3f4f6;
    }

    /* ─── モバイル対応 ─── */
    @media (max-width: 480px) {
      #chat-window {
        width: calc(100vw - 16px);
        height: calc(100dvh - 90px);
        left: 8px !important;
        right: 8px !important;
        bottom: 76px;
      }
    }
  `;
  shadow.appendChild(style);

  // ─── DOM 構築 ───────────────────────────────────────────────────────────────
  const chatWindow = document.createElement('div');
  chatWindow.id = 'chat-window';
  chatWindow.className = 'hidden';
  chatWindow.setAttribute('role', 'dialog');
  chatWindow.setAttribute('aria-label', TITLE);

  chatWindow.innerHTML = `
    <div id="chat-header">
      <div>
        <div class="title">💬 ${TITLE}</div>
        <div class="subtitle" id="status-text">接続中...</div>
      </div>
      <button id="close-btn" aria-label="閉じる">✕</button>
    </div>
    <div id="status-bar" class="disconnected"></div>
    <div id="escalation-banner" class="hidden" role="alert">
      ⚠️ スタッフへ転送します。少々お待ちください。
    </div>
    <div id="messages" role="log" aria-live="polite"></div>
    <div id="input-area">
      <textarea
        id="message-input"
        placeholder="メッセージを入力..."
        rows="1"
        aria-label="メッセージ入力"
        maxlength="1000"
      ></textarea>
      <button id="send-btn" disabled aria-label="送信">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
    <div id="chat-footer">Powered by AI Chatbot SaaS</div>
  `;

  const fab = document.createElement('button');
  fab.id = 'fab';
  fab.setAttribute('aria-label', 'チャットを開く');
  fab.setAttribute('title', TITLE);
  fab.innerHTML = `
    💬
    <span class="badge" id="unread-badge" style="display:none">1</span>
  `;

  shadow.appendChild(chatWindow);
  shadow.appendChild(fab);

  // ─── 状態管理 ─────────────────────────────────────────────────────────────
  let isOpen = false;
  let isConnected = false;
  let isTyping = false;
  let sessionId: string | null = null;
  let unreadCount = 0;
  const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  let socket: WebSocket | null = null;

  // ─── DOM 参照 ──────────────────────────────────────────────────────────────
  const messagesEl = shadow.getElementById('messages')!;
  const inputEl = shadow.getElementById('message-input') as HTMLTextAreaElement;
  const sendBtn = shadow.getElementById('send-btn') as HTMLButtonElement;
  const statusBar = shadow.getElementById('status-bar')!;
  const statusText = shadow.getElementById('status-text')!;
  const escalationBanner = shadow.getElementById('escalation-banner')!;
  const unreadBadge = shadow.getElementById('unread-badge')!;

  // ─── メッセージ追加 ────────────────────────────────────────────────────────
  function addMessage(msg: Message) {
    const el = document.createElement('div');
    el.className = `message ${msg.role}`;
    el.id = `msg-${msg.id}`;

    const time = msg.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    el.innerHTML = `
      <div>${escapeHtml(msg.content)}</div>
      <div class="message-time">${time}</div>
    `;
    messagesEl.appendChild(el);
    scrollToBottom();

    if (msg.role === 'assistant' && !isOpen) {
      unreadCount++;
      unreadBadge.textContent = String(unreadCount);
      unreadBadge.style.display = 'flex';
    }
  }

  function removeTypingIndicator() {
    shadow.getElementById('typing-indicator')?.remove();
  }

  function showTypingIndicator() {
    removeTypingIndicator();
    const el = document.createElement('div');
    el.id = 'typing-indicator';
    el.className = 'typing-indicator';
    el.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  function setStatus(connected: boolean, text: string) {
    isConnected = connected;
    statusBar.className = connected ? 'connected' : 'disconnected';
    statusText.textContent = text;
    sendBtn.disabled = !connected;
  }

  // ─── WebSocket 接続 ────────────────────────────────────────────────────────
  function connectWebSocket() {
    try {
      const wsUrl = WS_URL.replace(/^http/, 'ws');
      socket = new WebSocket(`${wsUrl}/socket.io/?EIO=4&transport=websocket`);

      socket.onopen = () => {
        setStatus(true, 'オンライン');
        startSession();
      };

      socket.onmessage = (event: MessageEvent) => {
        handleSocketMessage(event.data as string);
      };

      socket.onerror = () => {
        setStatus(false, '接続エラー');
        fallbackToRest();
      };

      socket.onclose = () => {
        setStatus(false, '再接続中...');
        setTimeout(connectWebSocket, 3000);
      };
    } catch {
      setStatus(false, 'オフライン');
      fallbackToRest();
    }
  }

  // Socket.io ハンドシェイク
  function startSession() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    // Socket.io プロトコル: 2 = EVENT
    const startPayload = JSON.stringify(['chat:start', { tenantId: TENANT_ID }]);
    socket.send(`42${startPayload}`);
  }

  function handleSocketMessage(data: string) {
    // Socket.io ハンドシェイク
    if (data === '2') { socket?.send('3'); return; } // ping/pong
    if (data.startsWith('0')) return; // connect
    if (data.startsWith('40')) return; // connect_ack

    if (data.startsWith('42')) {
      try {
        const payload = JSON.parse(data.substring(2)) as [string, unknown];
        const [event, eventData] = payload;

        if (event === 'chat:session' && eventData && typeof eventData === 'object') {
          sessionId = (eventData as Record<string, string>).sessionId ?? null;
        }

        if (event === 'chat:response' && eventData && typeof eventData === 'object') {
          const resp = eventData as { message: string; shouldEscalate?: boolean };
          removeTypingIndicator();
          addMessage({
            id: Date.now().toString(),
            role: 'assistant',
            content: resp.message,
            timestamp: new Date(),
          });
          conversationHistory.push({ role: 'assistant', content: resp.message });

          if (resp.shouldEscalate) {
            escalationBanner.classList.remove('hidden');
          }
        }

        if (event === 'chat:typing') {
          showTypingIndicator();
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  // ─── REST フォールバック ───────────────────────────────────────────────────
  async function fallbackToRest() {
    setStatus(false, 'REST モード');
  }

  async function sendViaRest(message: string): Promise<string> {
    const response = await fetch(`${API_URL}/api/v1/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TENANT_ID,
        message,
        channel: 'widget',
        conversationHistory: conversationHistory.slice(-8),
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json() as { answer: string; shouldEscalate?: boolean };
    if (data.shouldEscalate) {
      escalationBanner.classList.remove('hidden');
    }
    return data.answer;
  }

  // ─── メッセージ送信 ────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    addMessage(userMsg);
    conversationHistory.push({ role: 'user', content: text });
    showTypingIndicator();
    sendBtn.disabled = true;

    try {
      if (
        socket &&
        socket.readyState === WebSocket.OPEN &&
        isConnected
      ) {
        // WebSocket 経由
        const msgPayload = JSON.stringify([
          'chat:message',
          { sessionId, tenantId: TENANT_ID, message: text },
        ]);
        socket.send(`42${msgPayload}`);
      } else {
        // REST フォールバック
        const answer = await sendViaRest(text);
        removeTypingIndicator();
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: answer,
          timestamp: new Date(),
        });
        conversationHistory.push({ role: 'assistant', content: answer });
        sendBtn.disabled = false;
      }
    } catch (error) {
      removeTypingIndicator();
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: '申し訳ありません。一時的に問題が発生しています。しばらくしてからお試しください。',
        timestamp: new Date(),
      });
      sendBtn.disabled = false;
      console.error('[AI Chatbot Widget]', error);
    }
  }

  // ─── ウィンドウ開閉 ───────────────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    chatWindow.classList.remove('hidden');
    fab.innerHTML = `
      ✕
      <span class="badge" id="unread-badge" style="display:none">${unreadCount}</span>
    `;
    unreadCount = 0;
    unreadBadge.style.display = 'none';
    inputEl.focus();

    // 初回オープン時にウェルカムメッセージ
    if (messagesEl.childElementCount === 0) {
      addMessage({
        id: 'welcome',
        role: 'assistant',
        content: `こんにちは！${TITLE}です。\nご質問はお気軽にどうぞ 😊`,
        timestamp: new Date(),
      });
      connectWebSocket();
    }
  }

  function closeChat() {
    isOpen = false;
    chatWindow.classList.add('hidden');
    fab.innerHTML = `
      💬
      <span class="badge" id="unread-badge" style="${unreadCount > 0 ? '' : 'display:none'}">${unreadCount}</span>
    `;
  }

  // ─── イベントリスナー ──────────────────────────────────────────────────────
  fab.addEventListener('click', () => {
    if (isOpen) closeChat(); else openChat();
  });

  shadow.getElementById('close-btn')!.addEventListener('click', closeChat);

  sendBtn.addEventListener('click', sendMessage);

  inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  inputEl.addEventListener('input', () => {
    // 自動高さ調整
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 96) + 'px';
    sendBtn.disabled = !inputEl.value.trim() && !isConnected;
  });

  // REST モードでは最初からボタンを有効化
  setTimeout(() => {
    if (!isConnected) {
      setStatus(false, 'REST モード (オフライン対応)');
      sendBtn.disabled = false; // REST フォールバック使用可能
    }
  }, 3000);

  // ─── 公開 API ─────────────────────────────────────────────────────────────
  (window as unknown as Record<string, unknown>).AIChatbotWidget = {
    open: openChat,
    close: closeChat,
    tenantId: TENANT_ID,
    version: '1.0.0',
  };
})();
