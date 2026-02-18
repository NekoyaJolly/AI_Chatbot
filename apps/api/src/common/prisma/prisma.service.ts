// apps/api/src/common/prisma/prisma.service.ts
// W2-010: Prisma サービス (RLS ミドルウェア付き)

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private currentTenantId: string | null = null;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // W2-010: Row-Level Security ミドルウェア
    // テナントスコープ対象モデルに自動的にtenantIdフィルタを追加
    const tenantScopedModels = ['tenantFaq', 'chatSession', 'chatMessage', 'tenantUser'] as const;

    for (const model of tenantScopedModels) {
      (this as unknown as Record<string, { $use: (fn: unknown) => void }>)[model]?.$use(
        async (params: {
          action: string;
          args: Record<string, unknown>;
          model?: string;
        }, next: (params: unknown) => Promise<unknown>) => {
          if (this.currentTenantId) {
            const readActions = ['findFirst', 'findMany', 'findUnique', 'count', 'aggregate'];
            const writeActions = ['create', 'createMany'];
            const mutationActions = ['update', 'updateMany', 'delete', 'deleteMany', 'upsert'];

            if (readActions.includes(params.action)) {
              params.args.where = {
                ...(params.args.where as Record<string, unknown> ?? {}),
                tenantId: this.currentTenantId,
              };
            } else if (writeActions.includes(params.action)) {
              if (params.action === 'create') {
                params.args.data = {
                  ...(params.args.data as Record<string, unknown> ?? {}),
                  tenantId: this.currentTenantId,
                };
              }
            } else if (mutationActions.includes(params.action)) {
              params.args.where = {
                ...(params.args.where as Record<string, unknown> ?? {}),
                tenantId: this.currentTenantId,
              };
            }
          }
          return next(params);
        },
      );
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * テナントコンテキストを設定してコールバックを実行
   * W2-010: RLS の runInTenantContext ヘルパー
   */
  async runInTenantContext<T>(tenantId: string, callback: () => Promise<T>): Promise<T> {
    const previousTenantId = this.currentTenantId;
    this.currentTenantId = tenantId;
    try {
      return await callback();
    } finally {
      this.currentTenantId = previousTenantId;
    }
  }

  setTenantId(tenantId: string | null) {
    this.currentTenantId = tenantId;
  }
}
