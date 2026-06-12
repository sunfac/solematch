import type { Profile } from '@/types/profile';
import type { Shoe } from '@/types/shoe';

export interface FilterResult {
  /** shoes inside budget and constraints */
  eligible: Shoe[];
  /** shoes within the +10% stretch window (only when profile.budget.stretch) */
  stretch: Shoe[];
}

/**
 * Hard filters per spec §4.2-2: availability, brand blocks, width need, budget.
 * In total-budget mode everything passes price-wise — the rotation optimiser
 * enforces the overall cap instead.
 */
export function hardFilter(shoes: Shoe[], p: Profile): FilterResult {
  const base = shoes.filter((s) => {
    if (s.status !== 'current') return false;
    if (p.brandBlocks.some((b) => b.toLowerCase() === s.brand.toLowerCase())) return false;
    if (p.fit.wide && s.widths.length < 2) return false;
    return true;
  });

  if (p.budget.type === 'total') return { eligible: base, stretch: [] };

  const cap = p.budget.amountGbp;
  const eligible = base.filter((s) => s.msrpGbp <= cap);
  const stretch = p.budget.stretch
    ? base.filter((s) => s.msrpGbp > cap && s.msrpGbp <= cap * 1.1)
    : [];
  return { eligible, stretch };
}
