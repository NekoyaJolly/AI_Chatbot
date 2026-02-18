'use client';

// apps/web/components/faqs/faq-form.tsx
// W2-007: FAQ 作成・編集フォームコンポーネント

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Faq, CreateFaqInput } from '@/lib/api-client';

interface FaqFormProps {
  faq?: Faq | null;
  onSubmit: (data: CreateFaqInput & { isActive?: boolean }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const CATEGORIES = [
  { value: 'general', label: '一般' },
  { value: 'hours', label: '営業時間' },
  { value: 'pricing', label: '料金' },
  { value: 'access', label: 'アクセス' },
  { value: 'service', label: 'サービス' },
  { value: 'contact', label: 'お問い合わせ' },
];

export function FaqForm({ faq, onSubmit, onCancel, loading }: FaqFormProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('general');
  const [tagsInput, setTagsInput] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (faq) {
      setQuestion(faq.question);
      setAnswer(faq.answer);
      setCategory(faq.category ?? 'general');
      setTagsInput(faq.tags?.join(', ') ?? '');
      setIsActive(faq.isActive);
    }
  }, [faq]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      setError('質問を入力してください');
      return;
    }
    if (!answer.trim()) {
      setError('回答を入力してください');
      return;
    }

    setError('');
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await onSubmit({ question, answer, category, tags, isActive });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{faq ? 'FAQ を編集' : '新しい FAQ を作成'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">質問 *</label>
            <Input
              placeholder="例: 営業時間はいつですか？"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">回答 *</label>
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="例: 当店の営業時間は月〜金 10:00〜19:00です。"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">カテゴリ</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">タグ (カンマ区切り)</label>
              <Input
                placeholder="例: 営業時間, アクセス"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          </div>

          {faq && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium">公開する</label>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : faq ? '更新' : '作成'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
