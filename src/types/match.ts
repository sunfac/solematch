import type { Role } from './profile';
import type { Shoe, ShoeScores } from './shoe';

export type Evidence = 'STRONG' | 'MODERATE' | 'EMERGING' | 'FIT & FEEL';

export interface Reason {
  text: string;
  evidence: Evidence;
  ruleId: string;
}

export interface ScoredShoe {
  shoe: Shoe;
  scores: ShoeScores;
  /** user-specific 40-99 */
  match: number;
  reasons: Reason[];
  roleScore: number;
}

export interface RoleResult {
  role: Role;
  pick: ScoredShoe;
  alternates: ScoredShoe[];
  /** one-line comparative edge vs the nearest alternate ("intelligence" line) */
  edge?: string;
  /**
   * The nearest alternate whose GENUINE (un-nudged) fit sits within the dead-heat
   * band of the pick — a statistical tie. Present only when truly co-equal, so the
   * UI can say "pick on feel" and the seeded re-roll reads as equally-right options
   * rather than inconsistency. Mutually exclusive with a decisive `edge`.
   */
  coEqual?: { slug: string; name: string };
}

export interface MatchResult {
  mode: 'single' | 'rotation';
  roles: RoleResult[];
  totals: { costGbp: number; budgetGbp: number };
  engineVersion: string;
  rulesetVersion: string;
  /** budget-shortfall roadmap, transition warnings, physio nudges */
  notes: string[];
}
