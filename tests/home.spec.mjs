import { test, expect } from './_fixtures.mjs';

test('home renders mosaic with all topics', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.home-hero-title')).toBeVisible();
  const tiles = page.locator('.tile');
  expect(await tiles.count()).toBeGreaterThanOrEqual(10);
  for (const t of (await tiles.all()).slice(0, 5)) {
    await expect(t.locator('.tile-title')).not.toBeEmpty();
  }
});

test('home: pillar strip renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.pillar-card')).toHaveCount(4);
  await expect(page.locator('.pillar-card-title').first()).not.toBeEmpty();
});

test('home: no console errors, no 404s on essential resources', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  const failed = [];
  page.on('response', r => {
    if (r.status() >= 400 && new URL(r.url()).origin === 'http://localhost:8181') {
      failed.push(`${r.status()} ${r.url()}`);
    }
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});

test('topnav theme toggle flips the data-theme attribute', async ({ page }) => {
  await page.goto('/');
  const initial = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.locator('#theme-toggle').click();
  const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(after).not.toBe(initial);
});

test('Cmd-K opens the search palette', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.keyboard.press('Meta+k');
  await expect(page.locator('#search-palette')).toHaveAttribute('open', '');
  await page.locator('#search-input').fill('tea');
  await expect(page.locator('.search-result').first()).toBeVisible();
});
