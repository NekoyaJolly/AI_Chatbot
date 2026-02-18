'use client';

// apps/web/components/faqs/faq-import.tsx
// W2-009: CSV 一括インポートコンポーネント

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { faqApi, CreateFaqInput } from '@/lib/api-client';

interface ImportResult {
  imported: number;
  failed: number;
  errors: Array<{ index: number; message: string }>;
}

function parseCsv(csvText: string): CreateFaqInput[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // ヘッダー行をスキップ (question,answer,category,tags の順を想定)
  const rows = lines.slice(1);
  return rows
    .map((line) => {
      // 簡易CSV パース (ダブルクォート内カンマを考慮)
      const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g) ?? [];
      const clean = (s: string) => s.replace(/^"|"$/g, '').trim();

      const question = clean(cols[0] ?? '');
      const answer = clean(cols[1] ?? '');
      const category = clean(cols[2] ?? '') || 'general';
      const tagsRaw = clean(cols[3] ?? '');
      const tags = tagsRaw ? tagsRaw.split('|').map((t) => t.trim()) : [];

      return { question, answer, category, tags };
    })
    .filter((row) => row.question && row.answer);
}

export function FaqImport({ onSuccess }: { onSuccess?: () => void }) {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? '';

  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<CreateFaqInput[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('CSVファイルを選択してください');
      return;
    }

    setFileName(file.name);
    setError('');
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCsv(text);
      setPreview(parsed);
      if (parsed.length === 0) {
        setError('有効なデータが見つかりませんでした。CSVフォーマット: question,answer,category,tags');
      }
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setLoading(true);
    setError('');

    try {
      const res = await faqApi.bulkImport(token, preview);
      setResult(res);
      if (res.imported > 0 && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'インポートに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">CSV 一括インポート</h3>
        <p className="text-sm text-muted-foreground">
          CSVフォーマット: <code className="bg-secondary px-1 rounded">question,answer,category,tags</code>
        </p>
      </div>

      {/* ドロップゾーン */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('csv-file-input')?.click()}
      >
        <div className="text-4xl mb-2">📂</div>
        <p className="text-sm font-medium">
          {fileName || 'CSVファイルをドラッグ＆ドロップ、またはクリックして選択'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">UTF-8エンコードのCSVファイル</p>
        <input
          id="csv-file-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {/* プレビュー */}
      {preview.length > 0 && !result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{preview.length} 件のFAQが読み込まれました</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {preview.slice(0, 5).map((faq, i) => (
                <div key={i} className="text-sm border-b pb-2">
                  <p className="font-medium">{faq.question}</p>
                  <p className="text-muted-foreground truncate">{faq.answer}</p>
                </div>
              ))}
              {preview.length > 5 && (
                <p className="text-sm text-muted-foreground">...他 {preview.length - 5} 件</p>
              )}
            </div>
            <Button
              onClick={handleImport}
              disabled={loading}
              className="mt-4"
            >
              {loading ? `インポート中...` : `${preview.length} 件をインポート`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 結果 */}
      {result && (
        <Card>
          <CardContent className="p-4">
            <p className="font-medium">インポート完了</p>
            <p className="text-sm text-green-600 mt-1">✅ 成功: {result.imported} 件</p>
            {result.failed > 0 && (
              <p className="text-sm text-red-600">❌ 失敗: {result.failed} 件</p>
            )}
            {result.errors.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                {result.errors.slice(0, 5).map((e) => (
                  <p key={e.index}>行 {e.index + 2}: {e.message}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
