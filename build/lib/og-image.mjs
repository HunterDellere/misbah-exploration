// og-image.mjs — generate per-topic OG card SVG (1200x630).
import { writeFileSync, mkdirSync } from 'fs';
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
  cartography:  { a: '#2c4a6e', b: '#0e1f38', c: '#c9a44a' },
  vietnam:      { a: '#8a3a3a', b: '#3a1414', c: '#c9a44a' },
  default:      { a: '#2c3949', b: '#0e1726', c: '#c9a44a' },
};

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h >>> 0;
}
function escape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrap(text, max) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line ? line + ' ' : '') + w;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export function writeOgImage(rootDir, slug, family, title, summary) {
  const dir = join(rootDir, 'og');
  mkdirSync(dir, { recursive: true });
  const p = PALETTES[family] || PALETTES.default;
  const seed = hash(slug + ':og');
  const arcs = [];
  for (let i = 0; i < 5; i++) {
    const r = 120 + i * 80 + ((seed >> i) & 7) * 6;
    const cx = 1200 + ((seed >> (i * 2)) & 31) * 4 - 80;
    const cy = 500 + ((seed >> (i * 3)) & 31) * 4 - 80;
    arcs.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.c}" stroke-opacity="${0.05 + (i % 3) * 0.04}" stroke-width="${1 + (i % 3)}"/>`,
    );
  }

  const titleLines = wrap(title, 22);
  const lineHeight = 80;
  const titleY = 320 - ((titleLines.length - 1) * lineHeight) / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${p.a}"/>
    <stop offset="1" stop-color="${p.b}"/>
  </linearGradient>
  <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
    <path d="M60 0 L0 0 0 60" fill="none" stroke="${p.c}" stroke-opacity="0.06" stroke-width="0.5"/>
  </pattern>
  <radialGradient id="v" cx="0.4" cy="0.5" r="0.8">
    <stop offset="0.5" stop-color="rgba(0,0,0,0)"/>
    <stop offset="1" stop-color="rgba(0,0,0,0.45)"/>
  </radialGradient>
</defs>
<rect width="1200" height="630" fill="url(#g)"/>
<rect width="1200" height="630" fill="url(#grid)"/>
${arcs.join('')}
<rect width="1200" height="630" fill="url(#v)"/>
<g fill="${p.c}">
  <text x="60" y="80" font-family="JetBrains Mono, monospace" font-size="20" letter-spacing="6" fill-opacity="0.7">MISBAH · EXPLORATION</text>
  <text x="60" y="565" font-family="JetBrains Mono, monospace" font-size="18" letter-spacing="4" fill-opacity="0.65">${escape((family || 'topic').toUpperCase())}</text>
  <g font-family="Fraunces, Georgia, serif" font-weight="500" letter-spacing="-1.5">
    ${titleLines.map((l, i) => `<text x="60" y="${titleY + i * lineHeight}" font-size="72">${escape(l)}</text>`).join('\n    ')}
  </g>
  ${summary ? `<text x="60" y="${titleY + titleLines.length * lineHeight + 30}" font-family="Fraunces, Georgia, serif" font-size="26" fill-opacity="0.75">${escape(summary.slice(0, 90))}${summary.length > 90 ? '…' : ''}</text>` : ''}
</g>
</svg>`;
  writeFileSync(join(dir, `${slug}.svg`), svg);
}
