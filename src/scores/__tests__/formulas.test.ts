import { SHOES } from '@/data/catalogue';
import { assignTiers, computeScores, SCORED } from '../formulas';

const score = (slug: string) => {
  const s = SCORED.get(slug);
  if (!s) throw new Error(`missing scores for ${slug}`);
  return s;
};

test('every shoe has all six stats in range with no NaN', () => {
  for (const s of SHOES) {
    const sc = score(s.slug);
    for (const k of ['spd', 'csh', 'stb', 'lgt', 'dur', 'val', 'overall'] as const) {
      expect(Number.isFinite(sc[k])).toBe(true);
      expect(sc[k]).toBeGreaterThanOrEqual(25);
      expect(sc[k]).toBeLessThanOrEqual(99);
    }
  }
});

test('relative orderings hold (spec-credibility invariants)', () => {
  expect(score('nike-vaporfly-4').spd).toBeGreaterThan(score('brooks-ghost-17').spd);
  expect(score('brooks-ghost-17').dur).toBeGreaterThan(score('nike-vaporfly-4').dur);
  expect(score('asics-gel-kayano-32').stb).toBeGreaterThanOrEqual(85);
  expect(score('nike-revolution-8').val).toBeGreaterThan(score('adidas-adios-pro-evo-3').val);
});

test('distribution-based tiers: ~10% ELITE and flagship racers rank top-quartile', () => {
  const all = [...SCORED.values()];
  const elite = all.filter((s) => s.tier === 'ELITE').length;
  expect(elite).toBe(Math.ceil(all.length * 0.1));

  const byOverall = [...SCORED.entries()].sort((a, b) => b[1].overall - a[1].overall);
  const topQuartile = new Set(byOverall.slice(0, Math.ceil(byOverall.length / 4)).map(([slug]) => slug));
  for (const flagship of ['nike-vaporfly-4', 'asics-metaspeed-ray', 'nike-alphafly-4']) {
    expect(topQuartile.has(flagship)).toBe(true);
  }
});

test('the consensus shoe of 2025-26 does not read as scrap', () => {
  expect(['ELITE', 'GOLD']).toContain(score('adidas-adizero-evo-sl').tier);
});

test('determinism: recomputing yields identical scores', () => {
  const fresh = new Map(SHOES.map((s) => [s.slug, computeScores(s)]));
  assignTiers(fresh);
  expect(JSON.stringify([...fresh.entries()].sort())).toBe(
    JSON.stringify([...SCORED.entries()].sort()),
  );
});
