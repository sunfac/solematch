/** Dev probe: print top-3 race/daily picks + match% for the calibration personas. */
import { SHOES } from '../src/data/catalogue';
import { hardFilter } from '../src/engine/filters';
import { marathonPaceSecPerKm, plateFactor } from '../src/engine/paces';
import { scoreRole } from '../src/engine/scoring';
import type { Profile } from '../src/types/profile';

const base: Profile = {
  units: 'metric', region: 'UK', sex: 'M', age: 35, weightKg: 75, weeklyKm: 35,
  easyPaceSecPerKm: 330, experience: 'regular', mode: 'rotation', primaryIntent: 'daily',
  budget: { type: 'total', amountGbp: 400, stretch: false },
  brandBlocks: [], brandLoves: [], fit: { wide: false, roomyToe: false },
  wantsStability: false, injuryFlags: [],
};

const personas: Profile[] = [
  { ...base, race: { distanceKm: 10, timeSec: 2400 }, raceDistanceTargetKm: 42.2, easyPaceSecPerKm: undefined },
  { ...base, easyPaceSecPerKm: 420, raceDistanceTargetKm: 42.2 },
  { ...base, weightKg: 95, weeklyKm: 20, raceDistanceTargetKm: 10 },
];

personas.forEach((p, i) => {
  const mp = marathonPaceSecPerKm(p);
  const f = plateFactor(mp);
  const { eligible } = hardFilter(SHOES, p);
  for (const role of ['race', 'daily'] as const) {
    const top3 = scoreRole(eligible, p, role, { mp, factor: f, versatility: false }).slice(0, 3);
    console.log(
      `persona ${i} mp=${mp?.toFixed(0)} f=${f.toFixed(2)} ${role} → ` +
        top3.map((t) => `${t.shoe.slug} rs=${t.roleScore.toFixed(1)} m=${t.match}`).join(' | '),
    );
  }
});
