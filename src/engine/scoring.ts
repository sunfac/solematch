import { RULES } from '@/data/rules';
import { SCORED } from '@/scores/formulas';
import type { Reason, ScoredShoe } from '@/types/match';
import type { Profile, Role } from '@/types/profile';
import type { Category, Shoe } from '@/types/shoe';
import { MODIFIERS, type ScoreCtx } from './modifiers';

const CATEGORY_FIT: Record<Role, Record<Category, number>> = {
  race: { race: 100, tempo: 72, daily: 40, max_cushion: 15, stability: 20, budget: 25 },
  tempo: { race: 60, tempo: 100, daily: 70, max_cushion: 30, stability: 45, budget: 45 },
  daily: { race: 15, tempo: 65, daily: 100, max_cushion: 80, stability: 80, budget: 80 },
  recovery: { race: 5, tempo: 30, daily: 75, max_cushion: 100, stability: 70, budget: 60 },
};

/**
 * Per-role plausible score ceilings (0.55·100 + realistic modifier stack),
 * tuned so strong picks land ~86-96 — never a degenerate always-99 (spec §6 example: 94).
 * The race ceiling tracks the plate-pace factor: at slow paces the +30 plate headroom
 * does not exist, so the ceiling shrinks with it and a well-matched non-plated pick
 * still reads as a strong match.
 */
const THEORETICAL_MAX: Record<Exclude<Role, 'race'>, number> = { tempo: 88, daily: 90, recovery: 92 };

/**
 * Best NET plate-path contribution available at a given pace factor — must mirror
 * modifiers.plateByPace: carbon nets 60f-30, composite nets 15f, and below f=0.6
 * non-carbon speed shoes earn (0.6-f)*60. The race ceiling tracks whichever path
 * is strongest so the top pick reads as a strong match at every ability level.
 */
const bestPlatePath = (f: number): number =>
  Math.max(60 * f - 30, f < 0.6 ? (0.6 - f) * 60 : 0, 15 * f);

const roleCeiling = (role: Role, factor: number): number =>
  role === 'race' ? 70 + bestPlatePath(factor) : THEORETICAL_MAX[role];

const clampMatch = (n: number) => Math.max(40, Math.min(99, Math.round(n)));

export function scoreShoeForRole(s: Shoe, p: Profile, role: Role, ctx: ScoreCtx): ScoredShoe {
  const scores = SCORED.get(s.slug);
  if (!scores) throw new Error(`no scores for ${s.slug}`);

  let roleScore = 0.55 * CATEGORY_FIT[role][s.category];
  const contributions: Array<{ delta: number; reason?: Reason }> = [];

  for (const mod of MODIFIERS) {
    const c = mod(s, p, role, ctx);
    if (!c) continue;
    roleScore += c.delta;
    if (c.reason) contributions.push({ delta: c.delta, reason: c.reason });
  }

  const reasons = contributions
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3)
    .map((c) => c.reason!)
    .filter((rsn, i, arr) => arr.findIndex((x) => x.ruleId === rsn.ruleId && x.text === rsn.text) === i);

  if (reasons.length === 0) {
    reasons.push({
      text: `Strong all-round fit for your ${role} running`,
      ruleId: 'comfort-tiebreak',
      evidence: RULES['comfort-tiebreak'].confidence,
    });
  }

  return {
    shoe: s,
    scores,
    roleScore,
    match: clampMatch((roleScore / roleCeiling(role, ctx.factor)) * 100),
    reasons,
  };
}

/** Score and rank a candidate pool for one role (descending; deterministic tiebreak by slug). */
export function scoreRole(cands: Shoe[], p: Profile, role: Role, ctx: ScoreCtx): ScoredShoe[] {
  return cands
    .map((s) => scoreShoeForRole(s, p, role, ctx))
    .sort((a, b) => b.roleScore - a.roleScore || a.shoe.slug.localeCompare(b.shoe.slug));
}
