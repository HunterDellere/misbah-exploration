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

export function renderTimelinePage(topics) {
  const dated = topics.filter((t) => t.era?.start != null);
  if (dated.length === 0) {
    return `<main class="timeline-page"><p>No dated topics yet.</p></main>`;
  }

  const minStart = Math.min(...dated.map((t) => Number(t.era.start)));
  const maxEnd = Math.max(...dated.map(eraEnd));
  const span = Math.max(1, maxEnd - minStart);

  // Group by family lane.
  const laneOrder = [
    'history',
    'cartography',
    'science',
    'travel',
    'anthropology',
    'tea',
    'craft',
    'food',
    'experience',
    'vietnam',
    'default',
  ];
  const families = new Map();
  for (const t of dated) {
    const fam = familyFor(t);
    if (!families.has(fam.key)) {
      families.set(fam.key, { key: fam.key, label: fam.label, color: fam.color, items: [] });
    }
    families.get(fam.key).items.push(t);
  }
  const lanes = [...families.values()].sort(
    (a, b) => laneOrder.indexOf(a.key) - laneOrder.indexOf(b.key),
  );
  // Sort items inside each lane by start.
  for (const l of lanes) l.items.sort((a, b) => Number(a.era.start) - Number(b.era.start));

  const tickStep = chooseTickStep(span);
  const ticks = [];
  let firstTick = Math.ceil(minStart / tickStep) * tickStep;
  for (let v = firstTick; v <= maxEnd; v += tickStep) {
    const pos = ((v - minStart) / span) * 100;
    ticks.push(
      `<span class="tl-tick" style="left:${pos.toFixed(2)}%">
        <span class="tl-tick-line" aria-hidden="true"></span>
        <span class="tl-tick-label">${escapeHtml(formatYear(v))}</span>
      </span>`,
    );
  }

  // "Now" marker if range includes present-day.
  const showNow = maxEnd >= 2020 && minStart < 2020;
  const nowPos = showNow ? (((2025 - minStart) / span) * 100).toFixed(2) : null;

  const laneRows = lanes
    .map((l) => {
      // Pack items into sub-rows within the lane to avoid overlap.
      const subRows = packLane(l.items, minStart, span);
      const laneHeight = Math.max(1, subRows.length) * 40 + 16;
      const itemsHtml = subRows
        .flatMap((row, idx) =>
          row.map((t) => {
            const start = Number(t.era.start);
            const end = eraEnd(t);
            const pos = ((start - minStart) / span) * 100;
            const width = Math.max(1.5, ((end - start) / span) * 100);
            const isPoint = end - start <= span / 200;
            return `<a class="tl-item ${isPoint ? 'tl-item--point' : ''}" href="topics/${escapeAttr(t.slug)}.html"
              style="left:${pos.toFixed(2)}%; width:${width.toFixed(2)}%; top:${idx * 40 + 8}px;"
              data-family="${escapeAttr(l.color)}"
              title="${escapeAttr(t.title)} · ${escapeAttr(formatEra(t.era))}">
              <span class="tl-item-dot" aria-hidden="true"></span>
              <span class="tl-item-title">${escapeHtml(t.title)}</span>
              <span class="tl-item-era">${escapeHtml(formatEra(t.era))}</span>
            </a>`;
          }),
        )
        .join('\n');
      return `<div class="tl-lane" data-family="${escapeAttr(l.color)}">
          <div class="tl-lane-label">
            <span class="tl-lane-swatch" style="background: var(--topic-${l.color})" aria-hidden="true"></span>
            <span>${escapeHtml(l.label)}</span>
            <span class="tl-lane-count">${l.items.length}</span>
          </div>
          <div class="tl-lane-track" style="height:${laneHeight}px">
            ${itemsHtml}
          </div>
        </div>`;
    })
    .join('\n');

  return `
<header class="index-hero index-hero--tight">
  <div class="index-hero-inner">
    <div class="index-hero-eyebrow">Index</div>
    <h1 class="index-hero-title">Timeline</h1>
    <p class="index-hero-sub">${dated.length} topics anchored in time, from ${escapeHtml(formatYear(minStart))} to ${escapeHtml(formatYear(maxEnd))}. Lanes group by family. Drag horizontally to scan.</p>
  </div>
</header>
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="../index.html">Home</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <span aria-current="page">Timeline</span>
</nav>
<main id="main-content" class="tl-page">
  <div class="tl-scroll">
    <div class="tl-grid">
      <div class="tl-axis-spacer" aria-hidden="true"></div>
      <div class="tl-axis">
        ${ticks.join('')}
        ${showNow ? `<span class="tl-now" style="left:${nowPos}%" aria-hidden="true"><span class="tl-now-line"></span><span class="tl-now-label">now</span></span>` : ''}
      </div>
      ${laneRows}
    </div>
  </div>
</main>`;
}

// Greedy packing: each item placed in the first sub-row whose last item ends
// before this one starts (with a small gutter). Returns array of sub-row
// arrays.
function packLane(items, minStart, span) {
  const gutter = span / 80; // ~1.25% breathing room
  const rows = [];
  for (const t of items) {
    const start = Number(t.era.start);
    const end = eraEnd(t);
    let placed = false;
    for (const row of rows) {
      const last = row[row.length - 1];
      if (eraEnd(last) + gutter <= start) {
        row.push(t);
        placed = true;
        break;
      }
    }
    if (!placed) rows.push([t]);
  }
  return rows;
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
