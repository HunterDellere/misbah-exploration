#!/usr/bin/env node
// usage: npm run draft <slug>
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const slug = process.argv[2];
if (!slug) { console.error('usage: npm run draft <slug>'); process.exit(1); }

const target = join(ROOT, 'local/drafts/topics', `${slug}.md`);
if (existsSync(target)) { console.error(`already exists: ${target}`); process.exit(1); }

const tpl = `---
title: ${slug.replace(/-/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase())}
slug: ${slug}
summary: One sentence on why this is worth a longer look.
status: draft
updated: ${new Date().toISOString().slice(0, 10)}
tags: []
geo:
  lat: 0
  lng: 0
  place: ""
  precision: region
images:
  - src: hero.jpg
    role: hero
    source: external
    credit: ""
    license: ""
    url: ""
related: []
sources: []
---

Body in markdown. Lead with the hook — the thing that surprised me. Don't try to be encyclopedic.
`;

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, tpl);
console.log(`drafted: ${target}`);
console.log(`when ready: mv ${target} content/topics/${slug}.md && npm run build`);
