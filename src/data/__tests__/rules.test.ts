import { RULES } from '../rules';

const LEVELS = ['STRONG', 'MODERATE', 'EMERGING', 'FIT & FEEL'];

test('at least 14 rules exist', () => {
  expect(Object.keys(RULES).length).toBeGreaterThanOrEqual(14);
});

test('every rule is complete and self-consistent', () => {
  for (const [key, rule] of Object.entries(RULES)) {
    expect(rule.id).toBe(key);
    expect(rule.statement.length).toBeGreaterThan(40);
    expect(rule.citation.length).toBeGreaterThan(10);
    expect(rule.url).toMatch(/^https:\/\//);
    expect(LEVELS).toContain(rule.confidence);
  }
});

test('the myth-guard rule against pronation matching is present and STRONG', () => {
  expect(RULES['no-pronation-matching'].confidence).toBe('STRONG');
});
