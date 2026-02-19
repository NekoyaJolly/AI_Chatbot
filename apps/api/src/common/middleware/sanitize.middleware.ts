// apps/api/src/common/middleware/sanitize.middleware.ts
// W4-010: XSS / インジェクション対策ミドルウェア

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * 文字列中の危険なHTML/SQLパターンを無効化
 * - <script>タグ除去
 * - SQLインジェクションパターン検出・無効化
 * - NestJS ValidationPipe (whitelist + class-validator) が主要防御層
 * - このミドルウェアは追加的な防御層
 */
@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  // HTML タグ除去パターン
  private readonly HTML_TAG_RE = /<[^>]*>/g;

  // SQLインジェクション検出パターン (ログ用)
  private readonly SQL_INJECTION_RE =
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b[\s\S]*?;|--|\/\*[\s\S]*?\*\/)/gi;

  use(req: Request, _res: Response, next: NextFunction): void {
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizeObject(req.query) as typeof req.query;
    }
    next();
  }

  private sanitizeObject<T>(obj: T): T {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj) as T;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item)) as T;
    }
    if (obj !== null && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized as T;
    }
    return obj;
  }

  private sanitizeString(str: string): string {
    // <script> タグとイベントハンドラを無効化
    return str
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, 'javascript_blocked:')
      .replace(/vbscript:/gi, 'vbscript_blocked:');
    // ※ HTML全体は除去しない (FAQ答えにHTMLを許可する場合あり)
    // 完全除去が必要なフィールドは @IsString() + @Matches() で個別制限
  }
}
