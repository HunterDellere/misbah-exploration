#!/usr/bin/env node
// Schema + image-attribution + geo-bounds validation.
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TOPICS_DIR = join(ROOT, 'content/topics');

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

const errors = [];

function check(file) {
  const raw = readFileSync(file, 'utf8');
  const { data, content } = matter(raw);
  const id = file.replace(ROOT + '/', '');

  if (!data.title) errors.push(`[${id}] missing title`);
  if (!data.summary) errors.push(`[${id}] missing summary`);
  if (data.status && !['draft', 'complete', 'stub'].includes(data.status)) {
    errors.push(`[${id}] status must be draft|complete|stub`);
  }
  if (!content.trim() && data.status === 'complete') {
    errors.push(`[${id}] body is empty for status=complete`);
  }
  for (const img of (data.images || [])) {
    if (!img.src) errors.push(`[${id}] image missing src`);
    if (!img.source) errors.push(`[${id}] image missing source (original|external) — ${img.src}`);
    if (img.source && !['original', 'external'].includes(img.source)) {
      errors.push(`[${id}] image.source must be original|external — got "${img.source}"`);
    }
    if (img.source === 'external' && !img.credit) {
      errors.push(`[${id}] external image missing credit — ${img.src}`);
    }
  }
  if (data.geo) {
    const { lat, lng } = data.geo;
    if (lat != null && (lat < -90 || lat > 90)) errors.push(`[${id}] geo.lat out of range: ${lat}`);
    if (lng != null && (lng < -180 || lng > 180)) errors.push(`[${id}] geo.lng out of range: ${lng}`);
    if (lat == null || lng == null) errors.push(`[${id}] geo set but missing lat or lng`);
  }
}

for (const f of walk(TOPICS_DIR)) check(f);

if (errors.length) {
  for (const e of errors) console.error(e);
  console.error(`\n[validate] ${errors.length} issue(s)`);
  process.exit(1);
}
console.log('[validate] OK');
