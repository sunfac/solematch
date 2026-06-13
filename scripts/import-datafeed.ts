/**
 * Licensed retailer datafeed → per-shoe PRODUCTION-SAFE images (+ live price &
 * deep link). The proper fix for the catalogue grid: instead of one repeated
 * brand-free image per category, every shoe gets its own real product photo,
 * cleared for production because it comes from an affiliate feed we monetise.
 *
 * Output: src/data/feedImages.json  { [slug]: { imageUrl, priceGbp?, url?, merchant?, checkedAt } }
 * which src/lib/affiliate.ts → imageFor() serves UNGATED (licensed), and which
 * gen-offers.ts never touches (kept isolated so a feed import survives).
 *
 * TWO ways to feed it — no code change needed:
 *
 *  1) FILE (easiest, no API key). Export an Awin "Create-a-Feed" product feed
 *     (CSV) or a Skimlinks merchant feed (CSV/JSON) for the merchants you're
 *     joined to, then:
 *        npx tsx scripts/import-datafeed.ts --feed C:\path\to\feed.csv
 *     Columns are auto-detected (Awin: product_name / aw_image_url /
 *     search_price / merchant_name / aw_deep_link / in_stock; generic names too).
 *
 *  2) SKIMLINKS Product API (credential-gated). Put in a gitignored .env.local:
 *        SKIMLINKS_API_KEY=...
 *        SKIMLINKS_API_URL=https://...   (your account's product-search endpoint)
 *     then:  npx tsx scripts/import-datafeed.ts --source skimlinks
 *
 * Flags: --dry (preview matches, write nothing) · --min <n> (match-score floor,
 * default 2) · --region UK|US (default UK).
 *
 * Matching is CONSERVATIVE: the shoe's brand must appear in the product title,
 * plus at least `--min` model/version tokens; among candidates we prefer rows
 * that have an image, are in stock, and carry a GBP price. Unmatched shoes are
 * left to the brand-free category art — we never attach a wrong photo.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SHOES } from '@/data/catalogue';

const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'src', 'data', 'feedImages.json');

interface FeedRow {
  title: string;
  imageUrl?: string;
  priceGbp?: number;
  url?: string;
  merchant?: string;
  inStock: boolean;
}
interface FeedEntry {
  imageUrl: string;
  priceGbp?: number;
  url?: string;
  merchant?: string;
  checkedAt: string;
}

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const DRY = args.includes('--dry');
const MIN = Number(flag('--min') ?? 2);
const REGION = (flag('--region') ?? 'UK').toUpperCase();
const SOURCE = flag('--source') ?? (flag('--feed') ? 'file' : 'file');

function envLocal(key: string): string | undefined {
  const v = process.env[key];
  if (v && v.trim()) return v.trim();
  const f = join(ROOT, '.env.local');
  if (!existsSync(f)) return undefined;
  for (const raw of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const line = raw.trim().replace(/^export\s+/, '');
    if (line.startsWith(`${key}=`)) return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '');
  }
  return undefined;
}

/** Minimal RFC-4180-ish CSV parser (handles quoted fields, commas, newlines). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQ = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r[0] ?? '').length);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Map flexible feed column names → our fields. */
function colIndex(headers: string[], names: string[]): number {
  const h = headers.map((x) => norm(x));
  for (const n of names) {
    const i = h.findIndex((x) => x === n || x.includes(n));
    if (i >= 0) return i;
  }
  return -1;
}

function rowsFromCsv(text: string): FeedRow[] {
  const grid = parseCsv(text);
  if (grid.length < 2) return [];
  const headers = grid[0];
  const ci = {
    title: colIndex(headers, ['product name', 'product_name', 'productname', 'title', 'name', 'description']),
    image: colIndex(headers, ['aw image url', 'aw_image_url', 'image url', 'imageurl', 'image', 'merchant image url', 'large image']),
    price: colIndex(headers, ['search price', 'search_price', 'price', 'store price', 'display price']),
    url: colIndex(headers, ['aw deep link', 'aw_deep_link', 'deep link', 'deeplink', 'merchant deep link', 'product url', 'url', 'link']),
    merchant: colIndex(headers, ['merchant name', 'merchant_name', 'merchant', 'retailer', 'programme name', 'advertiser']),
    stock: colIndex(headers, ['in stock', 'in_stock', 'stock status', 'availability', 'stock']),
    currency: colIndex(headers, ['currency', 'aw_product_currency']),
  };
  if (ci.title < 0) throw new Error('feed has no recognisable product-name column');
  return grid.slice(1).map((r) => {
    const cur = ci.currency >= 0 ? norm(r[ci.currency] ?? '') : '';
    const priceRaw = ci.price >= 0 ? Number((r[ci.price] ?? '').replace(/[^0-9.]/g, '')) : NaN;
    const stockRaw = ci.stock >= 0 ? norm(r[ci.stock] ?? '') : '';
    return {
      title: r[ci.title] ?? '',
      imageUrl: ci.image >= 0 ? (r[ci.image] || undefined) : undefined,
      priceGbp: !cur || cur === 'gbp' ? (Number.isFinite(priceRaw) && priceRaw > 0 ? priceRaw : undefined) : undefined,
      url: ci.url >= 0 ? (r[ci.url] || undefined) : undefined,
      merchant: ci.merchant >= 0 ? (r[ci.merchant] || undefined) : undefined,
      inStock: ci.stock < 0 ? true : !/(out of stock|0|false|no)/.test(stockRaw),
    };
  });
}

