#!/usr/bin/env node
/**
 * Down-res every hero.jpg to MAX_W width (default 1600) at JPEG quality 82.
 * Run after fetching fresh images. Keeps OG-shareable JPGs reasonably small.
 * The responsive build pipeline (build/lib/responsive.mjs) generates webp
 * variants from the source, so this is purely a size cap on the source jpg.
 */
import sharp from 'sharp';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MAX_W = 1600;
const QUALITY = 82;

async function main() {
  const topicsDir = join(ROOT, 'assets/images/topics');
  const slugs = readdirSync(topicsDir);
  let processed = 0;
  let savedKB = 0;
  for (const slug of slugs) {
    const file = join(topicsDir, slug, 'hero.jpg');
    try {
      statSync(file);
    } catch {
      continue;
    }
    const before = statSync(file).size;
    const img = sharp(file);
    const meta = await img.metadata();
    if (!meta.width || meta.width <= MAX_W) {
      // Just re-encode at quality cap; skip if already small.
      if (before < 350 * 1024) continue;
    }
    const buf = await sharp(file)
      .rotate()
      .resize({ width: MAX_W, withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toBuffer();
    const { writeFileSync } = await import('fs');
    writeFileSync(file, buf);
    const after = buf.length;
    savedKB += Math.max(0, (before - after) / 1024);
    processed++;
    console.log(
      `${slug}: ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB`,
    );
  }
  console.log(
    `[optimize-heroes] processed=${processed}, saved≈${savedKB.toFixed(0)} KB`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
