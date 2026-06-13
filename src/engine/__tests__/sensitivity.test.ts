/**
 * Regression suite for the "same match for two different specs" report:
 * (1) body-metric dead zones, (2) mid-budget quality starvation,
 * (3) constraint violations after the budget pass, (4) rotation/collapse cliff.
 */
import { runMatch } from '../index';
import { SCORED } from '@/scores/formulas';
import type { Profile } from '@/types/profile';
import { baseProfile } from './filtersRolePlan.test';

const midBudgetRacer = (over: Partial<Profile> = {}): Profile =>
  baseProfile({
    weeklyKm: 32,
    raceDistanceTargetKm: 42.2,
    easyPaceSecPerKm: 330,
    budget: { type: 'total', amountGbp: 400, stretch: false },
    ...over,
  });

const signature = (p: Profile) =>
  runMatch(p)
    .roles.map((r) => `${r.role}:${r.pick.shoe.slug}@${r.pick.match}`)
    .join('|');

describe('input sensitivity — different specs must read differently', () => {
  test('weight 70 vs 92 kg changes the result', () => {
    expect(signature(midBudgetRacer({ weightKg: 70 }))).not.toBe(
      signature(midBudgetRacer({ weightKg: 92 })),
    );
  });

  test('age 35 vs 58 changes the result', () => {
    expect(signature(midBudgetRacer({ age: 35 }))).not.toBe(signature(midBudgetRacer({ age: 58 })));
  });

  test('weight changes inside the old dead zone (75 vs 84) still register somewhere', () => {
    const a = runMatch(midBudgetRacer({ weightKg: 75 }));
    const b = runMatch(midBudgetRacer({ weightKg: 84 }));
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });
});

describe('mid-budget rotation quality — no starvation, no broken constraints', () => {
  test('£400 marathon rotation right-sizes instead of starving slots (no budget-category daily, no weak matches)', () => {
    const r = runMatch(midBudgetRacer());
    // 3 great shoes don't exist at £400 in this market — expect a right-sized 2-3 with quality floors
    expect(r.roles.length).toBeGreaterThanOrEqual(2);
    expect(r.roles.length).toBeLessThanOrEqual(3);
    expect(r.totals.costGbp).toBeLessThanOrEqual(400);
    expect(r.roles.map((x) => x.role)).toEqual(expect.arrayContaining(['daily', 'race']));
    const daily = r.roles.find((x) => x.role === 'daily')!;
    expect(daily.pick.shoe.category).not.toBe('budget');
    for (const role of r.roles) {
      expect(role.pick.match).toBeGreaterThanOrEqual(80);
    }
    const race = r.roles.find((x) => x.role === 'race')!;
    expect(race.pick.shoe.plate).not.toBe('none');
  });

  test('no duplicate slugs and diversity holds across the squeezed budget band', () => {
    for (const amount of [300, 350, 400, 450, 500]) {
      for (const weightKg of [58, 75, 95]) {
        const r = runMatch(midBudgetRacer({ weightKg, budget: { type: 'total', amountGbp: amount, stretch: false } }));
        const slugs = r.roles.map((x) => x.pick.shoe.slug);
        expect(new Set(slugs).size).toBe(slugs.length);
        if (r.roles.length >= 2) {
          const foams = new Set(r.roles.map((x) => x.pick.shoe.foamClass));
          expect(foams.size).toBeGreaterThanOrEqual(2);
          // brand uniqueness — no two same-brand picks in a rotation
          const brands = new Set(r.roles.map((x) => x.pick.shoe.brand));
          expect(brands.size).toBe(r.roles.length);
        }
      }
    }
  });

  test('no collapse cliff: every profile variant at £400 keeps a true rotation (≥2 shoes)', () => {
    for (const over of [
      {},
      { sex: 'F' as const },
      { age: 55 },
      { weightKg: 95 },
      { sex: 'F' as const, age: 55, weightKg: 95 },
    ]) {
      const r = runMatch(midBudgetRacer(over));
      expect(r.roles.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('stated priority personalises the pick', () => {
  const dailyPick = (priority: Profile['priority']) =>
    runMatch(
      baseProfile({
        mode: 'single',
        primaryIntent: 'daily',
        race: undefined,
        raceDistanceTargetKm: undefined,
        budget: { type: 'perShoe', amountGbp: 220, stretch: false },
        priority,
      }),
    ).roles[0].pick.shoe.slug;

  test('different priorities land on different daily shoes (≥2 distinct of 4)', () => {
    const picks = (['speed', 'comfort', 'value', 'durability'] as const).map(dailyPick);
    expect(new Set(picks).size).toBeGreaterThanOrEqual(2);
  });

  test('priority is deterministic — same priority twice gives the same shoe', () => {
    expect(dailyPick('comfort')).toBe(dailyPick('comfort'));
  });
});

describe('stated priority personalises the ROTATION daily slot (reported bug)', () => {
  // The owner picked "speed" for a daily trainer in a rotation and got the same
  // shoe as every other priority — the random dead-heat tiebreaks were burying
  // the stated preference. Priority must now DIRECT both tiebreaks.
  const STAT = { speed: 'spd', comfort: 'csh', value: 'val', durability: 'dur' } as const;
  const rotProfile = (priority: Profile['priority']) =>
    baseProfile({
      mode: 'rotation',
      weeklyKm: 40,
      raceDistanceTargetKm: 42.2,
      budget: { type: 'total', amountGbp: 600, stretch: false },
      priority,
    });
  const dailyOf = (priority: Profile['priority']) =>
    runMatch(rotProfile(priority)).roles.find((x) => x.role === 'daily')!.pick.shoe;

  test('the daily slot responds to priority (≥2 distinct picks across the four)', () => {
    const slugs = (['speed', 'comfort', 'value', 'durability'] as const).map((p) => dailyOf(p).slug);
    expect(new Set(slugs).size).toBeGreaterThanOrEqual(2);
  });

  test('each priority makes the daily at least as strong on its OWN dimension as the neutral pick', () => {
    const neutral = SCORED.get(dailyOf(undefined).slug)!;
    for (const p of ['speed', 'comfort', 'value', 'durability'] as const) {
      expect(SCORED.get(dailyOf(p).slug)![STAT[p]]).toBeGreaterThanOrEqual(neutral[STAT[p]]);
    }
  });

  test('speed priority yields a strictly faster daily than the neutral pick', () => {
    expect(SCORED.get(dailyOf('speed').slug)!.spd).toBeGreaterThan(SCORED.get(dailyOf(undefined).slug)!.spd);
  });

  test('rotation priority is deterministic — same priority twice gives the same daily', () => {
    expect(dailyOf('speed').slug).toBe(dailyOf('speed').slug);
  });
});
