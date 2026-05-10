#!/usr/bin/env node
/**
 * misbah-exploration build pipeline
 *
 * Reads:  content/topics/*.md, content/collections/*.md
 * Writes: pages/topics/<slug>.html
 *         pages/collections/<slug>.html
 *         pages/atlas.html
 *         index.html (homepage)
 *         data/topics.json, data/geo.json
 *         sitemap.xml
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { escapeHtml, escapeAttr, fillTemplate } from './lib/util.mjs';
import { renderTopicPage, renderHomeMosaic, familyFor } from './lib/render.mjs';
import { renderAtlasPage } from './lib/atlas.mjs';
import { ensurePlaceholder } from './lib/placeholder.mjs';

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

function loadTopics() {
  const dir = join(ROOT, 'content/topics');
  return walk(dir).map(file => {
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

function buildHome(topics) {
  const body = renderHomeMosaic(topics);
  writePage(join(ROOT, 'index.html'), {
    metaComment: `built ${new Date().toISOString()}`,
    pageTitle: 'an atlas of things worth a longer look',
    metaDesc: 'A personal visual atlas — tea, anthropology, travel, history, craft.',
    canonicalUrl: SITE_URL + '/',
    favicon: 'icons/favicon.svg',
    cssRoot: '',
    category: 'home',
    ogTags: ogTags({
      title: SITE_NAME,
      description: 'A personal visual atlas — tea, anthropology, travel, history, craft.',
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

function emitData(topics) {
  ensureDir(join(ROOT, 'data'));
  writeFileSync(join(ROOT, 'data/topics.json'), JSON.stringify(
    topics.map(t => ({
      slug: t.slug, title: t.title, summary: t.summary,
      tags: t.tags || [], updated: t.updated, status: t.status,
      geo: t.geo, family: familyFor(t).key,
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
        image: hero ? `assets/images/topics/${t.slug}/${hero.src}` : null,
        url: `pages/topics/${t.slug}.html`,
      };
    });
  writeFileSync(join(ROOT, 'data/geo.json'), JSON.stringify(geo, null, 2));
}

function emitSitemap(topics) {
  const urls = [
    SITE_URL + '/',
    SITE_URL + '/pages/atlas.html',
    ...topics.map(t => `${SITE_URL}/pages/topics/${t.slug}.html`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;
  writeFileSync(join(ROOT, 'sitemap.xml'), xml);
}

function ensureAssetsForTopics(topics) {
  const assetsDir = join(ROOT, 'assets');
  for (const t of topics) {
    const fam = familyFor(t).key === 'default' ? (t.tags || [])[0] : familyFor(t).key;
    ensurePlaceholder(assetsDir, t.slug, fam, t.title);

    // If frontmatter declared images but the actual files aren't on disk,
    // rewrite each missing src → hero.svg so build output references the
    // generated placeholder. This keeps draft topics looking intentional.
    const dir = join(assetsDir, 'images/topics', t.slug);
    for (const img of (t.images || [])) {
      if (/^https?:/i.test(img.src)) continue;
      const onDisk = join(dir, img.src);
      if (!existsSync(onDisk)) img.src = 'hero.svg';
    }
  }
}

// ── Run ────────────────────────────────────────────────────────────────
const topics = loadTopics();
if (topics.length === 0) {
  console.warn('[build] No topics found in content/topics/');
}
ensureAssetsForTopics(topics);
buildHome(topics);
buildAtlas(topics);
buildTopicPages(topics);
emitData(topics);
emitSitemap(topics);
console.log(`[build] ${topics.length} topics → pages/, data/, sitemap.xml`);
