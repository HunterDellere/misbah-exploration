#!/usr/bin/env node
/**
 * Fallback for topics whose declared Commons File: title doesn't exist.
 * Uses the Commons search API to find a likely match, downloads the
 * thumbnail to assets/images/topics/<slug>/hero.jpg, and writes a report
 * to local/image-fetch-report.md so the frontmatter url/credit/license
 * can be updated by hand.
 *
 * Does NOT modify content/topics/<slug>.md.
 */
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const UA = 'misbah-exploration/0.1 (hunter@bootle.io) Node fetch';
const MAX_WIDTH = 2400;

// Curated search queries for slugs whose declared Commons title 404s.
// Queries are deliberately specific to avoid topical drift.
const QUERIES = {
  'anthropology-after-1980': 'University of California Berkeley campus aerial',
  'camellia-sinensis': 'Camellia sinensis botanical illustration',
  'contemporary-vietnam': 'Ho Chi Minh City skyline night',
  'doi-moi-and-reunification': 'Hanoi traffic',
  'four-fields': 'Franz Boas anthropologist portrait',
  'french-indochina': 'Hanoi Opera House colonial',
  'japanese-tea-ceremony': 'Japanese tea ceremony chashitsu',
  'kinship-and-structuralism': 'Claude Levi-Strauss',
  'oaxacan-mezcal': 'Mezcal Oaxaca Mexico',
  'participant-observation': 'Bronislaw Malinowski Trobriand',
  'sea-silk': 'sea silk byssus',
  'silk-road-cities': 'Registan Samarkand Uzbekistan',
  'tea-processing': 'Tea leaves withering processing',
  'the-vietnam-wars': 'Vietnam War helicopter Huey',
  'vietnam-before-the-colonizers': 'My Son Sanctuary Champa Vietnam',
  'vietnam-the-shape-of-the-country': 'Hai Van Pass Vietnam coast',
  'vietnamese-food-and-coffee': 'Pho beef noodle soup Vietnam',
  'gongfu-cha': 'Chinese tea ceremony gongfu',
};

async function searchCommons(query) {
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.searchParams.set('action', 'query');
  api.searchParams.set('format', 'json');
  api.searchParams.set('list', 'search');
  api.searchParams.set('srnamespace', '6');
  api.searchParams.set('srlimit', '5');
  api.searchParams.set('srsearch', query + ' filetype:bitmap');
  const r = await fetch(api, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`Search ${r.status}`);
  const j = await r.json();
  return (j.query?.search || []).map((s) => s.title);
}

async function imageInfo(title) {
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.searchParams.set('action', 'query');
  api.searchParams.set('format', 'json');
  api.searchParams.set('prop', 'imageinfo');
  api.searchParams.set('iiprop', 'url|mime|size|extmetadata');
  api.searchParams.set('iiurlwidth', String(MAX_WIDTH));
  api.searchParams.set('titles', title);
  const r = await fetch(api, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`API ${r.status}`);
  const j = await r.json();
  const page = Object.values(j.query?.pages || {})[0];
  if (!page || page.missing) return null;
  const info = page.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata || {};
  return {
    title,
    descriptionurl: info.descriptionurl,
    thumburl: (info.thumburl || info.url || '').split('?')[0],
    mime: info.mime,
    width: info.thumbwidth || info.width,
    artist: stripHtml(meta.Artist?.value || ''),
    license: meta.LicenseShortName?.value || meta.License?.value || '',
    credit: stripHtml(meta.Credit?.value || ''),
  };
}

function stripHtml(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function downloadTo(url, outPath) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`Download ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(outPath, buf);
  return buf.length;
}

function ensureDir(d) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

async function main() {
  const slugs = Object.keys(QUERIES);
  const report = [
    '# Image fetch report',
    '',
    'Topics where the originally declared Commons File: title 404s.',
    'A candidate was searched and downloaded — review and update each',
    "topic's frontmatter `images:` block (url, credit, license) to match",
    'the resolved Commons file before the next deploy.',
    '',
  ];
  let fetched = 0;

  for (const slug of slugs) {
    const outDir = join(ROOT, 'assets/images/topics', slug);
    const outPath = join(outDir, 'hero.jpg');
    if (existsSync(outPath)) {
      console.log(`[skip] ${slug} (hero.jpg exists)`);
      continue;
    }
    const query = QUERIES[slug];
    let chosen = null;
    try {
      const titles = await searchCommons(query);
      for (const t of titles) {
        const info = await imageInfo(t);
        await new Promise((r) => setTimeout(r, 200));
        if (info && (info.mime === 'image/jpeg' || info.mime === 'image/png')) {
          chosen = info;
          break;
        }
      }
    } catch (e) {
      console.error(`[error] ${slug}: ${e.message}`);
    }
    if (!chosen) {
      console.error(`[miss] ${slug}: no usable result for "${query}"`);
      report.push(`## ${slug}`, '', `- Query: \`${query}\``, '- No usable result. Resolve manually.', '');
      continue;
    }
    try {
      ensureDir(outDir);
      const bytes = await downloadTo(chosen.thumburl, outPath);
      const kb = (bytes / 1024).toFixed(0);
      console.log(`[ok]   ${slug} ← ${chosen.title} (${kb} KB)`);
      fetched++;
      report.push(
        `## ${slug}`,
        '',
        `- Query: \`${query}\``,
        `- Resolved title: **${chosen.title}**`,
        `- Description page: ${chosen.descriptionurl}`,
        `- Thumb URL: ${chosen.thumburl}`,
        `- License: ${chosen.license || '(check page)'}`,
        `- Artist/credit: ${chosen.artist || chosen.credit || '(check page)'}`,
        '',
        '_Update frontmatter `url`, `credit`, `license` to match._',
        '',
      );
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      console.error(`[fail] ${slug}: ${e.message}`);
    }
  }

  ensureDir(join(ROOT, 'local'));
  writeFileSync(join(ROOT, 'local/image-fetch-report.md'), report.join('\n'));
  console.log(`[fetch-images-search] fetched=${fetched}, see local/image-fetch-report.md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
