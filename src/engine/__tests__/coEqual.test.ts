import { runMatch } from '../index';
import { DEAD_HEAT, isCoEqual } from '../scoring';
import { baseProfile } from './filtersRolePlan.test';

describe('isCoEqual (dead-heat band)', () => {
  test('within the band is co-equal; just outside is not', () => {
    expect(isCoEqual(80, 80)).toBe(true);
    expect(isCoEqual(80, 80 - DEAD_HEAT)).toBe(true);
    expect(isCoEqual(80 - DEAD_HEAT, 80)).toBe(true); // symmetric
    expect(isCoEqual(80, 80 - DEAD_HEAT - 0.01)).toBe(false);
    expect(isCoEqual(80, 70)).toBe(false);
  });
});

describe('coEqual annotation on match results', () => {
  // a spread of realistic profiles: deep-budget racer, mid-budget half, tight single
  const profiles = [
    baseProfile({
      weeklyKm: 60,
      raceDistanceTargetKm: 42.2,
      race: { distanceKm: 21.1, timeSec: 95 * 60 },
      budget: { type: 'total', amountGbp: 650, stretch: false },
    }),
    baseProfile({
      weeklyKm: 40,
      raceDistanceTargetKm: 21.1,
      budget: { type: 'total', amountGbp: 480, stretch: false },
    }),
    baseProfile({ weeklyKm: 25, budget: { type: 'total', amountGbp: 160, stretch: false } }),
  ];
  const allRoles = profiles.flatMap((p) => runMatch(p).roles);

  test('every coEqual names the nearest alternate (alternates[0]) with a non-empty label', () => {
    for (const r of allRoles) {
      if (r.coEqual) {
        expect(r.alternates.length).toBeGreaterThan(0);
        expect(r.coEqual.slug).toBe(r.alternates[0].shoe.slug);
        expect(r.coEqual.name.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('a co-equal tie and a decisive edge are mutually exclusive', () => {
    for (const r of allRoles) {
      expect(Boolean(r.coEqual && r.edge)).toBe(false);
    }
  });

  test('co-equal pick and its named tie sit within a few match points (sanity)', () => {
    for (const r of allRoles) {
      if (r.coEqual) {
        // genuine fit is within DEAD_HEAT; the displayed match can diverge a little
        // via the soft cap, but a true tie should never read as a blowout
        expect(Math.abs(r.pick.match - r.alternates[0].match)).toBeLessThanOrEqual(6);
      }
    }
  });

  test('a deep, dense rotation surfaces at least one co-equal slot (the feature fires)', () => {
    expect(allRoles.some((r) => !!r.coEqual)).toBe(true);
  });
});
