/** Phase-1 debugging probe: do profile differences actually change results? */
import { runMatch } from '../src/engine';
import type { Profile } from '../src/types/profile';

const base: Profile = {
  units: 'metric', region: 'UK', sex: 'M', age: 35, weightKg: 75, weeklyKm: 32,
  easyPaceSecPerKm: 330, experience: 'regular', mode: 'rotation', primaryIntent: 'daily',
  raceDistanceTargetKm: 42.2,
  budget: { type: 'total', amountGbp: 400, stretch: false },
  brandBlocks: [], brandLoves: [], fit: { wide: false, roomyToe: false },
  wantsStability: false, injuryFlags: [],
};

const picksOf = (p: Profile) =>
  runMatch(p).roles.map((r) => `${r.role}:${r.pick.shoe.slug}@${r.pick.match}`).join(' | ');

const variants: Array<[string, Partial<Profile>]> = [
  ['baseline 35y 75kg M', {}],
  ['age 55', { age: 55 }],
  ['age 49', { age: 49 }],
  ['weight 95kg', { weightKg: 95 }],
  ['weight 84kg', { weightKg: 84 }],
  ['weight 58kg', { weightKg: 58 }],
  ['sex F', { sex: 'F' }],
  ['experience new', { experience: 'new' }],
  ['55y + 95kg + F', { age: 55, weightKg: 95, sex: 'F' }],
];

const baselineOut = picksOf(base);
for (const [label, over] of variants) {
  const out = picksOf({ ...base, ...over });
  const same = out === baselineOut ? '  << IDENTICAL to baseline' : '';
  console.log(`${label.padEnd(22)} ${out}${same}`);
}
