# apps/api/Dockerfile
# W4-deploy: GCP Cloud Run 用 マルチステージビルド
# ベースイメージ: node:22-slim (セキュリティ最小化)

# ─── Stage 1: ベースイメージ ──────────────────────────────────────────────────
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.4.0 --activate

# ─── Stage 2: 依存関係インストール ────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

# モノレポルートの設定ファイルをコピー
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/langchain/package.json ./packages/langchain/

# 本番依存関係のみインストール
RUN pnpm install --frozen-lockfile --prod=false

# ─── Stage 3: ビルド ──────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules 2>/dev/null || true
COPY --from=deps /app/packages ./packages
COPY . .

# Prisma クライアント生成
RUN cd packages/database && npx prisma generate

# API ビルド
RUN cd apps/api && npx nest build

# ─── Stage 4: 本番イメージ ────────────────────────────────────────────────────
FROM node:22-slim AS production
WORKDIR /app

# セキュリティ: 非rootユーザー
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nestjs

# 必要なファイルのみコピー
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/database/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./package.json

# Prisma 本番クライアント
RUN npx prisma generate 2>/dev/null || true

USER nestjs

# Cloud Run: 8080ポートを使用
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

CMD ["node", "dist/main"]
