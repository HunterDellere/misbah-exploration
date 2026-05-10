import { test, expect } from '@playwright/test';

test('topic page: hero, attribution, body, breadcrumbs', async ({ page }) => {
  await page.goto('/pages/topics/gongfu-cha.html');
  await expect(page.locator('.topic-hero-title')).toHaveText(/Gongfu Cha/i);
  await expect(page.locator('.topic-hero-attrib')).toContainText(/Pexels/i);
  await expect(page.locator('.topic-body p').first()).not.toBeEmpty();
  await expect(page.locator('.breadcrumbs')).toContainText(/Tea/);
});

test('topic page: pillar nav has prev and next', async ({ page }) => {
  // gongfu-cha is order 4 in tea pillar (1 camellia, 2 processing, 3 empire, 4 gongfu, 5 yixing, 6 japanese)
  await page.goto('/pages/topics/gongfu-cha.html');
  await expect(page.locator('.pillar-nav-prev')).toBeVisible();
  await expect(page.locator('.pillar-nav-next')).toBeVisible();
});

test('topic page: long essays show TOC', async ({ page }) => {
  await page.goto('/pages/topics/origins-of-anthropology.html');
  // TOC only renders at >=1100px width; default desktop test uses 1280
  await expect(page.locator('.toc')).toBeVisible();
  expect(await page.locator('.toc-list a').count()).toBeGreaterThanOrEqual(3);
});

test('topic page: drop-cap class applied to first paragraph', async ({ page }) => {
  await page.goto('/pages/topics/origins-of-anthropology.html');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.read-column .drop-cap').first()).toBeVisible();
});
