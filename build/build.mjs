#!/usr/bin/env node
/**
 * misbah-exploration build pipeline
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { escapeAttr, fillTemplate } from './lib/util.mjs';
import { renderTopicPage, renderHomeMosaic, renderPillarPage, familyFor } from './lib/render.mjs';
import { renderAtlasPage } from './lib/atlas.mjs';
import { ensurePlaceholder, ensurePillarPlaceholder } from './lib/placeholder.mjs';
import { renderTagsPage, renderTimelinePage, buildSearchIndex } from './lib/indexes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SITE_URL = process.env.SITE_URL || 'https://hunterdellere.github.io/misbah-exploration';
const SITE_NAME = 'misbah · exploration';

const LAYOUT = readFileSync(join(ROOT, 'templates/_layout.html'), 'utf8');

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('_') || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.md')) out.push(full);
  }
  return out;
}

function loadMd(dir) {
  return walk(join(ROOT, dir)).map(file => {
    const raw = readFileSync(file, 'utf8');
    const { data, content } = matter(raw);
    const slug = data.slug || file.split('/').pop().replace(/\.md$/, '');
    return { ...data, slug, body: content.trim() };
  });
}

function ensureDir(p) { mkdirSync(p, { recursive: true }); }

function writePage(filePath, vars) {
  const html = fillTemplate(LAYOUT, vars);
  ensureDir(dirname(filePath));
  writeFileSync(filePath, html);
}

function ogTags({ title, description, url, image }) {
  return `<meta property="og:type" content="website">
<meta property="og:title" content="${escapeAttr(title)}">
<meta property="og:description" content="${escapeAttr(description)}">
<meta property="og:url" content="${escapeAttr(url)}">
<meta property="og:site_name" content="${SITE_NAME}">
${image ? `<meta property="og:image" content="${escapeAttr(image)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttr(title)}">
<meta name="twitter:description" content="${escapeAttr(description)}">`;
}

function buildHome(topics, pillars) {
  const enriched = pillars.map(p => ({
    ...p,
    count: (p.order || []).length,
  }));
  const body = renderHomeMosaic(topics, enriched);
  writePage(join(ROOT, 'index.html'), {
    metaComment: `built ${new Date().toISOString()}`,
    pageTitle: 'an atlas of things worth a longer look',
    metaDesc: 'A personal visual atlas — anthropology, tea, cartography, travel, history, craft.',
    canonicalUrl: SITE_URL + '/',
    favicon: 'icons/favicon.svg',
    cssRoot: '',
    category: 'home',
    ogTags: ogTags({
      title: SITE_NAME,
      description: 'A personal visual atlas — anthropology, tea, cartography, and what was worth a longer look.',
      url: SITE_URL,
    }),
    jsonLd: '',
    pageBody: body,
  });
}

function buildAtlas(topics) {
  const body = renderAtlasPage(topics);
  writePage(join(ROOT, 'pages/atlas.html'), {
    metaComment: `built ${new Date().toISOString()}`,
    pageTitle: 'Atlas',
    metaDesc: 'Interactive globe of every pinned topic — drag, zoom, peek.',
    canonicalUrl: SITE_URL + '/pages/atlas.html',
    favicon: '../icons/favicon.svg',
    cssRoot: '../',
    category: 'atlas',
    ogTags: ogTags({
      title: 'Atlas — ' + SITE_NAME,
      description: 'Interactive globe of every pinned topic.',
      url: SITE_URL + '/pages/atlas.html',
    }),
    jsonLd: '',
    pageBody: body,
  });
}

function buildTopicPages(topics) {
  for (const topic of topics) {
    const body = renderTopicPage(topic, topics);
    const fam = familyFor(topic);
    const url = `${SITE_URL}/pages/topics/${topic.slug}.html`;
    const hero = (topic.images || []).find(i => i.role === 'hero') || (topic.images || [])[0];
    const ogImage = hero ? `${SITE_URL}/assets/images/topics/${topic.slug}/${hero.src}` : undefined;
    writePage(join(ROOT, 'pages/topics', `${topic.slug}.html`), {
      metaComment: `built ${new Date().toISOString()} · ${fam.label}`,
      pageTitle: topic.title,
      metaDesc: topic.summary || topic.title,
      canonicalUrl: url,
      favicon: '../../icons/favicon.svg',
      cssRoot: '../../',
      category: 'topic',
      ogTags: ogTags({ title: topic.title, description: topic.summary || '', url, image: ogImage }),
      jsonLd: jsonLdForTopic(topic, url),
      pageBody: body,
    });
  }
}

function buildPillarPages(pillars, topics) {
  for (const p of pillars) {
    const body = renderPillarPage(p, topics, pillars.map(x => ({ ...x, count: (x.order || []).length })));
    const url = `${SITE_URL}/pages/pillars/${p.slug}.html`;
    const hero = (p.images || []).find(i => i.role === 'hero') || (p.images || [])[0];
    const ogImage = hero ? `${SITE_URL}/assets/images/pillars/${p.slug}/${hero.src}` : undefined;
    writePage(join(ROOT, 'pages/pillars', `${p.slug}.html`), {
      metaComment: `built ${new Date().toISOString()} · pillar`,
      pageTitle: p.title,
      metaDesc: p.summary || p.title,
      canonicalUrl: url,
      favicon: '../../icons/favicon.svg',
      cssRoot: '../../',
      category: 'pillar',
      ogTags: ogTags({ title: p.title + ' — ' + SITE_NAME, description: p.summary || '', url, image: ogImage }),
      jsonLd: '',
      pageBody: body,
    });
  }
}

function buildIndexPages(topics) {
  writePage(join(ROOT, 'pages/tags.html'), {
    metaComment: `built ${new Date().toISOString()}`,
    pageTitle: 'Tags',
    metaDesc: 'Browse all topics by tag.',
    canonicalUrl: SITE_URL + '/pages/tags.html',
    favicon: '../icons/favicon.svg',
    cssRoot: '../',
    category: 'tags',
    ogTags: ogTags({ title: 'Tags — ' + SITE_NAME, description: 'Browse all topics by tag.', url: SITE_URL + '/pages/tags.html' }),
    jsonLd: '',
    pageBody: renderTagsPage(topics),
  });

  writePage(join(ROOT, 'pages/timeline.html'), {
    metaComment: `built ${new Date().toISOString()}`,
    pageTitle: 'Timeline',
    metaDesc: 'Topics anchored in time, from antiquity to now.',
    canonicalUrl: SITE_URL + '/pages/timeline.html',
    favicon: '../icons/favicon.svg',
    cssRoot: '../',
    category: 'timeline',
    ogTags: ogTags({ title: 'Timeline — ' + SITE_NAME, description: 'Topics anchored in time.', url: SITE_URL + '/pages/timeline.html' }),
    jsonLd: '',
    pageBody: renderTimelinePage(topics),
  });
}

function build404() {
  const body = `<main id="main-content" class="not-found">
  <div class="not-found-inner">
    <div class="not-found-glyph" aria-hidden="true">⌖</div>
    <h1 class="not-found-title">Off the map</h1>
    <p class="not-found-sub">There's no topic here. Try the atlas, or one of these instead.</p>
    <div class="not-found-actions">
      <a class="not-found-btn not-found-btn--primary" href="/misbah-exploration/index.html">Home</a>
      <a class="not-found-btn" href="/misbah-exploration/pages/atlas.html">Atlas</a>
      <a class="not-found-btn" href="/misbah-exploration/pages/tags.html">Tags</a>
      <a class="not-found-btn" href="/misbah-exploration/random.html">A random topic ↻</a>
    </div>
  </div>
</main>`;
  writePage(join(ROOT, '404.html'), {
    metaComment: `built ${new Date().toISOString()}`,
    pageTitle: 'Off the map',
    metaDesc: 'Page not found.',
    canonicalUrl: SITE_URL + '/404.html',
    favicon: 'icons/favicon.svg',
    cssRoot: '/misbah-exploration/',
    category: 'error',
    ogTags: '',
    jsonLd: '',
    pageBody: body,
  });
}

function jsonLdForTopic(topic, url) {
  if (topic.status !== 'complete') return '';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: topic.title,
    description: topic.summary || '',
    url,
    datePublished: topic.updated,
    author: { '@type': 'Person', name: 'Hunter Dellere' },
    keywords: (topic.tags || []).join(', '),
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function emitData(topics, pillars) {
  ensureDir(join(ROOT, 'data'));
  writeFileSync(join(ROOT, 'data/topics.json'), JSON.stringify(
    topics.map(t => ({
      slug: t.slug, title: t.title, summary: t.summary,
      tags: t.tags || [], updated: t.updated, status: t.status,
      geo: t.geo, family: familyFor(t).key, pillar: t.pillar,
    })),
    null, 2
  ));

  const geo = topics
    .filter(t => t.geo?.lat != null && t.geo?.lng != null)
    .map(t => {
      const hero = (t.images || []).find(i => i.role === 'hero') || (t.images || [])[0];
      return {
        slug: t.slug,
        title: t.title,
        summary: t.summary || '',
        lat: t.geo.lat,
        lng: t.geo.lng,
        place: t.geo.place || '',
        precision: t.geo.precision || 'region',
        tags: t.tags || [],
        family: familyFor(t).key,
        pillar: t.pillar || null,
        image: hero ? `assets/images/topics/${t.slug}/${hero.src}` : null,
        url: `pages/topics/${t.slug}.html`,
      };
    });
  writeFileSync(join(ROOT, 'data/geo.json'), JSON.stringify(geo, null, 2));

  writeFileSync(join(ROOT, 'data/search.json'), JSON.stringify(buildSearchIndex(topics, pillars), null, 2));
}

function emitSitemap(topics, pillars) {
  const urls = [
    SITE_URL + '/',
    SITE_URL + '/pages/atlas.html',
    SITE_URL + '/pages/tags.html',
    SITE_URL + '/pages/timeline.html',
    ...pillars.map(p => `${SITE_URL}/pages/pillars/${p.slug}.html`),
    ...topics.map(t => `${SITE_URL}/pages/topics/${t.slug}.html`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;
  writeFileSync(join(ROOT, 'sitemap.xml'), xml);
}

function emitFeed(topics) {
  const sorted = topics
    .filter(t => t.status === 'complete')
    .sort((a, b) => String(b.updated || '').localeCompare(String(a.updated || '')))
    .slice(0, 25);
  const items = sorted.map(t => `<item>
    <title>${escapeXml(t.title)}</title>
    <link>${SITE_URL}/pages/topics/${t.slug}.html</link>
    <guid isPermaLink="true">${SITE_URL}/pages/topics/${t.slug}.html</guid>
    <pubDate>${new Date(t.updated || Date.now()).toUTCString()}</pubDate>
    <description>${escapeXml(t.summary || '')}</description>
  </item>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>misbah · exploration</title>
  <link>${SITE_URL}/</link>
  <description>A personal visual atlas of topics worth a longer look.</description>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel></rss>`;
  writeFileSync(join(ROOT, 'feed.xml'), xml);
}

function escapeXml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function emitRobots() {
  writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml
`);
}

function ensureAssets(topics, pillars) {
  const assetsDir = join(ROOT, 'assets');
  for (const t of topics) {
    const fam = familyFor(t).key === 'default' ? (t.tags || [])[0] : familyFor(t).key;
    ensurePlaceholder(assetsDir, t.slug, fam, t.title);
    const dir = join(assetsDir, 'images/topics', t.slug);
    for (const img of (t.images || [])) {
      if (/^https?:/i.test(img.src)) continue;
      const onDisk = join(dir, img.src);
      if (!existsSync(onDisk)) img.src = 'hero.svg';
    }
  }
  for (const p of pillars) {
    ensurePillarPlaceholder(assetsDir, p.slug, p.hue || p.slug, p.title);
    const dir = join(assetsDir, 'images/pillars', p.slug);
    for (const img of (p.images || [])) {
      if (/^https?:/i.test(img.src)) continue;
      const onDisk = join(dir, img.src);
      if (!existsSync(onDisk)) img.src = 'hero.svg';
    }
  }
}

// ── Run ─────────────────────────────────────────────────────────────────
const topics = loadMd('content/topics');
const pillars = loadMd('content/pillars');

if (topics.length === 0) console.warn('[build] No topics found');

ensureAssets(topics, pillars);
buildHome(topics, pillars);
buildAtlas(topics);
buildPillarPages(pillars, topics);
buildTopicPages(topics);
buildIndexPages(topics);
build404();
emitData(topics, pillars);
emitSitemap(topics, pillars);
emitFeed(topics);
emitRobots();
console.log(`[build] ${topics.length} topics + ${pillars.length} pillars → pages/, data/, sitemap.xml, feed.xml`);
