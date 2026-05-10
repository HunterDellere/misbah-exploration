#!/usr/bin/env node
// Schema + image-attribution + geo-bounds + cross-reference validation.
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TOPICS_DIR = join(ROOT, 'content/topics');

const FAMILIES = new Set([
  'tea', 'history', 'travel', 'anthropology',
  'science', 'craft', 'experience', 'food',
  'cartography', 'vietnam',
]);

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

function isValidUrl(s) {
  try { new URL(s); return true; } catch { return false; }
}

const errors = [];
const slugs = new Map(); // slug -> file path
const allDocs = [];

function parseDoc(file) {
  const raw = readFileSync(file, 'utf8');
  const { data, content } = matter(raw);
  const slug = data.slug || basename(file, '.md');
  return { file, data, content, slug };
}

function check(doc) {
  const { file, data, content, slug } = doc;
  const id = file.replace(ROOT + '/', '');

  if (!data.title) errors.push(`[${id}] missing title`);
  if (!data.summary) errors.push(`[${id}] missing summary`);
  if (data.status && !['draft', 'complete', 'stub'].includes(data.status)) {
    errors.push(`[${id}] status must be draft|complete|stub`);
  }
  if (!content.trim() && data.status === 'complete') {
    errors.push(`[${id}] body is empty for status=complete`);
  }

  // Duplicate slug detection
  if (slugs.has(slug)) {
    errors.push(`[${id}] duplicate slug "${slug}" — also in ${slugs.get(slug)}`);
  } else {
    slugs.set(slug, id);
  }

  // Family tag (first tag must be a known family if tags present)
  if (Array.isArray(data.tags) && data.tags.length > 0) {
    const first = String(data.tags[0]).toLowerCase();
    if (!FAMILIES.has(first)) {
      errors.push(`[${id}] first tag "${first}" is not a valid family — expected one of: ${[...FAMILIES].join(', ')}`);
    }
  }

  // Images
  for (const img of (data.images || [])) {
    if (!img.src) errors.push(`[${id}] image missing src`);
    if (!img.source) errors.push(`[${id}] image missing source (original|external) — ${img.src}`);
    if (img.source && !['original', 'external'].includes(img.source)) {
      errors.push(`[${id}] image.source must be original|external — got "${img.source}"`);
    }
    if (img.source === 'external' && !img.credit) {
      errors.push(`[${id}] external image missing credit — ${img.src}`);
    }
    if (img.source === 'original' && img.src) {
      const imgPath = join(ROOT, 'assets/images/topics', slug, img.src);
      if (!existsSync(imgPath)) {
        errors.push(`[${id}] original image not found on disk: assets/images/topics/${slug}/${img.src}`);
      }
    }
  }

  // Geo
  if (data.geo) {
    const { lat, lng } = data.geo;
    if (lat != null && (lat < -90 || lat > 90)) errors.push(`[${id}] geo.lat out of range: ${lat}`);
    if (lng != null && (lng < -180 || lng > 180)) errors.push(`[${id}] geo.lng out of range: ${lng}`);
    if (lat == null || lng == null) errors.push(`[${id}] geo set but missing lat or lng`);
  }

  // Sources
  for (const src of (data.sources || [])) {
    if (!src.title) errors.push(`[${id}] source missing title`);
    if (src.url && !isValidUrl(src.url)) errors.push(`[${id}] source url not parseable: ${src.url}`);
  }
}

function checkCrossRefs() {
  const slugSet = new Set(slugs.keys());
  for (const doc of allDocs) {
    const id = doc.file.replace(ROOT + '/', '');
    for (const r of (doc.data.related || [])) {
      if (!slugSet.has(r)) {
        errors.push(`[${id}] related slug "${r}" does not exist`);
      }
    }
  }
}

for (const f of walk(TOPICS_DIR)) {
  const doc = parseDoc(f);
  allDocs.push(doc);
  check(doc);
}
checkCrossRefs();

if (errors.length) {
  for (const e of errors) console.error(e);
  console.error(`\n[validate] ${errors.length} issue(s)`);
  process.exit(1);
}
console.log(`[validate] OK (${allDocs.length} topics)`);
