#!/usr/bin/env node
// Minimal dev watcher: rebuild on change, serve on :8080
import { watch } from 'fs';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { readFileSync, existsSync, statSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PORT = 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.xml': 'application/xml; charset=utf-8',
  '.ico': 'image/x-icon',
};

function buildOnce() {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [join(__dirname, 'build.mjs')], { stdio: 'inherit', cwd: ROOT });
    p.on('exit', code => { console.log(`[watch] build exit ${code}`); resolve(code); });
  });
}

let pending = false, building = false;
async function trigger() {
  if (building) { pending = true; return; }
  building = true;
  await buildOnce();
  building = false;
  if (pending) { pending = false; trigger(); }
}

for (const dir of ['content', 'templates', 'build', 'scripts', 'style.css']) {
  const target = join(ROOT, dir);
  if (!existsSync(target)) continue;
  watch(target, { recursive: true }, () => trigger());
}

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let p = join(ROOT, url === '/' ? '/index.html' : url);
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('404'); return; }
  const ext = '.' + p.split('.').pop();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(readFileSync(p));
}).listen(PORT, () => console.log(`[watch] http://localhost:${PORT}`));

trigger();
