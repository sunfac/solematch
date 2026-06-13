/**
 * One-shot patch: assign curated forefoot-shape to shoes whose reviewer
 * consensus or brand last-shape policy gives clear signal. Conservative:
 * unspecified shoes default to 'standard' implicitly (back-compat preserved).
 *
 * Sources for the curation calls (per cluster):
 *  - NARROW racers: Adidas Adizero lineage (narrow heel cup is a known trait,
 *    Takumi Sen 11 reviews flag it explicitly), Asics Metaspeed family
 *    (Metaspeed Ray, Tokyo lasts run snug), Nike Streakfly 2 (built on a
 *    track-spike last), Saucony Endorphin race (snug performance fit).
 *  - ROOMY foot-shaped lasts: Altra (Fit4Her + FootShape policy), Topo
 *    (foot-shaped policy), Hoka wide-fit cruisers (Gaviota 6, Bondi 9 wide),
 *    Brooks Ghost Max 3 (wide platform), NB More v6 (2E availability + wide last),
 *    Mizuno Wave Sky 9 (premium plush — accommodates), Saucony Triumph 23/24
 *    (well-padded daily, generally accommodating).
 * Everything else stays undefined = 'standard'.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Shoe } from '../src/types/shoe';

const NARROW = new Set<string>([
  'adidas-adios-pro-4',
  'adidas-adios-pro-evo-3',
  'adidas-boston-13',
  'adidas-adizero-takumi-sen-11',
  'asics-metaspeed-sky-tokyo',
  'asics-metaspeed-edge-tokyo',
  'asics-metaspeed-ray',
  'asics-magic-speed-5',
  'nike-streakfly-2',
  'nike-vaporfly-4',
  'saucony-endorphin-elite-2',
  'saucony-endorphin-pro-5',
  'mizuno-wave-rebellion-flash-3',
  'mizuno-hyperwarp-pure',
  'brooks-hyperion-elite-5',
]);

const ROOMY = new Set<string>([
  'altra-experience-flow-3',
  'topo-phantom-4',
  'hoka-bondi-9',
  'hoka-clifton-10',
  'hoka-gaviota-6',
  'hoka-arahi-8',
  'hoka-skyflow',
  'brooks-ghost-max-3',
  'brooks-ghost-17',
  'brooks-glycerin-23',
  'brooks-glycerin-max-2',
  'new-balance-more-v6',
  'new-balance-1080v15',
  'new-balance-880v15',
  'new-balance-860-v15',
  'mizuno-wave-sky-9',
  'mizuno-wave-horizon-9',
  'saucony-triumph-24',
  'saucony-triumph-23',
  'asics-gel-nimbus-28',
  'asics-gel-kayano-32',
]);

const p = join(__dirname, '..', 'src', 'data', 'shoes.json');
const shoes = JSON.parse(readFileSync(p, 'utf8')) as Shoe[];

let n = 0;
let r = 0;
for (const s of shoes) {
  if (NARROW.has(s.slug)) {
    s.forefootShape = 'narrow';
    n++;
  } else if (ROOMY.has(s.slug)) {
    s.forefootShape = 'roomy';
    r++;
  } else {
    delete s.forefootShape;
  }
}

writeFileSync(p, `[\n${shoes.map((s) => JSON.stringify(s)).join(',\n')}\n]\n`);
console.log(`patched: ${n} narrow + ${r} roomy + ${shoes.length - n - r} standard (implicit)`);
