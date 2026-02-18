// packages/database/scripts/test-gemini.ts
// W1-004: Gemini API 動作確認スクリプト
// 実行: pnpm tsx scripts/test-gemini.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY が設定されていません');
  console.error('   .env.local に GEMINI_API_KEY=your_key を設定してください');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface TestCase {
  name: string;
  prompt: string;
}

async function testGemini(): Promise<void> {
  console.log('🧪 Gemini API 動作確認テスト\n');
  console.log('━'.repeat(60));

  // gemini-2.0-flash-exp または gemini-1.5-flash を試みる
  const modelName = 'gemini-2.0-flash-exp';
  console.log(`📌 使用モデル: ${modelName}\n`);

  const model = genAI.getGenerativeModel({ model: modelName });

  const testCases: TestCase[] = [
    {
      name: '基本応答テスト',
      prompt: 'ペットショップの営業時間を聞かれた場合、どのように答えればよいですか？',
    },
    {
      name: '日本語精度テスト',
      prompt: '犬のトイレトレーニングについて、初心者に分かりやすく説明してください。',
    },
    {
      name: '長文生成テスト',
      prompt:
        'ペットショップで扱う犬種トップ5を紹介し、それぞれの特徴を200文字以内で説明してください。',
    },
  ];

  const results: { name: string; elapsed: number; success: boolean; tokens?: number }[] = [];

  for (const testCase of testCases) {
    console.log(`\n📝 ${testCase.name}`);
    console.log(`プロンプト: ${testCase.prompt}`);
    console.log('─'.repeat(40));

    const startTime = Date.now();

    try {
      const result = await model.generateContent(testCase.prompt);
      const response = result.response;
      const text = response.text();

      const elapsed = Date.now() - startTime;
      const totalTokens = response.usageMetadata?.totalTokenCount;

      console.log(`✅ 応答成功 (${elapsed}ms)`);
      if (totalTokens) {
        console.log(`📊 トークン使用量: ${totalTokens}`);
      }
      console.log(`💬 応答 (先頭200文字):\n${text.substring(0, 200)}...\n`);

      // パフォーマンス評価
      if (elapsed < 2000) {
        console.log(`⚡ 評価: 高速 (<2秒)`);
      } else if (elapsed < 3000) {
        console.log(`🟡 評価: やや遅い (2-3秒)`);
      } else {
        console.log(`🔴 評価: 遅い (>3秒) - 本番環境では最適化検討`);
      }

      results.push({ name: testCase.name, elapsed, success: true, tokens: totalTokens });
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`❌ エラー:`, error);
      results.push({ name: testCase.name, elapsed, success: false });
    }
  }

  // サマリー
  console.log('\n' + '━'.repeat(60));
  console.log('📊 テスト結果サマリー\n');

  const successCount = results.filter((r) => r.success).length;
  const avgElapsed =
    results.filter((r) => r.success).reduce((sum, r) => sum + r.elapsed, 0) / successCount || 0;

  results.forEach((r) => {
    const status = r.success ? '✅' : '❌';
    const time = r.success ? `${r.elapsed}ms` : 'FAILED';
    const tokens = r.tokens ? ` (${r.tokens} tokens)` : '';
    console.log(`  ${status} ${r.name}: ${time}${tokens}`);
  });

  console.log(`\n  📈 成功率: ${successCount}/${results.length}`);
  console.log(`  ⏱  平均応答時間: ${Math.round(avgElapsed)}ms`);

  if (successCount === results.length) {
    console.log('\n✅ 全テスト成功 - Gemini API は正常に動作しています');
  } else {
    console.log('\n⚠️  一部テスト失敗 - 上記エラーを確認してください');
    process.exit(1);
  }
}

testGemini().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
