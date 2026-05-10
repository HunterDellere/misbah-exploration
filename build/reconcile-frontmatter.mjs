#!/usr/bin/env node
/**
 * Reconcile topic frontmatter `images:` blocks against the hero.jpg files
 * actually on disk. For each slug listed in QUERIES (slugs whose originally
 * declared Commons File: title 404s), re-runs the Commons search to get the
 * resolved title + descriptionurl + license + credit, then rewrites only
 * the hero entry's url / credit / license fields. Other fields and the
 * rest of the file are preserved verbatim — we do a targeted text edit
 * rather than a full YAML round-trip to avoid reformatting.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const UA = 'misbah-exploration/0.1 (hunter@bootle.io) Node fetch';

// Same query map as fetch-images-search.mjs — kept in sync intentionally.
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
    mime: info.mime,
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

// Targeted regex rewrite of the hero image's url/credit/license lines.
// Assumes the standard frontmatter shape used in this project (see
// CLAUDE.md). Only touches the hero entry (the first images: entry that
// has role: hero, falling back to the first entry).
function rewriteHero(md, { url, credit, license }) {
  const lines = md.split('\n');
  // Find frontmatter bounds.
  if (lines[0] !== '---') throw new Error('No frontmatter');
  let endFM = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endFM = i;
      break;
    }
  }
  if (endFM === -1) throw new Error('Unclosed frontmatter');

  // Find images: block start.
  let imagesIdx = -1;
  for (let i = 1; i < endFM; i++) {
    if (/^images:\s*$/.test(lines[i])) {
      imagesIdx = i;
      break;
    }
  }
  if (imagesIdx === -1) throw new Error('No images: block');

  // Find first hero entry (or first - src: entry).
  let entryStart = -1;
  let foundHero = false;
  for (let i = imagesIdx + 1; i < endFM; i++) {
    if (/^[a-z_]+:/.test(lines[i])) break; // next top-level key
    if (/^\s*-\s*src:/.test(lines[i])) {
      if (entryStart === -1) entryStart = i;
      // Look ahead within this entry for role: hero.
      let j = i + 1;
      let role = null;
      while (j < endFM && !/^\s*-\s*src:/.test(lines[j]) && !/^[a-z_]+:/.test(lines[j])) {
        const m = lines[j].match(/^\s+role:\s*(.+)\s*$/);
        if (m) role = m[1].trim();
        j++;
      }
      if (role === 'hero') {
        entryStart = i;
        foundHero = true;
        break;
      }
    }
  }
  if (entryStart === -1) throw new Error('No image entry');

  // Determine entry end.
  let entryEnd = endFM;
  for (let i = entryStart + 1; i < endFM; i++) {
    if (/^\s*-\s*src:/.test(lines[i]) || /^[a-z_]+:/.test(lines[i])) {
      entryEnd = i;
      break;
    }
  }

  // Detect indent of child lines (typically 4 spaces).
  let indent = '    ';
  for (let i = entryStart + 1; i < entryEnd; i++) {
    const m = lines[i].match(/^(\s+)\S/);
    if (m) {
      indent = m[1];
      break;
    }
  }

  function setField(name, value) {
    const re = new RegExp('^' + indent + name + ':');
    for (let i = entryStart + 1; i < entryEnd; i++) {
      if (re.test(lines[i])) {
        lines[i] = `${indent}${name}: ${value}`;
        return true;
      }
    }
    // Insert before entryEnd.
    lines.splice(entryEnd, 0, `${indent}${name}: ${value}`);
    entryEnd++;
    return false;
  }

  function quote(s) {
    if (!s) return '""';
    if (/[:#"'\\]/.test(s)) return JSON.stringify(s);
    return `"${s}"`;
  }

  setField('credit', quote(credit));
  setField('license', quote(license));
  setField('url', url); // URLs don't need quoting in YAML

  return { content: lines.join('\n'), foundHero };
}

async function main() {
  const slugs = Object.keys(QUERIES);
  const updated = [];
  const skipped = [];
  const failures = [];

  for (const slug of slugs) {
    const file = join(ROOT, 'content/topics', `${slug}.md`);
    if (!existsSync(file)) {
      skipped.push([slug, 'file missing']);
      continue;
    }
    const heroJpg = join(ROOT, 'assets/images/topics', slug, 'hero.jpg');
    if (!existsSync(heroJpg)) {
      skipped.push([slug, 'hero.jpg missing']);
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
      failures.push([slug, e.message]);
      continue;
    }
    if (!chosen) {
      failures.push([slug, `no usable result for "${query}"`]);
      continue;
    }
    try {
      const md = readFileSync(file, 'utf8');
      const credit = chosen.artist
        ? `Wikimedia Commons — ${chosen.artist}`
        : `Wikimedia Commons — ${stripCommonsTitle(chosen.title)}`;
      const { content } = rewriteHero(md, {
        url: chosen.descriptionurl,
        credit,
        license: chosen.license || 'See description page',
      });
      writeFileSync(file, content);
      updated.push([slug, chosen.title]);
      console.log(`[ok] ${slug} ← ${chosen.title}`);
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      failures.push([slug, e.message]);
    }
  }

  console.log(
    `[reconcile] updated=${updated.length} skipped=${skipped.length} failed=${failures.length}`,
  );
  for (const [s, m] of skipped) console.log(`  - skip ${s}: ${m}`);
  for (const [s, m] of failures) console.error(`  ! fail ${s}: ${m}`);
}

function stripCommonsTitle(t) {
  return t.replace(/^File:/, '').replace(/\.[a-zA-Z0-9]+$/, '');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
