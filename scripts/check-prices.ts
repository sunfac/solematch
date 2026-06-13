/**
 * Live-price research job (owner item 7 / spec §5.4): for every SEARCH-kind
 * offer, fetch the retailer page via firecrawl (handles JS-hydrated pages),
 * extract the first £-amount adjacent to the model name, and patch back the
 * Offer with `streetPriceGbp` + `priceDropped` if the live price is below RRP.
 *
 * This drives:
 *  - "was £X / now £Y / -Z%" UI on reveal + results + detail (sources of trust)
 *  - VAL recalc via val() in scores/formulas.ts (a superseded flagship at -30%
 *    becomes a genuine value pick, the brief's "price-drop value play")
 *  - the release-watch signal: when a NEW model appears in the search results
 *    above an older versioned one, the older one's status flips to superseded
 *    (left as a follow-up TODO when the catalogue grows past the firecrawl
 *    rate budget; today it's manual)
 *
 * Operationally: run as a daily/weekly cron, commit changes, redeploy. Pre-
 * datafeed compromise: ~1 firecrawl scrape per offer; expensive but bounded.
 *
 * Usage: npx tsx scripts/check-prices.ts [--limit N] [--retailer Name] [--dry]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import shoesJson from '../src/data/shoes.json';
import offersJson from '../src/data/offers.json';

interface Offer {
  retailer: string;
  region: string;
  url: string;
  priceGbp: number;
  streetPriceGbp?: number;
  priceDropped?: boolean;
  kind?: 'search' | 'brand' | 'product';
  checkedAt: string;
}
interface Shoe {
  slug: string;
  brand: string;
  model: string;
  version: string;
  msrpGbp: number;
}

const today = new Date().toISOString().slice(0, 10);
const SHOES = shoesJson as Shoe[];
const OFFERS = offersJson as Record<string, Offer[]>;
const CACHE_DIR = join(__dirname, '..', '.firecrawl', 'prices');
mkdirSync(CACHE_DIR, { recursive: true });

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const limit = (() => {
  const i = args.indexOf('--limit');
  return i >= 0 ? Number(args[i + 1]) : Infinity;
})();
const retailerFilter = (() => {
  const i = args.indexOf('--retailer');
  return i >= 0 ? args[i + 1].toLowerCase() : null;
})();

async function firecrawl(url: string, outFile: string): Promise<string | null> {
  if (existsSync(outFile)) return readFileSync(outFile, 'utf8');
  // firecrawl logs to stderr (Scrape ID) — Windows treats that as a NativeCommandError on
  // some shells, and execFile would reject. Spawn raw and check the FILE afterward.
  await new Promise<void>((resolve) => {
    const child = spawn('npx', ['-y', 'firecrawl', 'scrape', url, '--format', 'markdown', '-o', outFile], {
      shell: true,
      stdio: 'ignore',
    });
    const timer = setTimeout(() => child.kill(), 60_000);
    child.on('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    child.on('error', () => {
      clearTimeout(timer);
      resolve();
    });
  });
  return existsSync(outFile) ? readFileSync(outFile, 'utf8') : null;
}

/**
 * Pull a plausible £ price for the named shoe by binding prices to PRODUCT
 * URLs in the rendered markdown. SportsShoes (and most retailer search pages)
 * embed each card as `£PRICE.99](https://.../product/SKU/exact-product-slug)`.
 * We extract those (price, url) pairs and accept only the one whose URL
 * actually identifies this shoe — proximity scraping on shared search-result
 * pages is far too noisy (clearance items on the same page poison every result).
 */
