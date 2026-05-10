import { test, expect } from './_fixtures.mjs';

test('pillar hub: anthropology lists 5 children in order', async ({ page }) => {
  await page.goto('/pages/pillars/anthropology.html');
  await expect(page.locator('.pillar-hero-title')).toContainText(/Anthropology/);
  await expect(page.locator('.pillar-child')).toHaveCount(5);
  // The first child should be origins-of-anthropology
  const firstHref = await page.locator('.pillar-child').first().getAttribute('href');
  expect(firstHref).toMatch(/origins-of-anthropology/);
});

test('pillar hub: tea has 6 essays', async ({ page }) => {
  await page.goto('/pages/pillars/tea.html');
  await expect(page.locator('.pillar-child')).toHaveCount(6);
});

test('pillar hub: cartography has 5 essays', async ({ page }) => {
  await page.goto('/pages/pillars/cartography.html');
  await expect(page.locator('.pillar-child')).toHaveCount(5);
});

test('tags page: renders tag cloud and sections', async ({ page }) => {
  await page.goto('/pages/tags.html');
  expect(await page.locator('.tag-cloud-chip').count()).toBeGreaterThan(5);
  expect(await page.locator('.tag-section').count()).toBeGreaterThan(5);
});

test('timeline page: renders items', async ({ page }) => {
  await page.goto('/pages/timeline.html');
  expect(await page.locator('.tl-card').count()).toBeGreaterThan(10);
});

test('404 page: renders with topic-suggest actions', async ({ page }) => {
  // Navigate to an explicit 404 route
  const r = await page.goto('/404.html');
  expect(r.status()).toBe(200);
  await expect(page.locator('.not-found-title')).toBeVisible();
  await expect(page.locator('.not-found-actions a')).toHaveCount(4);
});

test('feed.xml is valid RSS', async ({ page }) => {
  const r = await page.goto('/feed.xml');
  expect(r.status()).toBe(200);
  const body = await r.text();
  expect(body).toContain('<rss');
  expect(body).toContain('<item>');
});

test('search.json contains all topics + pillars', async ({ page }) => {
  const r = await page.goto('/data/search.json');
  const data = await r.json();
  expect(data.length).toBeGreaterThanOrEqual(26 + 4);
  expect(data.some(d => d.kind === 'pillar')).toBe(true);
});

test('vietnam pillar: lists 7 essays in order', async ({ page }) => {
  await page.goto('/pages/pillars/vietnam.html');
  await expect(page.locator('.pillar-hero-title')).toContainText(/Vietnam/);
  await expect(page.locator('.pillar-child')).toHaveCount(7);
  const firstHref = await page.locator('.pillar-child').first().getAttribute('href');
  expect(firstHref).toMatch(/vietnam-the-shape-of-the-country/);
});
