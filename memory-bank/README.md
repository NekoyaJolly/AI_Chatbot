---
description: "AI長期記憶管理システム - Memory Bank 使用ガイド"
tags: ["memory-bank", "context-management", "compaction"]
version: 1.0.0
last_updated: 2026-02-18
---

# Memory Bank - AI長期記憶管理システム

## 🎯 目的

Memory Bankは、AI開発エージェントの長期記憶を管理し、トークン効率を最大化するためのシステムです。

### 主な利点

1. **コンテキストの永続化**: セッション間でプロジェクト知識を保持
2. **トークン効率の最大化**: 重要な情報のみを圧縮して保存
3. **意思決定の追跡**: 技術的判断の理由と経緯を記録
4. **進捗の可視化**: マイルストーンごとの成果をサマリー化
5. **ポータビリティ**: Markdownベースで任意のAIツール（Cursor、Cline、GitHub Copilot等）間で共有可能

---

## 📁 ディレクトリ構造と役割

```
memory-bank/
├── README.md                    # このファイル - 使用説明書
├── context/                     # プロジェクトコンテキスト（変更頻度: 低）
│   ├── project-overview.md      # プロジェクト全体概要
│   ├── tech-decisions.md        # 技術選定理由サマリー
│   └── business-requirements.md # ビジネス要件サマリー
├── decisions/                   # アーキテクチャ決定記録（ADR形式）
│   ├── 001-*.md                 # ADR: 各技術的意思決定
│   ├── 002-*.md
│   ├── ...
│   └── template.md              # ADR作成用テンプレート
└── progress/                    # 進捗スナップショット（変更頻度: 高）
    ├── initial-structure.md     # 初期構造
    ├── week-N-summary.md        # 週次サマリー
    └── template.md              # 進捗サマリー用テンプレート
```

### ディレクトリ役割詳細

| ディレクトリ | 役割 | 更新頻度 | YAML必須 |
|-------------|------|---------|---------|
| `context/` | プロジェクト不変の情報（技術スタック、ビジネス目標等） | 低（月1回程度） | ✅ |
| `decisions/` | 技術的意思決定の記録（ADR形式） | 中（重要な決定時） | ✅ |
| `progress/` | 進捗スナップショットとタスク完了記録 | 高（週次〜毎日） | ✅ |

---

## 🔄 Compaction（圧縮）プロトコル

### いつ実行するか

| フェーズ | タイミング | 理由 |
|---------|----------|------|
| **Week 1-4** | 各週完了時 | 初期段階は変更が多く、頻繁な整理が必要 |
| **Month 2以降** | 各月完了時 | 安定期に入るため月次で十分 |
| **重大マイルストーン** | MVP完成、β版リリース等 | プロジェクトの節目で知識を統合 |

### 実行手順

#### 1. 進捗サマリー作成

`memory-bank/progress/week-N-summary.md` または `month-N-summary.md` を作成：

```markdown
---
period: Week N | Month N
dates: YYYY-MM-DD ~ YYYY-MM-DD
completed_tasks: X/Y
status: completed | in-progress
---

# Week N 完了サマリー

## 📊 タスク完了状況
| タスクID | タスク名 | 工数 | 完了日 |
|---------|---------|------|--------|
| W1-001  | ...     | 1pt  | 2026-02-18 |

## 🔍 技術的発見
- 重要な学びや発見

## ⚠️ 未解決課題
- 次週に持ち越す課題

## 🎯 次週への引き継ぎ
- 優先タスク

## 📈 KPI達成状況
- 目標値との比較

## 🔗 関連ファイル
- 更新したmemory-bankファイル一覧
```

#### 2. コンテキスト更新

必要に応じて `context/` および `decisions/` を更新：

- **新しいADRの追加**: 重要な技術的決定があった場合
- **tech-decisions.mdの更新**: 技術選定理由の追加や修正
- **project-overview.mdの更新**: ビジネス目標やKPIの変更

#### 3. 会話履歴のクリア

圧縮後、以下を削除して新しいセッションを開始：

- ✅ 冗長な会話履歴
- ✅ 完了したタスクの詳細な議論
- ❌ memory-bankファイル（これらは保持）

#### 4. 人間への報告

Compaction完了時のレポートフォーマット：

```markdown
## 🧠 Memory Bank Compaction 完了報告

**期間**: Week N (YYYY-MM-DD ~ YYYY-MM-DD)
**完了タスク**: X/Y
**総所要時間**: Z時間

### 更新したファイル
- [ ] `memory-bank/progress/week-N-summary.md` (新規作成)
- [ ] `memory-bank/decisions/00X-*.md` (新規作成 or 更新)
- [ ] `memory-bank/context/tech-decisions.md` (更新)

### 技術的ハイライト
- 簡潔な成果のまとめ

### 次週への引き継ぎ事項
- 優先すべきタスク

**承認をお願いします。**
```

---

## 🚀 セッション開始時の使用方法

新しいAI開発セッションを開始する際の推奨読み込み順序：

### 1. YAML Frontmatterのスキャン（Progressive Disclosure）

```bash
# すべてのmemory-bankファイルのFrontmatterを確認
grep -r "^---" memory-bank/ -A 5
```

