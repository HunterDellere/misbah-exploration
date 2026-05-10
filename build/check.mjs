#!/usr/bin/env node
// Post-build invariants: required artifacts exist, internal links resolve.
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

let errors = 0;
function fail(m) { console.error('[check]', m); errors++; }

if (!existsSync(join(ROOT, 'index.html'))) fail('index.html missing');
if (!existsSync(join(ROOT, 'pages/atlas.html'))) fail('pages/atlas.html missing');
if (!existsSync(join(ROOT, 'data/geo.json'))) fail('data/geo.json missing');
if (!existsSync(join(ROOT, 'data/topics.json'))) fail('data/topics.json missing');
if (!existsSync(join(ROOT, 'pages/topics'))) fail('pages/topics/ missing');
else if (readdirSync(join(ROOT, 'pages/topics')).filter((f) => f.endsWith('.html')).length === 0) {
  fail('no topic pages emitted');
}

// Internal link check: every href to a local path must resolve to a file
function walkHtml(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walkHtml(full));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

const HREF = /\bhref="([^"#?]+)(?:[#?][^"]*)?"/g;
const SRC = /\b(?:src|data-src)="([^"#?]+)(?:[#?][^"]*)?"/g;

function isExternal(u) {
  return /^([a-z]+:)?\/\//i.test(u) || u.startsWith('mailto:') || u.startsWith('tel:');
}
function isInternal(u) {
  if (!u) return false;
  if (isExternal(u)) return false;
  if (u.startsWith('#')) return false;
  return true;
}

// Known deploy prefix (GitHub Pages project path). Absolute hrefs may include it.
const DEPLOY_PREFIX = '/misbah-exploration/';

function resolveRef(htmlFile, ref) {
  // ref examples: "/pages/topics/foo.html", "/misbah-exploration/style.css", "../style.css"
  if (ref.startsWith(DEPLOY_PREFIX)) return join(ROOT, ref.slice(DEPLOY_PREFIX.length));
  if (ref.startsWith('/')) return join(ROOT, ref.slice(1));
  return resolve(dirname(htmlFile), ref);
}

const htmlFiles = [
  ...walkHtml(join(ROOT, 'pages')),
  join(ROOT, 'index.html'),
  join(ROOT, '404.html'),
  join(ROOT, 'random.html'),
].filter(existsSync);

let linkErrors = 0;
const allowedMissingRoots = new Set(['/og/']); // generated optionally
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  for (const re of [HREF, SRC]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(html))) {
      const ref = m[1];
      if (!isInternal(ref)) continue;
      // skip well-known absolute roots that may be optional
      if ([...allowedMissingRoots].some((p) => ref.startsWith(p))) continue;
      const target = resolveRef(file, ref);
      if (!existsSync(target)) {
        // also accept directory + index.html
        if (existsSync(join(target, 'index.html'))) continue;
        fail(`broken link in ${file.replace(ROOT + '/', '')} → ${ref}`);
        linkErrors++;
        if (linkErrors > 50) {
          fail('… (truncated; >50 link errors)');
          break;
        }
      }
    }
    if (linkErrors > 50) break;
  }
  if (linkErrors > 50) break;
}

if (errors) {
  console.error(`[check] ${errors} issue(s)`);
  process.exit(1);
}
console.log(`[check] OK (${htmlFiles.length} html files scanned)`);
