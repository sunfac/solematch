import { SHOES } from '@/data/catalogue';
import { RULESET_VERSION } from '@/data/rules';
import type { MatchResult, RoleResult, ScoredShoe } from '@/types/match';
import type { Profile, Role } from '@/types/profile';
import type { Shoe } from '@/types/shoe';
import { buildNotes } from './explain';
import { hardFilter } from './filters';
import { marathonPaceSecPerKm, plateFactor } from './paces';
import { isVersatilityMode, planRoles } from './rolePlan';
import { assembleRotation } from './rotation';
import { scoreRole } from './scoring';

export const ENGINE_VERSION = '1.0.0';

/**
 * The matching engine. Pure and deterministic: profile in, MatchResult out.
 * No I/O, no randomness, no ML — see spec §4 and /methodology.
 */
export function runMatch(profile: Profile, shoes: Shoe[] = SHOES): MatchResult {
  const mp = marathonPaceSecPerKm(profile);
  const ctx = { mp, factor: plateFactor(mp), versatility: isVersatilityMode(profile) };

  const { eligible, stretch } = hardFilter(shoes, profile);
  const roles = planRoles(profile);

  const rankingsByRole = new Map<Role, ScoredShoe[]>();
  for (const role of roles) {
    let ranking = scoreRole(eligible, profile, role, ctx);
    if (stretch.length > 0) {
      // stretch picks compete only as visible alternates, never as the default pick
      const stretchRanked = scoreRole(stretch, profile, role, ctx);
      ranking = ranking.concat(stretchRanked).sort(
        (a, b) => b.roleScore - a.roleScore || a.shoe.slug.localeCompare(b.shoe.slug),
      );
      const within = ranking.filter((s) => s.shoe.msrpGbp <= profile.budget.amountGbp || profile.budget.type === 'total');
      const top = within[0];
      ranking = [top, ...ranking.filter((s) => s !== top)];
    }
    rankingsByRole.set(role, ranking);
  }

  const { roles: roleResults, notes: rotationNotes, costGbp } = assembleRotation(rankingsByRole, profile);

  const budgetGbp =
    profile.budget.type === 'total'
      ? profile.budget.amountGbp
      : profile.budget.amountGbp * roleResults.length;

  let finalRoles: RoleResult[] = roleResults;
  const notes = buildNotes(profile, roleResults, rotationNotes);

  // Budget unreachable for a rotation → collapse to best versatile single + roadmap
  if (
    profile.mode === 'rotation' &&
    profile.budget.type === 'total' &&
    costGbp > profile.budget.amountGbp * (profile.budget.stretch ? 1.1 : 1)
  ) {
    const versatileCtx = { ...ctx, versatility: true };
    const affordable = eligible.filter((s) => s.msrpGbp <= profile.budget.amountGbp);
    const pool = affordable.length > 0 ? affordable : eligible;
    const single = scoreRole(pool, profile, 'daily', versatileCtx);
    finalRoles = [{ role: 'daily', pick: single[0], alternates: single.slice(1, 3) }];
    const race = roleResults.find((r) => r.role === 'race');
    if (race) {
      notes.push(
        `Add next: a race-day shoe (~£${race.pick.shoe.msrpGbp}) when budget allows — ${race.pick.shoe.brand} ${race.pick.shoe.model} tops your match today.`,
      );
    }
  }

  return {
    mode: profile.mode,
    roles: finalRoles,
    totals: {
      costGbp: finalRoles.reduce((t, r) => t + r.pick.shoe.msrpGbp, 0),
      budgetGbp,
    },
    engineVersion: ENGINE_VERSION,
    rulesetVersion: RULESET_VERSION,
    notes,
  };
}
