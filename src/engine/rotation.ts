import type { RoleResult, ScoredShoe } from '@/types/match';
import type { Profile, Role } from '@/types/profile';
import type { Shoe } from '@/types/shoe';
import { PRIORITY_LABEL, priorityAffinity } from './modifiers';
import { DEAD_HEAT, seededUnit } from './scoring';

export interface RotationOutcome {
  /** empty = no feasible combination under the budget (caller collapses to single) */
  roles: RoleResult[];
  notes: string[];
  costGbp: number;
}

/**
 * Per-pair "meaningfully different" check. The original (plate OR ≥2mm drop)
 * passed when both shoes share foam + drop but plate differed — e.g. Saucony
 * Endorphin Speed 5 (composite) + Endorphin Pro 5 (carbon) at the same 8mm
 * drop / same PEBA / same 36-39mm stack. That's not a rotation, that's two
 * versions of the same shoe.
 *
 * Tightened: two shoes are meaningfully different ONLY if they satisfy at
 * least TWO of (different drop ≥2mm, different foam class, different stack
 * ≥5mm). Plate difference alone no longer qualifies — most modern racers
 * differ only by plate and would otherwise fly through unchecked.
 */
function meaningfullyDifferent(a: Shoe, b: Shoe): boolean {
  let score = 0;
  if (Math.abs(a.dropMm - b.dropMm) >= 2) score++;
  if (a.foamClass !== b.foamClass) score++;
  if (Math.abs(a.stackHeelMm - b.stackHeelMm) >= 5) score++;
  return score >= 2;
}

function diversityOk(picks: ScoredShoe[]): boolean {
  if (picks.length < 2) return true;
  // Brand uniqueness — Malisoux 2015's load-variation benefit comes from
  // varied LASTS as much as varied foams; two Sauconys give the runner the
  // same last, same heel hold, same forefoot shape across the rotation.
  const brands = new Set(picks.map((p) => p.shoe.brand));
  if (brands.size < picks.length) return false;
  // Foam class spread across the rotation as a whole
  const foams = new Set(picks.map((p) => p.shoe.foamClass));
  if (foams.size < 2) return false;
  // Every pair must clear the two-of-three "meaningfully different" bar
  for (let i = 0; i < picks.length; i++) {
    for (let j = i + 1; j < picks.length; j++) {
      if (!meaningfullyDifferent(picks[i].shoe, picks[j].shoe)) return false;
    }
  }
  return true;
}

/** Quality depth searched per role; price-coverage extras keep tight budgets feasible. */
const POOL_DEPTH = 18;
const CHEAP_EXTRAS = 6;
/** The race slot degrades last for racers (spec §4.2-3) — via weighting, not absolute protection. */
const ROLE_WEIGHT: Record<Role, number> = { race: 1.15, daily: 1, tempo: 1, recovery: 1, trail: 1.15 };

/**
 * Globally optimise the rotation: exhaustive search (pruned) over per-role
 * candidate pools, maximising weighted total roleScore subject to budget,
 * unique slugs and geometry diversity — all constraints checked TOGETHER,
 * so a tight budget can no longer starve slots or re-break dedupe/diversity
 * the way the old sequential greedy-and-walk passes did.
 */