以下の情報をインデックス化：
- `description`: ファイルの概要
- `tags`: 関連トピック
- `status`: 現在のステータス（ADRの場合）
- `last_updated`: 最終更新日

### 2. タスク関連性の判定

現在のタスクに関連する `tags` を持つファイルのみを完全読み込み：

| タスク例 | 読み込むべきファイル |
|---------|------------------|
| Gemini API統合 | `decisions/001-why-gemini-over-gpt.md` |
| Supabase設定 | `decisions/002-supabase-vs-firebase.md` |
| モノレポ構成変更 | `decisions/003-monorepo-strategy.md` |
| 週次サマリー作成 | `progress/week-N-summary.md` |

### 3. 必読ファイル（常に読み込む）

- ✅ `context/project-overview.md` - プロジェクト全体像の理解
- ✅ `progress/` の最新サマリー - 現在の進捗状況

### 4. オプショナルファイル（必要に応じて読み込む）

- `context/tech-decisions.md` - 技術選定の詳細が必要な場合
- `context/business-requirements.md` - ビジネス要件の確認が必要な場合
- 特定の `decisions/*.md` - 関連するADRがある場合

---

## 🎨 2025-2026年ベストプラクティス統合

### Plan/Actモードの活用

Memory Bankは以下のモードで使い分けます：

#### Planモード（計画フェーズ）
- **読み込み**: `context/` および最新の `progress/`
- **目的**: タスクの全体像を把握し、実装計画を立案
- **出力**: 実装チェックリスト、技術的制約の確認

#### Actモード（実装フェーズ）
- **読み込み**: 関連する `decisions/` のみ
- **目的**: 技術的意思決定に基づいた実装
- **出力**: コード、テスト、ADRの追加

### activeContext概念

`memory-bank/progress/` に `active-context.md` を作成（オプション）：

```markdown
---
description: "現在の焦点と最近の変更"
tags: ["active-context", "current-focus"]
last_updated: 2026-02-18
---

# Active Context

## 現在の焦点
- 取り組み中のタスク: [W1-003] Prisma スキーマ初期定義

## 最近の変更 (過去3日間)
- 2026-02-18: Memory Bank構造を完全構築
- 2026-02-17: AGENTS.md階層を確立
- 2026-02-16: プロジェクト初期化

## 未解決の問題
- Supabase RLS設定の詳細設計待ち

## 次のステップ
- Prisma schema定義完了後、マイグレーション実行
```

### ポータビリティ（AI Tool Agnostic）

Memory Bankは純粋なMarkdownファイルとして設計されており、以下のツール間で共有可能：

- ✅ **GitHub Copilot** (現在使用中)
- ✅ **Cursor** (AI-powered IDE)
- ✅ **Cline** (Claude Code Editor)
- ✅ **任意のLLMベースツール**

移行時の注意点：
1. YAML Frontmatterをサポートしないツールでは、手動でメタデータを解釈
2. ファイルパスは絶対パスで記録（ツール間での互換性向上）
3. 外部リンクは相対パスではなく、リポジトリルートからの相対パスを使用

---

## ✅ ベストプラクティス

### DO（推奨）

- ✅ **簡潔に書く**: 各ファイルは500行以下を目安に
- ✅ **YAML Frontmatterを必ず含める**: メタデータ駆動の読み込みを可能に
- ✅ **定期的にCompactionを実行**: 週次〜月次で情報を整理
- ✅ **ADRには代替案も記録**: 「なぜその選択をしなかったか」も重要
- ✅ **進捗サマリーにはKPIを含める**: 数値で成果を測定

### DON'T（非推奨）

- ❌ **コードを直接貼らない**: コードへの参照（ファイル名と行番号）のみ記録
- ❌ **会話ログを保存しない**: 結論のみを記録
- ❌ **古い情報を放置しない**: 定期的に `last_updated` を更新
- ❌ **秘密情報を含めない**: Memory Bankはリポジトリにコミットされる
- ❌ **一つのファイルに複数の役割を持たせない**: 1ファイル1責任の原則

---

## 🔧 トラブルシューティング

### Q: Compaction後もトークン数が減らない

**A**: 以下を確認：
1. 冗長な会話履歴を削除したか？
2. `progress/` の古いサマリーをアーカイブしたか？
3. `context/` に重複情報がないか？

### Q: どのファイルを読み込むべきか分からない

**A**: 以下の手順で判断：
1. YAML Frontmatterの `tags` を確認
2. 現在のタスクに関連する `tags` を持つファイルを優先
3. `context/project-overview.md` は常に読み込む

### Q: ADRを書くべきか判断できない

**A**: 以下の条件を満たす場合はADRを作成：
- ✅ 複数の選択肢があった（代替案が存在）
- ✅ 決定の影響が大きい（複数モジュールに影響）
- ✅ 将来の開発者が疑問に思う可能性がある

---

## 📚 参考資料

- [ADR (Architecture Decision Records)](https://adr.github.io/)
- [Cline Memory Bank Best Practices](https://github.com/cline/cline)
- [Cursor AI Documentation](https://cursor.sh/docs)
- [AGENTS.md v1.1 Specification](/AGENTS.md)

---

> **このファイルは「生きた文書」です。** Memory Bankの運用を通じて得た知見は、随時このREADMEにフィードバックしてください。
