import { escapeHtml, escapeAttr } from './util.mjs';
import { familyFor } from './render.mjs';

export function renderAtlasPage(topics) {
  const geo = topics.filter((t) => t.geo?.lat != null && t.geo?.lng != null);

  const tagCounts = new Map();
  for (const t of geo) {
    for (const tag of t.tags || []) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);

  // Group by region for readable scanning. Lat/lng buckets → coarse continents.
  const REGIONS = [
    { id: 'asia', label: 'Asia', test: (t) => t.geo.lng >= 60 && t.geo.lng <= 150 && t.geo.lat >= 0 },
    { id: 'europe', label: 'Europe', test: (t) => t.geo.lng >= -10 && t.geo.lng <= 60 && t.geo.lat >= 35 },
    { id: 'africa', label: 'Africa & Med.', test: (t) => t.geo.lng >= -20 && t.geo.lng <= 60 && t.geo.lat < 35 && t.geo.lat >= -40 },
    { id: 'americas', label: 'Americas', test: (t) => t.geo.lng >= -170 && t.geo.lng <= -30 },
    { id: 'pacific', label: 'Pacific & Oceania', test: (t) => t.geo.lng > 150 || t.geo.lng < -170 || (t.geo.lng > 100 && t.geo.lat < 0) },
    { id: 'cosmic', label: 'Beyond', test: (t) => t.geo.precision === 'broad' && t.geo.lat === 0 && t.geo.lng === 0 },
  ];

  function bucket(t) {
    for (const r of REGIONS) if (r.test(t)) return r.id;
    return 'asia';
  }

  const grouped = new Map(REGIONS.map((r) => [r.id, []]));
  for (const t of geo.slice().sort((a, b) => a.title.localeCompare(b.title))) {
    grouped.get(bucket(t)).push(t);
  }

  const regionBlocks = REGIONS.filter((r) => grouped.get(r.id).length > 0)
    .map((r) => {
      const items = grouped
        .get(r.id)
        .map((t) => {
          const fam = familyFor(t);
          return `<a class="atlas-list-item" href="topics/${escapeAttr(t.slug)}.html"
              data-slug="${escapeAttr(t.slug)}"
              data-tags="${escapeAttr((t.tags || []).join(' '))}"
              data-family="${escapeAttr(fam.key)}">
              <span class="pin-dot" aria-hidden="true" style="background: var(--topic-${fam.color})"></span>
              <span class="atlas-list-text">
                <span class="atlas-list-title">${escapeHtml(t.title)}</span>
                <span class="atlas-list-place">${escapeHtml(t.geo.place || '')}</span>
              </span>
            </a>`;
        })
        .join('\n');
      return `<section class="atlas-region" data-region="${escapeAttr(r.id)}">
          <header class="atlas-region-header">
            <span class="atlas-region-label">${escapeHtml(r.label)}</span>
            <span class="atlas-region-count">${grouped.get(r.id).length}</span>
          </header>
          <div class="atlas-region-list">${items}</div>
        </section>`;
    })
    .join('\n');

  const tagChips = topTags
    .map(
      ([tag, count]) =>
        `<button class="tag-chip" type="button" data-tag="${escapeAttr(tag)}" aria-pressed="false">${escapeHtml(tag)}<span class="count">${count}</span></button>`,
    )
    .join('\n');

  return `
<header class="atlas-header">
  <div class="atlas-header-inner">
    <div class="atlas-header-eyebrow">The Atlas</div>
    <h1 class="atlas-header-title">${geo.length} places worth a longer look</h1>
    <p class="atlas-header-sub">Drag the globe to wander. Hover the list to peek. Tap a pin or row to open.</p>
  </div>
  <nav class="breadcrumbs atlas-breadcrumbs" aria-label="Breadcrumb">
    <a href="../index.html">Home</a>
    <span class="breadcrumb-sep" aria-hidden="true">›</span>
    <span aria-current="page">Atlas</span>
  </nav>
</header>

<main id="main-content" class="atlas">
  <section class="atlas-stage" aria-label="Interactive globe">
    <div id="globe" role="application" aria-label="Globe of pinned topics"></div>
    <noscript><div class="globe-fallback-msg">The interactive globe needs JavaScript. The list is the same data, accessible without it.</div></noscript>

    <article class="atlas-preview" id="atlas-preview" aria-live="polite" aria-atomic="true">
      <div class="atlas-preview-media">
        <img class="atlas-preview-img" id="atlas-preview-img" alt="" src="" decoding="async">
        <button class="atlas-preview-close" type="button" aria-label="Close preview">×</button>
        <div class="atlas-preview-family" id="atlas-preview-family"></div>
      </div>
      <div class="atlas-preview-body">
        <div class="atlas-preview-meta">
          <span class="atlas-preview-place" id="atlas-preview-place"></span>
          <span class="atlas-preview-era" id="atlas-preview-era"></span>
        </div>
        <h2 class="atlas-preview-title" id="atlas-preview-title"></h2>
        <p class="atlas-preview-summary" id="atlas-preview-summary"></p>
        <a class="atlas-preview-cta" id="atlas-preview-cta" href="#">Read the topic <span aria-hidden="true">→</span></a>
      </div>
    </article>
  </section>

  <aside class="atlas-side">
    <div class="atlas-side-sticky">
      <label class="atlas-search">
        <span class="sr-only">Search the atlas</span>
        <input type="search" id="atlas-search" placeholder="Search ${geo.length} places…" autocomplete="off">
      </label>

      <div class="atlas-side-section">
        <div class="atlas-side-section-label">Filter by tag</div>
        <div class="tag-cloud" role="group" aria-label="Filter topics by tag">
          ${tagChips || '<span class="lede">No tagged topics yet.</span>'}
        </div>
        <button class="tag-clear" type="button" id="atlas-clear" hidden>Clear filters</button>
      </div>
    </div>

    <nav class="atlas-list" aria-label="Pinned topics">
      ${regionBlocks || '<span class="lede">No pinned topics yet.</span>'}
    </nav>
  </aside>
</main>

<script>window.__MISBAH_ATLAS_BASE__ = '';</script>
<script src="../scripts/atlas.js?v=5" defer></script>`;
}
