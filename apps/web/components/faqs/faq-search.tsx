'use client';

// apps/web/components/faqs/faq-search.tsx
// W2-008: FAQ 検索UIコンポーネント

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { faqApi, Faq } from '@/lib/api-client';

export function FaqSearch() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? '';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const data = await faqApi.vectorSearch(token, query, 5);
      setResults(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : '検索に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">FAQ 検索</h3>
        <p className="text-sm text-muted-foreground">質問を入力して類似FAQを検索します</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="例: 営業時間を教えてください"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? '検索中...' : '検索'}
        </Button>
      </form>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {searched && !loading && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              「{query}」に一致するFAQが見つかりませんでした
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{results.length} 件の結果</p>
              {results.map((faq) => (
                <Card key={faq.id}>
                  <CardContent className="p-4">
                    <p className="font-medium">Q: {faq.question}</p>
                    <p className="text-sm text-muted-foreground mt-2">A: {faq.answer}</p>
                    {faq.category && (
                      <span className="mt-2 inline-block text-xs bg-secondary px-2 py-0.5 rounded-full">
                        {faq.category}
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
