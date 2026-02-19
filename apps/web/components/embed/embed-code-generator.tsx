'use client';

// apps/web/components/embed/embed-code-generator.tsx
// W4-007: 埋め込みコードジェネレーター

import { useState, useCallback } from 'react';

interface EmbedConfig {
  themeColor: string;
  title: string;
  position: 'bottom-right' | 'bottom-left';
  widgetUrl: string;
  apiUrl: string;
  wsUrl: string;
}

interface EmbedCodeGeneratorProps {
  tenantId: string;
}

export function EmbedCodeGenerator({ tenantId }: EmbedCodeGeneratorProps) {
  const defaultApiUrl =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_API_URL ?? 'https://api.your-domain.run.app'
      : 'https://api.your-domain.run.app';

  const defaultWidgetUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/widget/chatbot-widget.iife.js`
      : 'https://your-domain.vercel.app/widget/chatbot-widget.iife.js';

  const [config, setConfig] = useState<EmbedConfig>({
    themeColor: '#6366f1',
    title: 'AIアシスタント',
    position: 'bottom-right',
    widgetUrl: defaultWidgetUrl,
    apiUrl: defaultApiUrl,
    wsUrl: defaultApiUrl,
  });

  const [copied, setCopied] = useState(false);
  const [copiedNpm, setCopiedNpm] = useState(false);

  // ─── コード生成 ─────────────────────────────────────────────────────────────
  const generateScriptTag = useCallback(
    (cfg: EmbedConfig, tid: string): string => {
      return `<!-- AI Chatbot Widget -->
<script
  src="${cfg.widgetUrl}"
  data-tenant-id="${tid}"
  data-api-url="${cfg.apiUrl}"
  data-ws-url="${cfg.wsUrl}"
  data-theme-color="${cfg.themeColor}"
  data-title="${cfg.title}"
  data-position="${cfg.position}"
  defer
></script>`;
    },
    [],
  );

  const generateNpmSnippet = useCallback(
    (cfg: EmbedConfig, tid: string): string => {
      return `// NPM / モジュールバンドラーの場合
import '@repo/widget';

// または動的インポート
window.AIChatbotWidget?.open();

// 設定オプション (window.chatbotConfig で事前設定)
window.chatbotConfig = {
  tenantId: "${tid}",
  apiUrl: "${cfg.apiUrl}",
  themeColor: "${cfg.themeColor}",
  title: "${cfg.title}",
};`;
    },
    [],
  );

  const scriptTag = generateScriptTag(config, tenantId);
  const npmSnippet = generateNpmSnippet(config, tenantId);

  const copyToClipboard = async (text: string, type: 'script' | 'npm') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'script') {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setCopiedNpm(true);
        setTimeout(() => setCopiedNpm(false), 2000);
      }
    } catch {
      // フォールバック
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── 設定パネル ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">ウィジェット設定</h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* テーマカラー */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              テーマカラー
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.themeColor}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, themeColor: e.target.value }))
                }
                className="h-9 w-14 cursor-pointer rounded border border-gray-300 p-0.5"
              />
              <input
                type="text"
                value={config.themeColor}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, themeColor: e.target.value }))
                }
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="#6366f1"
              />
            </div>
          </div>

          {/* チャットタイトル */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              チャットタイトル
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) =>
                setConfig((c) => ({ ...c, title: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="AIアシスタント"
            />
          </div>

          {/* 表示位置 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              表示位置
            </label>
            <select
              value={config.position}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  position: e.target.value as EmbedConfig['position'],
                }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="bottom-right">右下</option>
              <option value="bottom-left">左下</option>
            </select>
          </div>

          {/* API URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              API URL
            </label>
            <input
              type="url"
              value={config.apiUrl}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  apiUrl: e.target.value,
                  wsUrl: e.target.value,
                }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="https://api.your-domain.run.app"
            />
          </div>

          {/* Widget URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Widget スクリプト URL
            </label>
            <input
              type="url"
              value={config.widgetUrl}
              onChange={(e) =>
                setConfig((c) => ({ ...c, widgetUrl: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="https://your-domain.vercel.app/widget/chatbot-widget.iife.js"
            />
          </div>

          {/* テナントID (読み取り専用) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              テナントID
            </label>
            <input
              type="text"
              value={tenantId}
              readOnly
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-default"
            />
          </div>
        </div>
      </div>

      {/* ─── プレビュー ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">プレビュー</h2>
        <div className="relative h-40 rounded-lg border border-dashed border-gray-300 bg-gray-50">
          <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
            ウェブサイトのプレビュー
          </p>
          {/* FABボタンプレビュー */}
          <button
            className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full text-xl text-white shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: config.themeColor }}
            aria-label="プレビュー"
          >
            💬
          </button>
        </div>
      </div>

      {/* ─── HTMLスクリプトタグ ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">埋め込みコード (推奨)</h2>
            <p className="text-sm text-gray-500">
              &lt;/body&gt; タグの直前に貼り付けてください
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(scriptTag, 'script')}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? '✅ コピーしました！' : '📋 コピー'}
          </button>
        </div>

        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs leading-relaxed text-green-300 font-mono">
          {scriptTag}
        </pre>
      </div>

      {/* ─── npm / モジュールバンドラー用 ───────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">JavaScript API</h2>
            <p className="text-sm text-gray-500">プログラムで開閉を制御する場合</p>
          </div>
          <button
            onClick={() => copyToClipboard(npmSnippet, 'npm')}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copiedNpm ? '✅ コピーしました！' : '📋 コピー'}
          </button>
        </div>

        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs leading-relaxed text-blue-300 font-mono">
          {npmSnippet}
        </pre>
      </div>

      {/* ─── 設置手順 ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
        <h2 className="mb-3 text-base font-semibold text-blue-800">設置手順</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-blue-700">
          <li>上記の埋め込みコードをコピーします</li>
          <li>
            ウェブサイトの HTML ファイルを開き、<code className="rounded bg-blue-100 px-1">&lt;/body&gt;</code>{' '}
            タグの直前に貼り付けます
          </li>
          <li>ページを保存してブラウザで確認します</li>
          <li>右下（または左下）に 💬 アイコンが表示されれば設置完了です</li>
        </ol>
        <div className="mt-4 rounded-lg border border-blue-200 bg-white p-3">
          <p className="text-xs text-blue-600">
            💡 <strong>ヒント:</strong> WordPress の場合は「テーマのカスタマイズ」→「フッター」に貼り付けてください。
            Shopify の場合は <code>theme.liquid</code> の末尾に追加します。
          </p>
        </div>
      </div>
    </div>
  );
}
