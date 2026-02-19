// apps/api/src/ai/ai.service.ts
// W3-001: AI応答生成サービス (Gemini + Langchain RAG)

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmbeddingsService } from '../faqs/embeddings.service';

// 業種別プロンプト
import { PET_SHOP_SYSTEM_PROMPT, PET_SHOP_HUMAN_TEMPLATE } from './prompts/pet-shop.prompt';
import { BEAUTY_SALON_SYSTEM_PROMPT, BEAUTY_SALON_HUMAN_TEMPLATE } from './prompts/beauty-salon.prompt';
import { VETERINARY_SYSTEM_PROMPT, VETERINARY_HUMAN_TEMPLATE } from './prompts/veterinary.prompt';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_HUMAN_TEMPLATE } from './prompts/default.prompt';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiResponse {
  answer: string;
  confidence: number;         // 0.0 ~ 1.0
  shouldEscalate: boolean;
  escalationReason?: string;
  matchedFaqs: Array<{ question: string; answer: string; similarity?: number }>;
  tokensUsed?: number;
  responseTimeMs: number;
}

const ESCALATION_KEYWORDS = [
  '緊急', '危険', '死', '血', '痙攣', '呼吸困難',
  'クレーム', '苦情', '返金', '法的', '弁護士',
  '手術', '入院', '処方', '診断',
];

