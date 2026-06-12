import type { Profile } from '@/types/profile';

/** Riegel endurance exponent for race-time extrapolation. */
export const RIEGEL_EXP = 1.06;

/**
 * Marathon-equivalent pace in s/km — the engine's single "ability" signal.
 * Priority: recent race (Riegel-projected to 42.195 km) > easy pace heuristic
 * (easy ≈ marathon pace + 60-90 s/km, midpoint 75) > undefined (engine treats
 * unknown ability conservatively, i.e. as slow).
 */
export function marathonPaceSecPerKm(p: Pick<Profile, 'race' | 'easyPaceSecPerKm'>): number | undefined {
  if (p.race && p.race.distanceKm > 0 && p.race.timeSec > 0) {
    const t42 = p.race.timeSec * Math.pow(42.195 / p.race.distanceKm, RIEGEL_EXP);
    return t42 / 42.195;
  }
  if (p.easyPaceSecPerKm) return p.easyPaceSecPerKm - 75;
  return undefined;
}

/**
 * Plate-benefit taper per spec §4.2 (Dominy & Joubert 2022): full weighting at
 * marathon pace ≤4:35/km (275 s), continuous linear taper to 0.3 at 6:15/km
 * (375 s), flooring at 0.3 for anything slower or unknown.
 */
export function plateFactor(mpSecPerKm?: number): number {
  if (mpSecPerKm === undefined) return 0.3;
  if (mpSecPerKm <= 275) return 1;
  if (mpSecPerKm >= 375) return 0.3;
  return 1 - ((mpSecPerKm - 275) / 100) * 0.7;
}
