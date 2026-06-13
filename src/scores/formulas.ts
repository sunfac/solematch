import { SHOES, categoryMedianGbp } from '@/data/catalogue';
import type { Shoe, ShoeScores, Tier } from '@/types/shoe';
import type { Role } from '@/types/profile';

/**
 * v1 attribute formulas — deterministic from catalogue fields, published on /methodology.
 * Constants are calibrated against the June-2026 catalogue; the unit-test invariants
 * (relative orderings) are authoritative over these numbers (plan decision 8).
 */
export const FORMULA_VERSION = 1 as const;

const clamp = (n: number, lo = 25, hi = 99) => Math.max(lo, Math.min(hi, Math.round(n)));

const FOAM_ENERGY: Record<Shoe['foamClass'], number> = {
  PEBA: 92,
  TPEE: 84,
  TPU: 76, // modern supercritical A-TPU race foams sit well above legacy TPU
  BLEND: 72,
  EVA: 58,
};

const FOAM_DUR: Record<Shoe['foamClass'], number> = {
  TPU: 86,
  EVA: 78,
  BLEND: 74,
  TPEE: 74, // TPEE (Lightstrike Pro class) wears far better than PEBA in practice
  PEBA: 48,
};

const PLATE_SPD: Record<Shoe['plate'], number> = { carbon: 96, composite: 84, none: 55 };

export function lgt(s: Shoe): number {
  return clamp(99 - (s.weightG - 130) * (59 / 190));
}

export function spd(s: Shoe): number {
  return clamp(0.45 * FOAM_ENERGY[s.foamClass] + 0.3 * PLATE_SPD[s.plate] + 0.25 * lgt(s));
}

export function csh(s: Shoe): number {
  return clamp(s.stackHeelMm * 1.45 + s.softness * 5);
}

export function stb(s: Shoe): number {
  const base = [40, 52, 64, 76, 88][s.stability - 1];
  return clamp(base + (s.widths.length > 1 ? 3 : 0));
}

export function dur(s: Shoe): number {
  return clamp(0.62 * FOAM_DUR[s.foamClass] + s.outsole * 7 + (s.category === 'race' ? -6 : 0));
}

export function val(s: Shoe): number {
  const med = categoryMedianGbp(s.category);
  return clamp(70 + ((med - s.msrpGbp) / med) * 55 + (dur(s) - 60) * 0.25);
}

type StatKey = keyof Omit<ShoeScores, 'overall' | 'tier' | 'formulaVersion'>;
const ROLE_WEIGHTS: Record<Role, Record<StatKey, number>> = {
  race: { spd: 0.56, lgt: 0.24, csh: 0.12, stb: 0.02, dur: 0.03, val: 0.03 },
  tempo: { spd: 0.35, lgt: 0.15, csh: 0.15, stb: 0.1, dur: 0.15, val: 0.1 },
  daily: { spd: 0.18, lgt: 0.12, csh: 0.22, stb: 0.12, dur: 0.21, val: 0.15 },
  recovery: { spd: 0.05, lgt: 0.05, csh: 0.32, stb: 0.2, dur: 0.18, val: 0.2 },
};

const STAT_LABEL: Record<StatKey, string> = {
  spd: 'speed',
  lgt: 'lightness',
  csh: 'cushioning',
  stb: 'stability',
  dur: 'durability',
  val: 'value',
};

/**
 * The stats that most drive a role's match — the published "what's weighting
 * your %" answer for the detail screen. Returns the top-N stat labels with
 * their weight as a percentage, descending.
 */
export function roleDrivers(role: Role, n = 3): Array<{ label: string; pct: number }> {
  return (Object.entries(ROLE_WEIGHTS[role]) as Array<[StatKey, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, w]) => ({ label: STAT_LABEL[k], pct: Math.round(w * 100) }));
}

/**
 * Community-consensus darlings (2025-26 reviewer + community convergence — see
 * RULES['community-consensus']).
 *
 * Two DIFFERENT weights, deliberately:
 *  - COMMUNITY_BONUS (+5) ranks the MARKET — applied to catalogue `overall`/
 *    tier, where "the reviewers and the community converged on this" is exactly
 *    what a market ranking should reflect. Published on /methodology.
 *  - COMMUNITY_NUDGE (+2) is all the per-user matcher gets. YOUR match is about
 *    fit and evidence, not what's trending; consensus is a gentle tiebreak, not
 *    a decider. At +5 it was deciding near-ties (two darlings won the daily slot
 *    for almost everyone — the "Novablast hits a lot" effect); +2 lets genuine
 *    fit signal lead while still rewarding a proven shoe on a true tie.
 */
export const COMMUNITY_DARLINGS: ReadonlySet<string> = new Set([
  'adidas-adizero-evo-sl',
  'asics-novablast-5',
  'saucony-endorphin-speed-5',
  'nike-vaporfly-4',
  'asics-metaspeed-ray',
  'new-balance-rebel-v5',
]);
export const COMMUNITY_BONUS = 5;
export const COMMUNITY_NUDGE = 2;

export function computeScores(s: Shoe): ShoeScores {
  const v = { spd: spd(s), csh: csh(s), stb: stb(s), lgt: lgt(s), dur: dur(s), val: val(s) };
  const mechanical = Math.max(
    ...Object.values(ROLE_WEIGHTS).map((w) =>
      Math.round(
        w.spd * v.spd + w.csh * v.csh + w.stb * v.stb + w.lgt * v.lgt + w.dur * v.dur + w.val * v.val,
      ),
    ),
  );
  const overall = clamp(mechanical + (COMMUNITY_DARLINGS.has(s.slug) ? COMMUNITY_BONUS : 0));
  return { ...v, overall, tier: 'BRONZE', formulaVersion: FORMULA_VERSION };
}

/**
 * Tiers are DISTRIBUTION-BASED (plan decision 9), like FUT itself: rank all current
 * shoes by overall — top 10% ELITE, next 25% GOLD, next 40% SILVER, rest BRONZE.
 * This tracks the live market instead of fighting absolute formula drift.
 */
export function assignTiers(scored: Map<string, ShoeScores>): void {
  const ranked = [...scored.entries()].sort((a, b) => b[1].overall - a[1].overall);
  ranked.forEach(([, sc], i) => {
    const pct = i / ranked.length;
    sc.tier = (pct < 0.1 ? 'ELITE' : pct < 0.35 ? 'GOLD' : pct < 0.75 ? 'SILVER' : 'BRONZE') as Tier;
  });
}

function buildScored(): Map<string, ShoeScores> {
  const m = new Map<string, ShoeScores>(SHOES.map((s) => [s.slug, computeScores(s)]));
  assignTiers(m);
  return m;
}

/** slug → scores for the whole catalogue, tiers assigned. */
export const SCORED: Map<string, ShoeScores> = buildScored();
