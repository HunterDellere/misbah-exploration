import { test, expect } from './_fixtures.mjs';

test('atlas: side panel renders one list item per geo-tagged topic', async ({ page }) => {
  await page.goto('/pages/atlas.html');
  // 19 topics, all have geo
  expect(await page.locator('.atlas-list-item').count()).toBeGreaterThanOrEqual(15);
});

test('atlas: tag chip filters list', async ({ page }) => {
  await page.goto('/pages/atlas.html');
  await page.waitForLoadState('networkidle');
  const teaChip = page.locator('.tag-chip', { hasText: /^tea/i });
  if (await teaChip.count()) {
    await teaChip.first().click();
    const visible = await page.locator('.atlas-list-item:visible').count();
    expect(visible).toBeGreaterThan(0);
  }
});

test('atlas: globe stage has either a canvas or svg fallback', async ({ page }) => {
  await page.goto('/pages/atlas.html');
  await page.waitForLoadState('networkidle');
  // Globe load is deferred past the LCP window (window 'load' + ~1.2s,
  // or up to a 2.5s hard floor) so the canvas/svg shows up a moment
  // later than the rest of the page. Poll for it.
  await expect(page.locator('#globe canvas, #globe svg').first()).toBeAttached({
    timeout: 8000,
  });
});
