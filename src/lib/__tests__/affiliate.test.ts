import { SHOES } from '@/data/catalogue';
import { buildAffiliateUrl, offersFor, type Offer } from '../affiliate';

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
