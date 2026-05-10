import { marked } from 'marked';
import { escapeHtml, escapeAttr } from './util.mjs';

marked.setOptions({ gfm: true, breaks: false });

const TOPIC_FAMILIES = {
  tea: { label: 'Tea',          color: 'tea' },
  history: { label: 'History',  color: 'history' },
  travel: { label: 'Travel',    color: 'travel' },
  anthropology: { label: 'Anthropology', color: 'anthro' },
  science: { label: 'Science',  color: 'science' },
  craft: { label: 'Craft',      color: 'craft' },
  experience: { label: 'Experience', color: 'experience' },
  food: { label: 'Food',        color: 'food' },
};

export function familyFor(topic) {
  for (const t of (topic.tags || [])) {
    if (TOPIC_FAMILIES[t]) return { key: t, ...TOPIC_FAMILIES[t] };
  }
  return { key: 'default', label: 'Topic', color: 'default' };
}

export function renderTopicPage(topic, all) {
  const fam = familyFor(topic);
  const hero = (topic.images || []).find(i => i.role === 'hero') || (topic.images || [])[0];
  const heroSrc = hero ? imagePath(topic.slug, hero.src) : null;
  const heroVariant = hero ? '' : 'topic-hero--minimal';

  const heroAttrib = hero ? renderHeroAttrib(hero) : '';
  const meta = [];
  if (topic.geo?.place) meta.push(`<span class="pin">◉ ${escapeHtml(topic.geo.place)}</span>`);
  if (topic.era) meta.push(escapeHtml(formatEra(topic.era)));
  meta.push(escapeHtml(fam.label));

  const heroBlock = `
    <header class="topic-hero ${heroVariant}" data-family="${fam.color}">
      ${heroSrc ? `<img class="topic-hero-img" src="${escapeAttr(heroSrc)}" alt="${escapeAttr(hero.alt || topic.title)}" loading="eager" decoding="async">` : ''}
      <div class="topic-hero-overlay">
        <div class="topic-hero-overlay-inner">
          <div class="topic-hero-meta">${meta.join('<span aria-hidden="true">·</span>')}</div>
          <h1 class="topic-hero-title">${escapeHtml(topic.title)}</h1>
          ${topic.summary ? `<p class="topic-hero-summary">${escapeHtml(topic.summary)}</p>` : ''}
        </div>
      </div>
      ${heroAttrib}
    </header>`;

  const bodyHtml = topic.body ? marked.parse(topic.body) : '';
  const inlineImages = (topic.images || []).filter(i => i.role !== 'hero').map(img => renderFigure(topic.slug, img)).join('\n');

  const sources = (topic.sources || []).length
    ? `<section class="sources" aria-label="Sources">
        <h2>Sources & further reading</h2>
        <ol>
          ${topic.sources.map(s => `<li><a href="${escapeAttr(s.url || '#')}" rel="noopener noreferrer" target="_blank">${escapeHtml(s.title || s.url)}</a>${s.note ? ` — <span>${escapeHtml(s.note)}</span>` : ''}</li>`).join('\n')}
        </ol>
      </section>`
    : '';

  const related = computeRelated(topic, all);
  const constellation = related.length ? renderConstellation(related) : '';

  return `
${heroBlock}
<main id="main-content" class="topic-body" data-family-bg="${fam.color}">
  <div class="read-column">
    ${bodyHtml}
    ${inlineImages}
    ${sources}
  </div>
</main>
${constellation}`;
}

function renderHeroAttrib(img) {
  if (img.source === 'original') {
    return `<div class="topic-hero-attrib">Photo · Hunter Dellere</div>`;
  }
  const credit = escapeHtml(img.credit || 'External');
  const license = img.license ? ` · ${escapeHtml(img.license)}` : '';
  const link = img.url
    ? `<a href="${escapeAttr(img.url)}" rel="noopener noreferrer" target="_blank">${credit}</a>`
    : credit;
  return `<div class="topic-hero-attrib">Image · ${link}${license}</div>`;
}

function renderFigure(slug, img) {
  const src = imagePath(slug, img.src);
  const alt = escapeAttr(img.alt || '');
  const tag = img.source === 'original'
    ? `<span class="credit-tag credit-tag--original">Original</span>`
    : `<span class="credit-tag credit-tag--external">External</span>`;
  const credit = img.source === 'original'
    ? `Hunter Dellere`
    : (img.url ? `<a href="${escapeAttr(img.url)}" rel="noopener noreferrer" target="_blank">${escapeHtml(img.credit || 'Source')}</a>` : escapeHtml(img.credit || 'Source'));
  const license = img.license ? ` · ${escapeHtml(img.license)}` : '';
  const caption = img.caption ? `<span>${escapeHtml(img.caption)}</span>` : '';
  return `<figure class="figure">
  <img src="${escapeAttr(src)}" alt="${alt}" loading="lazy" decoding="async">
  <figcaption class="figure-caption">${tag}<span>${credit}${license}</span>${caption}</figcaption>
</figure>`;
}

