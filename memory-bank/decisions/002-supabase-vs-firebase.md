---
id: ADR-002
title: Supabase over Firebase / PlanetScale
status: Accepted
date: 2026-02-18
tags: ["adr", "database", "supabase", "pgvector"]
---

# ADR-002: Supabase over Firebase / PlanetScale

## Status

**Accepted** (2026-02-18)

---

## Context

AIチャットボットSaaSのバックエンドデータベースとして、BaaS（Backend as a Service）を選定する必要があった。

### 要件

1. **ベクトル検索サポート**: FAQ セマンティック検索に必須
2. **マルチテナント対応**: Row Level Security (RLS) でデータ分離
3. **リアルタイム機能**: チャットメッセージのリアルタイム配信
4. **SQL制御**: 複雑なクエリとトランザクション対応
5. **コスト**: スタートアップフェーズのため低コスト

### 検討した選択肢

1. **Supabase** (PostgreSQL 16 + pgvector)
2. **Firebase** (Firestore + Cloud Functions)
3. **PlanetScale** (MySQL with Vitess)

---

## Decision

**Supabase (PostgreSQL 16 + pgvector) を採用**

---

## Rationale

### 比較表

| 評価項目 | Supabase | Firebase | PlanetScale |
|---------|----------|----------|-------------|
| **ベクトル検索** | ✅ pgvector (ネイティブ) | ❌ 非対応 | ❌ 非対応 |
| **RLS対応** | ✅ PostgreSQL RLS | ✅ Firestore Rules | ❌ 手動実装 |
| **SQL制御** | ✅ フル制御 | ❌ NoSQL | ✅ フル制御 |
| **リアルタイム** | ✅ Realtime Subscriptions | ✅ Firestore Realtime | ❌ 非対応 |
| **トランザクション** | ✅ ACID準拠 | ⚠️ 限定的 | ✅ ACID準拠 |
| **コスト** | $25/月〜 | $25/月〜 | $39/月〜 |
| **移行性** | ✅ PostgreSQL互換 | ❌ ベンダーロックイン | ✅ MySQL互換 |

### 1. ベクトル検索（最重要）

**Supabase (pgvector)**:
```sql
-- セマンティック検索が1クエリで完結
SELECT question, answer, 
       1 - (embedding <=> '[0.1, 0.2, ...]') AS similarity
FROM faqs
WHERE tenant_id = 'xxx'
ORDER BY embedding <=> '[0.1, 0.2, ...]'
LIMIT 5;
```

**Firebase**:
- ❌ ネイティブなベクトル検索なし
- 代替案: Firebaseから外部ベクトルDB（Pinecone, Weaviate）への連携が必要 → **複雑性増加**

**PlanetScale**:
- ❌ MySQLはベクトル検索非対応
- 代替案: 別途ベクトルDBを構築 → **コスト増加**

**結論**: Supabaseのpgvectorがネイティブサポートでシンプル

### 2. マルチテナント対応（RLS）

**Supabase (PostgreSQL RLS)**:
```sql
-- RLS Policyで自動的にテナント分離
CREATE POLICY tenant_isolation ON faqs
FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

**Firebase (Firestore Rules)**:
```javascript
// Firestore Rulesでも可能だが、複雑
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tenants/{tenantId}/faqs/{faqId} {
      allow read, write: if request.auth.token.tenantId == tenantId;
    }
  }
}
```

**PlanetScale**:
- ❌ RLS機能なし
- 代替案: アプリケーションレイヤーで手動実装 → **セキュリティリスク増加**

**結論**: SupabaseのRLSが宣言的でセキュア

### 3. SQL制御

**Supabase**:
- ✅ PostgreSQL完全互換、複雑なJOIN・サブクエリ対応
- ✅ Prisma ORMでTypeScript型安全性

**Firebase**:
- ❌ NoSQLのため、複雑なクエリは非効率
- 例: 集計クエリはCloud Functionsで手動実装が必要

**PlanetScale**:
- ✅ MySQL互換だが、外部キー制約なし（Vitess制約）
- ⚠️ マイグレーションがSupabaseより複雑

**結論**: SupabaseのPostgreSQLが最も柔軟

### 4. リアルタイム機能

**Supabase Realtime Subscriptions**:
```typescript
const subscription = supabase
  .from('chat_messages')
  .on('INSERT', payload => {
    console.log('New message:', payload.new);
  })
  .subscribe();
