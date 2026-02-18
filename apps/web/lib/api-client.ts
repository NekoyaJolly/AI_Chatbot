// apps/web/lib/api-client.ts
// API クライアントユーティリティ

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function fetchWithAuth<T>(
  path: string,
  options?: RequestInit,
  token?: string,
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message ?? `HTTP ${response.status}`);
  }

  return response.json();
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  category: string;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FaqListResponse {
  items: Faq[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateFaqInput {
  question: string;
  answer: string;
  tags?: string[];
  category?: string;
}

export interface UpdateFaqInput extends Partial<CreateFaqInput> {
  isActive?: boolean;
}

export const faqApi = {
  list: (token: string, params?: { q?: string; page?: number; limit?: number; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.category) query.set('category', params.category);
    return fetchWithAuth<FaqListResponse>(`/faqs?${query.toString()}`, {}, token);
  },

  get: (token: string, id: string) =>
    fetchWithAuth<Faq>(`/faqs/${id}`, {}, token),

  create: (token: string, data: CreateFaqInput) =>
    fetchWithAuth<Faq>('/faqs', { method: 'POST', body: JSON.stringify(data) }, token),

  update: (token: string, id: string, data: UpdateFaqInput) =>
    fetchWithAuth<Faq>(`/faqs/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),

  delete: (token: string, id: string) =>
    fetchWithAuth<{ message: string; id: string }>(`/faqs/${id}`, { method: 'DELETE' }, token),

  bulkImport: (token: string, faqs: CreateFaqInput[]) =>
    fetchWithAuth<{ imported: number; failed: number; errors: Array<{ index: number; message: string }> }>(
      '/faqs/bulk-import',
      { method: 'POST', body: JSON.stringify({ faqs }) },
      token,
    ),

  vectorSearch: (token: string, q: string, limit = 5) => {
    const query = new URLSearchParams({ q, limit: String(limit) });
    return fetchWithAuth<FaqListResponse>(`/faqs/search/vector?${query.toString()}`, {}, token);
  },
};
