import { marathonPaceSecPerKm, plateFactor } from '../paces';

test('Riegel projection: 20:00 5k runner has ~273 s/km marathon pace', () => {
  const mp = marathonPaceSecPerKm({ race: { distanceKm: 5, timeSec: 1200 } });
  expect(mp).toBeGreaterThanOrEqual(265);
  expect(mp).toBeLessThanOrEqual(280);
});

test('easy-pace fallback subtracts the heuristic offset', () => {
  expect(marathonPaceSecPerKm({ easyPaceSecPerKm: 360 })).toBe(285);
});

test('unknown ability returns undefined', () => {
  expect(marathonPaceSecPerKm({})).toBeUndefined();
});

test('plateFactor endpoints and midpoint', () => {
  expect(plateFactor(275)).toBe(1);
  expect(plateFactor(375)).toBe(0.3);
  expect(plateFactor(325)).toBeCloseTo(0.65, 5);
  expect(plateFactor(undefined)).toBe(0.3);
});

test('plateFactor is monotonically non-increasing', () => {
  let prev = plateFactor(200);
  for (let p = 210; p <= 450; p += 10) {
    const f = plateFactor(p);
    expect(f).toBeLessThanOrEqual(prev);
    prev = f;
  }
});
