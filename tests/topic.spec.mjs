import { test, expect } from '@playwright/test';

test('topic page: hero, attribution, body, constellation', async ({ page }) => {
  await page.goto('/pages/topics/gongfu-cha.html');
  await expect(page.locator('.topic-hero-title')).toHaveText(/Gongfu Cha/i);
  await expect(page.locator('.topic-hero-attrib')).toContainText(/Pexels/i);
  await expect(page.locator('.topic-body p').first()).not.toBeEmpty();
  await expect(page.locator('.constellation .constel-card')).toHaveCount(1, { timeout: 5000 }); // related: yixing-clay only
});

test('topic page: hero meta shows place + era', async ({ page }) => {
  await page.goto('/pages/topics/gongfu-cha.html');
  const meta = page.locator('.topic-hero-meta');
  await expect(meta).toContainText(/Fujian/);
  await expect(meta).toContainText(/1700/);
});

test('topic page: body has at least 3 paragraphs', async ({ page }) => {
  await page.goto('/pages/topics/sea-silk.html');
  const ps = page.locator('.topic-body p');
  expect(await ps.count()).toBeGreaterThanOrEqual(3);
});
