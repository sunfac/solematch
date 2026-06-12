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
