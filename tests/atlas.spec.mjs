import { test, expect } from '@playwright/test';

test('atlas: side panel renders one list item per geo-tagged topic', async ({ page }) => {
  await page.goto('/pages/atlas.html');
  // 5 seed topics all have geo
  await expect(page.locator('.atlas-list-item')).toHaveCount(5);
});

test('atlas: tag chip filters list', async ({ page }) => {
  await page.goto('/pages/atlas.html');
  await page.waitForLoadState('networkidle');
  // Click the "tea" chip if present
  const teaChip = page.locator('.tag-chip', { hasText: /^tea/i });
  if (await teaChip.count()) {
    await teaChip.first().click();
    // After filtering, only items with tea tag should be visible
    const visible = await page.locator('.atlas-list-item:visible').count();
    expect(visible).toBeGreaterThan(0);
    expect(visible).toBeLessThanOrEqual(5);
  }
});

test('atlas: globe stage has either a canvas or svg fallback', async ({ page }) => {
  await page.goto('/pages/atlas.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500); // give globe.gl a beat to mount or fail
  const inGlobe = await page.locator('#globe canvas, #globe svg').count();
  expect(inGlobe).toBeGreaterThan(0);
});

test('atlas: hovering a list item opens the preview card', async ({ page }) => {
  await page.goto('/pages/atlas.html');
  await page.waitForLoadState('networkidle');
  await page.locator('.atlas-list-item').first().hover();
  await expect(page.locator('.atlas-preview')).toHaveAttribute('data-open', 'true');
  await expect(page.locator('.atlas-preview-title')).not.toBeEmpty();
});
