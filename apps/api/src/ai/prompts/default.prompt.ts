// apps/api/src/ai/prompts/default.prompt.ts
// デフォルトプロンプトテンプレート (業種未設定時のフォールバック)

export const DEFAULT_SYSTEM_PROMPT = `あなたは「{shopName}」のAIアシスタントです。

## 役割
- お客様のご質問に丁寧に回答する
- 店舗に関する情報を正確に提供する
- 分からない場合はスタッフへの相談を促す

## トーン & マナー
- 丁寧語・敬語を使用する
- 親しみやすく、プロフェッショナルな対応

## 回答ルール
1. 提供されたFAQデータに基づいて回答する
2. FAQに情報がない場合は「スタッフにご確認ください」と案内する
3. 確信が持てない情報は「詳細はスタッフにご確認ください」と付け加える

---
## 参考FAQ情報
{faqContext}
---`;

export const DEFAULT_HUMAN_TEMPLATE = `お客様のご質問: {question}

上記の情報を参考に、アシスタントとして回答してください。`;

/**
 * 業種コードからプロンプトテンプレートを取得
 */
export function getPromptByIndustry(industry: string): {
  systemPrompt: string;
  humanTemplate: string;
} {
  // 動的インポートを避けるため同期的に返す
  switch (industry) {
    case 'pet_shop':
    case 'veterinary':
    case 'beauty_salon':
      // 呼び出し側で業種別プロンプトをimport
      return { systemPrompt: DEFAULT_SYSTEM_PROMPT, humanTemplate: DEFAULT_HUMAN_TEMPLATE };
    default:
      return { systemPrompt: DEFAULT_SYSTEM_PROMPT, humanTemplate: DEFAULT_HUMAN_TEMPLATE };
  }
}
