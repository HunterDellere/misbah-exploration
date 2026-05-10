// Tag index, timeline index, search.json
import { escapeHtml, escapeAttr } from './util.mjs';
import { familyFor } from './render.mjs';

export function renderTagsPage(topics) {
  const map = new Map();
  for (const t of topics) {
    for (const tag of t.tags || []) {
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag).push(t);
    }
  }
  const tags = [...map.entries()].sort((a, b) => b[1].length - a[1].length);

  const sections = tags
    .map(([tag, ts]) => {
      const items = ts
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((t) => {
          const fam = familyFor(t);
          return `<a class="tag-result" href="topics/${escapeAttr(t.slug)}.html">
        <span class="tag-result-title">${escapeHtml(t.title)}</span>
        <span class="tag-result-meta">${escapeHtml(fam.label)}${t.geo?.place ? ` · ${escapeHtml(t.geo.place)}` : ''}</span>
      </a>`;
        })
        .join('');
      return `<section class="tag-section" id="tag-${escapeAttr(tag)}">
      <header class="tag-section-header">
        <h2 class="tag-section-title">${escapeHtml(tag)}</h2>
        <span class="tag-section-count">${ts.length}</span>
      </header>
      <div class="tag-section-list">${items}</div>
    </section>`;
    })
    .join('');

  const cloud = tags
    .map(
      ([tag, ts]) =>
        `<a class="tag-cloud-chip" href="#tag-${escapeAttr(tag)}" data-weight="${ts.length}">
      <span>${escapeHtml(tag)}</span><span class="count">${ts.length}</span>
    </a>`,
    )
    .join('');

  return `
<header class="index-hero">
  <div class="index-hero-inner">
    <div class="index-hero-eyebrow">Index</div>
    <h1 class="index-hero-title">Browse by tag</h1>
    <p class="index-hero-sub">${tags.length} tags across ${topics.length} topics. Tap a chip to jump.</p>
  </div>
</header>
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="../index.html">Home</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <span aria-current="page">Tags</span>
</nav>
<main id="main-content" class="tags-page">
  <aside class="tag-cloud-wrap" aria-label="Tag cloud">
    ${cloud}
  </aside>
  <div class="tag-sections">
    ${sections}
  </div>
</main>`;
}

// Approximate "now" used to clamp `present`/null era ends.
const NOW_YEAR = 2030;

function eraEnd(t) {
  const e = t.era?.end;
  if (e === 'present' || e == null) return NOW_YEAR;
  return Number(e);
}

// Vertical timeline grouped into wide eras, sorted most-recent-first.
const ERA_BUCKETS = [
  { id: 'now', label: 'Now & the recent past', sub: '2000 → present', from: 2000, to: Infinity },
  { id: 'twentieth', label: 'The twentieth century', sub: '1900 — 2000', from: 1900, to: 2000 },
  { id: 'modern', label: 'The long nineteenth', sub: '1800 — 1900', from: 1800, to: 1900 },
  { id: 'early-modern', label: 'Early modern', sub: '1500 — 1800', from: 1500, to: 1800 },
  { id: 'medieval', label: 'The middle centuries', sub: '500 — 1500', from: 500, to: 1500 },
  { id: 'classical', label: 'Antiquity', sub: '500 BCE — 500 CE', from: -500, to: 500 },
  { id: 'ancient', label: 'Deep past', sub: 'before 500 BCE', from: -Infinity, to: -500 },
];

function bucketFor(start) {
  for (const b of ERA_BUCKETS) {
    if (start >= b.from && start < b.to) return b;
  }
  return ERA_BUCKETS[ERA_BUCKETS.length - 1];
}

