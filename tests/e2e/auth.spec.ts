import { test, expect } from '@playwright/test';
import { createVerifiedUser, deleteUser, generateTestEmail } from './utils/supabaseAdmin';

const DEFAULT_PASSWORD = process.env.E2E_TEST_PASSWORD || 'Supabase123!';

test.describe('認証E2E', () => {
  test('メールアドレスとパスワードでログインできる', async ({ page }) => {
    const email = generateTestEmail('email-login');
    const user = await createVerifiedUser(email, DEFAULT_PASSWORD);

    try {
      await page.goto('/login');

      await page.getByLabel('メールアドレス').fill(email);
      await page.getByLabel('パスワード').fill(DEFAULT_PASSWORD);
      await page.getByRole('button', { name: 'ログイン' }).click();

      await page.waitForURL('**/', { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { name: 'New Gate' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'ユーザーメニュー' })).toBeVisible();
    } finally {
      await deleteUser(user.id);
    }
  });

  test('GoogleログインボタンでOAuthリクエストが開始される', async ({ page }) => {
    let oauthUrl: string | null = null;

    await page.route('**/auth/v1/authorize**', async (route) => {
      oauthUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>OAuth Stub</body></html>',
      });
    });

    await page.goto('/login');
    await page.getByRole('button', { name: 'Googleでログイン' }).click();

    await expect
      .poll(() => oauthUrl, { message: 'Google OAuthへ遷移するURLが検出できませんでした' })
      .not.toBeNull();

    if (!oauthUrl) {
      throw new Error('OAuthリダイレクトURLの取得に失敗しました');
    }

    expect(oauthUrl).toContain('provider=google');
    expect(oauthUrl).toContain('redirect_to=');

    await page.unroute('**/auth/v1/authorize**');
  });
});
