import { runMatch } from '@/engine';
import { baseProfile } from '@/engine/__tests__/filtersRolePlan.test';
import { buildShareLines, buildShareText, SHARE_URL } from '../share';

const rotation = runMatch(
  baseProfile({
    weeklyKm: 60,
    raceDistanceTargetKm: 42.2,
    race: { distanceKm: 21.1, timeSec: 95 * 60 },
    budget: { type: 'total', amountGbp: 650, stretch: false },
  }),
);

const single = runMatch(
  baseProfile({
    weeklyKm: 45,
    raceDistanceTargetKm: 42.2,
    budget: { type: 'total', amountGbp: 180, stretch: false },
  }),
);

test('fixtures are the shapes we expect (multi-shoe rotation + single pick)', () => {
  expect(rotation.roles.length).toBeGreaterThan(1);
  expect(single.roles.length).toBe(1);
});

describe('rotation share copy', () => {
  const lines = buildShareLines(rotation);

  test('leads with a hook naming the STRONGEST pick + its match%', () => {
    const strongest = rotation.roles.reduce((a, b) => (b.pick.match > a.pick.match ? b : a));
    const s = strongest.pick.shoe;
    expect(lines[0]).toBe(
      `My top SoleMatch pick: ${strongest.pick.match}% ${s.brand} ${s.model} ${s.version}`,
    );
    // the hook % is the maximum across the whole lineup
    expect(strongest.pick.match).toBe(Math.max(...rotation.roles.map((r) => r.pick.match)));
  });

  test('has one clean line per role with shoe + match%', () => {
    for (const r of rotation.roles) {
      const s = r.pick.shoe;
      expect(lines.some((l) => l.includes(`${s.brand} ${s.model} ${s.version} — ${r.pick.match}%`))).toBe(
        true,
      );
    }
  });

  test('keeps the rotation total', () => {
    expect(lines.some((l) => l.startsWith(`Total £${rotation.totals.costGbp} ·`))).toBe(true);
  });

  test('ends with a clickable CTA on the LIVE host (not the SEO canonical)', () => {
    const cta = lines[lines.length - 1];
    expect(cta).toBe(`Match yours → ${SHARE_URL}`);
    expect(cta).toContain('https://solematch-production.up.railway.app');
    expect(buildShareText(rotation)).not.toContain('solematch.app');
  });
});

describe('single-pick share copy', () => {
  const lines = buildShareLines(single);
  const r = single.roles[0];
  const s = r.pick.shoe;

  test('is a tidy 3-liner: hook, price+tag, CTA', () => {
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(`My ${r.pick.match}% SoleMatch pick: ${s.brand} ${s.model} ${s.version}`);
    expect(lines[1]).toBe(`£${single.totals.costGbp} · independent, science-backed matching`);
    expect(lines[2]).toBe(`Match yours → ${SHARE_URL}`);
  });

  test('does not mention commission (voice: independent / unbiased)', () => {
    expect(buildShareText(single).toLowerCase()).not.toContain('commission');
  });
});