export function renderTimelinePage(topics) {
  const dated = topics.filter((t) => t.era?.start != null);
  if (dated.length === 0) {
    return `<main class="timeline-page"><p>No dated topics yet.</p></main>`;
  }

  // Anchor: prefer era end (the topic's most-recent presence), break ties by
  // era start (older origins first within a bucket — "this began earlier
  // even though it persists today" reads naturally top-down).
  const sorted = [...dated].sort((a, b) => {
    const ea = eraEnd(a);
    const eb = eraEnd(b);
    if (eb !== ea) return eb - ea;
    return Number(a.era.start) - Number(b.era.start);
  });

  // Bucket by the most recent era end — a topic spanning antiquity to
  // present still belongs near "Now" because that's where the story is most
  // alive.
  const groups = new Map(ERA_BUCKETS.map((b) => [b.id, []]));
  for (const t of sorted) groups.get(bucketFor(eraEnd(t)).id).push(t);

  const minStart = Math.min(...dated.map((t) => Number(t.era.start)));
  const maxEnd = Math.max(...dated.map(eraEnd));

  const sections = ERA_BUCKETS.filter((b) => groups.get(b.id).length > 0)
    .map((b) => {
      const items = groups
        .get(b.id)
        .map((t) => renderTimelineItem(t))
        .join('\n');
      return `<section class="tl-era" id="era-${escapeAttr(b.id)}" aria-labelledby="era-${escapeAttr(b.id)}-h">
          <header class="tl-era-header">
            <span class="tl-era-marker" aria-hidden="true"></span>
            <div class="tl-era-text">
              <span class="tl-era-eyebrow">${escapeHtml(b.sub)}</span>
              <h2 class="tl-era-title" id="era-${escapeAttr(b.id)}-h">${escapeHtml(b.label)}</h2>
              <span class="tl-era-count">${groups.get(b.id).length} ${groups.get(b.id).length === 1 ? 'topic' : 'topics'}</span>
            </div>
          </header>
          <div class="tl-era-items">${items}</div>
        </section>`;
    })
    .join('\n');

  // Anchor strip — quick jump between era buckets.
  const anchors = ERA_BUCKETS.filter((b) => groups.get(b.id).length > 0)
    .map(
      (b) => `<a class="tl-anchor" href="#era-${escapeAttr(b.id)}">
          <span class="tl-anchor-label">${escapeHtml(b.label)}</span>
          <span class="tl-anchor-meta">${escapeHtml(b.sub)} · ${groups.get(b.id).length}</span>
        </a>`,
    )
    .join('');

  return `
<header class="index-hero index-hero--tight">
  <div class="index-hero-inner">
    <div class="index-hero-eyebrow">Index</div>
    <h1 class="index-hero-title">Timeline</h1>
    <p class="index-hero-sub">${dated.length} topics anchored in time, ordered from now backward to ${escapeHtml(formatYear(minStart))}. Stories that are still alive sit at the top.</p>
  </div>
</header>
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="../index.html">Home</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <span aria-current="page">Timeline</span>
</nav>
<main id="main-content" class="tl-page tl-page--vertical">
  <nav class="tl-anchors" aria-label="Jump to era">${anchors}</nav>
  <div class="tl-river">
    <div class="tl-spine" aria-hidden="true"></div>
    ${sections}
    <footer class="tl-river-end">
      <span class="tl-river-end-marker" aria-hidden="true"></span>
      <span class="tl-river-end-label">${escapeHtml(formatYear(minStart))}</span>
    </footer>
  </div>
</main>`;
}

function renderTimelineItem(t) {
  const fam = familyFor(t);
  const img = (t.images || []).find((i) => i.role === 'hero') || (t.images || [])[0];
  const thumb = img ? `../assets/images/topics/${t.slug}/${img.src}` : '';
  const place = t.geo?.place ? `<span class="tl-card-place">◉ ${escapeHtml(t.geo.place)}</span>` : '';
  const era = formatEra(t.era);
  return `<a class="tl-card" href="topics/${escapeAttr(t.slug)}.html"
        data-family="${escapeAttr(fam.color)}">
        <div class="tl-card-node" aria-hidden="true"><span class="tl-card-node-dot"></span></div>
        <div class="tl-card-era">
          <span class="tl-card-era-pill">${escapeHtml(era)}</span>
        </div>
        ${thumb ? `<div class="tl-card-thumb" style="background-image:url('${escapeAttr(thumb)}')" aria-hidden="true"></div>` : '<div class="tl-card-thumb tl-card-thumb--empty" aria-hidden="true"></div>'}
        <div class="tl-card-body">
          <div class="tl-card-meta">
            <span class="tl-card-fam" style="--fam-color: var(--topic-${fam.color})">${escapeHtml(fam.label)}</span>
            ${place}
          </div>
          <h3 class="tl-card-title">${escapeHtml(t.title)}</h3>
          ${t.summary ? `<p class="tl-card-summary">${escapeHtml(t.summary)}</p>` : ''}
        </div>
      </a>`;
}

function formatYear(v) {
  if (v < 0) return `${Math.abs(v)} BCE`;
  if (v >= 2025) return 'now';
  return `${v}`;
}
function formatEra(era) {
  const fmt = (v) => {
    if (v == null) return '?';
    if (v === 'present') return 'present';
    if (typeof v === 'number') return v < 0 ? `${Math.abs(v)} BCE` : `${v}`;
    return String(v);
  };
  return `${fmt(era.start)} — ${fmt(era.end)}`;
}

export function buildSearchIndex(topics, pillars) {
  const items = [];
  for (const t of topics) {
    items.push({
      kind: 'topic',
      slug: t.slug,
      title: t.title,
      summary: t.summary || '',
      tags: t.tags || [],
      pillar: t.pillar || null,
      place: t.geo?.place || '',
      url: `pages/topics/${t.slug}.html`,
    });
  }
  for (const p of pillars) {
    items.push({
      kind: 'pillar',
      slug: p.slug,
      title: p.title,
      summary: p.summary || '',
      tags: [],
      pillar: p.slug,
      place: '',
      url: `pages/pillars/${p.slug}.html`,
    });
  }
  return items;
}
