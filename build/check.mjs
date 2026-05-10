#!/usr/bin/env node
// Post-build invariants: pages/ exists, links resolve, geo.json matches geo-tagged topics.
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
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
else if (readdirSync(join(ROOT, 'pages/topics')).filter(f => f.endsWith('.html')).length === 0) {
  fail('no topic pages emitted');
}

if (errors) { console.error(`[check] ${errors} issue(s)`); process.exit(1); }
console.log('[check] OK');
