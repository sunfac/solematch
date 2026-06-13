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

/**
 * Owner calibration: strong honest picks land 86-96, sub-85 reads weak.
 * The raw ratio (roleScore/ceiling*100) can exceed 100 for ideally-matched
 * shoes — but no real shoe is a perfect match for a real runner. So above 90
 * we apply a soft compression (slope 0.6) and clamp at 96. The strong band
 * 85-90 passes through untouched; only the over-claimed top end is squeezed.
 *   raw 100 → 96, raw 95 → 93, raw 90 → 90, raw 85 → 85.
 */
const softCapTop = (raw: number): number => (raw > 90 ? 90 + (raw - 90) * 0.6 : raw);
const clampMatch = (n: number) => Math.max(40, Math.min(96, Math.round(softCapTop(n))));

/** FNV-1a — tiny deterministic hash for the dead-heat rotation. */
function fnv(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Dead-heat rotation (published on /methodology). A deterministic engine would
 * otherwise crown the single highest-scoring shoe for every runner with the
 * same answers — so a neutral runner with no strong fit signal always gets ONE
 * shoe, and the rest of a deep catalogue never surfaces. But the top of a slot
 * is usually a statistical DEAD HEAT: on a 40-99 scale, two shoes within ~2.5
 * points are indistinguishable given curated-stat noise.
 *
 * So: shoes within DEAD_HEAT of the slot leader are treated as tied, and a
 * profile-seeded uniform nudge in [0, DEAD_HEAT) rotates among them. Because
 * the seed is the whole profile, two runners who differ in ANY answer can see
 * different (equally-right) picks, while the same runner always sees the same.
 * The nudge is one-sided and bounded, so a shoe more than DEAD_HEAT below the
 * leader can never win, and a clearly-better shoe is never demoted — the win
 * probability simply decays with the gap to the leader.
 */
export const DEAD_HEAT = 2.5;
/** Deterministic uniform [0,1) from a profile seed + key — drives every dead-heat rotation. */
export const seededUnit = (seed: string, key: string): number => (fnv(`${seed}|${key}`) % 100000) / 100000;

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

/**
 * Score and rank a candidate pool for one role. Pure fit by default (a single-
 * shoe recommendation gets the precise best). In a rotation (ctx.rotate) a
 * profile-seeded dead-heat rotation is applied to shoes within DEAD_HEAT of the
 * leader, so the optimiser's pool varies between runners — different equally-
 * right picks instead of one shoe for everyone. A clearly-better shoe is never
 * demoted (the nudge is one-sided and bounded), and the winner's displayed match
 * tracks its nudged score so the #1 pick never shows below an alternate.
 */
export function scoreRole(cands: Shoe[], p: Profile, role: Role, ctx: ScoreCtx): ScoredShoe[] {
  const scored = cands.map((s) => scoreShoeForRole(s, p, role, ctx));
  if (ctx.rotate && scored.length > 0) {
    const leader = Math.max(...scored.map((x) => x.roleScore));
    const ceiling = roleCeiling(role, ctx.factor);
    for (const x of scored) {
      if (leader - x.roleScore <= DEAD_HEAT) {
        x.roleScore += seededUnit(ctx.seed, x.shoe.slug) * DEAD_HEAT;
        x.match = clampMatch((x.roleScore / ceiling) * 100);
      }
    }
  }
  return scored.sort((a, b) => b.roleScore - a.roleScore || a.shoe.slug.localeCompare(b.shoe.slug));
}
