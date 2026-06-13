import { SHOES } from '@/data/catalogue';
import { bestOffer, buildAffiliateUrl, dropFor, offersFor, payPrice, type Offer } from '../affiliate';

const offer: Offer = {
  retailer: 'SportsShoes',
  region: 'UK',
  url: 'https://www.sportsshoes.com/search/?q=Nike%20Vaporfly%204',
  priceGbp: 240,
  checkedAt: '2026-06-12',
};

test('passes the raw URL through when no Skimlinks id is configured', () => {
  delete process.env.EXPO_PUBLIC_SKIMLINKS_ID;
  expect(buildAffiliateUrl(offer, 'm1:nike-vaporfly-4:detail')).toBe(offer.url);
});

test('wraps via Skimlinks with encoded url and subId when configured', () => {
  process.env.EXPO_PUBLIC_SKIMLINKS_ID = '123456X789';
  const wrapped = buildAffiliateUrl(offer, 'm1:nike-vaporfly-4:detail');
  delete process.env.EXPO_PUBLIC_SKIMLINKS_ID;
  expect(wrapped).toContain('https://go.skimresources.com/?');
  expect(wrapped).toContain('id=123456X789');
  expect(wrapped).toContain(encodeURIComponent(offer.url));
  expect(wrapped).toContain(`xcust=${encodeURIComponent('m1:nike-vaporfly-4:detail')}`);
});

