/**
 * Calibration harness (dev-only): prints the catalogue ranked by overall with tiers,
 * so formula constants can be tuned against the plan's invariants on real data.
 * Run: npx tsx scripts/calibrate.ts
 */
import { SHOES } from '../src/data/catalogue';
import { SCORED } from '../src/scores/formulas';

const rows = SHOES.map((s) => ({ slug: s.slug, cat: s.category, ...SCORED.get(s.slug)! }))
  .sort((a, b) => b.overall - a.overall);

console.log('rank  overall tier    cat          slug');
rows.forEach((r, i) => {
  const flag = ['nike-vaporfly-4', 'asics-metaspeed-ray', 'nike-alphafly-4', 'adidas-adizero-evo-sl'].includes(r.slug) ? ' <<<' : '';
  console.log(
    `${String(i + 1).padStart(3)}   ${String(r.overall).padStart(3)}    ${r.tier.padEnd(7)} ${r.cat.padEnd(12)} ${r.slug}${flag}`,
  );
});
const q = Math.ceil(rows.length / 4);
console.log(`\ntop-quartile cutoff = rank ${q} (overall ${rows[q - 1].overall})`);
