// packages/database/src/index.ts
// Prisma Client エクスポート

export { PrismaClient, Prisma } from '@prisma/client';
export type {
  User,
  Tenant,
  TenantUser,
  FaqTemplate,
  TenantFaq,
  ChatSession,
  ChatMessage,
  TenantTemplate,
} from '@prisma/client';

// シングルトンPrismaクライアント (開発環境でのホットリロード対策)
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
