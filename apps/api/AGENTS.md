---
description: "NestJS 11 Backend - GCP Cloud Run向けバックエンド固有ルール"
tags: ["agents-v1.1", "backend", "nestjs11", "cloudrun", "gemini", "langchain"]
version: 1.0.0
jurisdiction: "apps/api"
parent: "../../AGENTS.md"
last_updated: 2026-02-19
---

# AGENTS.md - Backend (apps/api)

> **管轄範囲**: このファイルは `apps/api/` 配下のNestJS 11 Backendにのみ適用されます。
> **親ルール**: ルートの `AGENTS.md` を継承し、矛盾する場合はこちらが優先されます。

---

## 🔧 Backend固有の技術スタック

- **Framework**: NestJS 11 (IntrinsicException活用)
- **ORM**: Prisma 6 (PostgreSQL + pgvector)
- **AI**: Gemini 3.0 Flash + Langchain.js
- **Cache**: Redis (GCP Memorystore)
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI
- **Deployment**: GCP Cloud Run (Direct VPC Egress)

---

## 🛠️ Backend開発ルール

### NestJS 11 固有の注意事項

1. **IntrinsicException (NEW)**
   - NestJS 11で導入された新しい例外ハンドリング
   - 予期しない内部エラーには `IntrinsicException` を使用
   ```typescript
   // ✅ NestJS 11推奨
   if (!user) {
     throw new NotFoundException('User not found');
   }
   
   try {
     await externalService.call();
   } catch (error) {
     throw new IntrinsicException('External service failed', error);
   }
   ```

2. **Dependency Injection**
   - `@Injectable()` デコレータ必須
   - Constructor Injection を優先
   - Circular Dependency は `forwardRef()` で解決

3. **Module構成**
   - 機能単位でモジュール分割
   - `@Global()` は最小限に（CoreModule, DatabaseModuleのみ）

### データベース設計

- **マルチテナント**: Row Level Security (RLS) + `tenant_id` カラム必須
- **Migration**: Prisma Migrate + `schema.prisma` から自動生成
- **pgvector**: FAQ埋め込みベクトル (1536次元、Gemini Embedding)
- **Indexing**: 必ず `EXPLAIN ANALYZE` で性能確認

### AI/プロンプト戦略

- **Gemini API**: `@google/generative-ai` SDK使用
- **プロンプト管理**: `packages/langchain/` で一元管理
- **RAG実装**: Langchain.jsの `VectorStoreRetriever` を活用
- **ストリーミング**: Server-Sent Events (SSE) で逐次応答

---

## 📁 ディレクトリ構造規約

```
apps/api/
├── src/
│   ├── main.ts                # エントリーポイント
│   ├── app.module.ts          # ルートモジュール
│   ├── modules/               # 機能モジュール
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── faq/
│   │   └── tenant/
│   ├── common/                # 共通コード
│   │   ├── decorators/
│   │   ├── filters/           # Exception Filters
│   │   ├── guards/            # Auth Guards
│   │   ├── interceptors/
│   │   └── pipes/             # Validation Pipes
│   ├── config/                # 設定
│   │   └── configuration.ts
│   └── prisma/                # Prisma関連
│       └── schema.prisma
├── test/                      # E2Eテスト
└── prisma/                    # Migrations
    └── migrations/
```

---

## 🔒 セキュリティ

### 認証・認可

- **JWT**: Access Token (15分) + Refresh Token (7日間)
- **Passport**: `@nestjs/passport` + `passport-jwt` 戦略
- **Guards**: `@UseGuards(JwtAuthGuard)` で保護
- **RBAC**: `tenant_id` + `role` (admin, staff, user) によるアクセス制御

### Rate Limiting

- **Throttler**: `@nestjs/throttler` (10req/秒/IP)
- **API Key制限**: テナント毎に月間リクエスト上限

### OWASP Top 10対策

- **SQL Injection**: Prisma ORM（パラメータ化クエリ）で防御
- **XSS**: API応答はJSON、HTML出力なし
- **CSRF**: SameSite Cookie + StatelessなAPI設計
- **Secrets**: GCP Secret Manager + 環境変数での注入

---

## 🧪 テスト戦略

- **Unit Test**: Jest + `@nestjs/testing`
- **E2E Test**: Supertest + Testcontainers (PostgreSQL)
- **Coverage**: 最低80%カバレッジ目標
- **Mocking**: `jest.mock()` でExternal APIをモック

---

## ⚡ パフォーマンス

### Cloud Run最適化

- **Min Instances**: `1` (コールドスタート防止)
- **Max Instances**: `10` (コスト抑制)
- **CPU**: 常時割り当て (Always Allocated)
- **Memory**: 512MB (AI推論時は1GB)

### キャッシング戦略

- **Redis**: セッション、FAQ検索結果（5分TTL）
- **Application Cache**: `@nestjs/cache-manager` + ioredis
- **HTTP Cache**: `Cache-Control` ヘッダー適切に設定

---

## 📞 Human Contact Protocol (Backend固有)

以下の場合は実装前に人間に確認してください:
- データベーススキーマの破壊的変更 (カラム削除、型変更)
- GCP APIの新規有効化 (課金への影響)
- Gemini APIの大量呼び出し (コスト上昇リスク)
- セキュリティに関わる認証・認可ロジックの変更

---

**このファイルはバックエンド開発者（AI/人間）のための「生きた憲法」です。**
