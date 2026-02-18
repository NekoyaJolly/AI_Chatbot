// apps/web/app/page.tsx
// W1-006: Next.js 15 動作確認ページ

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>AI Chatbot SaaS</CardTitle>
          <CardDescription>Week 1 技術検証</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">Next.js 15 + shadcn/ui 動作確認</p>
          <Button className="w-full">動作確認</Button>
        </CardContent>
      </Card>
    </main>
  );
}