export function assembleRotation(
  rankingsByRole: Map<Role, ScoredShoe[]>,
  p: Profile,
  /** un-nudged genuine order per role (dead-heat shuffle off) for the upgrade pass */
  plainByRole?: Map<Role, ScoredShoe[]>,
): RotationOutcome {
  const roles = [...rankingsByRole.keys()];
  const notes: string[] = [];
  const capRaw = p.budget.type === 'total' ? p.budget.amountGbp : Infinity;
  const cap = p.budget.stretch && capRaw !== Infinity ? capRaw * 1.1 : capRaw;

  const pools: ScoredShoe[][] = roles.map((role) => {
    const ranking = rankingsByRole.get(role)!;
    const pool = ranking.slice(0, POOL_DEPTH);
    const cheapest = [...ranking]
      .sort((a, b) => a.shoe.msrpGbp - b.shoe.msrpGbp || a.shoe.slug.localeCompare(b.shoe.slug))
      .slice(0, CHEAP_EXTRAS);
    for (const c of cheapest) if (!pool.includes(c)) pool.push(c);
    return pool;
  });

  // lower bound on remaining cost from role i onward, for pruning
  const minCostFrom: number[] = new Array(roles.length + 1).fill(0);
  for (let i = roles.length - 1; i >= 0; i--) {
    minCostFrom[i] = minCostFrom[i + 1] + Math.min(...pools[i].map((c) => c.shoe.msrpGbp));
  }

  /**
   * Keep the top-K feasible rotations, not just the single best — so we can
   * apply the published dead-heat rotation at the COMBO level. A deterministic
   * optimiser would otherwise hand every runner the exact same rotation (and,
   * at tight budgets, always economise the daily slot to the same cheapest
   * dead-heat shoe — the "same shoe for everyone" effect). Among rotations
   * within DEAD_HEAT of the best total — a statistical tie — a profile-seeded
   * pick rotates between them, so different runners see different equally-good
   * rotations while the same runner always sees the same, and a meaningfully
   * better rotation is never demoted.
   */
  const RESERVOIR = 24;
  const top: Array<{ picks: ScoredShoe[]; score: number; key: string }> = [];
  const combo: ScoredShoe[] = [];

  const consider = (score: number, key: string) => {
    if (top.length < RESERVOIR) {
      top.push({ picks: [...combo], score, key });
      return;
    }
    let wi = 0;
    for (let i = 1; i < top.length; i++) if (top[i].score < top[wi].score) wi = i;
    if (score > top[wi].score) top[wi] = { picks: [...combo], score, key };
  };

  const dfs = (i: number, cost: number, score: number) => {
    if (cost + minCostFrom[i] > cap) return;
    if (i === roles.length) {
      if (!diversityOk(combo)) return;
      consider(score, combo.map((c) => c.shoe.slug).join('+'));
      return;
    }
    for (const cand of pools[i]) {
      if (combo.some((c) => c.shoe.slug === cand.shoe.slug)) continue;
      combo.push(cand);
      dfs(i + 1, cost + cand.shoe.msrpGbp, score + cand.roleScore * ROLE_WEIGHT[roles[i]]);
      combo.pop();
    }
  };
  dfs(0, 0, 0);

  if (top.length === 0) {
    notes.push(
      `Your budget could not cover a full ${roles.length}-shoe rotation — see the single-shoe roadmap below.`,
    );
    return { roles: [], notes, costGbp: 0 };
  }

  const bestScore = Math.max(...top.map((r) => r.score));
  // Single-shoe recommendation → give the precise best fit (deterministic key
  // tiebreak). A multi-shoe rotation → rotate among rotations within a dead
  // heat of the best total, seeded by profile, for population variety.
  let chosen: { picks: ScoredShoe[]; score: number; key: string };
  if (roles.length >= 2) {
    const tied = top.filter((r) => bestScore - r.score <= DEAD_HEAT);
    if (p.priority) {
      // Directed dead-heat tiebreak: among statistically-tied rotations, choose
      // the one that best expresses the stated priority — the most total speed /
      // cushioning / value / durability across its slots — deterministically, so
      // "speed matters most" actually surfaces the faster rotation (incl. a
      // faster daily) instead of a blind seed landing on the same shoe for all.
      const aff = (rot: { picks: ScoredShoe[] }) =>
        rot.picks.reduce((t, c) => t + priorityAffinity(c.shoe.slug, p.priority), 0);
      chosen = tied.reduce((a, b) => {
        const da = aff(a);
        const db = aff(b);
        return db > da + 1e-9 || (Math.abs(db - da) <= 1e-9 && b.key < a.key) ? b : a;
      });
    } else {
      const seed = JSON.stringify(p);
      chosen = tied.reduce((a, b) => (seededUnit(seed, b.key) > seededUnit(seed, a.key) ? b : a));
    }
  } else {
    chosen = top.reduce((a, b) =>
      b.score > a.score + 1e-9 || (Math.abs(b.score - a.score) <= 1e-9 && b.key < a.key) ? b : a,
    );
  }
  const picks: ScoredShoe[] = chosen.picks;
  let cost = picks.reduce((t, c) => t + c.shoe.msrpGbp, 0);

  // Budget-permitting upgrade: never leave a slot on a lower-MATCH shoe to bank
  // money the runner chose to spend. The dead-heat rotation (cost-blind) and
  // tight-budget right-sizing can both trade a slot down — right when the cap is
  // binding, wrong when it isn't. So for each slot, restore the highest-match
  // shoe that fits the cap and keeps the rotation diverse (biggest gap first, so
  // the headroom funds the most under-picked slot). A high budget then always
  // buys the best shoe; a tight one still right-sizes.
  // Compare by GENUINE (un-nudged) roleScore: match% is soft-capped, so the
  // elite picks all read ~93% and can't tell the true best apart — roleScore
  // can. Skip when a priority is set: there the rotate nudge is the runner's
  // DIRECTED lean (deterministic signal, not the random shuffle that causes the
  // downgrade), and the priority path already spends to its leaning best.
  if (!p.priority && plainByRole) {
    const genuine = (i: number) => plainByRole.get(roles[i])!;
    const scoreOf = (i: number, slug: string) =>
      genuine(i).find((s) => s.shoe.slug === slug)?.roleScore ?? picks[i].roleScore;
    const gap = (i: number) => Math.max(...genuine(i).map((s) => s.roleScore)) - scoreOf(i, picks[i].shoe.slug);
    const order = roles.map((_, i) => i).sort((a, b) => gap(b) - gap(a));
    for (const i of order) {
      const curScore = scoreOf(i, picks[i].shoe.slug);
      let upgrade: ScoredShoe | undefined;
      for (const cand of genuine(i)) {
        if (cand.roleScore <= curScore + 0.1) continue; // only a genuinely better fit
        if (upgrade && cand.roleScore <= upgrade.roleScore) continue; // keep the best valid one
        if (cost - picks[i].shoe.msrpGbp + cand.shoe.msrpGbp > cap) continue; // affordable
        if (picks.some((pp, j) => j !== i && pp.shoe.slug === cand.shoe.slug)) continue; // no dup
        if (!diversityOk(picks.map((pp, j) => (j === i ? cand : pp)))) continue; // stay diverse
        upgrade = cand;
      }
      if (upgrade) {
        cost = cost - picks[i].shoe.msrpGbp + upgrade.shoe.msrpGbp;
        picks[i] = upgrade;
      }
    }
  }

  if (p.budget.stretch && capRaw !== Infinity && cost > capRaw && cost <= cap) {
    notes.push('Includes a stretch pick within 10% of your budget.');
  }
  if (p.priority && roles.length >= 2) {
    notes.push(
      `Tuned to what matters most to you — ${PRIORITY_LABEL[p.priority]}: where shoes were otherwise a dead heat, we leaned each slot toward it.`,
    );
  }

  const STAT_LABEL: Record<string, string> = {
    spd: 'speed',
    csh: 'cushioning',
    stb: 'stability',
    lgt: 'lightness',
    dur: 'durability',
    val: 'value',
  };

  const results: RoleResult[] = roles.map((role, i) => {
    const ranking = rankingsByRole.get(role)!;
    const pick = picks[i];
    const alternates = ranking
      .filter((s) => !picks.some((f) => f.shoe.slug === s.shoe.slug))
      .slice(0, 2);

    // Budget-allocation transparency: when the optimiser passed over a
    // higher-scoring shoe to fund the rest of the rotation, say so.
    const top = ranking[0];
    if (top.shoe.slug !== pick.shoe.slug && top.roleScore - pick.roleScore >= 1.5 && top.shoe.msrpGbp > pick.shoe.msrpGbp + 10) {
      notes.push(
        `Budget allocation: in the ${role} slot we picked the ${pick.shoe.brand} ${pick.shoe.model} (£${pick.shoe.msrpGbp}) over the higher-scoring ${top.shoe.brand} ${top.shoe.model} (£${top.shoe.msrpGbp}) — the saving buys a stronger shoe elsewhere in your rotation.`,
      );
    }

    // Comparative edge vs the nearest alternate — the "why this one" line.
    let edge: string | undefined;
    const rival = alternates[0];
    if (rival) {
      const dims = ['spd', 'csh', 'stb', 'lgt', 'dur', 'val'] as const;
      const bestDim = dims.reduce((a, b) =>
        pick.scores[a] - rival.scores[a] >= pick.scores[b] - rival.scores[b] ? a : b,
      );
      const gap = pick.scores[bestDim] - rival.scores[bestDim];
      edge =
        gap >= 3
          ? `Beats the ${rival.shoe.brand} ${rival.shoe.model} on ${STAT_LABEL[bestDim]} (+${gap}) for this slot`
          : `A dead heat with the ${rival.shoe.brand} ${rival.shoe.model} — fit and feel should decide`;
    }

    return { role, pick, alternates, edge };
  });

  return { roles: results, notes, costGbp: cost };
}
