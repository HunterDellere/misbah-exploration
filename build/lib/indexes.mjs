// Tag index, timeline index, search.json
import { escapeHtml, escapeAttr } from './util.mjs';
import { familyFor } from './render.mjs';

export function renderTagsPage(topics) {
  const map = new Map();
  for (const t of topics) {
    for (const tag of (t.tags || [])) {
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag).push(t);
    }
  }
  const tags = [...map.entries()].sort((a, b) => b[1].length - a[1].length);

  const sections = tags.map(([tag, ts]) => {
    const items = ts.sort((a, b) => a.title.localeCompare(b.title)).map(t => {
      const fam = familyFor(t);
      return `<a class="tag-result" href="../topics/${escapeAttr(t.slug)}.html">
        <span class="tag-result-title">${escapeHtml(t.title)}</span>
        <span class="tag-result-meta">${escapeHtml(fam.label)}${t.geo?.place ? ` · ${escapeHtml(t.geo.place)}` : ''}</span>
      </a>`;
    }).join('');
    return `<section class="tag-section" id="tag-${escapeAttr(tag)}">
      <header class="tag-section-header">
        <h2 class="tag-section-title">${escapeHtml(tag)}</h2>
        <span class="tag-section-count">${ts.length}</span>
      </header>
      <div class="tag-section-list">${items}</div>
    </section>`;
  }).join('');

  const cloud = tags.map(([tag, ts]) =>
    `<a class="tag-cloud-chip" href="#tag-${escapeAttr(tag)}" data-weight="${ts.length}">
      <span>${escapeHtml(tag)}</span><span class="count">${ts.length}</span>
    </a>`
  ).join('');

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

export function renderTimelinePage(topics) {
  const dated = topics.filter(t => t.era?.start != null);
  if (dated.length === 0) {
    return `<main class="timeline-page"><p>No dated topics yet.</p></main>`;
  }

  // Compute era bounds
  const minStart = Math.min(...dated.map(t => Number(t.era.start)));
  const maxEnd = Math.max(...dated.map(t => {
    const e = t.era.end;
    if (e === 'present' || e == null) return 2030;
    return Number(e);
  }));

  // Logarithmic-ish positioning: bucket into eras
  const span = maxEnd - minStart;
  const items = dated
    .slice()
    .sort((a, b) => Number(a.era.start) - Number(b.era.start))
    .map(t => {
      const start = Number(t.era.start);
      const end = t.era.end === 'present' || t.era.end == null ? 2030 : Number(t.era.end);
      const pos = ((start - minStart) / span) * 100;
      const width = Math.max(2, ((end - start) / span) * 100);
      const fam = familyFor(t);
      return `<a class="timeline-item" href="../topics/${escapeAttr(t.slug)}.html"
        style="left:${pos.toFixed(2)}%; width:${width.toFixed(2)}%"
        data-family="${fam.color}">
        <span class="timeline-item-title">${escapeHtml(t.title)}</span>
        <span class="timeline-item-era">${formatEra(t.era)}</span>
      </a>`;
    });

  // Generate axis ticks
  const ticks = [];
  const tickStep = chooseTickStep(span);
  let firstTick = Math.ceil(minStart / tickStep) * tickStep;
  for (let v = firstTick; v <= maxEnd; v += tickStep) {
    const pos = ((v - minStart) / span) * 100;
    ticks.push(`<span class="timeline-tick" style="left:${pos.toFixed(2)}%">
      <span class="timeline-tick-line" aria-hidden="true"></span>
      <span class="timeline-tick-label">${formatYear(v)}</span>
    </span>`);
  }

  return `
<header class="index-hero">
  <div class="index-hero-inner">
    <div class="index-hero-eyebrow">Index</div>
    <h1 class="index-hero-title">Timeline</h1>
    <p class="index-hero-sub">${dated.length} topics anchored in time, from ${formatYear(minStart)} to ${formatYear(maxEnd)}.</p>
  </div>
</header>
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="../index.html">Home</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <span aria-current="page">Timeline</span>
</nav>
<main id="main-content" class="timeline-page">
  <div class="timeline-scroll">
    <div class="timeline-track">
      <div class="timeline-axis" aria-hidden="true">${ticks.join('')}</div>
      <div class="timeline-items">${items.join('')}</div>
    </div>
  </div>
  <p class="timeline-hint">Drag horizontally on touch devices, or scroll. Bars show the era a topic spans.</p>
</main>`;
}

function chooseTickStep(span) {
  const candidates = [50, 100, 200, 500, 1000, 2000];
  for (const c of candidates) if (span / c < 12) return c;
  return 5000;
}
function formatYear(v) {
  if (v < 0) return `${Math.abs(v)} BCE`;
  if (v >= 2025) return 'now';
  return `${v}`;
}
function formatEra(era) {
  const fmt = v => {
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
