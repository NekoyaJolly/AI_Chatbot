'use client';

// apps/web/components/faqs/faq-list.tsx
// W2-007: FAQ 一覧コンポーネント

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Faq } from '@/lib/api-client';

interface FaqListProps {
  faqs: Faq[];
  total: number;
  page: number;
  totalPages: number;
  loading?: boolean;
  onSearch: (q: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (faq: Faq) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function FaqList({
  faqs,
  total,
  page,
  totalPages,
  loading,
  onSearch,
  onPageChange,
  onEdit,
  onDelete,
  onNew,
}: FaqListProps) {
  const [searchValue, setSearchValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">FAQ 管理</h2>
          <p className="text-muted-foreground text-sm">全 {total} 件</p>
        </div>
        <Button onClick={onNew}>+ FAQ を追加</Button>
      </div>

      {/* 検索バー */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="FAQ を検索..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">検索</Button>
      </form>

      {/* FAQ リスト */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">FAQ がまだありません</p>
          <Button onClick={onNew} className="mt-4">最初の FAQ を作成</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <Card key={faq.id} className={`transition-opacity ${!faq.isActive ? 'opacity-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{faq.question}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {faq.category && (
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                          {faq.category}
                        </span>
                      )}
                      {faq.tags?.map((tag) => (
                        <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                      {!faq.isActive && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          非公開
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(faq)}
                    >
                      編集
                    </Button>
                    <Button
                      size="sm"
                      variant={deleteConfirm === faq.id ? 'destructive' : 'outline'}
                      onClick={() => handleDelete(faq.id)}
                    >
                      {deleteConfirm === faq.id ? '確認' : '削除'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            前へ
          </Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  );
}
