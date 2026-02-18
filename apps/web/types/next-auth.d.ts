// apps/web/types/next-auth.d.ts
// NextAuth.js v5 型定義拡張

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      tenantId?: string;
      tenantName?: string;
      role?: string;
    };
  }

  interface User {
    id?: string;
    tenantId?: string | null;
    tenantName?: string | null;
    role?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    tenantId?: string | null;
    tenantName?: string | null;
    role?: string | null;
  }
}
