// apps/web/app/(dashboard)/embed/page.tsx
// W4-007: 埋め込みコード生成・管理ページ

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { EmbedCodeGenerator } from '@/components/embed/embed-code-generator';

export const metadata = { title: '埋め込みコード - AI Chatbot' };

export default async function EmbedPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const tenantId =
    (session as unknown as { tenantId?: string }).tenantId ?? 'YOUR_TENANT_ID';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">埋め込みウィジェット</h1>
        <p className="mt-1 text-gray-500">
          コードをコピーしてウェブサイトの &lt;body&gt; タグ直前に貼り付けてください
        </p>
      </div>

      <EmbedCodeGenerator tenantId={tenantId} />
    </div>
  );
}
