import { SHOES } from '@/data/catalogue';
import { RULES } from '@/data/rules';
import type { Profile } from '@/types/profile';
import { hardFilter } from '../filters';
import { marathonPaceSecPerKm, plateFactor } from '../paces';
import { scoreRole } from '../scoring';
import { baseProfile } from './filtersRolePlan.test';

function ctxFor(p: Profile) {
  const mp = marathonPaceSecPerKm(p);
  return { mp, factor: plateFactor(mp), versatility: false, seed: JSON.stringify(p) };
}

function raceRanking(p: Profile) {
  const { eligible } = hardFilter(SHOES, p);
  return scoreRole(eligible, p, 'race', ctxFor(p));
}

test('fast racer: top race pick has a carbon plate', () => {
  const p = baseProfile({ race: { distanceKm: 42.195, timeSec: 3 * 3600 + 5 * 60 }, raceDistanceTargetKm: 42.2 });
  const ranked = raceRanking(p);
  expect(ranked[0].shoe.plate).toBe('carbon');
  expect(ranked[0].match).toBeGreaterThanOrEqual(80);
});

test('slow runner: race top-3 includes a non-carbon shoe and the top pick is not a max-stack carbon marathon shoe', () => {
  // easy 8:00/km → marathon-equivalent ~6:45/km → plate factor at the 0.3 floor (spec §4.2 slow band)
  const p = baseProfile({ easyPaceSecPerKm: 480, race: undefined, raceDistanceTargetKm: 42.2 });
  const ranked = raceRanking(p);
  const top3 = ranked.slice(0, 3);
  expect(top3.some((s) => s.shoe.plate !== 'carbon')).toBe(true);
  const top = ranked[0].shoe;
  expect(top.plate === 'carbon' && top.stackHeelMm >= 39).toBe(false);
});

test('bone-stress history: no carbon plate outside the race role', () => {
  const p = baseProfile({ injuryFlags: ['bone_stress'] });
  const { eligible } = hardFilter(SHOES, p);
  for (const role of ['daily', 'tempo', 'recovery'] as const) {
    const ranked = scoreRole(eligible, p, role, ctxFor(p));
    for (const s of ranked.slice(0, 5)) {
      expect(s.shoe.plate).not.toBe('carbon');
    }
  }
});

test('heavier runner: top daily pick uses a durable foam platform', () => {
  const p = baseProfile({ weightKg: 92 });
  const { eligible } = hardFilter(SHOES, p);
  const ranked = scoreRole(eligible, p, 'daily', ctxFor(p));
  expect(['TPU', 'EVA', 'BLEND']).toContain(ranked[0].shoe.foamClass);
});

test('stability never auto-prescribed: no stability-category picks in race/tempo top-5 without preference', () => {
  const p = baseProfile({ wantsStability: false });
  const { eligible } = hardFilter(SHOES, p);
  for (const role of ['race', 'tempo'] as const) {
    const ranked = scoreRole(eligible, p, role, ctxFor(p));
    expect(ranked.slice(0, 5).some((s) => s.shoe.category === 'stability')).toBe(false);
  }
});

test('match% is plausible and not uniformly 99 across personas', () => {
  // race role is always scored with a distance target in real flows (planRoles invariant)
  const personas = [
    baseProfile({ race: { distanceKm: 10, timeSec: 2400 }, raceDistanceTargetKm: 42.2 }),
    baseProfile({ easyPaceSecPerKm: 420, raceDistanceTargetKm: 42.2 }),
    baseProfile({ weightKg: 95, weeklyKm: 20, raceDistanceTargetKm: 10 }),
  ];
  const tops: number[] = [];
  for (const p of personas) {
    const { eligible } = hardFilter(SHOES, p);
    for (const role of ['race', 'daily'] as const) {
      const top = scoreRole(eligible, p, role, ctxFor(p))[0];
      expect(top.match).toBeGreaterThanOrEqual(80);
      expect(top.match).toBeLessThanOrEqual(99);
      tops.push(top.match);
    }
  }
  expect(new Set(tops).size).toBeGreaterThan(1);
});

test('fitter expertise: current-shoe verdict and roomy toe box both change results with cited reasons', () => {
  const base = baseProfile({});
  const lover = baseProfile({ currentShoeSlug: 'asics-novablast-5', currentShoeVerdict: 'love' });
  const { eligible } = hardFilter(SHOES, base);
  const plain = scoreRole(eligible, base, 'daily', ctxFor(base));
  const anchored = scoreRole(hardFilter(SHOES, lover).eligible, lover, 'daily', ctxFor(lover));
  expect(JSON.stringify(plain.map((s) => s.roleScore))).not.toBe(
    JSON.stringify(anchored.map((s) => s.roleScore)),
  );
  expect(
    anchored.some((s) => s.reasons.some((x) => x.ruleId === 'fit-continuity')),
  ).toBe(true);

  const roomy = baseProfile({ fit: { wide: false, roomyToe: true } });
  const roomyRanked = scoreRole(hardFilter(SHOES, roomy).eligible, roomy, 'daily', ctxFor(roomy));
  const altra = roomyRanked.find((s) => s.shoe.brand === 'Altra')!;
  expect(altra.reasons.some((x) => x.ruleId === 'fit-continuity')).toBe(true);
});

test('every reason cites an existing rule', () => {
  const p = baseProfile({ sex: 'F', age: 55, brandLoves: ['Asics'], wantsStability: true, raceDistanceTargetKm: 42.2 });
  const { eligible } = hardFilter(SHOES, p);
  for (const role of ['race', 'tempo', 'daily', 'recovery'] as const) {
    for (const scored of scoreRole(eligible, p, role, ctxFor(p))) {
      expect(scored.reasons.length).toBeGreaterThanOrEqual(1);
      expect(scored.reasons.length).toBeLessThanOrEqual(3);
      for (const reason of scored.reasons) {
        expect(RULES[reason.ruleId]).toBeDefined();
        expect(reason.evidence).toBe(RULES[reason.ruleId].confidence);
      }
    }
  }
});
