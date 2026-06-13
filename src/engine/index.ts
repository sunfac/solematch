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
  const ctx = {
    mp,
    factor: plateFactor(mp),
    versatility: isVersatilityMode(profile),
    seed: JSON.stringify(profile),
    // a true multi-shoe rotation rotates among tied picks for variety; a single
    // "one for everything" shoe gets the precise best fit (rotate left false)
    rotate: profile.mode === 'rotation' && !isVersatilityMode(profile),
  };

  const { eligible, stretch } = hardFilter(shoes, profile);
  const roles = planRoles(profile);

  const rankingsByRole = new Map<Role, ScoredShoe[]>();
  // genuine (un-nudged) best-by-fit order per role — the dead-heat shuffle off —
  // so the rotation assembler can restore a slot's true best when the budget
  // affords it (a high budget should never be banked behind a tied cheaper pick).
  const plainByRole = new Map<Role, ScoredShoe[]>();
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
    plainByRole.set(role, scoreRole(eligible, profile, role, { ...ctx, rotate: false }));
  }

  /**
   * Right-size the rotation to the budget: try the full role plan, then trim
   * recovery, then tempo. Accept the first plan whose best combination has no
   * weak slot (every match ≥ MIN_MATCH) — two excellent shoes beat three
   * compromised ones, and any two differing pairs keep the rotation benefit.
   * If no plan clears the bar, keep the feasible plan with the strongest
   * weakest slot — but only down to FALLBACK_MIN_MATCH; below that the
   * "rotation" is degenerate (e.g. a £90 daily-disguised-as-race forced into
   * the race slot at 40% match) and a single versatile shoe + roadmap reads
   * more honestly than a sub-60% slot. (Owner cal: sub-mid-80s feels weak.)
   */
  const MIN_MATCH = 80;
  // Owner cal: sub-mid-80s reads weak. A "rotation" whose worst slot is 73%
  // (e.g. a £65 budget shoe forced into the daily slot at £180) is degenerate
  // — one strong versatile pick + a roadmap note reads better than two
  // compromises. Bumped from 60 once the catalogue grew dense enough to keep
  // surfacing low-quality 2-shoe fits at very tight budgets.
  const FALLBACK_MIN_MATCH = 75;
  const planCandidates: Role[][] = [roles];
  for (const trim of ['recovery', 'tempo'] as const) {
    const prev = planCandidates[planCandidates.length - 1];
    if (prev.includes(trim) && prev.length > 2) {
      planCandidates.push(prev.filter((r) => r !== trim));
    }
  }

  let chosen: { roles: RoleResult[]; notes: string[] } | null = null;
  let fallback: { roles: RoleResult[]; notes: string[]; minMatch: number } | null = null;
  for (const plan of planCandidates) {
    const subMap = new Map<Role, ScoredShoe[]>(plan.map((r) => [r, rankingsByRole.get(r)!]));
    const outcome = assembleRotation(subMap, profile, plainByRole);
    if (outcome.roles.length === 0) continue;
    const minMatch = Math.min(...outcome.roles.map((r) => r.pick.match));
    const trimmedNote =
      plan.length < roles.length
        ? [
            `Right-sized to ${plan.length} shoes for your budget — stronger picks per slot beat a stretched-thin rotation, and rotating any two differing pairs keeps the load-variation benefit.`,
          ]
        : [];
    if (minMatch >= MIN_MATCH) {
      chosen = { roles: outcome.roles, notes: [...outcome.notes, ...trimmedNote] };
      break;
    }
    if (!fallback || minMatch > fallback.minMatch) {
      fallback = { roles: outcome.roles, notes: [...outcome.notes, ...trimmedNote], minMatch };
    }
  }
  const assembled =
    chosen ??
    (fallback && fallback.minMatch >= FALLBACK_MIN_MATCH ? fallback : null) ??
    { roles: [] as RoleResult[], notes: [] as string[] };

  const roleResults = assembled.roles;
  let finalRoles: RoleResult[] = roleResults;
  const notes = buildNotes(profile, roleResults, assembled.notes);

  // No feasible combination under the budget → collapse to best versatile single + roadmap
  if (roleResults.length === 0) {
    // one shoe → precise best fit, not a rotation pick
    const versatileCtx = { ...ctx, versatility: true, rotate: false };
    const affordable = eligible.filter((s) => s.msrpGbp <= profile.budget.amountGbp);
    const pool = affordable.length > 0 ? affordable : eligible;
    const single = scoreRole(pool, profile, 'daily', versatileCtx);
    finalRoles = [{ role: 'daily', pick: single[0], alternates: single.slice(1, 3) }];
    const raceRanking = rankingsByRole.get('race');
    if (raceRanking && raceRanking.length > 0) {
      const top = raceRanking[0];
      notes.push(
        `Add next: a race-day shoe (~£${top.shoe.msrpGbp}) when budget allows — ${top.shoe.brand} ${top.shoe.model} tops your match today.`,
      );
    }
  }

  const budgetGbp =
    profile.budget.type === 'total'
      ? profile.budget.amountGbp
      : profile.budget.amountGbp * finalRoles.length;

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
