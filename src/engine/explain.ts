import { bySlug } from '@/data/catalogue';
import type { RoleResult } from '@/types/match';
import type { Profile } from '@/types/profile';

/** Assemble the result-level notes: rotation rationale, transitions, nudges, budget story. */
export function buildNotes(p: Profile, roles: RoleResult[], baseNotes: string[]): string[] {
  const notes = [...baseNotes];

  if (p.mode === 'rotation' && roles.length >= 2) {
    notes.push(
      'Rotating differing pairs was associated with ~39% lower injury hazard (Malisoux 2015) — your rotation deliberately varies foam and geometry.',
    );
  }

  const current = p.currentShoeSlug ? bySlug.get(p.currentShoeSlug) : undefined;
  for (const { role, pick } of roles) {
    if (current && Math.abs(pick.shoe.dropMm - current.dropMm) >= 4) {
      notes.push(
        `${pick.shoe.brand} ${pick.shoe.model} sits at ${pick.shoe.dropMm} mm drop vs your current ${current.dropMm} mm — phase it in gradually over a few weeks (Malisoux 2017).`,
      );
    }
    if (pick.shoe.plate === 'carbon' && (!current || current.plate !== 'carbon')) {
      notes.push(
        `First carbon plate? Introduce the ${pick.shoe.model} on shorter key sessions before racing in it, and build volume gradually (Tenforde 2023).`,
      );
      break; // one transition note is enough
    }
    void role;
  }

  if (p.injuryFlags.length > 0) {
    notes.push(
      'You flagged an injury history — these picks use conservative defaults, but a physio or medical professional should guide your return, not a shoe.',
    );
  }

  return notes;
}

/** Budget-shortfall roadmap when a rotation could not fit (spec §4.2-5 fallback). */
export function roadmapNote(roles: RoleResult[]): string | undefined {
  const race = roles.find((r) => r.role === 'race');
  if (!race) return undefined;
  return `Add next: a race-day shoe (~£${race.pick.shoe.msrpGbp}) when budget allows — ${race.pick.shoe.brand} ${race.pick.shoe.model} tops your match today.`;
}
