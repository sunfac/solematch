import type { Profile, Role } from '@/types/profile';

/**
 * Role plan per spec §4.2-3. Rotation size scales with weekly volume
 * (rationale: Malisoux 2015 load-variation — see RULES['rotation-injury']);
 * a race slot is added whenever the runner is targeting a race.
 * Single mode scores against the chosen intent; "everything" maps to daily
 * with versatility weighting applied in scoring.
 */
export function planRoles(p: Profile): Role[] {
  const offRoad = p.terrain === 'trail' || p.terrain === 'technical';
  const someTrail = p.terrain === 'road-trail';

  if (p.mode === 'single') {
    // an off-road runner wanting one shoe gets a trail shoe; a road-trail runner
    // (mostly road) keeps their road intent; pure road is unchanged
    if (offRoad) return ['trail'];
    return [p.primaryIntent === 'everything' ? 'daily' : p.primaryIntent];
  }

  // off-road primary: lead with the trail slot, keep a road daily for road days
  if (offRoad) {
    return p.weeklyKm > 50 ? ['trail', 'daily', 'tempo'] : ['trail', 'daily'];
  }

  const wantsRace = p.raceDistanceTargetKm !== undefined;
  const base: Role[] =
    p.weeklyKm < 25
      ? wantsRace
        ? ['daily', 'race']
        : ['daily']
      : p.weeklyKm <= 50
        ? wantsRace
          ? ['daily', 'tempo', 'race']
          : ['daily', 'tempo']
        : wantsRace
          ? ['daily', 'recovery', 'tempo', 'race']
          : ['daily', 'recovery', 'tempo'];

  // road-primary but some off-road: add a single trail slot to the rotation
  return someTrail ? [...base, 'trail'] : base;
}

/** Single+everything needs versatility weighting in the scorer. */
export function isVersatilityMode(p: Profile): boolean {
  return p.mode === 'single' && p.primaryIntent === 'everything';
}
