import { SHOES, bySlug } from '@/data/catalogue';
import { avoidIf } from '../avoidIf';

describe('avoidIf', () => {
  it('returns at most two substantial caveats for every shoe in the catalogue', () => {
    for (const s of SHOES) {
      const a = avoidIf(s);
      expect(a.length).toBeLessThanOrEqual(2);
      a.forEach((t) => expect(t.length).toBeGreaterThan(10));
    }
  });

  it('warns daily-trainer seekers off a carbon race shoe', () => {
    const alpha = bySlug.get('nike-alphafly-3');
    expect(alpha).toBeTruthy();
    expect(avoidIf(alpha!).join(' ')).toMatch(/everyday trainer|race tool/i);
  });

  it('flags trail shoes as draggy on the road', () => {
    const trail = SHOES.find((s) => s.category === 'trail');
    expect(trail).toBeTruthy();
    expect(avoidIf(trail!).join(' ')).toMatch(/road/i);
  });

  it('never warns a budget shoe about flagship money', () => {
    const budget = SHOES.find((s) => s.category === 'budget');
    if (budget) expect(avoidIf(budget).join(' ')).not.toMatch(/flagship money/i);
  });

  it('is a pure deterministic function of the shoe', () => {
    const s = SHOES[0];
    expect(avoidIf(s)).toEqual(avoidIf(s));
  });
});
