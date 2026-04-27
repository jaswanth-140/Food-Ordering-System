import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const LIST_PATH = path.join(ROOT, 'scripts', 'dish-list.txt');
const OUTPUT_DIR = path.join(ROOT, 'public', 'dishes');
const MAP_PATH = path.join(ROOT, 'src', 'data', 'dishImageMap.ts');
const META_PATH = path.join(OUTPUT_DIR, '_sources.json');

const PEXELS_KEY = process.env.PEXELS_API_KEY || '';
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || '';
const REQUEST_DELAY_MS = 900;

const QUERY_HINTS = {
  'chicken 65': 'chicken 65 indian fried chicken',
  'apollo fish': 'apollo fish indian fried fish',
  'masala dosa': 'masala dosa south indian',
  vada: 'medu vada south indian',
};

const PIXABAY_BANNED_TAGS = ['egg', 'eggs', 'breakfast egg', 'pattern'];

function normalize(value) {
  return value.toLowerCase().trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function slugify(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readDishList() {
  const raw = await fs.readFile(LIST_PATH, 'utf8');
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function getRequestedDishesFromArgs() {
  const cliDishes = process.argv.slice(2).map((value) => value.trim()).filter(Boolean);
  return cliDishes;
}

async function searchPexels(query) {
  if (!PEXELS_KEY) return null;
  const url = new URL('https://api.pexels.com/v1/search');
  const hinted = QUERY_HINTS[normalize(query)] || query;
  url.searchParams.set('query', `${hinted} food`);
  url.searchParams.set('per_page', '1');

  const response = await fetch(url, {
    headers: { Authorization: PEXELS_KEY },
  });
  if (!response.ok) return null;

  const data = await response.json();
  const photo = data?.photos?.[0];
  if (!photo?.src?.large2x) return null;
  return {
    imageUrl: photo.src.large2x,
    source: 'pexels',
    sourceUrl: photo.url || '',
    photographer: photo.photographer || '',
  };
}

async function searchPixabay(query) {
  if (!PIXABAY_KEY) return null;
  const url = new URL('https://pixabay.com/api/');
  url.searchParams.set('key', PIXABAY_KEY);
  const hinted = QUERY_HINTS[normalize(query)] || query;
  url.searchParams.set('q', `${hinted} food`);
  url.searchParams.set('image_type', 'photo');
  url.searchParams.set('per_page', '3');
  url.searchParams.set('safesearch', 'true');

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const wantedTokens = normalize(hinted).split(' ').filter((token) => token.length > 2);
  const hit = (data?.hits || []).find((candidate) => {
    const tags = normalize(candidate?.tags || '');
    if (PIXABAY_BANNED_TAGS.some((blocked) => tags.includes(blocked))) return false;
    return wantedTokens.some((token) => tags.includes(token));
  }) || data?.hits?.[0];
  if (!hit?.largeImageURL) return null;
  return {
    imageUrl: hit.largeImageURL,
    source: 'pixabay',
    sourceUrl: hit.pageURL || '',
    photographer: hit.user || '',
  };
}

async function downloadImage(url, destinationPath) {
  const maxRetries = 4;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(url);
    if (response.ok) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      await fs.writeFile(destinationPath, bytes);
      return;
    }

    if (response.status !== 429 || attempt === maxRetries) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const retryAfterHeader = response.headers.get('retry-after');
    const retryAfterSec = Number(retryAfterHeader || '0');
    const waitMs = Number.isFinite(retryAfterSec) && retryAfterSec > 0
      ? retryAfterSec * 1000
      : 1200 * (attempt + 1);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

async function fetchBestImage(query) {
  // Prefer Pexels first, then Pixabay fallback.
  const pexels = await searchPexels(query);
  if (pexels) return pexels;

  const pixabay = await searchPixabay(query);
  if (pixabay) return pixabay;

  return null;
}

function renderMapFile(map) {
  const sorted = Object.keys(map).sort();
  const entries = sorted.map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(map[key])},`);
  return `export const dishImageMap: Record<string, string> = {\n${entries.join('\n')}\n};\n`;
}

async function readExistingMap() {
  try {
    const raw = await fs.readFile(MAP_PATH, 'utf8');
    const matches = [...raw.matchAll(/"([^"]+)"\s*:\s*"([^"]+)"/g)];
    const existing = {};
    for (const match of matches) {
      existing[match[1]] = match[2];
    }
    return existing;
  } catch {
    return {};
  }
}

async function main() {
  if (!PEXELS_KEY && !PIXABAY_KEY) {
    throw new Error('Set PEXELS_API_KEY or PIXABAY_API_KEY before running.');
  }

  await ensureDir(OUTPUT_DIR);
  const cliDishes = getRequestedDishesFromArgs();
  const dishes = cliDishes.length > 0 ? cliDishes : await readDishList();
  const map = await readExistingMap();
  const metadata = {};

  for (const dish of dishes) {
    const normalized = normalize(dish);
    const slug = slugify(dish);
    const outPath = path.join(OUTPUT_DIR, `${slug}.jpg`);

    const best = await fetchBestImage(dish);
    if (!best) {
      console.warn(`No result for: ${dish}`);
      continue;
    }

    try {
      await downloadImage(best.imageUrl, outPath);
      map[normalized] = `/dishes/${slug}.jpg`;
      metadata[normalized] = {
        dish,
        localPath: `/dishes/${slug}.jpg`,
        provider: best.source,
        sourceUrl: best.sourceUrl,
        photographer: best.photographer,
        fetchedAt: new Date().toISOString(),
      };
      console.log(`Downloaded: ${dish}`);
    } catch (error) {
      console.warn(`Skipped ${dish}: ${error.message || error}`);
    }

    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
  }

  await fs.writeFile(MAP_PATH, renderMapFile(map), 'utf8');
  await fs.writeFile(META_PATH, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`Generated map: ${MAP_PATH}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

