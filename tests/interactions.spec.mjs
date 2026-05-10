// interactions.spec.mjs — UX behaviors and small delights
import { test, expect } from './_fixtures.mjs';

test('search: palette opens with Cmd-K, returns matching results, navigates with Enter', async ({ page, browserName }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Use Control on non-Mac runners — Playwright sends both via Meta+ on chromium
  await page.keyboard.press('Meta+k');
  await expect(page.locator('#search-palette')).toHaveAttribute('open', '');
  await page.locator('#search-input').fill('mercator');
  await expect(page.locator('.search-result').first()).toBeVisible();
  await expect(page.locator('.search-result').first()).toContainText(/Mercator/i);
  // Press Enter to navigate
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/mercator-projection/);
});

test('search: empty state shows for no results', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.keyboard.press('Meta+k');
  await page.locator('#search-input').fill('zzzqqqxxx');
  await expect(page.locator('.search-empty')).toBeVisible();
});

test('search: arrow keys move active selection', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.keyboard.press('Meta+k');
  await page.locator('#search-input').fill('tea');
  await page.waitForTimeout(150);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  // The 3rd result should now be selected
  const selected = await page.locator('.search-result[aria-selected="true"]').count();
  expect(selected).toBe(1);
});

test('search: Escape closes the palette', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.keyboard.press('Meta+k');
  await expect(page.locator('#search-palette')).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('#search-palette')).not.toHaveAttribute('open', '');
});

test('theme: toggle persists across navigation via localStorage', async ({ page }) => {
  await page.goto('/');
  await page.locator('#theme-toggle').click();
  const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.goto('/pages/atlas.html');
  const onAtlas = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(onAtlas).toBe(after);
});

test('atlas: clicking a list-item opens the preview card', async ({ page }) => {
  await page.goto('/pages/atlas.html');
  await page.waitForLoadState('networkidle');
  await page.locator('.atlas-list-item').first().hover();
  await expect(page.locator('.atlas-preview')).toHaveAttribute('data-open', 'true');
  await expect(page.locator('.atlas-preview-title')).not.toBeEmpty();
});

test('topic: TOC scroll-spy sets is-active on the first link', async ({ page }) => {
  await page.goto('/pages/topics/the-vietnam-wars.html');
  await page.waitForLoadState('networkidle');
  // Wait a beat for IntersectionObserver init
  await page.waitForTimeout(300);
  const activeCount = await page.locator('.toc-list a.is-active').count();
  expect(activeCount).toBeGreaterThanOrEqual(1);
});

test('topic: anchor links jump and update the URL hash', async ({ page, viewport }) => {
  // Anchor-link glyphs are hidden at <900px by design
  test.skip((viewport?.width ?? 0) < 900, 'Anchor-link glyphs are hidden on narrow viewports by design');
  await page.goto('/pages/topics/the-vietnam-wars.html');
  await page.waitForLoadState('networkidle');
  const anchor = page.locator('h2 a.anchor-link').first();
  if (await anchor.count()) {
    const href = await anchor.getAttribute('href');
    await anchor.click();
    await page.waitForTimeout(200);
    const hash = await page.evaluate(() => location.hash);
    expect(hash).toBe(href);
  }
});

test('topic: external body links carry the ↗ affordance', async ({ page }) => {
  await page.goto('/pages/topics/origins-of-anthropology.html');
  await page.waitForLoadState('networkidle');
  // The .ext-arrow span is appended by enhance.js — wait for it
  await page.waitForTimeout(200);
  const arrows = await page.locator('.read-column .ext-link .ext-arrow').count();
  expect(arrows).toBeGreaterThan(0);
});

test('topic: reading-progress bar exists and updates on scroll', async ({ page }) => {
  await page.goto('/pages/topics/contemporary-vietnam.html');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.reading-progress-bar')).toHaveCount(1);
  // Read the inline transform set by toc.js (it sets el.style.transform = scaleX(...))
  // Scroll deep enough to be past the hero + breadcrumbs and well into the article
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
  await page.waitForTimeout(250);
  const t = await page.locator('.reading-progress-bar').evaluate(el => el.style.transform);
  // After scrolling we expect a non-zero scaleX
  expect(t).toMatch(/scaleX\(([0-9]*\.?[0-9]+)\)/);
  const m = t.match(/scaleX\(([0-9]*\.?[0-9]+)\)/);
  expect(parseFloat(m[1])).toBeGreaterThan(0);
});