/** Significant model tokens — drops short ambiguous fragments like "pro", "x", "v5". */
function modelTokens(shoe: Shoe): { strong: string[]; weak: string[] } {
  const all = `${shoe.model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  // strong: distinctive names that virtually NEVER appear in another product slug
  // weak: short fragments that need company (version, generic series words)
  const strong = all.filter((t) => t.length >= 5);
  const weak = all.filter((t) => t.length < 5);
  if (shoe.version) weak.push(shoe.version.toLowerCase().replace(/[^a-z0-9]/g, ''));
  return { strong, weak };
}

function extractPrice(md: string, shoe: Shoe): number | null {
  const { strong, weak } = modelTokens(shoe);
  if (strong.length === 0) return null;
  const re = /£\s?(\d{2,3})(?:\.\d{2})?\]\(([^)]+)\)/g;
  const candidates: Array<{ price: number; url: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    const price = Number(m[1]);
    const url = m[2].toLowerCase();
    if (price < 30 || price > 400) continue;
    if (!url.includes('/product/')) continue;
    // strip /product/SKU/ prefix — we only match against the product slug
    const slug = url.replace(/^.*\/product\/[^/]+\//, '');
    const slugWords = slug.split(/[^a-z0-9]+/);
    // ALL strong tokens must appear as whole words in the slug, OR all strong + at
    // least one matching weak token (version + family name)
    const strongHits = strong.every((t) => slugWords.includes(t));
    if (!strongHits) continue;
    if (weak.length > 0 && !weak.some((t) => slugWords.includes(t))) continue;
    candidates.push({ price, url });
  }
  if (candidates.length === 0) return null;
  // among matching cards, the lowest price is the in-stock variant
  candidates.sort((a, b) => a.price - b.price);
  return candidates[0].price;
}

interface PriceJob {
  slug: string;
  shoe: Shoe;
  offer: Offer;
  index: number;
}

const jobs: PriceJob[] = [];
for (const shoe of SHOES) {
  const offers = OFFERS[shoe.slug] ?? [];
  offers.forEach((offer, index) => {
    if (offer.kind !== 'search') return;
    if (retailerFilter && offer.retailer.toLowerCase() !== retailerFilter) return;
    jobs.push({ slug: shoe.slug, shoe, offer, index });
  });
}

const sample = jobs.slice(0, limit === Infinity ? jobs.length : limit);
console.log(`price-check: ${sample.length} of ${jobs.length} search offers (cache: ${CACHE_DIR})`);

let drops = 0;
let updates = 0;
let misses = 0;

async function main() {
  for (const job of sample) {
  const safe = `${job.shoe.slug}-${job.offer.retailer.replace(/\W+/g, '')}.md`;
  const cache = join(CACHE_DIR, safe);
  const md = await firecrawl(job.offer.url, cache);
  if (!md) {
    console.log(`  ?  ${job.shoe.slug.padEnd(34)} ${job.offer.retailer.padEnd(14)} fetch failed`);
    misses++;
    continue;
  }
  const live = extractPrice(md, job.shoe);
  if (live === null) {
    console.log(`  -  ${job.shoe.slug.padEnd(34)} ${job.offer.retailer.padEnd(14)} no price near model`);
    misses++;
    continue;
  }
  const rrp = job.offer.priceGbp;
  const tag = live < rrp ? `↓ £${rrp}→£${live} (-${Math.round(((rrp - live) / rrp) * 100)}%)` : `= £${live}`;
  console.log(`  ${live < rrp ? '*' : ' '}  ${job.shoe.slug.padEnd(34)} ${job.offer.retailer.padEnd(14)} ${tag}`);
  if (live < rrp - 4) {
    job.offer.streetPriceGbp = live;
    job.offer.priceDropped = true;
    job.offer.checkedAt = today;
    drops++;
    updates++;
  } else if (job.offer.streetPriceGbp && live >= rrp - 4) {
    // back to RRP — strip stale drop
    delete job.offer.streetPriceGbp;
    delete job.offer.priceDropped;
    job.offer.checkedAt = today;
    updates++;
  }
}

  console.log(`\n${drops} price drops, ${updates} offer updates, ${misses} misses`);
  if (!dry && updates > 0) {
    const out = join(__dirname, '..', 'src', 'data', 'offers.json');
    writeFileSync(out, `${JSON.stringify(OFFERS, null, 0)}\n`);
    console.log(`wrote ${out}`);
  } else if (dry) {
    console.log('--dry: no file written');
  }
}

main();
