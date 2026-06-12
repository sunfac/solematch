import { BRANDS, bySlug, categoryMedianGbp, SHOES } from '../catalogue';

test('catalogue loads and validates against schema', () => {
  expect(SHOES.length).toBeGreaterThanOrEqual(55);
});

test('every category is populated with at least 5 shoes', () => {
  for (const c of ['race', 'tempo', 'daily', 'max_cushion', 'stability', 'budget'] as const) {
    expect(SHOES.filter((s) => s.category === c).length).toBeGreaterThanOrEqual(5);
  }
});

test('slugs are unique and resolvable', () => {
  expect(new Set(SHOES.map((s) => s.slug)).size).toBe(SHOES.length);
  expect(bySlug.get('nike-vaporfly-4')?.brand).toBe('Nike');
});

test('forefoot stack never exceeds heel stack and drop is consistent within 2mm', () => {
  for (const s of SHOES) {
    expect(s.stackFfMm).toBeLessThanOrEqual(s.stackHeelMm);
    expect(Math.abs(s.stackHeelMm - s.stackFfMm - s.dropMm)).toBeLessThanOrEqual(2);
  }
});

test('category price medians are sane', () => {
  expect(categoryMedianGbp('race')).toBeGreaterThan(180);
  expect(categoryMedianGbp('budget')).toBeLessThan(110);
});

test('major brands are represented', () => {
  for (const b of ['Nike', 'Adidas', 'Asics', 'Saucony', 'Hoka', 'Brooks', 'New Balance']) {
    expect(BRANDS).toContain(b);
  }
});
