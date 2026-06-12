/**
 * Persona regression suite (plan Task 12 / spec §4.4): named real-world profiles
 * with behavioural invariants. Invariants — not snapshots — so formula tuning
 * survives while spec behaviour cannot silently regress.
 */
import { runMatch } from '../index';
import type { MatchResult } from '@/types/match';
import { baseProfile } from './filtersRolePlan.test';

const allPicks = (r: MatchResult) => r.roles.map((x) => x.pick);
const roleOf = (r: MatchResult, role: string) => r.roles.find((x) => x.role === role);

test('PB-chaser: 38, 70 kg, 65 km/wk, 3:05 marathon target, £700', () => {
  const r = runMatch(
    baseProfile({
      age: 38, weightKg: 70, weeklyKm: 65,
      race: { distanceKm: 42.195, timeSec: 3 * 3600 + 10 * 60 },
      raceDistanceTargetKm: 42.2,
      budget: { type: 'total', amountGbp: 700, stretch: false },
    }),
  );
  expect(r.roles.length).toBe(4);
  expect(roleOf(r, 'race')!.pick.shoe.plate).toBe('carbon');
  expect(roleOf(r, 'race')!.pick.match).toBeGreaterThanOrEqual(85);
  expect(roleOf(r, 'recovery')!.pick.shoe.plate).not.toBe('carbon');
  expect(r.totals.costGbp).toBeLessThanOrEqual(700);
});

test('returner: 45, new runner, 15 km/wk, one comfortable shoe, £120', () => {
  const r = runMatch(
    baseProfile({
      age: 45, weeklyKm: 15, experience: 'new', mode: 'single', primaryIntent: 'everything',
      easyPaceSecPerKm: 450, race: undefined,
      budget: { type: 'perShoe', amountGbp: 120, stretch: false },
    }),
  );
  expect(r.roles.length).toBe(1);
  const pick = r.roles[0].pick;
  expect(pick.shoe.msrpGbp).toBeLessThanOrEqual(120);
  expect(pick.shoe.plate).not.toBe('carbon');
  expect(['daily', 'tempo', 'budget', 'max_cushion', 'stability']).toContain(pick.shoe.category);
});

test('masters runner: 58, prefers cushion, no race — no plates anywhere, rocker lean visible', () => {
  const r = runMatch(
    baseProfile({
      age: 58, weeklyKm: 35, easyPaceSecPerKm: 400, race: undefined,
      budget: { type: 'total', amountGbp: 320, stretch: false },
    }),
  );
  for (const pick of allPicks(r)) {
    expect(pick.shoe.plate).not.toBe('carbon');
  }
  const reasons = allPicks(r).flatMap((p) => p.reasons.map((x) => x.ruleId));
  expect(reasons).toContain('masters-rocker');
});

test('female runner with bone-stress history: carbon only on race day, physio nudge present', () => {
  const r = runMatch(
    baseProfile({
      sex: 'F', age: 29, weightKg: 55, weeklyKm: 55,
      race: { distanceKm: 21.1, timeSec: 88 * 60 }, raceDistanceTargetKm: 21.1,
      injuryFlags: ['bone_stress'],
      budget: { type: 'total', amountGbp: 600, stretch: false },
    }),
  );
  for (const { role, pick } of r.roles) {
    if (role !== 'race') expect(pick.shoe.plate).not.toBe('carbon');
  }
  expect(r.notes.some((n) => n.toLowerCase().includes('physio'))).toBe(true);
  const reasons = allPicks(r).flatMap((p) => p.reasons.map((x) => x.ruleId));
  expect(reasons).toContain('soft-midsole-light-runners');
});

test('heavy novice: 102 kg, 20 km/wk — durable daily, no max-cushion forcing, no low-drop push', () => {
  const r = runMatch(
    baseProfile({
      weightKg: 102, weeklyKm: 20, experience: 'new', easyPaceSecPerKm: 480, race: undefined,
      mode: 'single', primaryIntent: 'daily',
      budget: { type: 'perShoe', amountGbp: 150, stretch: false },
    }),
  );
  const pick = r.roles[0].pick;
  expect(['TPU', 'EVA', 'BLEND']).toContain(pick.shoe.foamClass);
  expect(pick.reasons.some((x) => x.ruleId === 'durable-foam-heavier')).toBe(true);
});

test('light fast racer: 52 kg female, 33:00 10k, targets 10k — low-mass racer wins', () => {
  const r = runMatch(
    baseProfile({
      sex: 'F', weightKg: 52, weeklyKm: 70,
      race: { distanceKm: 10, timeSec: 33 * 60 }, raceDistanceTargetKm: 10,
      budget: { type: 'total', amountGbp: 800, stretch: false },
    }),
  );
  const race = roleOf(r, 'race')!.pick;
  expect(race.shoe.weightG).toBeLessThanOrEqual(180);
  expect(race.match).toBeGreaterThanOrEqual(88);
});

test('budget student: £90 per shoe — gets a real recommendation, value visible', () => {
  const r = runMatch(
    baseProfile({
      age: 21, weeklyKm: 25, mode: 'single', primaryIntent: 'daily',
      budget: { type: 'perShoe', amountGbp: 90, stretch: false },
    }),
  );
  const pick = r.roles[0].pick;
  expect(pick.shoe.msrpGbp).toBeLessThanOrEqual(90);
  expect(pick.match).toBeGreaterThanOrEqual(70);
});

test('zone-2-only runner: recovery-heavy needs, no race slot, no carbon', () => {
  const r = runMatch(
    baseProfile({
      weeklyKm: 55, easyPaceSecPerKm: 430, race: undefined,
      budget: { type: 'total', amountGbp: 450, stretch: false },
    }),
  );
  expect(r.roles.map((x) => x.role)).not.toContain('race');
  for (const pick of allPicks(r)) expect(pick.shoe.plate).not.toBe('carbon');
});

test('Achilles history: no sub-6mm drop picks, achilles reasoning surfaced', () => {
  const r = runMatch(
    baseProfile({
      injuryFlags: ['achilles_calf'], weeklyKm: 40,
      budget: { type: 'total', amountGbp: 400, stretch: false },
    }),
  );
  for (const pick of allPicks(r)) {
    expect(pick.shoe.dropMm).toBeGreaterThanOrEqual(6);
  }
  expect(r.notes.some((n) => n.toLowerCase().includes('physio'))).toBe(true);
});

test('no-pace-data runner: conservative plate handling, still gets a confident match', () => {
  const r = runMatch(
    baseProfile({
      easyPaceSecPerKm: undefined, race: undefined, raceDistanceTargetKm: 42.2, weeklyKm: 45,
      budget: { type: 'total', amountGbp: 550, stretch: false },
    }),
  );
  const race = roleOf(r, 'race');
  expect(race).toBeDefined();
  // unknown ability = slow-band handling: top race pick must not be a max-stack carbon marathon shoe
  const top = race!.pick.shoe;
  expect(top.plate === 'carbon' && top.stackHeelMm >= 39).toBe(false);
  expect(race!.pick.match).toBeGreaterThanOrEqual(75);
});
