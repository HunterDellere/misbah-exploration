import { escapeHtml, escapeAttr } from './util.mjs';
import { familyFor } from './render.mjs';

export function renderAtlasPage(topics) {
  const geo = topics.filter(t => t.geo?.lat != null && t.geo?.lng != null);

  const tagCounts = new Map();
  for (const t of geo) {
    for (const tag of (t.tags || [])) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16);

  const list = geo
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(t => {
      const fam = familyFor(t);
      return `<a class="atlas-list-item" href="topics/${escapeAttr(t.slug)}.html"
        data-slug="${escapeAttr(t.slug)}"
        data-tags="${escapeAttr((t.tags || []).join(' '))}">
        <span class="pin-dot" aria-hidden="true" style="background: var(--topic-${fam.color})"></span>
        <span>
          <strong>${escapeHtml(t.title)}</strong>
          <span class="place">${escapeHtml(t.geo.place || '')}</span>
        </span>
      </a>`;
    }).join('\n');

  const tagChips = topTags.map(([tag, count]) =>
    `<button class="tag-chip" type="button" data-tag="${escapeAttr(tag)}" aria-pressed="false">${escapeHtml(tag)} <span class="count">${count}</span></button>`
  ).join('\n');

  return `
<main id="main-content" class="atlas">
  <aside class="atlas-side">
    <h1>The atlas</h1>
    <p class="lede">Every topic anchored in a place. Drag the globe to wander; tap a pin to peek.</p>

    <h2>Filter by tag</h2>
    <div class="tag-cloud" role="group" aria-label="Filter topics by tag">
      ${tagChips || '<span class="lede">No tagged topics yet.</span>'}
    </div>

    <h2>All ${geo.length} pinned topic${geo.length === 1 ? '' : 's'}</h2>
    <nav class="atlas-list" aria-label="Pinned topics">
      ${list || '<span class="lede">No pinned topics yet.</span>'}
    </nav>
  </aside>

  <section class="atlas-stage" aria-label="Interactive globe">
    <div id="globe" role="application" aria-label="Globe of pinned topics"></div>
    <noscript><div class="globe-fallback-msg">The interactive globe needs JavaScript. The list to the left is the same data, accessible without it.</div></noscript>
    <article class="atlas-preview" id="atlas-preview" aria-live="polite" aria-atomic="true">
      <button class="atlas-preview-close" type="button" aria-label="Close preview">×</button>
      <img class="atlas-preview-img" id="atlas-preview-img" alt="" src="" decoding="async">
      <div class="atlas-preview-body">
        <div class="atlas-preview-eyebrow" id="atlas-preview-eyebrow"></div>
        <h2 class="atlas-preview-title" id="atlas-preview-title"></h2>
        <p class="atlas-preview-summary" id="atlas-preview-summary"></p>
        <a class="atlas-preview-cta" id="atlas-preview-cta" href="#">Open topic →</a>
      </div>
    </article>
  </section>
</main>

<script>window.__MISBAH_ATLAS_BASE__ = '';</script>
<script src="../scripts/atlas.js?v=1" defer></script>`;
}
