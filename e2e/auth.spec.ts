// e2e/auth.spec.ts
// W2-014: 認証 E2E テスト

import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible();
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('無効なメールアドレスでログイン失敗', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('メールアドレス').fill('invalid@example.com');
    await page.getByLabel('パスワード').fill('wrongpassword');
    await page.getByRole('button', { name: 'ログイン' }).click();

    // エラーメッセージが表示されること
    await expect(
      page.getByText('メールアドレスまたはパスワードが正しくありません'),
    ).toBeVisible({ timeout: 5000 });
  });

  test('新規登録ページが表示される', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.getByRole('heading', { name: '新規登録' })).toBeVisible();
    await expect(page.getByLabel('お名前')).toBeVisible();
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
  });

  test('未認証でダッシュボードにアクセスするとリダイレクト', async ({ page }) => {
    await page.goto('/dashboard');

    // ログインページにリダイレクトされること
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
