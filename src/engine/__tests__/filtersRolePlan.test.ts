import { SHOES } from '@/data/catalogue';
import type { Profile, Role } from '@/types/profile';
import { hardFilter } from '../filters';
import { isVersatilityMode, planRoles } from '../rolePlan';

export function baseProfile(over: Partial<Profile> = {}): Profile {
  return {
    units: 'metric',
    region: 'UK',
    sex: 'M',
    age: 35,
    weightKg: 75,
    weeklyKm: 35,
    easyPaceSecPerKm: 330,
    experience: 'regular',
    mode: 'rotation',
    primaryIntent: 'daily',
    budget: { type: 'total', amountGbp: 400, stretch: false },
    brandBlocks: [],
    brandLoves: [],
    fit: { wide: false, roomyToe: false },
    wantsStability: false,
    injuryFlags: [],
    ...over,
  };
}

describe('hardFilter', () => {
  test('excludes superseded shoes and blocked brands', () => {
    const { eligible } = hardFilter(SHOES, baseProfile({ brandBlocks: ['Nike'] }));
    expect(eligible.some((s) => s.slug === 'nike-alphafly-3')).toBe(false);
    expect(eligible.some((s) => s.brand === 'Nike')).toBe(false);
    expect(eligible.length).toBeGreaterThan(30);
  });

  test('wide fit requires multiple widths', () => {
    const { eligible } = hardFilter(SHOES, baseProfile({ fit: { wide: true, roomyToe: false } }));
    expect(eligible.every((s) => s.widths.length >= 2)).toBe(true);
    expect(eligible.length).toBeGreaterThanOrEqual(10);
  });

  test('per-shoe budget excludes pricier shoes; stretch window is 10%', () => {
    const p = baseProfile({ budget: { type: 'perShoe', amountGbp: 200, stretch: true } });
    const { eligible, stretch } = hardFilter(SHOES, p);
    expect(eligible.every((s) => s.msrpGbp <= 200)).toBe(true);
    expect(stretch.every((s) => s.msrpGbp > 200 && s.msrpGbp <= 220)).toBe(true);
    expect(stretch.some((s) => s.slug === 'asics-megablast')).toBe(true);
  });

  test('total-budget mode passes everything through price-wise', () => {
    const p = baseProfile({ budget: { type: 'total', amountGbp: 100, stretch: false } });
    const { eligible } = hardFilter(SHOES, p);
    expect(eligible.some((s) => s.msrpGbp > 100)).toBe(true);
  });
});

describe('planRoles', () => {
  const cases: Array<[number, boolean, Role[]]> = [
    [20, false, ['daily']],
    [20, true, ['daily', 'race']],
    [40, false, ['daily', 'tempo']],
    [40, true, ['daily', 'tempo', 'race']],
    [60, false, ['daily', 'recovery', 'tempo']],
    [60, true, ['daily', 'recovery', 'tempo', 'race']],
  ];
  test.each(cases)('weeklyKm=%s racing=%s', (km, racing, expected) => {
    const p = baseProfile({
      weeklyKm: km,
      raceDistanceTargetKm: racing ? 42.2 : undefined,
    });
    expect(planRoles(p)).toEqual(expected);
  });

  test('single mode returns the chosen intent', () => {
    expect(planRoles(baseProfile({ mode: 'single', primaryIntent: 'race' }))).toEqual(['race']);
    const everything = baseProfile({ mode: 'single', primaryIntent: 'everything' });
    expect(planRoles(everything)).toEqual(['daily']);
    expect(isVersatilityMode(everything)).toBe(true);
  });
});
