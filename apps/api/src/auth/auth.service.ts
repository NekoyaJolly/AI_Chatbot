// apps/api/src/auth/auth.service.ts
// W2-003: NestJS 認証モジュール

import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string | null;
  role: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    tenantId: string | null;
    tenantName: string | null;
    role: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 新規ユーザー登録 & テナント作成
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    // メール重複チェック
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('このメールアドレスは既に登録されています');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // トランザクション: ユーザー + テナント + TenantUser 作成
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
        },
      });

      const tenantName = dto.tenantName ?? `${dto.name}のテナント`;
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          industry: dto.industry ?? 'general',
          status: 'active',
        },
      });

      await tx.tenantUser.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: 'owner',
        },
      });

      return { user, tenant };
    });

    const payload: JwtPayload = {
      sub: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
      role: 'owner',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        tenantId: result.tenant.id,
        tenantName: result.tenant.name,
        role: 'owner',
      },
    };
  }

  /**
   * ログイン認証
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        tenants: {
          include: { tenant: true },
          where: { tenant: { status: 'active' } },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('メールアドレスまたはパスワードが正しくありません');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('メールアドレスまたはパスワードが正しくありません');
    }

    const ownerTenant = user.tenants.find((t) => t.role === 'owner');
    const defaultTenantUser = ownerTenant ?? user.tenants[0];
    const defaultTenant = defaultTenantUser?.tenant;

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: defaultTenant?.id ?? null,
      role: defaultTenantUser?.role ?? null,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: defaultTenant?.id ?? null,
        tenantName: defaultTenant?.name ?? null,
        role: defaultTenantUser?.role ?? null,
      },
    };
  }

  /**
   * JWT ペイロードからユーザー情報を取得 (JwtStrategy 用)
   */
  async validateJwtPayload(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('ユーザーが見つかりません');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: payload.tenantId,
      role: payload.role,
    };
  }
}
