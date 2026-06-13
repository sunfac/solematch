import { bySlug } from '@/data/catalogue';
import {
  CONSENSUS_BEST,
  consensusBestForSlug,
  consensusRunnerUpForSlug,
} from '@/data/consensusBest';

describe('consensus best-in-class data integrity', () => {
  test('every best-in-class slug exists in the catalogue and is current', () => {
    for (const p of CONSENSUS_BEST) {
      const shoe = bySlug.get(p.slug);
      expect(shoe).toBeDefined();
      expect(shoe!.status).not.toBe('superseded');
    }
  });

  test('every runner-up slug exists in the catalogue', () => {
    for (const p of CONSENSUS_BEST) {
      if (p.runnerUpSlug) expect(bySlug.get(p.runnerUpSlug)).toBeDefined();
    }
  });

  test('each pick is well-formed (label, why, keyTech, ≥1 source, valid confidence)', () => {
    for (const p of CONSENSUS_BEST) {
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.why.length).toBeGreaterThan(20);
      expect(p.keyTech.length).toBeGreaterThan(0);
      expect(p.sources.length).toBeGreaterThanOrEqual(1);
      expect(p.sources.every((s) => /^https?:\/\//.test(s))).toBe(true);
      expect(['clear', 'near-tie']).toContain(p.confidence);
    }
  });

  test('no shoe is its own runner-up, and best/runner-up slugs are distinct per class', () => {
    for (const p of CONSENSUS_BEST) {
      expect(p.slug).not.toBe(p.runnerUpSlug);
    }
  });

  test('no slug is best-in-class for two different classes', () => {
    const slugs = CONSENSUS_BEST.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test('lookups resolve by slug for best and runner-up', () => {
    const sample = CONSENSUS_BEST[0];
    expect(consensusBestForSlug(sample.slug)?.label).toBe(sample.label);
    if (sample.runnerUpSlug) {
      expect(consensusRunnerUpForSlug(sample.runnerUpSlug)?.label).toBe(sample.label);
    }
    expect(consensusBestForSlug('definitely-not-a-shoe')).toBeUndefined();
  });
});
