import { marked } from 'marked';
import { escapeHtml, escapeAttr, slugify } from './util.mjs';

marked.setOptions({ gfm: true, breaks: false });

const TOPIC_FAMILIES = {
  tea: { label: 'Tea',          color: 'tea' },
  history: { label: 'History',  color: 'history' },
  travel: { label: 'Travel',    color: 'travel' },
  anthropology: { label: 'Anthropology', color: 'anthro' },
  science: { label: 'Science',  color: 'science' },
  cartography: { label: 'Cartography', color: 'science' },
  craft: { label: 'Craft',      color: 'craft' },
  experience: { label: 'Experience', color: 'experience' },
  food: { label: 'Food',        color: 'food' },
  vietnam: { label: 'Vietnam',  color: 'vietnam' },
  geography: { label: 'Geography', color: 'science' },
};

const PILLAR_LABELS = {
  anthropology: 'Anthropology',
  tea: 'Tea',
  cartography: 'Cartography',
  vietnam: 'Vietnam',
};

// Pick a thumbnail URL for a topic. Prefers a generated webp variant
// (much smaller than the raw jpg hero) and accepts a size preference:
// 'small' → smallest variant (~80–150KB for cards/tiles), 'large' →
// largest variant (for spotlight). Falls back to the raw image src if
// no variants exist.
export function thumbSrc(topic, prefix = '../assets/images/topics', size = 'small') {
  const img = (topic.images || []).find((i) => i.role === 'hero') || (topic.images || [])[0];
  if (!img) return '';
  const variants = topic.heroVariants || [];
  if (variants.length > 0) {
    const v = size === 'large' ? variants[variants.length - 1] : variants[0];
    return `${prefix}/${topic.slug}/${v.file}`;
  }
  return `${prefix}/${topic.slug}/${img.src}`;
}

export function familyFor(topic) {
  // Pillar takes precedence over tag-based family
  if (topic.pillar && TOPIC_FAMILIES[topic.pillar]) {
    return { key: topic.pillar, ...TOPIC_FAMILIES[topic.pillar] };
  }
  for (const t of (topic.tags || [])) {
    if (TOPIC_FAMILIES[t]) return { key: t, ...TOPIC_FAMILIES[t] };
  }
  return { key: 'default', label: 'Topic', color: 'default' };
}

// Inject heading IDs and collect TOC entries from rendered HTML.
function injectHeadingIdsAndCollectToc(html) {
  const toc = [];
  const used = new Set();
  const result = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    let id = slugify(text);
    if (!id) id = 'section';
    let unique = id, i = 2;
    while (used.has(unique)) unique = `${id}-${i++}`;
    used.add(unique);
    toc.push({ level: Number(level), id: unique, text });
    return `<h${level} id="${unique}"><a class="anchor-link" href="#${unique}" aria-label="Link to this section"><span aria-hidden="true">§</span></a>${inner}</h${level}>`;
  });
  return { html: result, toc };
}

function renderTocSidebar(toc) {
  if (toc.length < 3) return '';
  const items = toc.map(item => {
    const cls = `toc-item toc-item--${item.level === 2 ? 'h2' : 'h3'}`;
    return `<li class="${cls}"><a href="#${item.id}" data-toc-target="${item.id}">${escapeHtml(item.text)}</a></li>`;
  }).join('');
  return `<aside class="toc" aria-label="On this page">
    <div class="toc-eyebrow">On this page</div>
    <ul class="toc-list">${items}</ul>
  </aside>`;
}

function pillarHref(slug, depth = 2) {
  const up = '../'.repeat(depth);
  return `${up}pages/pillars/${slug}.html`;
}

function topicHref(slug, depth = 2) {
  const up = '../'.repeat(depth);
  return `${up}pages/topics/${slug}.html`;
}

function rootHref(depth = 2) {
  return '../'.repeat(depth) + 'index.html';
}