test('every current shoe has at least one UK offer with an https url and a checked date', () => {
  for (const s of SHOES.filter((x) => x.status === 'current')) {
    const offers = offersFor(s.slug, 'UK');
    expect(offers.length).toBeGreaterThanOrEqual(1);
    for (const o of offers) {
      expect(o.url).toMatch(/^https:\/\//);
      expect(o.priceGbp).toBeGreaterThan(0);
      expect(o.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  }
});

test('regional filter falls back to any region when none match', () => {
  const offers = offersFor('nike-vaporfly-4', 'US');
  expect(offers.length).toBeGreaterThanOrEqual(1);
});

test('Skimlinks wrap includes the matchId in xcust so commissions attribute back to the match', () => {
  process.env.EXPO_PUBLIC_SKIMLINKS_ID = '123456X789';
  const wrapped = buildAffiliateUrl(offer, 'matchABC:nike-vaporfly-4:reveal');
  delete process.env.EXPO_PUBLIC_SKIMLINKS_ID;
  // network payout reports include the xcust we passed in → revenue attributable per
  // matchId / per slug / per placement (reveal vs results vs detail) — the trust
  // contract relies on knowing what earns WITHOUT ever letting it touch ranking.
  expect(wrapped).toMatch(/xcust=matchABC%3Anike-vaporfly-4%3Areveal/);
});

test('every current shoe has a buyable offer (search-or-product kind, real https price)', () => {
  let usableOffers = 0;
  for (const s of SHOES.filter((x) => x.status === 'current')) {
    const offers = offersFor(s.slug, 'UK');
    const usable = offers.filter((o) => o.kind !== 'brand');
    if (usable.length > 0) usableOffers++;
  }
  // every current shoe must have at least one model-specific destination (search or
  // product PDP) — brand-range pages are the no-search-pattern fallback, not the
  // money path. If this trips, run npx tsx scripts/gen-offers.ts and check the kind:
  expect(usableOffers).toBe(SHOES.filter((x) => x.status === 'current').length);
});

test('payPrice prefers a live street price below RRP', () => {
  expect(payPrice({ ...offer, streetPriceGbp: 180 })).toBe(180);
  expect(payPrice(offer)).toBe(offer.priceGbp);
});

test('bestOffer prefers cheaper SEARCH-kind over equal-price BRAND', () => {
  const search: Offer = { ...offer, kind: 'search', priceGbp: 200 };
  const brand: Offer = { ...offer, kind: 'brand', retailer: 'Runners Need', url: 'https://example/brand', priceGbp: 200 };
  expect(bestOffer([brand, search])?.kind).toBe('search');
});

test('bestOffer prefers the live street price when present', () => {
  const expensive: Offer = { ...offer, kind: 'search', priceGbp: 200, streetPriceGbp: 140 };
  const cheaper: Offer = { ...offer, kind: 'search', retailer: 'X', priceGbp: 180 };
  expect(bestOffer([cheaper, expensive])?.streetPriceGbp).toBe(140);
});

test('dropFor surfaces the biggest absolute saving across retailers', () => {
  const drop = dropFor([
    { ...offer, kind: 'search', priceGbp: 240, streetPriceGbp: 180 }, // £60 off
    { ...offer, kind: 'search', retailer: 'X', priceGbp: 240, streetPriceGbp: 200 }, // £40 off
  ]);
  expect(drop?.rrpGbp).toBe(240);
  expect(drop?.streetGbp).toBe(180);
  expect(drop?.pctOff).toBe(25);
});

test('dropFor returns undefined when nothing is dropped', () => {
  expect(dropFor([offer])).toBeUndefined();
});

describe('per-network affiliate dispatch', () => {
  // each network test mutates env vars; clean up after every test so they're isolated
  const envKeys = [
    'EXPO_PUBLIC_SKIMLINKS_ID',
    'EXPO_PUBLIC_AMAZON_TAG',
    'EXPO_PUBLIC_AWIN_ID',
    'EXPO_PUBLIC_AWIN_MID_NIKE',
    'EXPO_PUBLIC_WEBGAINS_ID',
    'EXPO_PUBLIC_WEBGAINS_MID_RUNNERS_NEED',
    'EXPO_PUBLIC_IMPACT_ID',
  ];
  afterEach(() => envKeys.forEach((k) => delete process.env[k]));

  test('Amazon URL wraps with the Amazon Associates tag when configured', () => {
    process.env.EXPO_PUBLIC_AMAZON_TAG = 'solematch-21';
    const amazon: Offer = {
      ...offer,
      retailer: 'Amazon UK',
      url: 'https://www.amazon.co.uk/s?k=Nike+Vaporfly+4',
    };
    const wrapped = buildAffiliateUrl(amazon, 'm:s:detail');
    expect(wrapped).toContain('tag=solematch-21');
    expect(wrapped).toContain('ascsubtag=m%3As%3Adetail');
    expect(wrapped).toContain('amazon.co.uk');
  });

  test('Awin wrap activates only when both publisher ID and merchant ID are set', () => {
    process.env.EXPO_PUBLIC_SKIMLINKS_ID = 'SKIM';
    const nike: Offer = { ...offer, retailer: 'Nike', url: 'https://www.nike.com/gb/w?q=vaporfly' };
    // only the publisher ID — Awin merchant ID for Nike not approved yet → falls back to Skimlinks
    process.env.EXPO_PUBLIC_AWIN_ID = '999999';
    expect(buildAffiliateUrl(nike, 'm:s:p')).toContain('go.skimresources.com');
    // merchant ID approved → Awin direct
    process.env.EXPO_PUBLIC_AWIN_MID_NIKE = '12345';
    const wrapped = buildAffiliateUrl(nike, 'm:s:p');
    expect(wrapped).toContain('awin1.com/cread.php');
    expect(wrapped).toContain('awinmid=12345');
    expect(wrapped).toContain('awinaffid=999999');
    expect(wrapped).toContain('clickref=m%3As%3Ap');
  });

  test('Webgains takes Runners Need when configured (the 8% UK anchor)', () => {
    process.env.EXPO_PUBLIC_WEBGAINS_ID = 'WG_AFF';
    process.env.EXPO_PUBLIC_WEBGAINS_MID_RUNNERS_NEED = 'WG_RN';
    const rn: Offer = { ...offer, retailer: 'Runners Need', url: 'https://www.runnersneed.com/brands/nike.html' };
    const wrapped = buildAffiliateUrl(rn, 'm:s:p');
    expect(wrapped).toContain('track.webgains.com/click.html');
    expect(wrapped).toContain('wgprogramid=WG_RN');
  });

  test('Impact takes Adidas when configured (~10% direct)', () => {
    process.env.EXPO_PUBLIC_IMPACT_ID = 'IMP123';
    const adidas: Offer = { ...offer, retailer: 'Adidas', url: 'https://www.adidas.co.uk/search?q=adios+pro' };
    const wrapped = buildAffiliateUrl(adidas, 'm:s:p');
    expect(wrapped).toContain('impact-radius.com');
    expect(wrapped).toContain('subId1=m%3As%3Ap');
  });

  test('Skimlinks is the passthrough fallback for unconfigured networks', () => {
    process.env.EXPO_PUBLIC_SKIMLINKS_ID = 'SKIM';
    const wrapped = buildAffiliateUrl(offer, 'm:s:p');
    expect(wrapped).toContain('go.skimresources.com');
  });

  test('raw URL passthrough when nothing is configured (zero commission, link still works)', () => {
    expect(buildAffiliateUrl(offer, 'm:s:p')).toBe(offer.url);
  });
});
