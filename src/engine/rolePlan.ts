import type { Profile, Role } from '@/types/profile';

/**
 * Role plan per spec §4.2-3. Rotation size scales with weekly volume
 * (rationale: Malisoux 2015 load-variation — see RULES['rotation-injury']);
 * a race slot is added whenever the runner is targeting a race.
 * Single mode scores against the chosen intent; "everything" maps to daily
 * with versatility weighting applied in scoring.
 */
export function planRoles(p: Profile): Role[] {
  if (p.mode === 'single') {
    return [p.primaryIntent === 'everything' ? 'daily' : p.primaryIntent];
  }
  const wantsRace = p.raceDistanceTargetKm !== undefined;
  if (p.weeklyKm < 25) return wantsRace ? ['daily', 'race'] : ['daily'];
  if (p.weeklyKm <= 50) return wantsRace ? ['daily', 'tempo', 'race'] : ['daily', 'tempo'];
  return wantsRace ? ['daily', 'recovery', 'tempo', 'race'] : ['daily', 'recovery', 'tempo'];
}

/** Single+everything needs versatility weighting in the scorer. */
export function isVersatilityMode(p: Profile): boolean {
  return p.mode === 'single' && p.primaryIntent === 'everything';
}
