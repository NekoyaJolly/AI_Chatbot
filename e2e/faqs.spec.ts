// e2e/faqs.spec.ts
// W2-014: FAQ E2E テスト (認証済みセッション前提)

import { test, expect } from '@playwright/test';

test.describe('FAQ 管理', () => {
  // テスト前にログイン状態をセットアップ
  // 実際の運用ではグローバルセットアップで認証トークンをセット
  test.use({ storageState: 'e2e/.auth/user.json' });

  test.skip('FAQ 一覧ページが表示される', async ({ page }) => {
    await page.goto('/dashboard/faqs');

    await expect(page.getByRole('heading', { name: 'FAQ 管理' })).toBeVisible();
    await expect(page.getByRole('button', { name: '+ FAQ を追加' })).toBeVisible();
  });

  test.skip('FAQ を作成できる', async ({ page }) => {
    await page.goto('/dashboard/faqs');

    await page.getByRole('button', { name: '+ FAQ を追加' }).click();

    await page.getByPlaceholder('例: 営業時間はいつですか？').fill('テスト質問');
    await page.getByRole('textbox').nth(1).fill('テスト回答です');

    await page.getByRole('button', { name: '作成' }).click();

    // 一覧に戻り、新しいFAQが表示されること
    await expect(page.getByText('テスト質問')).toBeVisible({ timeout: 5000 });
  });
});