```

**Firebase Firestore Realtime**:
```typescript
db.collection('chat_messages')
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      console.log('New message:', change.doc.data());
    });
  });
```

**PlanetScale**:
- ❌ リアルタイム機能なし
- 代替案: WebSocket自前実装 → **開発コスト増加**

**結論**: SupabaseとFirebaseは同等、PlanetScaleは非対応

### 5. コスト

| プラン | Supabase | Firebase | PlanetScale |
|--------|----------|----------|-------------|
| 無料枠 | 500MB DB + 2GB転送 | 1GB保存 + 10GB転送 | 5GB保存 + 1億読み取り |
| 有料開始 | $25/月 | $25/月 | $39/月 |

**結論**: SupabaseとFirebaseが同等、PlanetScaleがやや高い

---

## Consequences

### Positive（メリット）

- ✅ **pgvectorネイティブサポート**: セマンティック検索が1クエリで完結
- ✅ **RLS対応**: マルチテナント分離が宣言的に実装可能
- ✅ **PostgreSQL互換**: 将来的に他のホスティング（AWS RDS、Google Cloud SQL等）への移行が容易
- ✅ **Prisma ORMサポート**: TypeScript型安全性と開発者体験向上
- ✅ **Realtime Subscriptions**: WebSocketでのリアルタイムチャット対応

### Negative（デメリット）

- ❌ **PostgreSQL運用知識が必要**: インデックス設計、パフォーマンスチューニング
- ❌ **Supabase固有のEdge Functions制約**: 今回は未使用のため影響なし
- ❌ **スケールアウト**: Firebaseほど自動スケーリングは強力ではない

### Mitigation（対策）

| デメリット | 対策 |
|-----------|------|
| PostgreSQL運用知識 | Supabase公式ドキュメント + PostgreSQLチューニングガイド活用 |
| スケールアウト | Supabase Proプラン（$25/月）で99.9%稼働率保証 |

---

## Alternatives Considered

### 代替案1: Firebase (Firestore)

**理由**: 自動スケーリング、NoSQLの柔軟性

**却下理由**:
- ❌ ベクトル検索非対応 → 別途ベクトルDB（Pinecone等）が必要
- ❌ 複雑なクエリが非効率 → Cloud Functions手動実装コスト増加
- ❌ ベンダーロックインリスク → 他のDBへの移行が困難

### 代替案2: PlanetScale (MySQL with Vitess)

**理由**: MySQL互換、ブランチングによる安全なスキーマ変更

**却下理由**:
- ❌ ベクトル検索非対応 → 別途ベクトルDBが必要
- ❌ リアルタイム機能なし → WebSocket自前実装必要
- ❌ 外部キー制約なし → Prismaとの相性悪化

### 代替案3: 自前PostgreSQL (AWS RDS / Google Cloud SQL)

**理由**: 完全制御、カスタマイズ自由

**却下理由**:
- ❌ 運用コスト高 → バックアップ、パッチ適用、監視を手動管理
- ❌ Realtime機能の自前実装必要
- ❌ スタートアップフェーズでは過剰

---

## References

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [PlanetScale Documentation](https://planetscale.com/docs)

---

## Related Documents

| ドキュメント | 説明 |
|-------------|------|
| [`tech-decisions.md`](../context/tech-decisions.md) | 技術選定理由サマリー |
| [`/AGENTS.md`](/AGENTS.md) | 技術スタック概要 |

---

## 更新履歴

| 日付 | 変更内容 | 担当 |
|------|---------|------|
| 2026-02-18 | ADR-002初版作成 | AI Agent |

---

> **このADRは最終決定を記録するものです。** 将来的にDBを変更する場合は、新しいADRを作成してください（例: ADR-011: Migrate to AWS RDS）。