const LOW_CONFIDENCE_THRESHOLD = 0.6;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly llm: ChatGoogleGenerativeAI;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService,
  ) {
    this.llm = new ChatGoogleGenerativeAI({
      apiKey: this.config.get<string>('GEMINI_API_KEY', ''),
      model: 'gemini-2.0-flash',
      temperature: 0.3,
      maxOutputTokens: 512,
    });
  }

  /**
   * FAQ検索 → LLM推論 → 応答生成 (RAG)
   */
  async generateResponse(
    tenantId: string,
    question: string,
    conversationHistory: ChatMessage[] = [],
  ): Promise<AiResponse> {
    const startTime = Date.now();

    // 1. テナント情報取得 (業種・店舗名)
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    const industry = tenant?.industry ?? 'general';
    const shopName = tenant?.name ?? 'お店';

    // 2. FAQ検索 (テキストベース検索、pgvector利用可能時はベクトル検索)
    const matchedFaqs = await this.searchRelatedFaqs(tenantId, question);

    // 3. FAQ コンテキスト構築
    const faqContext = this.buildFaqContext(matchedFaqs);

    // 4. 業種別プロンプト選択
    const { systemPrompt, humanTemplate } = this.selectPrompt(industry);

    // 5. プロンプト変数展開
    const systemContent = systemPrompt
      .replace('{shopName}', shopName)
      .replace('{faqContext}', faqContext || 'FAQ情報なし');

    const humanContent = humanTemplate.replace('{question}', question);

    // 6. 会話履歴を含むメッセージ構築
    const messages = [
      new SystemMessage(systemContent),
      ...conversationHistory.slice(-6).map((msg) =>
        msg.role === 'user'
          ? new HumanMessage(msg.content)
          : new SystemMessage(`アシスタント: ${msg.content}`),
      ),
      new HumanMessage(humanContent),
    ];

    // 7. LLM呼び出し
    let answer = '';
    let tokensUsed: number | undefined;
    try {
      const result = await this.llm.invoke(messages);
      answer = typeof result.content === 'string'
        ? result.content
        : Array.isArray(result.content)
          ? result.content.map((c) => (typeof c === 'string' ? c : '')).join('')
          : '';
      tokensUsed = (result.response_metadata?.usageMetadata as { totalTokenCount?: number } | undefined)?.totalTokenCount;
    } catch (error) {
      this.logger.error(`LLM呼び出しエラー: ${error instanceof Error ? error.message : String(error)}`);
      // フォールバック: FAQから直接回答
      answer = matchedFaqs[0]
        ? matchedFaqs[0].answer
        : 'ただいまシステムに問題が発生しています。スタッフにお問い合わせください。';
    }

    // 8. 信頼度スコア算出
    const confidence = this.calculateConfidence(matchedFaqs, answer);

    // 9. エスカレーション判定
    const { shouldEscalate, escalationReason } = this.detectEscalation(
      question,
      answer,
      confidence,
    );

    const responseTimeMs = Date.now() - startTime;
    this.logger.log(
      `AI応答生成完了: tenant=${tenantId}, time=${responseTimeMs}ms, confidence=${confidence.toFixed(2)}, escalate=${shouldEscalate}`,
    );

    return {
      answer,
      confidence,
      shouldEscalate,
      escalationReason,
      matchedFaqs: matchedFaqs.map((f) => ({
        question: f.question,
        answer: f.answer,
        similarity: f.similarity,
      })),
      tokensUsed,
      responseTimeMs,
    };
  }

  /**
   * FAQ テキスト検索 (pgvector が使えない環境でも動作)
   */
  private async searchRelatedFaqs(
    tenantId: string,
    query: string,
    limit = 3,
  ): Promise<Array<{ question: string; answer: string; similarity?: number }>> {
    // テキスト検索
    const results = await this.prisma.tenantFaq.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { question: { contains: query, mode: 'insensitive' } },
          { answer: { contains: query, mode: 'insensitive' } },
          // キーワード分割検索
          ...query
            .split(/[\s　、。]+/)
            .filter((w) => w.length >= 2)
            .slice(0, 3)
            .map((word) => ({
              OR: [
                { question: { contains: word, mode: 'insensitive' as const } },
                { answer: { contains: word, mode: 'insensitive' as const } },
              ],
            })),
        ],
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
      select: { question: true, answer: true },
    });

    return results;
  }

  /**
   * FAQ コンテキスト文字列を構築
   */
  private buildFaqContext(
    faqs: Array<{ question: string; answer: string; similarity?: number }>,
  ): string {
    if (faqs.length === 0) return '';
    return faqs
      .map((f, i) => `[FAQ${i + 1}]\nQ: ${f.question}\nA: ${f.answer}`)
      .join('\n\n');
  }

  /**
   * 業種別プロンプトを選択
   */
  private selectPrompt(industry: string): {
    systemPrompt: string;
    humanTemplate: string;
  } {
    switch (industry) {
      case 'pet_shop':
        return { systemPrompt: PET_SHOP_SYSTEM_PROMPT, humanTemplate: PET_SHOP_HUMAN_TEMPLATE };
      case 'beauty_salon':
        return { systemPrompt: BEAUTY_SALON_SYSTEM_PROMPT, humanTemplate: BEAUTY_SALON_HUMAN_TEMPLATE };
      case 'veterinary':
        return { systemPrompt: VETERINARY_SYSTEM_PROMPT, humanTemplate: VETERINARY_HUMAN_TEMPLATE };
      default:
        return { systemPrompt: DEFAULT_SYSTEM_PROMPT, humanTemplate: DEFAULT_HUMAN_TEMPLATE };
    }
  }

  /**
   * 信頼度スコア算出
   * - FAQ マッチ数に基づいてスコア計算
   */
  private calculateConfidence(
    faqs: Array<{ question: string; answer: string; similarity?: number }>,
    answer: string,
  ): number {
    if (faqs.length === 0) return 0.3;

    // FAQ が多く見つかるほど信頼度高
    const faqScore = Math.min(faqs.length / 3, 1.0) * 0.6;

    // 回答にFAQの内容が含まれているか
    const contentScore = faqs.some(
      (f) => answer.includes(f.answer.substring(0, 20)),
    )
      ? 0.4
      : 0.2;

    return Math.min(faqScore + contentScore, 1.0);
  }

  /**
   * エスカレーション判定
   */
  private detectEscalation(
    question: string,
    answer: string,
    confidence: number,
  ): { shouldEscalate: boolean; escalationReason?: string } {
    // キーワードチェック
    const allText = `${question} ${answer}`.toLowerCase();
    const matchedKeyword = ESCALATION_KEYWORDS.find((k) => allText.includes(k));
    if (matchedKeyword) {
      return {
        shouldEscalate: true,
        escalationReason: `エスカレーションキーワード検出: "${matchedKeyword}"`,
      };
    }

    // 低信頼度
    if (confidence < LOW_CONFIDENCE_THRESHOLD) {
      return {
        shouldEscalate: true,
        escalationReason: `信頼度が低い (${(confidence * 100).toFixed(0)}%)`,
      };
    }

    return { shouldEscalate: false };
  }
}
