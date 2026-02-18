'use client';

// apps/web/app/(auth)/signup/page.tsx
// サインアップページ

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  industry: string;
}

const INDUSTRIES = [
  { value: 'pet_shop', label: 'ペットショップ' },
  { value: 'beauty_salon', label: '美容サロン' },
  { value: 'veterinary', label: '動物病院' },
  { value: 'restaurant', label: '飲食店' },
  { value: 'real_estate', label: '不動産' },
  { value: 'dental', label: '歯科医院' },
  { value: 'general', label: 'その他' },
];

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<SignupForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    industry: 'general',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'お名前を入力してください';
    if (!form.email.trim()) return 'メールアドレスを入力してください';
    if (form.password.length < 8) return 'パスワードは8文字以上で入力してください';
    if (form.password !== form.confirmPassword) return 'パスワードが一致しません';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          industry: form.industry,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || '登録に失敗しました');
      }

      // 登録後に自動ログイン
      await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">新規登録</CardTitle>
        <CardDescription className="text-center">
          AI Chatbot SaaS を無料で始める
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">お名前</label>
            <Input
              id="name"
              name="name"
              placeholder="山田 太郎"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">メールアドレス</label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="industry" className="text-sm font-medium">業種</label>
            <select
              id="industry"
              name="industry"
              value={form.industry}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind.value} value={ind.value}>
                  {ind.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">パスワード</label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="8文字以上"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              パスワード（確認）
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="パスワードを再入力"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '登録中...' : '無料で始める'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            登録することで利用規約とプライバシーポリシーに同意したことになります
          </p>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          既にアカウントをお持ちの方は{' '}
          <Link href="/login" className="underline hover:text-primary">
            ログイン
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
