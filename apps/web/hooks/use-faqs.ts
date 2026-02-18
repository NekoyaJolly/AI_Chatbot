'use client';

// apps/web/hooks/use-faqs.ts
// W2-007: FAQ 管理 カスタムフック

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { faqApi, Faq, FaqListResponse, CreateFaqInput, UpdateFaqInput } from '@/lib/api-client';

export function useFaqs(initialParams?: { q?: string; page?: number; limit?: number }) {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? '';

  const [data, setData] = useState<FaqListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [params, setParams] = useState({
    q: initialParams?.q ?? '',
    page: initialParams?.page ?? 1,
    limit: initialParams?.limit ?? 20,
  });

  const fetchFaqs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await faqApi.list(token, params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'FAQの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [token, params]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const createFaq = useCallback(async (input: CreateFaqInput): Promise<Faq> => {
    const result = await faqApi.create(token, input);
    await fetchFaqs();
    return result;
  }, [token, fetchFaqs]);

  const updateFaq = useCallback(async (id: string, input: UpdateFaqInput): Promise<Faq> => {
    const result = await faqApi.update(token, id, input);
    await fetchFaqs();
    return result;
  }, [token, fetchFaqs]);

  const deleteFaq = useCallback(async (id: string): Promise<void> => {
    await faqApi.delete(token, id);
    await fetchFaqs();
  }, [token, fetchFaqs]);

  const search = useCallback((q: string) => {
    setParams((prev) => ({ ...prev, q, page: 1 }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  return {
    data,
    loading,
    error,
    params,
    search,
    goToPage,
    refetch: fetchFaqs,
    createFaq,
    updateFaq,
    deleteFaq,
  };
}
