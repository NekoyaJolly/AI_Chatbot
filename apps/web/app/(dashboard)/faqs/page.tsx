'use client';

// apps/web/app/(dashboard)/faqs/page.tsx
// W2-007: FAQ 管理ページ

import { useState } from 'react';
import { FaqList } from '@/components/faqs/faq-list';
import { FaqForm } from '@/components/faqs/faq-form';
import { FaqSearch } from '@/components/faqs/faq-search';
import { FaqImport } from '@/components/faqs/faq-import';
import { useFaqs } from '@/hooks/use-faqs';
import { Faq } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

type View = 'list' | 'new' | 'edit' | 'search' | 'import';

export default function FaqsPage() {
  const { data, loading, error, search, goToPage, refetch, createFaq, updateFaq, deleteFaq } =
    useFaqs();

  const [view, setView] = useState<View>('list');
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleCreate = async (input: Parameters<typeof createFaq>[0]) => {
    setFormLoading(true);
    try {
      await createFaq(input);
      setView('list');
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (input: Parameters<typeof updateFaq>[1]) => {
    if (!editingFaq) return;
    setFormLoading(true);
    try {
      await updateFaq(editingFaq.id, input);
      setView('list');
      setEditingFaq(null);
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setView('edit');
  };

  const handleDelete = async (id: string) => {
    await deleteFaq(id);
  };

  return (
    <div className="space-y-4">
      {/* タブナビゲーション */}
      <div className="flex gap-2 border-b pb-2">
        {(['list', 'search', 'import'] as const).map((v) => (
          <Button
            key={v}
            variant={view === v ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView(v)}
          >
            {v === 'list' ? '📋 一覧' : v === 'search' ? '🔍 検索' : '📥 インポート'}
          </Button>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {/* ビュー切り替え */}
      {view === 'list' && (
        <FaqList
          faqs={data?.items ?? []}
          total={data?.total ?? 0}
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          loading={loading}
          onSearch={search}
          onPageChange={goToPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onNew={() => setView('new')}
        />
      )}

      {view === 'new' && (
        <FaqForm
          onSubmit={handleCreate}
          onCancel={() => setView('list')}
          loading={formLoading}
        />
      )}

      {view === 'edit' && (
        <FaqForm
          faq={editingFaq}
          onSubmit={handleUpdate}
          onCancel={() => { setView('list'); setEditingFaq(null); }}
          loading={formLoading}
        />
      )}

      {view === 'search' && <FaqSearch />}

      {view === 'import' && (
        <FaqImport onSuccess={() => { refetch(); setView('list'); }} />
      )}
    </div>
  );
}
