import {
  fmtPace,
  kgFromLb,
  kgFromSt,
  kmFromMi,
  lbFromKg,
  miFromKm,
  paceSecPerKmFromMinPerMile,
} from '../units';

test('weight conversions round-trip', () => {
  expect(lbFromKg(kgFromLb(154))).toBeCloseTo(154, 6);
  expect(kgFromLb(154)).toBeCloseTo(69.85, 1);
  expect(kgFromSt(11, 0)).toBeCloseTo(69.85, 1);
});

test('distance conversions round-trip', () => {
  expect(miFromKm(kmFromMi(26.2))).toBeCloseTo(26.2, 6);
  expect(kmFromMi(26.2)).toBeCloseTo(42.16, 1);
});

test('pace conversions', () => {
  expect(paceSecPerKmFromMinPerMile(8, 0)).toBeCloseTo(298.3, 0);
  expect(fmtPace(300, 'metric')).toBe('5:00/km');
  expect(fmtPace(300, 'imperial')).toBe('8:03/mi');
  expect(fmtPace(299.6, 'metric')).toBe('5:00/km');
});
