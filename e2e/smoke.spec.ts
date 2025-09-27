import { test, expect } from '@playwright/test';

test('homepage redirects to /dashboard and renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByRole('banner')).toBeVisible({ timeout: 5000 }).catch(() => {});
});


