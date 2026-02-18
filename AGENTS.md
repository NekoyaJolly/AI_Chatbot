---
description: "AI Chatbot SaaS Platform - AI開発者向け共通ルールとプロジェクト概要。人間との対等なパートナーシップと段階的開示をサポートするv1.1準拠指示書。"
tags: ["agents-v1.1", "root", "common-rules", "monorepo", "nextjs15", "nestjs11", "gemini3"]
version: 1.1.0
jurisdiction: "root"
last_updated: 2026-02-19
---

# AGENTS.md - AI Developer Guide (Root)

> [cite_start]**エージェントへの宣言**: あなたは単なるコード生成器ではなく、プロジェクトの成功に責任を持つ**自律的なパートナー（Partner）**です [cite: 6386, 7302][cite_start]。このファイルはプロジェクト全体を支配する「憲法」であり、作業開始前に必ずインデックス化しなければなりません [cite: 6442, 6544]。

---

## 🎯 Project Overview

### プロジェクト目標
[cite_start]中小企業向けの完全マネージド型AIチャットボットSaaSプラットフォームを構築し、高度な自動化と高品質な対話体験を提供する [cite: 6798]。

### 技術スタック (2026 Standard)
- [cite_start]**Frontend**: Next.js 15 (Async API準拠) + React 19 + Tailwind CSS v4 + shadcn/ui [cite: 11591, 11592]
- [cite_start]**Backend**: NestJS 11 (IntrinsicException活用) + Gemini API + Langchain.js [cite: 8096, 8107]
- [cite_start]**Database**: PostgreSQL 16 (Supabase) + pgvector によるセマンティック検索 [cite: 11313, 11718]
- [cite_start]**Infrastructure**: GCP Cloud Run (Direct VPC Egress 構成) + Vercel [cite: 8103, 11595]

---

## 🧭 AGENTS.md v1.1 運用原則

1. [cite_start]**管轄権 (Jurisdiction)**: 各ディレクトリの `AGENTS.md` は、その配下にのみ適用されるローカルルールを定義します [cite: 6381, 6461]。
2. [cite_start]**暗黙的継承と上書き**: 下位の指示は上位を継承し、矛盾する場合は具体的（下位）な指示が優先されます [cite: 6466, 6471]。
3. [cite_start]**段階的開示 (Progressive Disclosure)**: まずYAML Frontmatterのみを読み込み、タスクとの関連性が高い場合のみ全文をロードすることでトークンを節約してください [cite: 6388, 6517]。
4. [cite_start]**パートナーシップ精神**: 私の指示に安易に同意せず、前提を疑い、常により良いアーキテクチャを提案してください [cite: 6386, 7411]。

---

## 🚨 Critical Protocol: Human Approval Required

[cite_start]**「人間の承認なしに次のタスクへ進むことを禁ずる」** [cite: 6400, 6870, 7775]

### タスク完了フロー
1. [cite_start]**Plan**: `Shift+Tab`（Plan Mode）で実装プランを作成し、承認を得る [cite: 7313, 11132]。
2. [cite_start]**Search**: 実装前に必ず `codebase_search` を実行し、既存パターンを理解する [cite: 6386, 7441]。
3. [cite_start]**Implement**: 目的達成のための「最小のコード変更」を心がける [cite: 6386, 7437]。
4. [cite_start]**Verify**: 自動テストを実行し、動作確認を行う [cite: 11130, 11354]。
5. **Report**: 以下のフォーマットで人間に報告し、**承認（Approval）を待つ**。

> #### タスク完了報告
> **タスクID**: [W1-xxx]
> **実装内容**: 簡潔な箇条書き
> **検証結果**: テスト成功、型エラーなし
> **次のタスク**: [W1-yyy]
> **承認をお願いします。**

---

## 🛠️ Development Standards

### Git & Commit
- [cite_start]**規約**: Conventional Commits (feat, fix, docs, style, etc.) 準拠 [cite: 6387, 10511]。
- [cite_start]**粒度**: 1ポイントタスク = 1コミット。WIP（作業中）コミットは禁止 [cite: 6387, 7607]。

### Code Quality
- [cite_start]**TypeScript**: `strict: true` モード必須。`any` の使用は原則禁止 [cite: 6378, 6680]。
- [cite_start]**エラーハンドリング**: 期待されるエラーはデータとして返し、予期せぬ例外はロギングして `HttpException` へ変換する [cite: 11597]。
- [cite_start]**命名**: コンポーネントは `PascalCase`、関数/フックは `camelCase` [cite: 6378, 7607]。

### Performance & Security
- [cite_start]**Cloud Run**: コールドスタート防止のため `min-instances: 1` 以上を設定 [cite: 8105]。
- [cite_start]**秘密情報**: Secret Manager を使用し、`.env` ファイルはコミットしない [cite: 6810, 8106]。

---

## 🧠 Memory Bank 運用ルール

[cite_start]AIの「忘却」を防ぐため、`.claude/` またはプロジェクトルートの `memory-bank/` に知識を蓄積してください [cite: 6389, 6954]。

- [cite_start]**progress.md**: 現在の進捗と完了タスクのリスト [cite: 6390, 6917]。
- [cite_start]**decisions.md**: アーキテクチャ決定（ADR形式）の記録 [cite: 6391, 6909]。
- [cite_start]**active_context.md**: 現在集中しているモジュールと直面している課題 [cite: 6390, 6945]。

[cite_start]**Compaction プロトコル**: 大きなタスク完了後、進捗を要約して `memory-bank` を更新し、冗長な会話履歴を破棄してください [cite: 6392, 11378]。

---

## 📞 Human Contact Protocol

[cite_start]以下の場合は即座に作業を停止し、人間に質問してください[cite: 11408, 11453]:
- [cite_start]要件に破壊的な影響を与える可能性がある場合（`rm -rf`, `git push --force` 等） [cite: 6400, 11411]。
- 複数の実装方針があり、判断が分かれる場合。
- セキュリティ上のリスクを発見した場合。
- `BACKLOG.md` に記載のない仕様の矛盾を発見した場合。

---
[cite_start]**このファイルは「生きた文書」です。タスクを通じて得た成功体験や困難は、随時このルールへフィードバックしてください [cite: 6401, 7461]。**
