/**
 * Offer seed generator (plan Task 16): emits src/data/offers.json from the
 * catalogue. MVP uses retailer/brand SEARCH urls (always valid, never invented
 * deep links) with RRP as the manual price snapshot — the Phase-2 datafeed
 * pipeline replaces this file with live per-SKU prices + licensed images.
 * Re-run after catalogue changes: npx tsx scripts/gen-offers.ts
 * Verify links after a run: npx tsx scripts/check-links.ts
 *
 * URL patterns are link-checker verified (2026-06-12):
 *  - SportsShoes search lives at /products/running?search= (the old /search/?q= 404s)
 *  - Runners Need has NO url-addressable search (all /search routes 404 even
 *    rendered) — we link verified per-brand landing pages until the Webgains
 *    datafeed provides per-SKU deep links (kind: 'brand', UI labels honestly)
 *  - Brooks search is /en_gb/search?q= (no trailing slash) and redirects known
 *    models to family pages
 *  - Hoka/Asics/Adidas/New Balance bot-wall headless checks but render fine in
 *    real browsers (firecrawl-verified)
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import shoes from '../src/data/shoes.json';

const CHECKED = '2026-06-12';

const q = (s: { brand: string; model: string; version: string }) =>
  encodeURIComponent(`${s.model} ${s.version}`.trim());
const qFull = (s: { brand: string; model: string; version: string }) =>
  encodeURIComponent(`${s.brand} ${s.model} ${s.version}`.trim());

/** Confident brand-site search patterns (UK storefronts). Others fall back to retailer only. */
/**
 * Brooks has no url-addressable search (versioned queries 404; family names
 * 302 to family pages) — link the stable family PLP directly. ALLOWLIST of
 * verified family pages only: unmapped models (e.g. Hyperion Elite — no route
 * exists, soft-404) get no Brooks offer and rely on SportsShoes/Runners Need.
 * Verify a family page before adding it here (npx tsx scripts/check-links.ts).
 */
const BROOKS_FAMILY: Record<string, string> = {
  Ghost: 'ghost',
  'Ghost Max': 'ghost',
  Glycerin: 'glycerin',
  'Glycerin Max': 'glycerin',
  'Adrenaline GTS': 'adrenaline',
};
const brooksFamilyUrl = (model: string): string | null => {
  const fam = BROOKS_FAMILY[model];
  return fam ? `https://www.brooksrunning.com/en_gb/${fam}/` : null;
};

const BRAND_SEARCH: Record<string, (s: { brand: string; model: string; version: string }) => string | null> = {
  Nike: (s) => `https://www.nike.com/gb/w?q=${q(s)}`,
  Adidas: (s) => `https://www.adidas.co.uk/search?q=${q(s)}`,
  Asics: (s) => `https://www.asics.com/gb/en-gb/search/?q=${q(s)}`,
  Saucony: (s) => `https://www.saucony.com/en/search?q=${q(s)}`,
  Hoka: (s) => `https://www.hoka.com/en/gb/search?q=${q(s)}`,
  Brooks: (s) => brooksFamilyUrl(s.model),
  'New Balance': (s) => `https://www.newbalance.co.uk/search?q=${q(s)}`,
  On: (s) => `https://www.on.com/en-gb/search?q=${q(s)}`,
  Puma: (s) => `https://uk.puma.com/uk/en/search?q=${q(s)}`,
  'Under Armour': (s) => `https://www.underarmour.co.uk/en-gb/search?q=${q(s)}`,
  Salomon: (s) => `https://www.salomon.com/en-gb/search?q=${q(s)}`,
};

/** Shoes whose brand-site search verifiably returns nothing (checker EMPTY). */
const BRAND_SEARCH_DEAD = new Set<string>([
  'saucony-axon-4', // gone from saucony.com search (superseded line) — retailers still stock it
]);

/**
 * Runners Need (Webgains 8% — the UK commission anchor) brand landing pages,
 * each verified HTTP 200. Brands absent here get no Runners Need offer.
 */
const RUNNERS_NEED_BRANDS: Record<string, string> = {
  Nike: 'nike',
  Adidas: 'adidas',
  Asics: 'asics',
  Saucony: 'saucony',
  Hoka: 'hoka',
  Brooks: 'brooks',
  'New Balance': 'new-balance',
  On: 'on',
  Puma: 'puma',
  Mizuno: 'mizuno',
  Altra: 'altra',
  'Under Armour': 'under-armour',
  Salomon: 'salomon',
  Skechers: 'skechers',
  Reebok: 'reebok',
};

const offers: Record<string, unknown[]> = {};

for (const s of shoes as Array<{ slug: string; brand: string; model: string; version: string; msrpGbp: number }>) {
  const list: unknown[] = [
    {
      retailer: 'SportsShoes',
      region: 'UK',
      url: `https://www.sportsshoes.com/products/running?search=${qFull(s)}`,
      priceGbp: s.msrpGbp,
      kind: 'search',
      checkedAt: CHECKED,
    },
  ];
  const rnBrand = RUNNERS_NEED_BRANDS[s.brand];
  if (rnBrand) {
    list.push({
      // Webgains programme pays 8% — the strongest UK commission surface (spec §9.1)
      retailer: 'Runners Need',
      region: 'UK',
      url: `https://www.runnersneed.com/brands/${rnBrand}.html`,
      priceGbp: s.msrpGbp,
      kind: 'brand',
      checkedAt: CHECKED,
    });
  }
  const brandUrl = BRAND_SEARCH[s.brand]?.(s);
  if (brandUrl && !BRAND_SEARCH_DEAD.has(s.slug)) {
    list.push({
      retailer: s.brand,
      region: 'UK',
      url: brandUrl,
      priceGbp: s.msrpGbp,
      kind: 'search',
      checkedAt: CHECKED,
    });
  }
  offers[s.slug] = list;
}

const out = join(__dirname, '..', 'src', 'data', 'offers.json');
writeFileSync(out, `${JSON.stringify(offers, null, 0)}\n`);
console.log(`wrote ${Object.keys(offers).length} shoes' offers → ${out}`);
