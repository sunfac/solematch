/**
 * Live UK price scraper — firecrawl-free replacement for check-prices.ts.
 *
 * SportsShoes server-renders its product grid as embedded JSON (each product
 * carries currency/price/rrp/title/brand/sku), so a plain HTTPS fetch is enough
 * — no headless browser, no firecrawl credits. We paginate the running category
 * into a price map, then STRICT-match our catalogue against it (brand + every
 * strong model token + the version, men's/unisex only) and write the live price
 * back to offers.json as `streetPriceGbp` whenever it's meaningfully below RRP.
 * The reveal/results/detail UI already renders "was £RRP / now £street / -N%".
 *
 * Usage: npx tsx scripts/scrape-prices.ts [--pages N] [--dry]
 * Run as a cron, commit offers.json, redeploy. Polite ~1.5s pacing + 1 retry.
 */
import { request } from 'node:https';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import shoesJson from '../src/data/shoes.json';
import offersJson from '../src/data/offers.json';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const pages = (() => {
  const i = args.indexOf('--pages');
  return i >= 0 ? Number(args[i + 1]) : 20;
})();

interface Offer {
  retailer: string;
  region: string;
  url: string;
  priceGbp: number;
  streetPriceGbp?: number;
  priceDropped?: boolean;
  kind?: string;
  checkedAt: string;
}
interface Shoe {
  slug: string;
  brand: string;
  model: string;
  version: string;
  status: string;
  msrpGbp: number;
}
interface SsProduct {
  title: string;
  brand: string;
  price: number;
  rrp: number;
  currency: string;
}

const SHOES = shoesJson as Shoe[];
const OFFERS = offersJson as Record<string, Offer[]>;
const today = new Date().toISOString().slice(0, 10);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fetchHtml(url: string, redirects = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = request(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } }, (res) => {
      const loc = res.headers.location;
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && loc && redirects < 4) {
        res.resume();
        return resolve(fetchHtml(new URL(loc, url).toString(), redirects + 1));
      }
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('timeout')));
    req.end();
  });
}

/** String-aware extraction of a JSON array literal by key (ignores brackets in strings). */
function extractArray(h: string, key: string): string | null {
  const i = h.indexOf(`"${key}":[`);
  if (i < 0) return null;
  let k = i + key.length + 3;
  const start = k;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (; k < h.length; k++) {
    const c = h[k];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) return h.slice(start, k + 1);
    }
  }
  return null;
}

async function fetchPage(pn: number): Promise<SsProduct[]> {
  const url = `https://www.sportsshoes.com/products/running${pn > 1 ? `?pn=${pn}` : ''}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const html = await fetchHtml(url);
      const raw = extractArray(html, 'products');
      if (raw) return JSON.parse(raw) as SsProduct[];
    } catch {
      /* retry */
    }
    await sleep(1500);
  }
  return [];
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const words = (s: string) => norm(s).split(' ').filter(Boolean);

/** Does this SportsShoes listing confidently identify THIS shoe? */
function matches(shoe: Shoe, p: SsProduct): boolean {
  const title = (p.title || '').toLowerCase();
  if (/women|wmn|w's/.test(title)) return false; // catalogue is men's-spec
  if (norm(p.brand || '') !== norm(shoe.brand) && !title.includes(norm(shoe.brand))) return false;
  const tw = new Set(words(p.title));
  const strong = words(shoe.model).filter((t) => t.length >= 4);
  if (strong.length === 0) return false;
  if (!strong.every((t) => tw.has(t))) return false;
  const ver = norm(shoe.version);
  if (ver && !tw.has(ver)) return false; // exact version (so "Pro 4" never matches "Elite 3")
  return true;
}

async function main() {
  // 1. accumulate a price map across paginated running pages
  const seen = new Set<string>();
  const products: SsProduct[] = [];
  for (let pn = 1; pn <= pages; pn++) {
    const batch = await fetchPage(pn);
    if (batch.length === 0) {
      console.log(`  page ${pn}: empty (stopping)`);
      break;
    }
    let fresh = 0;
    for (const p of batch) {
      const k = `${p.brand}|${p.title}`;
      if (!seen.has(k)) {
        seen.add(k);
        products.push(p);
        fresh++;
      }
    }
    console.log(`  page ${pn}: ${batch.length} products (${fresh} new) — total ${products.length}`);
    if (fresh === 0 && pn > 1) break; // pagination not advancing → stop
    await sleep(1500);
  }
  console.log(`\nprice map: ${products.length} unique SportsShoes listings\n`);

  // 2. strict-match the catalogue and write live prices
  let matched = 0;
  let drops = 0;
  let updates = 0;
  const current = SHOES.filter((s) => s.status === 'current');
  for (const shoe of current) {
    const cands = products.filter((p) => matches(shoe, p));
    if (cands.length === 0) continue;
    matched++;
    const live = Math.min(...cands.map((p) => p.price)); // in-stock variant = lowest
    const offers = OFFERS[shoe.slug] ?? [];
    const ss = offers.find((o) => o.retailer === 'SportsShoes') ?? offers[0];
    if (!ss) continue;
    const rrp = ss.priceGbp;
    if (live < rrp - 4) {
      const pct = Math.round(((rrp - live) / rrp) * 100);
      console.log(`  * ${shoe.slug.padEnd(32)} £${rrp} → £${live} (-${pct}%)`);
      ss.streetPriceGbp = live;
      ss.priceDropped = true;
      ss.checkedAt = today;
      drops++;
      updates++;
    } else if (ss.streetPriceGbp && live >= rrp - 4) {
      delete ss.streetPriceGbp;
      delete ss.priceDropped;
      ss.checkedAt = today;
      updates++;
    }
  }

  console.log(`\n${matched}/${current.length} shoes matched, ${drops} live discounts, ${updates} offer updates`);
  if (!dry && updates > 0) {
    writeFileSync(join(__dirname, '..', 'src', 'data', 'offers.json'), `${JSON.stringify(OFFERS, null, 0)}\n`);
    console.log('wrote src/data/offers.json');
  } else if (dry) {
    console.log('--dry: no file written');
  }
}

main();
