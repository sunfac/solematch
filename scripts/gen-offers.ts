/**
 * Offer seed generator (plan Task 16): emits src/data/offers.json from the
 * catalogue. MVP uses retailer/brand SEARCH urls (always valid, never invented
 * deep links) with RRP as the manual price snapshot — the Phase-2 datafeed
 * pipeline replaces this file with live per-SKU prices + licensed images.
 * Re-run after catalogue changes: npx tsx scripts/gen-offers.ts
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
const BRAND_SEARCH: Record<string, (s: { brand: string; model: string; version: string }) => string> = {
  Nike: (s) => `https://www.nike.com/gb/w?q=${q(s)}`,
  Adidas: (s) => `https://www.adidas.co.uk/search?q=${q(s)}`,
  Asics: (s) => `https://www.asics.com/gb/en-gb/search/?q=${q(s)}`,
  Saucony: (s) => `https://www.saucony.com/en/search?q=${q(s)}`,
  Hoka: (s) => `https://www.hoka.com/en/gb/search?q=${q(s)}`,
  Brooks: (s) => `https://www.brooksrunning.com/en_gb/search/?q=${q(s)}`,
  'New Balance': (s) => `https://www.newbalance.co.uk/search?q=${q(s)}`,
  On: (s) => `https://www.on.com/en-gb/search?q=${q(s)}`,
  Puma: (s) => `https://uk.puma.com/uk/en/search?q=${q(s)}`,
  'Under Armour': (s) => `https://www.underarmour.co.uk/en-gb/search?q=${q(s)}`,
  Salomon: (s) => `https://www.salomon.com/en-gb/search?q=${q(s)}`,
};

const offers: Record<string, unknown[]> = {};

for (const s of shoes as Array<{ slug: string; brand: string; model: string; version: string; msrpGbp: number }>) {
  const list: unknown[] = [
    {
      retailer: 'SportsShoes',
      region: 'UK',
      url: `https://www.sportsshoes.com/search/?q=${qFull(s)}`,
      priceGbp: s.msrpGbp,
      checkedAt: CHECKED,
    },
    {
      // Webgains programme pays 8% — the strongest UK commission surface (spec §9.1)
      retailer: 'Runners Need',
      region: 'UK',
      url: `https://www.runnersneed.com/search?q=${qFull(s)}`,
      priceGbp: s.msrpGbp,
      checkedAt: CHECKED,
    },
  ];
  const brandUrl = BRAND_SEARCH[s.brand];
  if (brandUrl) {
    list.push({
      retailer: s.brand,
      region: 'UK',
      url: brandUrl(s),
      priceGbp: s.msrpGbp,
      checkedAt: CHECKED,
    });
  }
  offers[s.slug] = list;
}

const out = join(__dirname, '..', 'src', 'data', 'offers.json');
writeFileSync(out, `${JSON.stringify(offers, null, 0)}\n`);
console.log(`wrote ${Object.keys(offers).length} shoes' offers → ${out}`);
