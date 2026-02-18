// apps/web/auth.ts
// NextAuth.js v5 (Auth.js) - メイン設定ファイル

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('メールアドレスとパスワードを入力してください');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            tenants: {
              include: { tenant: true },
              where: { tenant: { status: 'active' } },
            },
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error('メールアドレスまたはパスワードが正しくありません');
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash,
        );
        if (!isValid) {
          throw new Error('メールアドレスまたはパスワードが正しくありません');
        }

        const ownerTenant = user.tenants.find((t: { role: string }) => t.role === 'owner');
        const defaultTenant = ownerTenant?.tenant ?? user.tenants[0]?.tenant;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar ?? null,
          tenantId: defaultTenant?.id ?? null,
          tenantName: defaultTenant?.name ?? null,
          role: user.tenants[0]?.role ?? null,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = (user as { tenantId?: string }).tenantId ?? null;
        token.tenantName = (user as { tenantName?: string }).tenantName ?? null;
        token.role = (user as { role?: string }).role ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { tenantId?: string }).tenantId = token.tenantId as string;
        (session.user as { tenantName?: string }).tenantName = token.tenantName as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
});
