// atlas.js — interactive globe + filter wiring
//
// Loads globe.gl (three.js based) from CDN. Falls back to an equirectangular
// 2D canvas projection when WebGL is unavailable. Reads ../data/geo.json.

const PIN_COLORS = {
  tea: '#3d6e6e', history: '#7a4a1a', travel: '#c9a44a',
  anthropology: '#7a2e2a', science: '#2c4a6e', craft: '#5a3a6a',
  experience: '#8a5a3a', food: '#b8623a', vietnam: '#8a3a3a',
  geography: '#2c4a6e', default: '#2c3949',
};

const stage = document.getElementById('globe');
const previewEl = document.getElementById('atlas-preview');
const previewImg = document.getElementById('atlas-preview-img');
const previewEyebrow = document.getElementById('atlas-preview-eyebrow');
const previewTitle = document.getElementById('atlas-preview-title');
const previewSummary = document.getElementById('atlas-preview-summary');
const previewCta = document.getElementById('atlas-preview-cta');
const previewClose = previewEl?.querySelector('.atlas-preview-close');
const tagChips = document.querySelectorAll('.tag-chip');
const listItems = document.querySelectorAll('.atlas-list-item');

const activeTags = new Set();

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

function showPreview(t) {
  if (!previewEl) return;
  previewImg.src = t.image ? '../' + t.image : '';
  previewImg.alt = t.title;
  previewImg.style.display = t.image ? '' : 'none';
  previewEyebrow.textContent = (t.family || 'topic').toUpperCase() + (t.place ? ' · ' + t.place : '');
  previewTitle.textContent = t.title;
  previewSummary.textContent = t.summary || '';
  previewCta.href = '../' + t.url;
  previewEl.dataset.open = 'true';
}
function hidePreview() { if (previewEl) previewEl.dataset.open = 'false'; }
previewClose?.addEventListener('click', hidePreview);

function pinPasses(t) {
  if (activeTags.size === 0) return true;
  return [...activeTags].every(tag => (t.tags || []).includes(tag));
}

function refreshList(filtered) {
  const slugs = new Set(filtered.map(t => t.slug));
  listItems.forEach(el => {
    el.style.display = slugs.has(el.dataset.slug) ? '' : 'none';
  });
}

async function init() {
  const data = await fetch('../data/geo.json').then(r => r.json()).catch(() => []);

  // Wire list rows for keyboard / accessibility — clicking still navigates,
  // but hovering opens the preview.
  listItems.forEach(el => {
    el.addEventListener('mouseenter', () => {
      const t = data.find(x => x.slug === el.dataset.slug);
      if (t) showPreview(t);
    });
    el.addEventListener('focus', () => {
      const t = data.find(x => x.slug === el.dataset.slug);
      if (t) showPreview(t);
    });
  });

  tagChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.tag;
      const pressed = chip.getAttribute('aria-pressed') === 'true';
      chip.setAttribute('aria-pressed', String(!pressed));
      if (pressed) activeTags.delete(tag); else activeTags.add(tag);
      const filtered = data.filter(pinPasses);
      refreshList(filtered);
      if (renderGlobe.update) renderGlobe.update(filtered);
    });
  });

  if (hasWebGL()) {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/globe.gl@2/dist/globe.gl.min.js');
      mountGlobe(data);
      return;
    } catch (e) {
      console.warn('globe.gl load failed, falling back to 2D', e);
    }
  }
  mount2D(data);
}

const renderGlobe = {};

function mountGlobe(data) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  // Day/night earth textures from globe.gl examples (public CDN-hosted assets).
  const tex = isDark
    ? 'https://unpkg.com/three-globe/example/img/earth-night.jpg'
    : 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
  const bumpTex = 'https://unpkg.com/three-globe/example/img/earth-topology.png';

  const world = window.Globe()(stage)
    .globeImageUrl(tex)
    .bumpImageUrl(bumpTex)
    .backgroundColor('rgba(0,0,0,0)')
    .atmosphereColor(isDark ? '#6ea9a9' : '#3d6e6e')
    .atmosphereAltitude(0.18)
    .pointOfView({ lat: 22, lng: 60, altitude: 2.2 }, 0)
    .pointAltitude(0.04)
    .pointRadius(0.5)
    .pointColor(d => PIN_COLORS[d.family] || PIN_COLORS.default)
    .pointLabel(d => `<div style="font-family:'Inter Tight',sans-serif;background:#0e1726;color:#f4ecd8;padding:6px 10px;border-radius:6px;font-size:12px;border:1px solid #c9a44a"><strong>${escapeHTML(d.title)}</strong><br>${escapeHTML(d.place || '')}</div>`)
    .onPointClick(d => {
      showPreview(d);
      world.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.4 }, 800);
    })
    .pointsTransitionDuration(400)
    .pointsData(data);

  const resize = () => world.width(stage.clientWidth).height(stage.clientHeight);
  resize();
  new ResizeObserver(resize).observe(stage);

  renderGlobe.update = (filtered) => world.pointsData(filtered);
}

// Equirectangular fallback — pleasant 2D map with clickable pins
function mount2D(data) {
  stage.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0;overflow:hidden;';
  stage.appendChild(wrap);
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 360 180');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.style.cssText = 'width:100%;height:100%;display:block;';
  // Soft sea
  const sea = document.createElementNS(svgNS, 'rect');
  sea.setAttribute('width', '360'); sea.setAttribute('height', '180');
  sea.setAttribute('fill', 'var(--paper-soft)');
  svg.appendChild(sea);
  // Lat/lng grid
  for (let lng = -180; lng <= 180; lng += 30) {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', lng + 180); line.setAttribute('x2', lng + 180);
    line.setAttribute('y1', 0); line.setAttribute('y2', 180);
    line.setAttribute('stroke', 'var(--rule-soft)'); line.setAttribute('stroke-width', '0.3');
    svg.appendChild(line);
  }
  for (let lat = -90; lat <= 90; lat += 30) {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', 0); line.setAttribute('x2', 360);
    line.setAttribute('y1', 90 - lat); line.setAttribute('y2', 90 - lat);
    line.setAttribute('stroke', 'var(--rule-soft)'); line.setAttribute('stroke-width', '0.3');
    svg.appendChild(line);
  }
  const pinsLayer = document.createElementNS(svgNS, 'g');
  svg.appendChild(pinsLayer);
  wrap.appendChild(svg);

  function draw(filtered) {
    pinsLayer.innerHTML = '';
    for (const d of filtered) {
      const cx = d.lng + 180, cy = 90 - d.lat;
      const c = document.createElementNS(svgNS, 'circle');
      c.setAttribute('cx', cx); c.setAttribute('cy', cy);
      c.setAttribute('r', '1.6');
      c.setAttribute('fill', PIN_COLORS[d.family] || PIN_COLORS.default);
      c.setAttribute('stroke', 'var(--ink)'); c.setAttribute('stroke-width', '0.3');
      c.style.cursor = 'pointer';
      c.addEventListener('click', () => showPreview(d));
      const title = document.createElementNS(svgNS, 'title');
      title.textContent = `${d.title} — ${d.place}`;
      c.appendChild(title);
      pinsLayer.appendChild(c);
    }
  }
  draw(data);
  renderGlobe.update = draw;
}

function escapeHTML(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

if (stage) init();
