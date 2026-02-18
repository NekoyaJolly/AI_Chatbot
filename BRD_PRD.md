# Business & Product Requirements Document (BRD/PRD)

## 🎯 プロジェクト概要
中小企業（ペットショップ、美容サロン、動物病院等）向けの完全マネージド型AIチャットボットSaaSプラットフォームの開発。

## 🏗️ システムアーキテクチャ
- **Frontend**: Next.js 15 (Vercel)
- **Backend**: NestJS (GCP Cloud Run)
- **Database**: PostgreSQL (Supabase) + pgvector
- **AI**: Gemini 3.0 Flash + Langchain.js
- **Cache**: Redis (GCP Memorystore)

## 📋 主要機能 (MVP)
1. **マルチテナント管理**: Row Level Security (RLS) によるデータ完全分離。
2. **FAQ管理システム**: CRUD操作、CSVインポート、pgvectorによるセマンティック検索。
3. **AIチャット応答生成**: Gemini 3.0 Flashを用いたRAG (Retrieval-Augmented Generation)。
4. **リアルタイムチャット**: Socket.ioによる双方向通信、既読管理。
5. **外部連携**: LINE Messaging APIとのWebhook連携。
6. **分析ダッシュボード**: チャット統計、FAQ正答率、Rechartsによる可視化。
7. **埋め込みウィジェット**: Shadow DOMを使用した、既存Webサイトへの簡単埋め込み。

## 🔐 非機能要件
- **セキュリティ**: JWT認証、Rate Limiting、OWASP Top 10対策。
- **パフォーマンス**: API応答 P95 < 200ms（AI推論除く）、pgvector検索 < 100ms。
- **可用性**: 稼働率 99.95% 目標。
