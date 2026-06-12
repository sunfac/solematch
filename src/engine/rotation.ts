import type { RoleResult, ScoredShoe } from '@/types/match';
import type { Profile, Role } from '@/types/profile';
import type { Shoe } from '@/types/shoe';

export interface RotationOutcome {
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

const cost = (picks: ScoredShoe[]) => picks.reduce((t, p) => t + p.shoe.msrpGbp, 0);

/**
 * Greedy pick per role from pre-sorted rankings, then a bounded swap pass to
 * (a) deduplicate slugs, (b) satisfy diversity, (c) fit total budget — protecting
 * the race slot for racers, the daily slot otherwise (spec §4.2-3/5).
 */
export function assembleRotation(
  rankingsByRole: Map<Role, ScoredShoe[]>,
  p: Profile,
): RotationOutcome {
  const roles = [...rankingsByRole.keys()];
  const protectedRole: Role = roles.includes('race') ? 'race' : 'daily';
  const notes: string[] = [];

  // candidate index per role (greedy = 0)
  const idx = new Map<Role, number>(roles.map((r) => [r, 0]));
  const pickAt = (role: Role) => rankingsByRole.get(role)![idx.get(role)!];
  const advance = (role: Role): boolean => {
    const ranking = rankingsByRole.get(role)!;
    const next = idx.get(role)! + 1;
    if (next >= ranking.length) return false;
    idx.set(role, next);
    return true;
  };

  const picks = () => roles.map(pickAt);

  // (a) dedupe identical slugs across roles — advance the lower-scoring role
  let guard = 0;
  const dedupe = () => {
    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        const a = pickAt(roles[i]);
        const b = pickAt(roles[j]);
        if (a.shoe.slug === b.shoe.slug) {
          const loser = a.roleScore >= b.roleScore ? roles[j] : roles[i];
          if (!advance(loser)) advance(loser === roles[i] ? roles[j] : roles[i]);
          return true;
        }
      }
    }
    return false;
  };
  while (dedupe() && guard++ < 50) {
    /* re-check until unique */
  }

  // (b) diversity: advance the least-protected, lowest-scoring role until satisfied
  guard = 0;
  while (!diversityOk(picks()) && guard++ < 100) {
    const sacrificable = roles
      .filter((r) => r !== protectedRole)
      .sort((a, b) => pickAt(a).roleScore - pickAt(b).roleScore);
    let moved = false;
    for (const r of sacrificable) {
      if (advance(r)) {
        moved = true;
        break;
      }
    }
    if (!moved) break;
  }

  // (c) total budget: walk non-protected roles down their rankings until affordable
  if (p.budget.type === 'total') {
    const capRaw = p.budget.amountGbp;
    const cap = p.budget.stretch ? capRaw * 1.1 : capRaw;
    guard = 0;
    while (cost(picks()) > cap && guard++ < 200) {
      // advance the role whose current pick is most expensive (excluding protected if possible)
      const candidates = roles
        .filter((r) => r !== protectedRole)
        .sort((a, b) => pickAt(b).shoe.msrpGbp - pickAt(a).shoe.msrpGbp);
      let moved = false;
      for (const r of candidates) {
        if (advance(r)) {
          moved = true;
          break;
        }
      }
      if (!moved && !advance(protectedRole)) break;
    }
    if (cost(picks()) > cap) {
      notes.push(
        `Your budget could not cover a full ${roles.length}-shoe rotation — see the single-shoe roadmap below.`,
      );
    }
    if (p.budget.stretch && cost(picks()) > capRaw && cost(picks()) <= cap) {
      notes.push('Includes a stretch pick within 10% of your budget.');
    }
  }

  const finalPicks = picks();
  const results: RoleResult[] = roles.map((role) => {
    const ranking = rankingsByRole.get(role)!;
    const pick = pickAt(role);
    const alternates = ranking
      .filter((s) => s.shoe.slug !== pick.shoe.slug && !finalPicks.some((f) => f !== pick && f.shoe.slug === s.shoe.slug))
      .slice(0, 2);
    return { role, pick, alternates };
  });

  return { roles: results, notes, costGbp: cost(finalPicks) };
}
