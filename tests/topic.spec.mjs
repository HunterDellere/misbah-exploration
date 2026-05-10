import { test, expect } from './_fixtures.mjs';

test('topic page: hero, attribution, body, breadcrumbs', async ({ page }) => {
  await page.goto('/pages/topics/gongfu-cha.html');
  await expect(page.locator('.topic-hero-title')).toHaveText(/Gongfu Cha/i);
  await expect(page.locator('.topic-hero-attrib')).toContainText(/Wikimedia/i);
  await expect(page.locator('.topic-body p').first()).not.toBeEmpty();
  await expect(page.locator('.breadcrumbs')).toContainText(/Tea/);
});

test('topic page: pillar nav has prev and next', async ({ page }) => {
  // gongfu-cha is order 4 in tea pillar (1 camellia, 2 processing, 3 empire, 4 gongfu, 5 yixing, 6 japanese)
  await page.goto('/pages/topics/gongfu-cha.html');
  await expect(page.locator('.pillar-nav-prev')).toBeVisible();
  await expect(page.locator('.pillar-nav-next')).toBeVisible();
});

test('topic page: long essays show TOC', async ({ page, viewport }) => {
  // TOC is hidden at <1100px by design (mobile + tablet)
  test.skip((viewport?.width ?? 0) < 1100, 'TOC is hidden on narrow viewports by design');
  await page.goto('/pages/topics/origins-of-anthropology.html');
  await expect(page.locator('.toc')).toBeVisible();
  expect(await page.locator('.toc-list a').count()).toBeGreaterThanOrEqual(3);
});

test('topic page: drop-cap class applied to first paragraph', async ({ page }) => {
  await page.goto('/pages/topics/origins-of-anthropology.html');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.read-column .drop-cap').first()).toBeVisible();
});
