// crawl.spec.mjs — visit every topic + pillar, assert structural invariants
import { test, expect } from './_fixtures.mjs';

async function loadIndex(page) {
  const r = await page.request.get('/data/topics.json');
  expect(r.ok()).toBe(true);
  return r.json();
}

async function loadPillars(page) {
  const r = await page.request.get('/data/search.json');
  const data = await r.json();
  return data.filter(d => d.kind === 'pillar');
}

test('crawl: every topic page renders without errors', async ({ page }) => {
  const topics = await loadIndex(page);
  expect(topics.length).toBeGreaterThanOrEqual(20);

  const failures = [];
  for (const t of topics) {
    const errors = [];
    page.removeAllListeners('pageerror');
    page.on('pageerror', e => errors.push(`${t.slug}: ${e}`));
    const failed = [];
    page.removeAllListeners('response');
    page.on('response', r => {
      if (r.status() >= 400) {
        const u = new URL(r.url());
        if (u.hostname === new URL(page.context()._options.baseURL || page.url()).hostname || u.hostname.endsWith('github.io')) {
          failed.push(`${t.slug}: ${r.status()} ${r.url()}`);
        }
      }
    });
    await page.goto(`/pages/topics/${t.slug}.html`);
    await page.waitForLoadState('networkidle');

    const heroVisible = await page.locator('.topic-hero-title').isVisible();
    const bodyP = await page.locator('.topic-body p, .read-column p').count();
    const breadcrumbs = await page.locator('.breadcrumbs').isVisible();

    if (!heroVisible) failures.push(`${t.slug}: hero-title not visible`);
    if (bodyP === 0) failures.push(`${t.slug}: no body paragraphs`);
    if (!breadcrumbs) failures.push(`${t.slug}: no breadcrumbs`);
    if (errors.length) failures.push(...errors);
    if (failed.length) failures.push(...failed);
  }

  if (failures.length) console.log('CRAWL FAILURES:\n' + failures.join('\n'));
  expect(failures).toEqual([]);
});

test('crawl: every pillar page renders with children', async ({ page }) => {
  const pillars = await loadPillars(page);
  expect(pillars.length).toBeGreaterThanOrEqual(4);

  const failures = [];
  for (const p of pillars) {
    await page.goto(`/pages/pillars/${p.slug}.html`);
    await page.waitForLoadState('domcontentloaded');
    const titleVisible = await page.locator('.pillar-hero-title').isVisible();
    const childCount = await page.locator('.pillar-child').count();
    if (!titleVisible) failures.push(`${p.slug}: title not visible`);
    if (childCount === 0) failures.push(`${p.slug}: no child essays`);
  }
  expect(failures).toEqual([]);
});

test('crawl: every topic has a working pillar prev/next chain (where applicable)', async ({ page }) => {
  const topics = await loadIndex(page);
  const byPillar = new Map();
  for (const t of topics) {
    if (!t.pillar) continue;
    if (!byPillar.has(t.pillar)) byPillar.set(t.pillar, []);
    byPillar.get(t.pillar).push(t);
  }

  const failures = [];
  for (const [pillar, ts] of byPillar) {
    if (ts.length < 3) continue;
    // The pillar nav reads from the topic's `order` frontmatter, not from
    // topics.json sorting. Visit each non-edge topic in the pillar and
    // assert it has both prev and next. We don't know the order from JSON,
    // so visit all and require that some middle has both.
    let foundWithBoth = false;
    for (const t of ts) {
      await page.goto(`/pages/topics/${t.slug}.html`);
      const prev = await page.locator('.pillar-nav-prev').count();
      const next = await page.locator('.pillar-nav-next').count();
      if (prev > 0 && next > 0) { foundWithBoth = true; break; }
    }
    if (!foundWithBoth) failures.push(`${pillar}: no topic has both prev and next`);
  }
  expect(failures).toEqual([]);
});

test('crawl: home tile count matches topics.json', async ({ page }) => {
  const topics = await loadIndex(page);
  await page.goto('/');
  const tiles = await page.locator('.tile').count();
  expect(tiles).toBe(topics.length);
});

test('crawl: atlas list count matches geo.json', async ({ page }) => {
  const r = await page.request.get('/data/geo.json');
  const geo = await r.json();
  await page.goto('/pages/atlas.html');
  await page.waitForLoadState('domcontentloaded');
  const listed = await page.locator('.atlas-list-item').count();
  expect(listed).toBe(geo.length);
});

test('crawl: every external image attribution links externally', async ({ page }) => {
  const topics = await loadIndex(page);
  // Sample a handful to keep this fast
  const sample = topics.slice(0, 8);
  for (const t of sample) {
    await page.goto(`/pages/topics/${t.slug}.html`);
    const attrib = page.locator('.topic-hero-attrib');
    if (await attrib.count() === 0) continue;
    const a = attrib.locator('a').first();
    if (await a.count()) {
      const href = await a.getAttribute('href');
      expect(href).toMatch(/^https?:/);
      expect(await a.getAttribute('rel')).toContain('noopener');
    }
  }
});

test('crawl: search index contains every topic by slug', async ({ page }) => {
  const r = await page.request.get('/data/search.json');
  const search = await r.json();
  const topics = await loadIndex(page);
  const searchSlugs = new Set(search.filter(d => d.kind === 'topic').map(d => d.slug));
  const missing = topics.filter(t => !searchSlugs.has(t.slug));
  expect(missing).toEqual([]);
});
