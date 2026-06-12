/**
 * Research-row ingester: merges pipe-format catalogue rows (from isolated research
 * agents) into src/data/shoes.json with full validation BEFORE zod ever sees them.
 *
 * Row formats accepted (one per line, blank lines and `ROWS:`/`#` lines ignored):
 *   plain row : brand|model|version|category|msrpUsd|msrpGbp|weightG|dropMm|stackHeelMm|
 *               stackFfMm|foamName|foamClass|plate|widths|womensLast|softness|stability|
 *               outsole|consensus|sources|status|releaseYear|specEstimated   (23 fields)
 *   ADD|<23 fields>                          — same as plain row
 *   AUDIT|<slug>|<y/n>|<source-url>          — womensLast correction for an existing shoe
 *
 * Usage: npx tsx scripts/ingest-research.ts [--dry] <rows.txt> [more.txt ...]
 * After a real run: npx tsx scripts/gen-offers.ts && npx tsx scripts/calibrate.ts && npx jest
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Shoe } from '../src/types/shoe';

const CATEGORIES = ['race', 'tempo', 'daily', 'max_cushion', 'stability', 'budget'] as const;
const FOAMS = ['PEBA', 'TPEE', 'TPU', 'EVA', 'BLEND'] as const;
const PLATES = ['carbon', 'composite', 'none'] as const;
const STATUSES = ['current', 'superseded', 'upcoming'] as const;
const WIDTHS = new Set(['standard', 'narrow', 'wide', '2E', '4E']);

const shoesPath = join(__dirname, '..', 'src', 'data', 'shoes.json');
const existing: Shoe[] = JSON.parse(readFileSync(shoesPath, 'utf8'));
const existingSlugs = new Set(existing.map((s) => s.slug));

/** Curated-slug convention: drop NB platform prefixes, drop "-1" for first-of-name. */
function deriveSlug(brand: string, model: string, version: string): string {
  const m = model
    .replace(/^Fresh Foam X /i, '')
    .replace(/^FuelCell /i, '')
    .replace(/^FF /i, '');
  const base = `${brand} ${m}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (version === '1' || version === '') return base;
  const v = version.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return `${base}-${v}`;
}

const errs: string[] = [];
const warns: string[] = [];
const added: Shoe[] = [];
const audits: Array<{ slug: string; womensLast: boolean; source: string }> = [];

function bad(line: number, file: string, msg: string): void {
  errs.push(`${file}:${line}  ${msg}`);
}

function parseShoeRow(f: string[], line: number, file: string): Shoe | null {
  const [
    brand, model, versionRaw, category, msrpUsd, msrpGbp, weightG, dropMm, stackHeelMm,
    stackFfMm, foamName, foamClass, plate, widthsRaw, womensLast, softness, stability,
    outsole, consensus, sourcesRaw, status, releaseYear, specEstimated,
  ] = f.map((x) => x.trim());

  const fail = (msg: string) => {
    bad(line, file, `${brand} ${model} ${versionRaw}: ${msg}`);
    return null;
  };

  if (!brand || !model) return fail('missing brand/model');
  const version = versionRaw || '1';
  const num = (s: string) => Number(s);
  const int = (s: string) => Number.isInteger(num(s));

  if (!(CATEGORIES as readonly string[]).includes(category)) return fail(`bad category '${category}'`);
  if (!(FOAMS as readonly string[]).includes(foamClass)) return fail(`bad foamClass '${foamClass}'`);
  if (!(PLATES as readonly string[]).includes(plate)) return fail(`bad plate '${plate}'`);
  if (!(STATUSES as readonly string[]).includes(status)) return fail(`bad status '${status}'`);
  for (const k of [msrpUsd, msrpGbp, weightG, dropMm, stackHeelMm, stackFfMm, softness, stability, outsole, releaseYear]) {
    if (!int(k)) return fail(`non-integer numeric field '${k}'`);
  }
  if (num(msrpGbp) < 30 || num(msrpGbp) > 350) return fail(`msrpGbp ${msrpGbp} out of range`);
  if (num(weightG) < 90 || num(weightG) > 400) return fail(`weightG ${weightG} out of range`);
  if (num(dropMm) < 0 || num(dropMm) > 14) return fail(`dropMm ${dropMm} out of range`);
  if (num(stackHeelMm) < 20 || num(stackHeelMm) > 60) return fail(`stackHeelMm ${stackHeelMm} out of range`);
  if (num(stackFfMm) < 10 || num(stackFfMm) > 50) return fail(`stackFfMm ${stackFfMm} out of range`);
  if (num(stackFfMm) > num(stackHeelMm)) return fail('forefoot stack exceeds heel stack');
  if (Math.abs(num(stackHeelMm) - num(stackFfMm) - num(dropMm)) > 2)
    return fail(`stack/drop inconsistent: ${stackHeelMm}-${stackFfMm} vs drop ${dropMm}`);
  for (const k of [softness, stability, outsole]) {
    if (num(k) < 1 || num(k) > 5) return fail(`curated 1-5 field out of range '${k}'`);
  }
  if (num(releaseYear) < 2023 || num(releaseYear) > 2027)
    return fail(`releaseYear ${releaseYear} outside schema 2023-2027`);
  if (!consensus || consensus.length < 10) return fail('consensus too short');
  if (consensus.length > 160) return fail(`consensus too long (${consensus.length})`);

  const widths = widthsRaw.split(',').map((w) => w.trim()).filter(Boolean);
  if (widths.length === 0 || widths.some((w) => !WIDTHS.has(w))) return fail(`bad widths '${widthsRaw}'`);

  const sources = sourcesRaw.split(';').map((s) => s.trim()).filter(Boolean);
  if (sources.length === 0 || sources.some((u) => !/^https?:\/\/[^ ]+$/.test(u)))
    return fail(`bad sources '${sourcesRaw}'`);

  const yn = (s: string) => s.toLowerCase() === 'y';
  const slug = deriveSlug(brand, model, version);
  if (existingSlugs.has(slug) || added.some((a) => a.slug === slug)) return fail(`duplicate slug '${slug}'`);

  const shoe: Shoe = {
    id: slug,
    brand,
    model,
    version,
    slug,
    category: category as Shoe['category'],
    msrpUsd: num(msrpUsd),
    msrpGbp: num(msrpGbp),
    weightG: num(weightG),
    dropMm: num(dropMm),
    stackHeelMm: num(stackHeelMm),
    stackFfMm: num(stackFfMm),
    foamName,
    foamClass: foamClass as Shoe['foamClass'],
    plate: plate as Shoe['plate'],
    widths,
    womensLast: yn(womensLast),
    softness: num(softness) as Shoe['softness'],
    stability: num(stability) as Shoe['stability'],
    outsole: num(outsole) as Shoe['outsole'],
    consensus,
    sources,
    status: status as Shoe['status'],
    releaseYear: num(releaseYear),
  };
  if (yn(specEstimated)) shoe.specEstimated = true;
  return shoe;
}

const dry = process.argv.includes('--dry');
const files = process.argv.slice(2).filter((a) => a !== '--dry');
if (files.length === 0) {
  console.error('usage: npx tsx scripts/ingest-research.ts [--dry] <rows.txt> [...]');
  process.exit(1);
}

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((raw, i) => {
    const lineText = raw.trim();
    const n = i + 1;
    if (!lineText || lineText.startsWith('#') || /^ROWS:/i.test(lineText)) return;
    const f = lineText.split('|');
    if (f[0] === 'AUDIT') {
      const [, slug, ynRaw, source] = f.map((x) => x.trim());
      if (!existingSlugs.has(slug)) return bad(n, file, `AUDIT unknown slug '${slug}'`);
      if (ynRaw !== 'y' && ynRaw !== 'n') return bad(n, file, `AUDIT bad y/n '${ynRaw}'`);
      if (!/^https?:\/\/[^ ]+$/.test(source ?? '')) return bad(n, file, `AUDIT bad source '${source}'`);
      audits.push({ slug, womensLast: ynRaw === 'y', source });
      return;
    }
    const fields = f[0] === 'ADD' ? f.slice(1) : f;
    if (fields.length !== 23) return bad(n, file, `expected 23 fields, got ${fields.length}`);
    const shoe = parseShoeRow(fields, n, file);
    if (shoe) added.push(shoe);
  });
}

// ---- merge -----------------------------------------------------------------
let flipped = 0;
for (const a of audits) {
  const s = existing.find((x) => x.slug === a.slug)!;
  if (s.womensLast !== a.womensLast) {
    s.womensLast = a.womensLast;
    if (!s.sources.includes(a.source)) s.sources.push(a.source);
    flipped++;
  }
}

const catOrder = new Map(CATEGORIES.map((c, i) => [c, i] as const));
const merged = [...existing, ...added].sort(
  (a, b) => catOrder.get(a.category)! - catOrder.get(b.category)! || 0,
);

// ---- post-merge invariant checks (mirror test suite) ------------------------
const median = (cat: string) => {
  const p = merged.filter((s) => s.category === cat).map((s) => s.msrpGbp).sort((a, b) => a - b);
  return p.length % 2 ? p[(p.length - 1) / 2] : (p[p.length / 2 - 1] + p[p.length / 2]) / 2;
};
if (median('race') <= 180) warns.push(`race median £${median('race')} ≤ £180 — WILL FAIL tests`);
if (median('budget') >= 110) warns.push(`budget median £${median('budget')} ≥ £110 — WILL FAIL tests`);
for (const c of CATEGORIES) {
  const count = merged.filter((s) => s.category === c).length;
  if (count < 5) warns.push(`category ${c} has only ${count} shoes — WILL FAIL tests`);
}

// ---- report ----------------------------------------------------------------
console.log(`parsed: ${added.length} new shoes, ${audits.length} audits (${flipped} womensLast flips)`);
for (const s of added) {
  console.log(
    `  + ${s.slug.padEnd(34)} ${s.category.padEnd(12)} £${String(s.msrpGbp).padStart(3)} ${s.weightG}g ` +
      `${String(s.dropMm).padStart(2)}mm ${s.foamClass.padEnd(5)} ${s.plate.padEnd(9)}${s.specEstimated ? ' ~est' : ''}`,
  );
}
if (errs.length) {
  console.log(`\nREJECTED ${errs.length} rows:`);
  for (const e of errs) console.log(`  ! ${e}`);
}
if (warns.length) {
  console.log('\nINVARIANT WARNINGS:');
  for (const w of warns) console.log(`  !! ${w}`);
}
if (dry) {
  console.log('\n--dry: no file written');
} else {
  // match the repo's one-object-per-line format so diffs stay reviewable
  writeFileSync(shoesPath, `[\n${merged.map((s) => JSON.stringify(s)).join(',\n')}\n]\n`);
  console.log(`\nwrote ${merged.length} shoes → ${shoesPath}`);
  console.log('next: npx tsx scripts/gen-offers.ts && npx tsx scripts/calibrate.ts && npx jest');
}
