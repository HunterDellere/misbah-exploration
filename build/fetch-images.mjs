#!/usr/bin/env node
/**
 * Fetch hero images declared in topic frontmatter from Wikimedia Commons.
 * Reads each content/topics/<slug>.md, finds the hero image entry, resolves
 * the wikimedia File: page to a thumbnail URL via the Commons API, and
 * downloads it to assets/images/topics/<slug>/<src>.
 *
 * Skips topics whose hero `url` is not a Commons File: URL (e.g. Pexels) —
 * those need to be hand-sourced. Skips topics where the target file already
 * exists, unless --force is passed.
 *
 * Usage:
 *   node build/fetch-images.mjs            # fetch missing
 *   node build/fetch-images.mjs --force    # re-fetch all
 *   node build/fetch-images.mjs <slug>     # one topic
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const UA = 'misbah-exploration/0.1 (hunter@bootle.io) Node fetch';
const MAX_WIDTH = 2400;

const args = process.argv.slice(2);
const force = args.includes('--force');
const onlySlug = args.find((a) => !a.startsWith('--'));

function commonsTitle(url) {
  const m = url.match(/\/wiki\/(File:[^?#]+)/);
  if (!m) return null;
  return decodeURIComponent(m[1].replace(/_/g, ' '));
}

async function resolveThumbUrl(title) {
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.searchParams.set('action', 'query');
  api.searchParams.set('format', 'json');
  api.searchParams.set('prop', 'imageinfo');
  api.searchParams.set('iiprop', 'url|mime|size');
  api.searchParams.set('iiurlwidth', String(MAX_WIDTH));
  api.searchParams.set('titles', title);
  const r = await fetch(api, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`API ${r.status} for ${title}`);
  const j = await r.json();
  const pages = j.query?.pages || {};
  const page = Object.values(pages)[0];
  if (!page || page.missing) throw new Error(`Wikimedia file missing: ${title}`);
  const info = page.imageinfo?.[0];
  if (!info) throw new Error(`No imageinfo for ${title}`);
  // Prefer thumbnail, fall back to original. Strip tracking params.
  const url = (info.thumburl || info.url || '').split('?')[0];
  return { url, mime: info.mime };
}

async function downloadTo(url, outPath) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`Download ${r.status} for ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(outPath, buf);
  return buf.length;
}

function ensureDir(d) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

async function main() {
  const topicsDir = join(ROOT, 'content/topics');
  const slugs = readdirSync(topicsDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));

  const targets = onlySlug ? slugs.filter((s) => s === onlySlug) : slugs;
  if (onlySlug && targets.length === 0) {
    console.error(`[fetch-images] No topic matches slug: ${onlySlug}`);
    process.exit(1);
  }

  let fetched = 0;
  let skipped = 0;
  const failures = [];

  for (const slug of targets) {
    const md = readFileSync(join(topicsDir, `${slug}.md`), 'utf8');
    const { data } = matter(md);
    const hero = (data.images || []).find((i) => i.role === 'hero') || (data.images || [])[0];
    if (!hero || !hero.url || !hero.src) {
      skipped++;
      continue;
    }
    const outDir = join(ROOT, 'assets/images/topics', slug);
    const outPath = join(outDir, hero.src);
    if (existsSync(outPath) && !force) {
      skipped++;
      continue;
    }
    const title = commonsTitle(hero.url);
    if (!title) {
      failures.push([slug, `non-Commons URL (${hero.url})`]);
      continue;
    }
    try {
      const { url } = await resolveThumbUrl(title);
      ensureDir(outDir);
      const bytes = await downloadTo(url, outPath);
      const kb = (bytes / 1024).toFixed(0);
      console.log(`[fetch-images] ${slug} ← ${title} (${kb} KB)`);
      fetched++;
      // Polite throttle.
      await new Promise((r) => setTimeout(r, 250));
    } catch (e) {
      failures.push([slug, e.message]);
    }
  }

  console.log(
    `[fetch-images] fetched=${fetched} skipped=${skipped} failed=${failures.length}`,
  );
  if (failures.length) {
    for (const [slug, msg] of failures) console.error(`  ! ${slug}: ${msg}`);
    process.exit(failures.length === targets.length ? 1 : 0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