function imagePath(slug, src) {
  if (/^https?:/i.test(src)) return src;
  return `../../assets/images/topics/${slug}/${src}`;
}

function formatEra(era) {
  if (!era) return '';
  const s = era.start ?? '?';
  const e = era.end ?? 'present';
  return `${s} — ${e}`;
}

function computeRelated(topic, all) {
  // Explicit related[] wins, fall back to overlapping tags
  const explicit = (topic.related || [])
    .map(s => all.find(t => t.slug === s))
    .filter(Boolean);
  if (explicit.length >= 3) return explicit.slice(0, 6);

  const others = all.filter(t => t.slug !== topic.slug);
  const tagSet = new Set(topic.tags || []);
  const scored = others.map(t => ({
    t,
    score: (t.tags || []).filter(x => tagSet.has(x)).length,
  })).filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.t);

  const seen = new Set(explicit.map(t => t.slug));
  const merged = [...explicit];
  for (const t of scored) {
    if (seen.has(t.slug)) continue;
    merged.push(t);
    seen.add(t.slug);
    if (merged.length >= 6) break;
  }
  return merged;
}

function renderConstellation(related) {
  return `
<aside class="constellation" aria-label="Nearby topics">
  <div class="constellation-inner">
    <h2>Nearby in the atlas</h2>
    <div class="constellation-grid">
      ${related.map(t => {
        const img = (t.images || []).find(i => i.role === 'hero') || (t.images || [])[0];
        const src = img ? imagePath(t.slug, img.src) : '';
        const fam = familyFor(t);
        return `<a class="constel-card" href="../topics/${escapeAttr(t.slug)}.html">
          <div class="constel-card-img" ${src ? `style="background-image:url('${escapeAttr(src)}')"` : ''}></div>
          <div class="constel-card-body">
            <div class="constel-card-eyebrow">${escapeHtml(fam.label)}${t.geo?.place ? ` · ${escapeHtml(t.geo.place)}` : ''}</div>
            <h3 class="constel-card-title">${escapeHtml(t.title)}</h3>
          </div>
        </a>`;
      }).join('\n')}
    </div>
  </div>
</aside>`;
}

export function pickTileSize(idx, total) {
  // Deterministic asymmetric pattern, never two large adjacent
  const pattern = ['lg', 'sm', 'sm', 'md', 'tall', 'sm', 'wide', 'xs', 'xs', 'md', 'sm', 'sm'];
  return 'tile--' + pattern[idx % pattern.length];
}

export function renderHomeMosaic(topics) {
  // Order by `featured` first, then updated desc, then title.
  const sorted = [...topics].sort((a, b) => {
    if ((b.featured ? 1 : 0) - (a.featured ? 1 : 0)) return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    if (a.updated && b.updated) return String(b.updated).localeCompare(String(a.updated));
    return a.title.localeCompare(b.title);
  });

  const tiles = sorted.map((t, idx) => {
    const fam = familyFor(t);
    const img = (t.images || []).find(i => i.role === 'hero') || (t.images || [])[0];
    const src = img ? `../assets/images/topics/${t.slug}/${img.src}` : '';
    const size = pickTileSize(idx, sorted.length);
    const meta = [];
    meta.push(escapeHtml(fam.label));
    if (t.geo?.place) meta.push(`◉ ${escapeHtml(t.geo.place)}`);
    return `<a class="tile ${size} reveal" href="pages/topics/${escapeAttr(t.slug)}.html"
      style="--tile-bg: url('${escapeAttr(src)}')"
      aria-label="${escapeAttr(t.title)}">
      <div class="tile-overlay">
        <div class="tile-eyebrow">${meta.map(m => `<span>${m}</span>`).join('')}</div>
        <h2 class="tile-title">${escapeHtml(t.title)}</h2>
        ${t.summary ? `<p class="tile-summary">${escapeHtml(t.summary)}</p>` : ''}
      </div>
    </a>`;
  }).join('\n');

  return `
<main id="main-content" class="home">
  <header class="home-hero">
    <div>
      <h1 class="home-hero-title">An atlas of <em>things worth a longer look</em>.</h1>
      <p class="home-hero-sub">A personal collection — tea, anthropology, travel, history, craft, and what I happened to find absorbing along the way.</p>
    </div>
    <aside class="home-hero-aside">
      ${topics.length} topic${topics.length === 1 ? '' : 's'} · curated by Hunter Dellere
    </aside>
  </header>
  <div class="mosaic">
    ${tiles}
  </div>
</main>`;
}
