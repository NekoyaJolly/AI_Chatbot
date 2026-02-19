// apps/web/app/(dashboard)/chat/page.tsx
// ダッシュボード - チャットテストページ

import { auth } from '@/auth';
import { ChatWindow } from '@/components/chat/chat-window';

export default async function ChatPage() {
  const session = await auth();
  const tenantId = (session?.user as { tenantId?: string } | undefined)?.tenantId ?? '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">チャットプレビュー</h1>
        <p className="text-muted-foreground mt-1">AIチャットボットの動作確認</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* チャットウィンドウ */}
        <div>
          <h2 className="text-lg font-semibold mb-3">ライブプレビュー</h2>
          {tenantId ? (
            <ChatWindow tenantId={tenantId} height="600px" />
          ) : (
            <div className="flex items-center justify-center h-[600px] border rounded-lg text-muted-foreground">
              テナントIDが設定されていません
            </div>
          )}
        </div>

        {/* 使い方ガイド */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">使い方</h2>
          <div className="rounded-lg border p-4 space-y-3 text-sm">
            <div>
              <p className="font-medium">1. FAQ を登録する</p>
              <p className="text-muted-foreground">FAQ管理ページでよくある質問と回答を登録します</p>
            </div>
            <div>
              <p className="font-medium">2. チャットで質問する</p>
              <p className="text-muted-foreground">AIが登録されたFAQを参照して回答します</p>
            </div>
            <div>
              <p className="font-medium">3. 精度を確認する</p>
              <p className="text-muted-foreground">回答の信頼度が低い場合はスタッフへエスカレーションされます</p>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">テスト用質問例</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• 「営業時間を教えてください」</li>
              <li>• 「予約は必要ですか？」</li>
              <li>• 「料金を教えてください」</li>
              <li>• 「アクセス方法を教えてください」</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
