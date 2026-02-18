/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turborepo との統合設定
  transpilePackages: ['@repo/ui', '@repo/types'],
  
  // 実験的機能
  experimental: {
    // React 19 の並列データフェッチ最適化
    ppr: false,
  },

  // 画像最適化
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // 環境変数 (公開可能なもののみ)
  env: {
    NEXT_PUBLIC_APP_NAME: 'AI Chatbot SaaS',
    NEXT_PUBLIC_APP_VERSION: '0.1.0',
  },
};

export default nextConfig;
