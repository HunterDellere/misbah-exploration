#!/usr/bin/env node
// Content health report — drafts, stale topics, missing assets, family distribution.
// Writes to local/content-report.md (gitignored).
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname, basename } from 'path';
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

function countWords(s) {
  return (s.match(/\S+/g) || []).length;
}

const topics = walk(TOPICS_DIR).map((file) => {
  const raw = readFileSync(file, 'utf8');
  const { data, content } = matter(raw);
  const slug = data.slug || basename(file, '.md');
  const body = content.trim();
  return {
    file: file.replace(ROOT + '/', ''),
    slug,
    title: data.title || '(untitled)',
    status: data.status || 'unknown',
    family: (data.tags || [])[0] || 'untagged',
    updated: data.updated || null,
    words: countWords(body),
    hasHero: (data.images || []).some((i) => i.role === 'hero'),
    sourcesCount: (data.sources || []).length,
    hasGeo: !!(data.geo?.lat != null && data.geo?.lng != null),
    hasOriginalImageOnDisk: (data.images || [])
      .filter((i) => i.source === 'original')
      .every((i) => existsSync(join(ROOT, 'assets/images/topics', slug, i.src || ''))),
  };
});

const now = new Date();
const STALE_DAYS = 365;
function ageDays(d) {
  if (!d) return null;
  const ms = now - new Date(d);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

const drafts = topics.filter((t) => t.status === 'draft' || t.status === 'stub');
const stale = topics.filter((t) => {
  const a = ageDays(t.updated);
  return a != null && a > STALE_DAYS;
});
const noHero = topics.filter((t) => !t.hasHero);
const noSources = topics.filter((t) => t.sourcesCount === 0);
const thinBodies = topics.filter((t) => t.status === 'complete' && t.words < 400);

const familyCounts = {};
for (const t of topics) familyCounts[t.family] = (familyCounts[t.family] || 0) + 1;

function list(items, render) {
  if (!items.length) return '_(none)_\n';
  return items.map(render).join('\n') + '\n';
}

const md = `# Content Report

_Generated ${now.toISOString().slice(0, 10)} · ${topics.length} topics_

## Status breakdown
- complete: ${topics.filter((t) => t.status === 'complete').length}
- draft: ${topics.filter((t) => t.status === 'draft').length}
- stub: ${topics.filter((t) => t.status === 'stub').length}
- other: ${topics.filter((t) => !['complete', 'draft', 'stub'].includes(t.status)).length}

## Drafts and stubs
${list(drafts, (t) => `- ${t.title} (${t.status}) — \`${t.slug}\``)}

## Stale (>${STALE_DAYS} days)
${list(stale, (t) => `- ${t.title} — last updated ${t.updated} (${ageDays(t.updated)} days)`)}

## Missing hero image
${list(noHero, (t) => `- ${t.title} — \`${t.slug}\``)}

## No sources
${list(noSources, (t) => `- ${t.title} — \`${t.slug}\``)}

## Thin bodies (complete, <400 words)
${list(thinBodies, (t) => `- ${t.title} — ${t.words} words`)}

## Family distribution
${Object.entries(familyCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

## Geo coverage
- with geo: ${topics.filter((t) => t.hasGeo).length}
- without geo: ${topics.filter((t) => !t.hasGeo).length}

## Word counts
- median: ${median(topics.map((t) => t.words))}
- min: ${Math.min(...topics.map((t) => t.words))}
- max: ${Math.max(...topics.map((t) => t.words))}
`;

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2);
}

mkdirSync(join(ROOT, 'local'), { recursive: true });
const out = join(ROOT, 'local/content-report.md');
writeFileSync(out, md);
console.log(`[report] wrote ${out.replace(ROOT + '/', '')} (${topics.length} topics)`);
