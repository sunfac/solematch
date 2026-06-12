/**
 * Seed SQL generator: catalogue + computed scores + rules + offers → seed.sql.
 * Run with: npx tsx supabase/seed/seed.ts   (tsx resolves the @/* tsconfig paths)
 * Apply with: supabase db push && psql/sql-editor < supabase/seed/seed.sql
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SHOES } from '../../src/data/catalogue';
import { RULES } from '../../src/data/rules';
import { SCORED } from '../../src/scores/formulas';
import { offersFor } from '../../src/lib/affiliate';

const esc = (s: string) => s.replace(/'/g, "''");
const arr = (a: string[]) => `'{${a.map((x) => `"${esc(x)}"`).join(',')}}'`;

const lines: string[] = ['begin;'];

const brands = [...new Set(SHOES.map((s) => s.brand))];
for (const b of brands) {
  lines.push(
    `insert into brands (name, slug) values ('${esc(b)}', '${esc(b.toLowerCase().replace(/\s+/g, '-'))}') on conflict (name) do nothing;`,
  );
}

for (const s of SHOES) {
  lines.push(`insert into shoes (id, brand_id, model, version, slug, category, msrp_usd, msrp_gbp, price_approx,
  weight_g, drop_mm, stack_heel_mm, stack_ff_mm, foam_name, foam_class, plate, widths, womens_last,
  softness, stability, outsole, consensus_line, athlete_notes, source_urls, status, release_year, spec_estimated)
values ('${s.slug}', (select id from brands where name='${esc(s.brand)}'), '${esc(s.model)}', '${esc(s.version)}',
  '${s.slug}', '${s.category}', ${s.msrpUsd}, ${s.msrpGbp}, ${!!s.priceApprox},
  ${s.weightG}, ${s.dropMm}, ${s.stackHeelMm}, ${s.stackFfMm}, '${esc(s.foamName)}', '${s.foamClass}', '${s.plate}',
  ${arr(s.widths)}, ${s.womensLast}, ${s.softness}, ${s.stability}, ${s.outsole},
  '${esc(s.consensus)}', ${s.athleteNotes ? `'${esc(s.athleteNotes)}'` : 'null'},
  '${esc(JSON.stringify(s.sources))}'::jsonb, '${s.status}', ${s.releaseYear}, ${!!s.specEstimated})
on conflict (id) do nothing;`);

  const sc = SCORED.get(s.slug)!;
  lines.push(
    `insert into shoe_scores (shoe_id, spd, csh, stb, lgt, dur, val, overall, tier, formula_version)
values ('${s.slug}', ${sc.spd}, ${sc.csh}, ${sc.stb}, ${sc.lgt}, ${sc.dur}, ${sc.val}, ${sc.overall}, '${sc.tier}', ${sc.formulaVersion})
on conflict (shoe_id) do nothing;`,
  );

  for (const o of offersFor(s.slug)) {
    lines.push(
      `insert into offers (shoe_id, retailer, region, price, currency, affiliate_url)
values ('${s.slug}', '${esc(o.retailer)}', '${o.region}', ${o.priceGbp}, 'GBP', '${esc(o.url)}');`,
    );
  }
}

for (const r of Object.values(RULES)) {
  lines.push(
    `insert into evidence_rules (id, statement, citation, url, confidence, effect_note)
values ('${r.id}', '${esc(r.statement)}', '${esc(r.citation)}', '${esc(r.url)}', '${r.confidence}', ${
      r.effectNote ? `'${esc(r.effectNote)}'` : 'null'
    }) on conflict (id) do nothing;`,
  );
}

lines.push('commit;');

const out = join(__dirname, 'seed.sql');
writeFileSync(out, lines.join('\n') + '\n');
console.log(`wrote ${lines.length} statements → ${out}`);
