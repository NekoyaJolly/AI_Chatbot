// apps/api/src/faqs/faqs.service.ts
// W2-005: FAQ CRUD サービス

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmbeddingsService } from './embeddings.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { SearchFaqDto } from './dto/search-faq.dto';
import { BulkImportFaqDto, BulkImportResult } from './dto/bulk-import.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FaqsService {
  private readonly logger = new Logger(FaqsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  /**
   * FAQ 作成 (埋め込みベクトル自動生成)
   */
  async create(tenantId: string, dto: CreateFaqDto) {
    // 埋め込みベクトル生成 (Gemini API)
    let embeddingData: Prisma.InputJsonValue | undefined;
    try {
      const embedding = await this.embeddingsService.generateFaqEmbedding(dto.question, dto.answer);
      embeddingData = embedding as unknown as Prisma.InputJsonValue;
    } catch (error) {
      this.logger.warn(`埋め込み生成スキップ (FAQ作成続行): ${error instanceof Error ? error.message : String(error)}`);
    }

    return this.prisma.tenantFaq.create({
      data: {
        tenantId,
        question: dto.question,
        answer: dto.answer,
        tags: dto.tags ?? [],
        category: dto.category ?? 'general',
        embedding: embeddingData,
        isActive: true,
      },
    });
  }

  /**
   * FAQ 一覧取得 (ページネーション + フィルタ)
   */
  async findAll(tenantId: string, query: SearchFaqDto) {
    const { q, category, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TenantFaqWhereInput = {
      tenantId,
      ...(category && { category }),
      ...(isActive !== undefined && { isActive }),
      ...(q && {
        OR: [
          { question: { contains: q, mode: 'insensitive' } },
          { answer: { contains: q, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.tenantFaq.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          question: true,
          answer: true,
          tags: true,
          category: true,
          isActive: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.tenantFaq.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * FAQ 1件取得
   */
  async findOne(tenantId: string, id: string) {
    const faq = await this.prisma.tenantFaq.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        question: true,
        answer: true,
        tags: true,
        category: true,
        isActive: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!faq) {
      throw new NotFoundException(`FAQ ID: ${id} が見つかりません`);
    }

    if (faq.tenantId !== tenantId) {
      throw new ForbiddenException('このリソースへのアクセス権がありません');
    }

    return faq;
  }

  /**
   * FAQ 更新 (埋め込み再生成)
   */
  async update(tenantId: string, id: string, dto: UpdateFaqDto) {
    await this.findOne(tenantId, id); // 存在確認 + テナント確認

    const updateData: Prisma.TenantFaqUpdateInput = {};
    if (dto.question !== undefined) updateData.question = dto.question;
    if (dto.answer !== undefined) updateData.answer = dto.answer;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    // 質問または回答が更新された場合、埋め込みを再生成
    if (dto.question !== undefined || dto.answer !== undefined) {
      const current = await this.prisma.tenantFaq.findUnique({ where: { id } });
      if (current) {
        const question = dto.question ?? current.question;
        const answer = dto.answer ?? current.answer;
        try {
          const embedding = await this.embeddingsService.generateFaqEmbedding(question, answer);
          updateData.embedding = embedding as unknown as Prisma.InputJsonValue;
        } catch (error) {
          this.logger.warn(`埋め込み再生成スキップ: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return this.prisma.tenantFaq.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        question: true,
        answer: true,
        tags: true,
        category: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * FAQ 削除
   */
  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id); // 存在確認 + テナント確認
    await this.prisma.tenantFaq.delete({ where: { id } });
    return { message: 'FAQが削除されました', id };
  }

  /**
   * CSV 一括インポート (W2-009)
   */
  async bulkImport(tenantId: string, dto: BulkImportFaqDto): Promise<BulkImportResult> {
    const result: BulkImportResult = { imported: 0, failed: 0, errors: [] };

    for (let i = 0; i < dto.faqs.length; i++) {
      const faqDto = dto.faqs[i];
      if (!faqDto) continue;
      try {
        await this.create(tenantId, faqDto);
        result.imported++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          index: i,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result;
  }

  /**
   * ベクトル類似度検索 (pgvector)
   * Week 3 で本実装 - 現在はテキスト検索にフォールバック
   */
  async vectorSearch(tenantId: string, query: string, limit = 5) {
    // TODO: Week 3 で pgvector cosine similarity 検索に切り替え
    // 現状はテキスト全文検索でフォールバック
    return this.findAll(tenantId, { q: query, isActive: true, limit, page: 1 });
  }
}
