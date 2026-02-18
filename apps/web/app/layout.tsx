import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Chatbot SaaS - 中小企業向けAIチャットボット',
  description:
    '中小企業向けの完全マネージド型AIチャットボットSaaSプラットフォーム。ペットショップ、美容サロン、動物病院など多業種対応。',
  keywords: ['AIチャットボット', 'SaaS', '中小企業', 'カスタマーサポート'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