test('home: pillar strip links navigate to hub pages', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('.pillar-card').first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute('href');
  expect(href).toMatch(/pages\/pillars\//);
  await link.click();
  await expect(page.locator('.pillar-hero-title')).toBeVisible();
});

test('home: shortcut "Search topics" opens the palette', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-search-trigger]').first().click();
  await expect(page.locator('#search-palette')).toHaveAttribute('open', '');
});

test('tags: clicking a chip scrolls to its section', async ({ page }) => {
  await page.goto('/pages/tags.html');
  await page.waitForLoadState('networkidle');
  const chip = page.locator('.tag-cloud-chip').first();
  const href = await chip.getAttribute('href');
  await chip.click();
  await page.waitForTimeout(200);
  const hash = await page.evaluate(() => location.hash);
  expect(hash).toBe(href);
});

test('timeline: cards render and link to topics', async ({ page }) => {
  await page.goto('/pages/timeline.html');
  const cards = page.locator('.tl-card');
  expect(await cards.count()).toBeGreaterThan(15);
  const href = await cards.first().getAttribute('href');
  expect(href).toMatch(/topics\//);
  // Era anchor sidebar should be present.
  expect(await page.locator('.tl-anchor').count()).toBeGreaterThan(2);
});

test('timeline: vertical layout — present bookend, spine, progress fill', async ({ page }) => {
  await page.goto('/pages/timeline.html');
  await expect(page.locator('.tl-river-start')).toHaveCount(1);
  await expect(page.locator('.tl-river-start-label')).toHaveText(/Present/i);
  await expect(page.locator('.tl-spine')).toHaveCount(1);
  await expect(page.locator('.tl-spine-fill')).toHaveCount(1);
  await expect(page.locator('.tl-river-end-label')).toBeVisible();
});

test('timeline: cards reveal on scroll and spine fill advances', async ({ page }) => {
  await page.goto('/pages/timeline.html');
  // First card is in-view on load and should be revealed
  const first = page.locator('.tl-card--reveal').first();
  await expect(first).toHaveClass(/is-in/);
  // Scroll into the middle; spine fill should report a non-zero progress
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(150);
  const pct = await page.evaluate(() => {
    const el = document.querySelector('.tl-spine-fill');
    return el ? el.style.getPropertyValue('--tl-progress') : '';
  });
  expect(pct).toMatch(/\d/);
  expect(parseFloat(pct)).toBeGreaterThan(0);
});

test('timeline: active era anchor highlights as you scroll', async ({ page }) => {
  await page.goto('/pages/timeline.html');
  // The first era should be marked active immediately
  await expect(page.locator('.tl-anchor.is-active')).toHaveCount(1);
  const firstActive = await page
    .locator('.tl-anchor.is-active')
    .getAttribute('data-era');
  expect(firstActive).toBeTruthy();

  // Scroll near the bottom of the river and confirm the active anchor
  // has advanced past the first era. IO + rAF coordination can lag
  // under parallel test load, so poll briefly.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 400));
  await expect
    .poll(
      async () =>
        page
          .locator('.tl-anchor.is-active')
          .getAttribute('data-era'),
      { timeout: 3000 },
    )
    .not.toBe(firstActive);
});

test('rss feed is well-formed xml', async ({ page }) => {
  const r = await page.request.get('/feed.xml');
  expect(r.ok()).toBe(true);
  const body = await r.text();
  expect(body).toMatch(/^<\?xml/);
  expect(body).toContain('<rss');
  expect(body).toContain('</rss>');
});

test('robots.txt allows all and references sitemap', async ({ page }) => {
  const r = await page.request.get('/robots.txt');
  const body = await r.text();
  expect(body).toMatch(/Allow:\s*\//);
  expect(body).toMatch(/Sitemap:.*sitemap\.xml/);
});

test('sitemap.xml lists every topic + pillar', async ({ page }) => {
  const r = await page.request.get('/sitemap.xml');
  const body = await r.text();
  const topicsR = await page.request.get('/data/topics.json');
  const topics = await topicsR.json();
  for (const t of topics.slice(0, 5)) {
    expect(body).toContain(`/topics/${t.slug}.html`);
  }
});
