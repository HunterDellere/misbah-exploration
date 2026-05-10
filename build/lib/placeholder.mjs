// placeholder.mjs — generates a topic-appropriate SVG used in place of any
// image whose file is missing. The SVG is written into assets/images/topics/<slug>/
// at build time so the page references resolve and feel intentional.
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const PALETTES = {
  tea:          { a: '#3d6e6e', b: '#1f3838', c: '#c9a44a' },
  history:      { a: '#7a4a1a', b: '#3a2208', c: '#c9a44a' },
  travel:       { a: '#c9a44a', b: '#7a5a1a', c: '#0e1726' },
  anthropology: { a: '#7a2e2a', b: '#3a1614', c: '#c9a44a' },
  craft:        { a: '#5a3a6a', b: '#2a1a36', c: '#c9a44a' },
  food:         { a: '#b8623a', b: '#5a2e1a', c: '#c9a44a' },
  experience:   { a: '#8a5a3a', b: '#3a2818', c: '#c9a44a' },
  science:      { a: '#2c4a6e', b: '#0e1f38', c: '#c9a44a' },
  default:      { a: '#2c3949', b: '#0e1726', c: '#c9a44a' },
};

function pickFamily(tags) {
  for (const t of tags) if (PALETTES[t]) return t;
  return 'default';
}

export function ensurePlaceholder(rootAssetsDir, slug, family, title) {
  const dir = join(rootAssetsDir, 'images/topics', slug);
  const file = join(dir, 'hero.jpg');
  const svgFile = join(dir, 'hero.svg');
  if (existsSync(file) || existsSync(svgFile)) return;
  mkdirSync(dir, { recursive: true });

  const p = PALETTES[family] || PALETTES.default;
  const initials = title.split(/\s+/).slice(0, 3).map(w => w[0] || '').join('').toUpperCase().slice(0, 3);

  // Generative concentric arcs + grid — feels archival, not corporate-blank.
  const seed = hash(slug);
  const arcs = [];
  for (let i = 0; i < 7; i++) {
    const r = 80 + i * 60 + (seed >> i & 7) * 4;
    const cx = 800 + ((seed >> (i * 2)) & 31) * 4 - 60;
    const cy = 600 + ((seed >> (i * 3)) & 31) * 4 - 60;
    arcs.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.c}" stroke-opacity="${0.05 + (i % 3) * 0.04}" stroke-width="${1 + (i % 3)}"/>`);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${p.a}"/>
    <stop offset="1" stop-color="${p.b}"/>
  </linearGradient>
  <radialGradient id="vignette" cx="0.5" cy="0.55" r="0.7">
    <stop offset="0.6" stop-color="rgba(0,0,0,0)"/>
    <stop offset="1" stop-color="rgba(0,0,0,0.5)"/>
  </radialGradient>
  <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
    <path d="M80 0 L0 0 0 80" fill="none" stroke="${p.c}" stroke-opacity="0.06" stroke-width="0.5"/>
  </pattern>
</defs>
<rect width="1600" height="900" fill="url(#g)"/>
<rect width="1600" height="900" fill="url(#grid)"/>
${arcs.join('')}
<rect width="1600" height="900" fill="url(#vignette)"/>
<g font-family="Fraunces, Georgia, serif" fill="${p.c}" opacity="0.85">
  <text x="80" y="820" font-size="84" font-weight="500" letter-spacing="-2">${escape(title)}</text>
  <text x="80" y="120" font-size="22" letter-spacing="6" text-transform="uppercase" font-family="JetBrains Mono, monospace" fill-opacity="0.7">MISBAH · EXPLORATION</text>
  <text x="1480" y="120" font-size="22" letter-spacing="6" font-family="JetBrains Mono, monospace" fill-opacity="0.55" text-anchor="end">${initials}</text>
</g>
</svg>`;
  writeFileSync(svgFile, svg);
}

function escape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h >>> 0;
}