function rowsFromJson(text: string): FeedRow[] {
  const data = JSON.parse(text);
  const list: any[] = Array.isArray(data) ? data : (data.products ?? data.items ?? data.data ?? []);
  const pick = (o: any, keys: string[]) => keys.map((k) => o[k]).find((v) => v != null);
  return list.map((o) => ({
    title: String(pick(o, ['product_name', 'productName', 'title', 'name', 'description']) ?? ''),
    imageUrl: pick(o, ['aw_image_url', 'imageUrl', 'image_url', 'image', 'imageLink']),
    priceGbp: Number(pick(o, ['search_price', 'price', 'priceGbp', 'displayPrice'])) || undefined,
    url: pick(o, ['aw_deep_link', 'deepLink', 'url', 'link', 'productUrl']),
    merchant: pick(o, ['merchant_name', 'merchant', 'retailer', 'advertiser']),
    inStock: String(pick(o, ['in_stock', 'inStock', 'availability']) ?? 'true').toLowerCase() !== 'false',
  }));
}

async function loadRows(): Promise<FeedRow[]> {
  if (SOURCE === 'file') {
    const path = flag('--feed');
    if (!path) throw new Error('--feed <path to .csv|.json> required for file source');
    if (!existsSync(path)) throw new Error(`feed file not found: ${path}`);
    const text = readFileSync(path, 'utf8');
    return path.toLowerCase().endsWith('.json') ? rowsFromJson(text) : rowsFromCsv(text);
  }
  if (SOURCE === 'skimlinks') {
    const key = envLocal('SKIMLINKS_API_KEY');
    const url = envLocal('SKIMLINKS_API_URL');
    if (!key || !url) {
      throw new Error(
        'Skimlinks mode needs SKIMLINKS_API_KEY and SKIMLINKS_API_URL in .env.local ' +
          '(your account product-search endpoint). Or use the file mode: --feed <feed.csv>.',
      );
    }
    // query per shoe so we only pull what we stock; map the JSON response loosely
    const out: FeedRow[] = [];
    for (const s of SHOES) {
      const q = encodeURIComponent(`${s.brand} ${s.model} ${s.version}`);
      const sep = url.includes('?') ? '&' : '?';
      const res = await fetch(`${url}${sep}q=${q}&apikey=${encodeURIComponent(key)}`).catch(() => null);
      if (!res || !res.ok) continue;
      const json = await res.json().catch(() => null);
      if (json) out.push(...rowsFromJson(JSON.stringify(json)));
    }
    return out;
  }
  throw new Error(`unknown --source ${SOURCE}`);
}

/**
 * Conservative match. Brand must appear; then we score by COVERAGE of the
 * model+version tokens (the version counts even when it's a single digit, and
 * the distinguishing word must be present) — so "Vaporfly 4" matches its row
 * while "Metaspeed Edge Tokyo" never steals a "Metaspeed Sky Tokyo" row. False
 * matches attach a WRONG photo, so we'd rather leave a shoe on category art:
 * require ≥67% token coverage and at least `--min` matched tokens.
 */
function bestMatch(shoe: (typeof SHOES)[number], rows: FeedRow[]): FeedRow | undefined {
  const brand = norm(shoe.brand).split(' ')[0];
  const model = norm(shoe.model).split(' ').filter((t) => t.length > 1);
  const version = norm(shoe.version).split(' ').filter((t) => t.length >= 1 && t !== 'v');
  const tokens = [...model, ...version];
  if (tokens.length === 0) return undefined;
  let best: { row: FeedRow; score: number } | undefined;
  for (const row of rows) {
    const t = ' ' + norm(row.title) + ' ';
    if (!t.includes(' ' + brand)) continue; // brand required
    const matched = tokens.filter((tok) => t.includes(' ' + tok + ' ') || t.includes(' ' + tok)).length;
    const coverage = matched / tokens.length;
    if (matched < MIN || coverage < 0.67) continue;
    let score = matched * 10 + coverage * 8;
    if (row.imageUrl) score += 6;
    if (row.inStock) score += 3;
    if (row.priceGbp) score += 2;
    if (!best || score > best.score) best = { row, score };
  }
  return best?.row;
}

async function main() {
  const rows = (await loadRows()).filter((r) => r.title);
  console.log(`feed rows: ${rows.length}  ·  catalogue: ${SHOES.length}  ·  region ${REGION}  ·  min ${MIN}${DRY ? '  · DRY' : ''}`);
  const out: Record<string, FeedEntry> = DRY ? {} : JSON.parse(readFileSync(OUT, 'utf8'));
  let matched = 0;
  const misses: string[] = [];
  const stamp = new Date().toISOString().slice(0, 10);
  for (const s of SHOES) {
    if (s.status !== 'current') continue;
    const row = bestMatch(s, rows);
    if (!row || !row.imageUrl) { misses.push(s.slug); continue; }
    matched++;
    console.log(`  + ${s.slug.padEnd(28)} ← ${(row.merchant ?? 'feed').padEnd(16)} ${row.priceGbp ? '£' + row.priceGbp : ''}`);
    if (!DRY) {
      out[s.slug] = {
        imageUrl: row.imageUrl,
        priceGbp: row.priceGbp,
        url: row.url,
        merchant: row.merchant,
        checkedAt: stamp,
      };
    }
  }
  if (!DRY) writeFileSync(OUT, JSON.stringify(out, null, 0).replace(/},/g, '},\n') + '\n');
  console.log(`\nmatched ${matched}/${SHOES.filter((s) => s.status === 'current').length} current shoes` + (DRY ? ' (dry run — nothing written)' : ` → ${OUT}`));
  if (misses.length) console.log(`unmatched (kept on category art): ${misses.length} — ${misses.slice(0, 12).join(', ')}${misses.length > 12 ? '…' : ''}`);
}

main().catch((e) => {
  console.error('import-datafeed failed:', e.message);
  process.exit(1);
});
