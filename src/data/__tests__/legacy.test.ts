import { SHOES, LEGACY_SLUGS, isLegacy, bySlug } from '@/data/catalogue';
import { hardFilter } from '@/engine/filters';
import { baseProfile } from '@/engine/__tests__/filtersRolePlan.test';

const norm = (s: string) => s.toLowerCase();

describe('previous-gen (legacy) policy — keep one back, never further', () => {
  test('every legacy slug is a superseded shoe', () => {
    for (const slug of LEGACY_SLUGS) expect(bySlug.get(slug)?.status).toBe('superseded');
  });

  test('the known immediate predecessors are kept eligible', () => {
    for (const slug of [
      'nike-alphafly-3',
      'saucony-endorphin-elite-2',
      'saucony-triumph-23',
      'salomon-aero-glide-3',
    ]) {
      expect(isLegacy(slug)).toBe(true);
    }
  });

  test('each legacy shoe is the NEWEST superseded in a line that still has a current shoe (only one back)', () => {
    for (const slug of LEGACY_SLUGS) {
      const shoe = bySlug.get(slug)!;
      const line = SHOES.filter(
        (s) => norm(s.brand) === norm(shoe.brand) && norm(s.model) === norm(shoe.model),
      );
      expect(line.some((s) => s.status === 'current')).toBe(true); // a successor exists
      const newer = line.filter((s) => s.status === 'superseded' && s.releaseYear > shoe.releaseYear);
      expect(newer.length).toBe(0); // nothing superseded is newer — this IS the one-back
    }
  });

  test('a legacy predecessor is eligible (not dismissed); anything else non-current is excluded', () => {
    const { eligible } = hardFilter(SHOES, baseProfile());
    expect(eligible.some((s) => s.slug === 'saucony-triumph-23')).toBe(true);
    expect(eligible.every((s) => s.status === 'current' || isLegacy(s.slug))).toBe(true);
  });

  test('legacy is valued as the discounted value play it is — its VAL beats its full-price current successor', () => {
    // Triumph 23 (prev-gen, valued ~15% below RRP) should read as better value than Triumph 24.
    const { SCORED } = require('@/scores/formulas');
    expect(SCORED.get('saucony-triumph-23')!.val).toBeGreaterThan(SCORED.get('saucony-triumph-24')!.val);
  });
});
