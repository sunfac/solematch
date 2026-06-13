import { runMatch } from '../index';
import { baseProfile } from './filtersRolePlan.test';

test('60 km/wk racer on £650 total: 4 distinct shoes, budget respected, diversity satisfied, carbon race slot', () => {
  const p = baseProfile({
    weeklyKm: 60,
    raceDistanceTargetKm: 42.2,
    race: { distanceKm: 21.1, timeSec: 95 * 60 },
    budget: { type: 'total', amountGbp: 650, stretch: false },
  });
  const result = runMatch(p);
  expect(result.roles.length).toBe(4);

  const slugs = result.roles.map((r) => r.pick.shoe.slug);
  expect(new Set(slugs).size).toBe(4);
  expect(result.totals.costGbp).toBeLessThanOrEqual(650);

  const race = result.roles.find((r) => r.role === 'race')!;
  expect(race.pick.shoe.plate).toBe('carbon');

  const foams = new Set(result.roles.map((r) => r.pick.shoe.foamClass));
  expect(foams.size).toBeGreaterThanOrEqual(2);
  // Brand uniqueness — no two Sauconys in a rotation, etc. Different brands
  // give the runner different lasts/heel hold/forefoot shape across the week,
  // which IS the Malisoux 2015 load-variation benefit.
  const brands = new Set(result.roles.map((r) => r.pick.shoe.brand));
  expect(brands.size).toBe(result.roles.length);
  // Every pair clears at least two of: ≥2mm drop, different foam, ≥5mm stack
  for (let i = 0; i < result.roles.length; i++) {
    for (let j = i + 1; j < result.roles.length; j++) {
      const a = result.roles[i].pick.shoe;
      const b = result.roles[j].pick.shoe;
      const diffs =
        Number(Math.abs(a.dropMm - b.dropMm) >= 2) +
        Number(a.foamClass !== b.foamClass) +
        Number(Math.abs(a.stackHeelMm - b.stackHeelMm) >= 5);
      expect(diffs).toBeGreaterThanOrEqual(2);
    }
  }
});

test('£180 total rotation collapses to one versatile shoe plus a roadmap note', () => {
  const p = baseProfile({
    weeklyKm: 45,
    raceDistanceTargetKm: 42.2,
    budget: { type: 'total', amountGbp: 180, stretch: false },
  });
  const result = runMatch(p);
  expect(result.roles.length).toBe(1);
  expect(result.roles[0].pick.shoe.msrpGbp).toBeLessThanOrEqual(180);
  expect(['daily', 'tempo']).toContain(result.roles[0].pick.shoe.category);
  expect(result.notes.some((n) => n.includes('Add next'))).toBe(true);
});

test('rotation note cites Malisoux and alternates exclude picked slugs', () => {
  const p = baseProfile({ weeklyKm: 40, budget: { type: 'total', amountGbp: 500, stretch: false } });
  const result = runMatch(p);
  expect(result.notes.some((n) => n.includes('Malisoux 2015'))).toBe(true);
  const picked = new Set(result.roles.map((r) => r.pick.shoe.slug));
  for (const role of result.roles) {
    expect(role.alternates.length).toBeGreaterThanOrEqual(1);
    for (const alt of role.alternates) {
      expect(picked.has(alt.shoe.slug)).toBe(false);
    }
  }
});

test('determinism: identical profiles produce identical results', () => {
  const p = baseProfile({ weeklyKm: 55, raceDistanceTargetKm: 21.1, easyPaceSecPerKm: 350 });
  expect(JSON.stringify(runMatch(p))).toBe(JSON.stringify(runMatch(p)));
});

test('engine and ruleset versions stamped on every result', () => {
  const result = runMatch(baseProfile());
  expect(result.engineVersion).toBe('1.0.0');
  expect(result.rulesetVersion).toBe('2026-06');
});
