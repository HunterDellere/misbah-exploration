// responsive.mjs — emit webp variants for raster hero images.
// No-op if sharp is not installed or no raster hero exists for a topic.
import { existsSync, statSync } from 'fs';
import { join } from 'path';

const WIDTHS = [800, 1600, 2400];
const RASTER_EXT = ['jpg', 'jpeg', 'png'];

let sharpMod = null;
async function getSharp() {
  if (sharpMod !== null) return sharpMod;
  try {
    sharpMod = (await import('sharp')).default;
  } catch {
    sharpMod = false;
  }
  return sharpMod;
}

export function findRasterHero(rootDir, slug) {
  const dir = join(rootDir, 'assets/images/topics', slug);
  for (const ext of RASTER_EXT) {
    const p = join(dir, `hero.${ext}`);
    if (existsSync(p)) return { path: p, ext };
  }
  return null;
}

export function variantsFor(rootDir, slug) {
  const dir = join(rootDir, 'assets/images/topics', slug);
  const out = [];
  for (const w of WIDTHS) {
    const p = join(dir, `hero@${w}.webp`);
    if (existsSync(p)) out.push({ width: w, file: `hero@${w}.webp` });
  }
  return out;
}

export async function ensureResponsiveVariants(rootDir, slug) {
  const sharp = await getSharp();
  if (!sharp) return [];
  const src = findRasterHero(rootDir, slug);
  if (!src) return [];
  const dir = join(rootDir, 'assets/images/topics', slug);
  const srcStat = statSync(src.path);
  const out = [];
  for (const w of WIDTHS) {
    const file = join(dir, `hero@${w}.webp`);
    const skip = existsSync(file) && statSync(file).mtimeMs >= srcStat.mtimeMs;
    if (!skip) {
      await sharp(src.path)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(file);
    }
    out.push({ width: w, file: `hero@${w}.webp` });
  }
  return out;
}
