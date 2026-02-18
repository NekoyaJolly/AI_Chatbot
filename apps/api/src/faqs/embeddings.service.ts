// apps/api/src/faqs/embeddings.service.ts
// W2-006: 埋め込み生成サービス (Gemini Embedding API)

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const EMBEDDING_MODEL = 'text-embedding-004';
const MAX_BATCH_SIZE = 100;

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY', '');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  }

  /**
   * テキスト1件の埋め込みベクトルを生成
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      this.logger.error(`埋め込み生成失敗: ${error instanceof Error ? error.message : String(error)}`);
      // レート制限エラーは再スロー
      throw error;
    }
  }

  /**
   * FAQ の question + answer を結合して埋め込み生成
   */
  async generateFaqEmbedding(question: string, answer: string): Promise<number[]> {
    const text = `質問: ${question}\n回答: ${answer}`;
    return this.generateEmbedding(text);
  }

  /**
   * バッチ埋め込み生成 (最大100件、レート制限対応)
   */
  async generateBatchEmbeddings(
    texts: string[],
    onProgress?: (completed: number, total: number) => void,
  ): Promise<Array<{ text: string; embedding: number[] | null; error?: string }>> {
    const results: Array<{ text: string; embedding: number[] | null; error?: string }> = [];
    const batches = this.chunkArray(texts, MAX_BATCH_SIZE);

    let completed = 0;
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map((text) => this.generateEmbedding(text)),
      );

      for (let i = 0; i < batch.length; i++) {
        const result = batchResults[i];
        if (result.status === 'fulfilled') {
          results.push({ text: batch[i]!, embedding: result.value });
        } else {
          results.push({
            text: batch[i]!,
            embedding: null,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });
        }
        completed++;
      }

      if (onProgress) {
        onProgress(completed, texts.length);
      }

      // レート制限回避: バッチ間に少し待機
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.sleep(100);
      }
    }

    return results;
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