function renderBreadcrumbs(topic, depth = 2) {
  const crumbs = [`<a href="${rootHref(depth)}">Home</a>`];
  if (topic.pillar && PILLAR_LABELS[topic.pillar]) {
    crumbs.push(`<a href="${pillarHref(topic.pillar, depth)}">${PILLAR_LABELS[topic.pillar]}</a>`);
  }
  crumbs.push(`<span aria-current="page">${escapeHtml(topic.title)}</span>`);
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">
    ${crumbs.join('<span class="breadcrumb-sep" aria-hidden="true">›</span>')}
  </nav>`;
}

function renderPillarNav(topic, all) {
  if (!topic.pillar) return '';
  const siblings = all
    .filter(t => t.pillar === topic.pillar)
    .sort((a, b) => (a.order || 99) - (b.order || 99));
  const idx = siblings.findIndex(t => t.slug === topic.slug);
  if (idx === -1) return '';
  const prev = siblings[idx - 1];
  const next = siblings[idx + 1];
  const pillarLabel = PILLAR_LABELS[topic.pillar] || topic.pillar;
  const total = siblings.length;
  return `<nav class="pillar-nav" aria-label="Pillar navigation">
    <div class="pillar-nav-inner">
      ${prev ? `<a class="pillar-nav-prev" href="${topicHref(prev.slug, 2)}">
        <span class="pillar-nav-eyebrow">← Previous in ${escapeHtml(pillarLabel)}</span>
        <span class="pillar-nav-title">${escapeHtml(prev.title)}</span>
      </a>` : '<span></span>'}
      <a class="pillar-nav-up" href="${pillarHref(topic.pillar, 2)}">
        <span class="pillar-nav-eyebrow">${escapeHtml(pillarLabel)}</span>
        <span class="pillar-nav-position">${idx + 1} / ${total}</span>
      </a>
      ${next ? `<a class="pillar-nav-next" href="${topicHref(next.slug, 2)}">
        <span class="pillar-nav-eyebrow">Next in ${escapeHtml(pillarLabel)} →</span>
        <span class="pillar-nav-title">${escapeHtml(next.title)}</span>
      </a>` : '<span></span>'}
    </div>
  </nav>`;
}

export function renderTopicPage(topic, all) {
  const fam = familyFor(topic);
  const hero = (topic.images || []).find(i => i.role === 'hero') || (topic.images || [])[0];
  const heroSrc = hero ? imagePath(topic.slug, hero.src) : null;
  const heroVariant = hero ? '' : 'topic-hero--minimal';

  const heroAttrib = hero ? renderHeroAttrib(hero) : '';
  const meta = [];
  if (topic.geo?.place) {
    // Make the place a deep-link to the atlas, anchored on this topic.
    // Atlas reads ?slug=… on load and opens the preview + flies the
    // globe to the matching pin.
    meta.push(
      `<a class="pin pin--link" href="../atlas.html?slug=${escapeAttr(topic.slug)}" title="Open ${escapeAttr(topic.geo.place)} on the atlas">◉ ${escapeHtml(topic.geo.place)}</a>`,
    );
  }
  if (topic.era) meta.push(escapeHtml(formatEra(topic.era)));
  meta.push(escapeHtml(fam.label));
  if (topic.readingMinutes) meta.push(`<span class="reading-time">${topic.readingMinutes} min read</span>`);

  const heroBlock = `
    <header class="topic-hero ${heroVariant}" data-family="${fam.color}">
      ${heroSrc ? renderHeroImg(topic, hero, heroSrc) : ''}
      ${heroSrc ? '<div class="topic-hero-scrollcue" aria-hidden="true"><span>Read</span></div>' : ''}
      <div class="topic-hero-overlay">
        <div class="topic-hero-overlay-inner">
          <div class="topic-hero-meta">${meta.join('<span aria-hidden="true">·</span>')}</div>
          <h1 class="topic-hero-title">${escapeHtml(topic.title)}</h1>
          ${topic.summary ? `<p class="topic-hero-summary">${escapeHtml(topic.summary)}</p>` : ''}
        </div>
      </div>
      ${heroAttrib}
    </header>`;

  const rawHtml = topic.body ? marked.parse(topic.body) : '';
  const { html: bodyHtml, toc } = injectHeadingIdsAndCollectToc(rawHtml);
  const tocSidebar = renderTocSidebar(toc);

  const inlineImages = (topic.images || []).filter(i => i.role !== 'hero').map(img => renderFigure(topic.slug, img)).join('\n');

  const sources = (topic.sources || []).length
    ? `<section class="sources" aria-label="Sources">
        <h2 id="sources">Sources & further reading</h2>
        <ol>
          ${topic.sources.map(s => `<li><a href="${escapeAttr(s.url || '#')}" rel="noopener noreferrer" target="_blank">${escapeHtml(s.title || s.url)}</a>${s.note ? ` — <span>${escapeHtml(s.note)}</span>` : ''}</li>`).join('\n')}
        </ol>
      </section>`
    : '';

  const related = computeRelated(topic, all);
  const constellation = related.length ? renderConstellation(related) : '';
  const pillarNav = renderPillarNav(topic, all);
  const breadcrumbs = renderBreadcrumbs(topic, 2);

  const wordCount = (topic.body || '').split(/\s+/).filter(Boolean).length;
  const readingTimeMin = Math.max(1, Math.round(wordCount / 220));

  return `
${heroBlock}
<div class="reading-progress" aria-hidden="true"><div class="reading-progress-bar"></div></div>
${breadcrumbs}
<main id="main-content" class="topic-body${tocSidebar ? ' has-toc' : ''}" data-family-bg="${fam.color}">
  ${tocSidebar}
  <article class="read-column">
    <div class="read-meta">
      <span class="read-meta-time">${readingTimeMin} min read</span>
      <span class="read-meta-sep" aria-hidden="true">·</span>
      <span class="read-meta-words">${wordCount.toLocaleString()} words</span>
      ${topic.updated ? `<span class="read-meta-sep" aria-hidden="true">·</span><span class="read-meta-updated">Updated ${escapeHtml(formatDate(topic.updated))}</span>` : ''}
    </div>
    ${bodyHtml}
    ${inlineImages}
    ${sources}
  </article>
</main>
${pillarNav}
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

function renderHeroImg(topic, hero, heroSrc) {
  const variants = topic.heroVariants || [];
  const alt = escapeAttr(hero.alt || topic.title);
  if (variants.length === 0) {
    return `<img class="topic-hero-img" src="${escapeAttr(heroSrc)}" alt="${alt}" loading="eager" decoding="async" fetchpriority="high">`;
  }
  const srcset = variants
    .map((v) => `../../assets/images/topics/${topic.slug}/${v.file} ${v.width}w`)
    .join(', ');
  const fallback = variants[variants.length - 1].file;
  return `<picture>
        <source type="image/webp" srcset="${escapeAttr(srcset)}" sizes="(min-width: 1200px) 1200px, 100vw">
        <img class="topic-hero-img" src="../../assets/images/topics/${escapeAttr(topic.slug)}/${escapeAttr(fallback)}" alt="${alt}" loading="eager" decoding="async" fetchpriority="high">
      </picture>`;
}

function formatEra(era) {
  if (!era) return '';
  const fmt = v => {
    if (v == null) return '?';
    if (v === 'present') return 'present';
    if (typeof v === 'number') return v < 0 ? `${Math.abs(v)} BCE` : `${v} CE`;
    return String(v);
  };
  return `${fmt(era.start)} — ${fmt(era.end)}`;
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function computeRelated(topic, all) {
  const explicit = (topic.related || [])
    .map(s => all.find(t => t.slug === s))
    .filter(Boolean);
  if (explicit.length >= 4) return explicit.slice(0, 6);

  const others = all.filter(t => t.slug !== topic.slug);
  const tagSet = new Set(topic.tags || []);
  const scored = others.map(t => ({
    t,
    score: (t.tags || []).filter(x => tagSet.has(x)).length + (t.pillar === topic.pillar ? 1 : 0),
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
        const src = thumbSrc(t, '../../assets/images/topics', 'small');
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

function pickTileSize(idx) {
  // Deterministic asymmetric pattern, never two large adjacent
  const pattern = ['lg', 'sm', 'sm', 'md', 'tall', 'sm', 'wide', 'xs', 'xs', 'md', 'sm', 'sm'];
  return 'tile--' + pattern[idx % pattern.length];
}

export function renderHomeMosaic(topics, pillars = []) {
  const featuredFirst = [...topics].sort((a, b) => {
    if ((b.featured ? 1 : 0) - (a.featured ? 1 : 0)) return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    if (a.updated && b.updated) return String(b.updated).localeCompare(String(a.updated));
    return a.title.localeCompare(b.title);
  });

  // Above-the-fold spotlight: up to 4 picks. Prefer explicitly `featured: true`
  // first, then most recently updated. Always at least one card so the fold
  // is never empty.
  const spotlightPool = featuredFirst.filter((t) => t.images && t.images.length);
  const spotlight = spotlightPool.slice(0, 4);
  const spotlightSlugs = new Set(spotlight.map((t) => t.slug));

  // Recently updated band — newest 6, excluding spotlight, with covers.
  const recent = [...topics]
    .filter((t) => !spotlightSlugs.has(t.slug) && t.images && t.images.length)
    .sort((a, b) => String(b.updated || '').localeCompare(String(a.updated || '')))
    .slice(0, 6);

  // Pick a place-rich byline for spotlight cards.
  const spotlightCards = spotlight.map((t, idx) => {
    const fam = familyFor(t);
    const src = thumbSrc(t, 'assets/images/topics', idx === 0 ? 'large' : 'small');
    const place = t.geo?.place ? `<span>◉ ${escapeHtml(t.geo.place)}</span>` : '';
    return `<a class="spot-card spot-card--${idx === 0 ? 'lead' : 'sub'}" href="pages/topics/${escapeAttr(t.slug)}.html"
        style="--spot-bg: url('${escapeAttr(src)}')"
        aria-label="${escapeAttr(t.title)}">
        <div class="spot-card-overlay">
          <div class="spot-card-eyebrow"><span>${escapeHtml(fam.label)}</span>${place}</div>
          <h3 class="spot-card-title">${escapeHtml(t.title)}</h3>
          ${t.summary ? `<p class="spot-card-summary">${escapeHtml(t.summary)}</p>` : ''}
          <span class="spot-card-cta">Read →</span>
        </div>
      </a>`;
  }).join('\n');

  const recentCards = recent.map((t) => {
    const fam = familyFor(t);
    const src = thumbSrc(t, 'assets/images/topics', 'small');
    return `<a class="recent-card" href="pages/topics/${escapeAttr(t.slug)}.html">
        <div class="recent-card-thumb" style="background-image:url('${escapeAttr(src)}')" aria-hidden="true"></div>
        <div class="recent-card-body">
          <div class="recent-card-eyebrow">${escapeHtml(fam.label)}${t.geo?.place ? ` · ${escapeHtml(t.geo.place)}` : ''}</div>
          <h3 class="recent-card-title">${escapeHtml(t.title)}</h3>
        </div>
      </a>`;
  }).join('\n');

  const tiles = featuredFirst.map((t, idx) => {
    const fam = familyFor(t);
    const src = thumbSrc(t, 'assets/images/topics', 'small');
    const size = pickTileSize(idx);
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

  const pillarStrip = pillars.length ? `
  <section class="pillar-strip" aria-label="Pillars">
    <div class="pillar-strip-inner">
      <div class="section-header">
        <div>
          <div class="pillar-strip-eyebrow">The four pillars</div>
          <h2 class="section-title">Long arcs, read in order</h2>
        </div>
      </div>
      <div class="pillar-strip-grid">
        ${pillars.map(p => `<a class="pillar-card pillar-card--${p.hue || 'default'}" href="pages/pillars/${escapeAttr(p.slug)}.html">
          <div class="pillar-card-eyebrow">${p.count} essay${p.count === 1 ? '' : 's'}</div>
          <h2 class="pillar-card-title">${escapeHtml(p.title)}</h2>
          <p class="pillar-card-summary">${escapeHtml(p.summary)}</p>
          <span class="pillar-card-cta">Open the pillar →</span>
        </a>`).join('')}
      </div>
    </div>
  </section>` : '';

  return `
<main id="main-content" class="home">
  <header class="home-hero home-hero--compact">
    <div class="home-hero-text">
      <div class="home-hero-eyebrow">${topics.length} topics · ${pillars.length} pillars · curated by Hunter Dellere</div>
      <h1 class="home-hero-title">An atlas of <em>things worth a longer look</em>.</h1>
      <p class="home-hero-sub">Tea, anthropology, cartography, Vietnam, and whatever else turned out to repay a slow read. Updated when something deserves it.</p>
      <form class="home-search" data-search-form-home role="search" aria-label="Search the atlas">
        <span class="home-search-icon" aria-hidden="true">⌕</span>
        <input type="search" class="home-search-input" data-search-trigger placeholder="Search topics, tags, places…" autocomplete="off" aria-label="Search">
        <span class="home-search-key" aria-hidden="true"><kbd>⌘</kbd><kbd>K</kbd></span>
      </form>
      <div class="home-hero-links">
        <a class="home-hero-link" href="pages/atlas.html"><span aria-hidden="true">◉</span> Open the atlas</a>
        <a class="home-hero-link" href="pages/timeline.html"><span aria-hidden="true">═</span> Timeline</a>
        <a class="home-hero-link" href="pages/tags.html"><span aria-hidden="true">#</span> Tags</a>
        <a class="home-hero-link" href="random.html"><span aria-hidden="true">↻</span> Random topic</a>
      </div>
    </div>
  </header>

  ${spotlight.length ? `<section class="spotlight" aria-label="Featured">
    <header class="section-header">
      <div>
        <div class="section-eyebrow">Start here</div>
        <h2 class="section-title">Featured</h2>
      </div>
      <a class="section-cta" href="#all-topics">All ${topics.length} topics ↓</a>
    </header>
    <div class="spotlight-grid">
      ${spotlightCards}
    </div>
  </section>` : ''}

  ${recent.length ? `<section class="recent-band" aria-label="Recently updated">
    <header class="section-header">
      <div>
        <div class="section-eyebrow">Just added</div>
        <h2 class="section-title">Recently updated</h2>
      </div>
    </header>
    <div class="recent-grid">
      ${recentCards}
    </div>
  </section>` : ''}

  ${pillarStrip}

  <section class="mosaic-section" id="all-topics">
    <header class="section-header">
      <div>
        <div class="section-eyebrow">Browse</div>
        <h2 class="section-title">All ${topics.length} topics</h2>
      </div>
      <a class="section-cta" href="pages/tags.html">Browse by tag →</a>
    </header>
    <div class="mosaic">
      ${tiles}
    </div>
  </section>
</main>`;
}

export function renderPillarPage(pillar, allTopics, allPillars) {
  const children = (pillar.order || [])
    .map(s => allTopics.find(t => t.slug === s))
    .filter(Boolean);
  const hero = (pillar.images || []).find(i => i.role === 'hero') || (pillar.images || [])[0];
  const heroSrc = hero ? imagePathPillar(pillar.slug, hero.src) : null;
  const fam = TOPIC_FAMILIES[pillar.hue] || TOPIC_FAMILIES[pillar.slug] || { color: 'default', label: pillar.title };

  const bodyHtml = pillar.body ? marked.parse(pillar.body) : '';

  const childCards = children.map((t, i) => {
    const src = thumbSrc(t, '../../assets/images/topics', 'small');
    return `<a class="pillar-child" href="../topics/${escapeAttr(t.slug)}.html" style="--child-bg: url('${escapeAttr(src)}')">
      <div class="pillar-child-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</div>
      <div class="pillar-child-body">
        <h3 class="pillar-child-title">${escapeHtml(t.title)}</h3>
        <p class="pillar-child-summary">${escapeHtml(t.summary || '')}</p>
        ${t.geo?.place ? `<div class="pillar-child-meta">◉ ${escapeHtml(t.geo.place)}</div>` : ''}
      </div>
      <div class="pillar-child-thumb" aria-hidden="true"></div>
    </a>`;
  }).join('');

  const otherPillars = (allPillars || []).filter(p => p.slug !== pillar.slug);
  const otherStrip = otherPillars.length ? `<aside class="other-pillars" aria-label="Other pillars">
    <div class="other-pillars-eyebrow">Other pillars</div>
    <div class="other-pillars-grid">
      ${otherPillars.map(p => `<a class="other-pillar" href="${escapeAttr(p.slug)}.html">
        <span class="other-pillar-title">${escapeHtml(p.title)}</span>
        <span class="other-pillar-count">${p.count} essays →</span>
      </a>`).join('')}
    </div>
  </aside>` : '';

  return `
<header class="pillar-hero ${heroSrc ? '' : 'pillar-hero--minimal'}" data-family="${fam.color}">
  ${heroSrc ? `<img class="pillar-hero-img" src="${escapeAttr(heroSrc)}" alt="${escapeAttr(pillar.title)}" loading="eager">` : ''}
  <div class="pillar-hero-overlay">
    <div class="pillar-hero-overlay-inner">
      <div class="pillar-hero-eyebrow">Pillar · ${children.length} essay${children.length === 1 ? '' : 's'}</div>
      <h1 class="pillar-hero-title">${escapeHtml(pillar.title)}</h1>
      <p class="pillar-hero-summary">${escapeHtml(pillar.summary || '')}</p>
    </div>
  </div>
</header>
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="../../index.html">Home</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <span aria-current="page">${escapeHtml(pillar.title)}</span>
</nav>
<main id="main-content" class="pillar-body">
  <div class="pillar-intro read-column">
    ${bodyHtml}
  </div>
  <section class="pillar-children" aria-label="${escapeAttr(pillar.title)} essays">
    <div class="pillar-children-eyebrow">Read in order</div>
    <div class="pillar-children-list">
      ${childCards}
    </div>
  </section>
  ${otherStrip}
</main>`;
}

function imagePathPillar(slug, src) {
  if (/^https?:/i.test(src)) return src;
  return `../../assets/images/pillars/${slug}/${src}`;
}
