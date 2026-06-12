import type { RoleResult, ScoredShoe } from '@/types/match';
import type { Profile, Role } from '@/types/profile';
import type { Shoe } from '@/types/shoe';

export interface RotationOutcome {
  /** empty = no feasible combination under the budget (caller collapses to single) */
  roles: RoleResult[];
  notes: string[];
  costGbp: number;
}

/** Geometry diversity per spec §4.2-5: differing plate status OR ≥2 mm drop separation. */
function geometriesDiffer(a: Shoe, b: Shoe): boolean {
  return a.plate !== b.plate || Math.abs(a.dropMm - b.dropMm) >= 2;
}

function diversityOk(picks: ScoredShoe[]): boolean {
  if (picks.length < 2) return true;
  const foams = new Set(picks.map((p) => p.shoe.foamClass));
  if (foams.size < 2) return false;
  for (let i = 0; i < picks.length; i++) {
    for (let j = i + 1; j < picks.length; j++) {
      if (!geometriesDiffer(picks[i].shoe, picks[j].shoe)) return false;
    }
  }
  return true;
}

/** Quality depth searched per role; price-coverage extras keep tight budgets feasible. */
const POOL_DEPTH = 18;
const CHEAP_EXTRAS = 6;
/** The race slot degrades last for racers (spec §4.2-3) — via weighting, not absolute protection. */
const ROLE_WEIGHT: Record<Role, number> = { race: 1.15, daily: 1, tempo: 1, recovery: 1 };

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

  let best: ScoredShoe[] | null = null;
  let bestScore = -Infinity;
  let bestKey = '';
  const combo: ScoredShoe[] = [];

  const dfs = (i: number, cost: number, score: number) => {
    if (cost + minCostFrom[i] > cap) return;
    if (i === roles.length) {
      if (!diversityOk(combo)) return;
      const key = combo.map((c) => c.shoe.slug).join('+');
      if (score > bestScore + 1e-9 || (Math.abs(score - bestScore) <= 1e-9 && key < bestKey)) {
        best = [...combo];
        bestScore = score;
        bestKey = key;
      }
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

  if (!best) {
    notes.push(
      `Your budget could not cover a full ${roles.length}-shoe rotation — see the single-shoe roadmap below.`,
    );
    return { roles: [], notes, costGbp: 0 };
  }

  const picks: ScoredShoe[] = best;
  const cost = picks.reduce((t, c) => t + c.shoe.msrpGbp, 0);
  if (p.budget.stretch && capRaw !== Infinity && cost > capRaw && cost <= cap) {
    notes.push('Includes a stretch pick within 10% of your budget.');
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
