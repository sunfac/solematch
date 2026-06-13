/**
 * Critics' consensus best-in-class, by class — independent reviewer + lab
 * consensus (RunRepeat, iRunFar, Believe in the Run, The Run Testers, Road
 * Trail Run), judged on MERIT with price no object: peer reviews, lab data,
 * technology and race pedigree.
 *
 * This is a MARKET-MERIT signal, deliberately SEPARATE from a runner's personal
 * deterministic match — "what the critics crown, all things considered" vs
 * "what fits you". Surfaced as an earned badge, never as paid placement: it is
 * reviewer/lab consensus, consistent with the independent-ranking contract.
 *
 * 'clear' = a confident solo #1; 'near-tie' = genuinely co-led, so we name the
 * co-leader and never fake certainty the evidence doesn't support. Sourced and
 * curated (like the sightings data); the scheduled freshness job re-checks each
 * incumbent against new releases so the crown moves when the market does.
 */
export interface ConsensusPick {
  /** human label for the class, e.g. "Daily trainer" */
  label: string;
  /** best-in-class slug (validated against the catalogue in tests) */
  slug: string;
  /** 'clear' = confident #1; 'near-tie' = co-led, show the rival */
  confidence: 'clear' | 'near-tie';
  why: string;
  keyTech: string;
  /** the co-leader / runner-up slug (validated against the catalogue) */
  runnerUpSlug?: string;
  sources: string[];
}

export const CONSENSUS_BEST: ConsensusPick[] = [
  {
    label: 'Marathon supershoe',
    slug: 'asics-metaspeed-sky-tokyo',
    confidence: 'near-tie',
    why: "RunRepeat's #1 super shoe of 2026 (92/100, ~78% energy return), and the Metaspeed line took 7 of the top 10 at Boston 2026 — the deepest mix of lab data and real-world marathon pedigree of any racer. The Adios Pro Evo 3 edges it on raw record pedigree (a sub-2 marathon) but is fragile and near single-use, so on all-round merit the Metaspeed leads.",
    keyTech: 'FF Leap + FF Turbo+ PEBA over a full-length carbon plate',
    runnerUpSlug: 'adidas-adios-pro-evo-3',
    sources: [
      'https://runrepeat.com/guides/best-super-shoe-running-shoes',
      'https://theruntesters.com/running-shoes/the-best-carbon-plate-running-shoes/',
    ],
  },
  {
    label: '5K–10K racer',
    slug: 'nike-streakfly-2',
    confidence: 'near-tie',
    why: "Believe in the Run's named best short-distance speed shoe of 2025 — a ~145 g racer on a track-spike last built for the mile-to-10K, where heavy max-stack marathon supershoes are overkill. The Metaspeed Ray is the light-marathon crossover alternative some reviewers prefer.",
    keyTech: 'Low ZoomX stack with a carbon plate on a sprint-last geometry',
    runnerUpSlug: 'asics-metaspeed-ray',
    sources: [
      'https://believeintherun.com/shoe-reviews/best-race-day-running-shoes/',
      'https://runrepeat.com/guides/best-competition-running-shoes',
    ],
  },
  {
    label: 'Tempo / uptempo',
    slug: 'saucony-endorphin-speed-5',
    confidence: 'clear',
    why: "RunRepeat's best tempo shoe of 2026 with measured super-shoe-level energy return — the near-unanimous uptempo pick across publications, versatile enough to race yet stable enough for daily speedwork.",
    keyTech: 'PWRRUN PB (PEBA) with a winged nylon plate and a Speedroll rocker',
    runnerUpSlug: 'asics-superblast-3',
    sources: [
      'https://runrepeat.com/guides/best-tempo-running-shoes',
      'https://theruntesters.com/saucony-endorphin-speed-5-review/',
    ],
  },
  {
    label: 'Daily trainer',
    slug: 'adidas-adizero-evo-sl',
    confidence: 'clear',
    why: 'The consensus daily trainer of 2025-26 — best-overall at Believe in the Run and RunRepeat and the community favourite — delivering full-length race-grade Lightstrike Pro foam in a ~224 g do-everything trainer.',
    keyTech: 'Full-length Lightstrike Pro (supercritical TPEE), plateless',
    runnerUpSlug: 'asics-novablast-5',
    sources: [
      'https://believeintherun.com/shoe-reviews/best-road-running-shoes-of-2025/',
      'https://runrepeat.com/guides/best-running-shoes',
    ],
  },
  {
    label: 'Max cushion',
    slug: 'nike-vomero-premium',
    confidence: 'near-tie',
    why: "Believe in the Run's best max-cushion shoe of 2025 — Nike's biggest-ever stack pairs a full ZoomX layer with Air Zoom and ReactX for the most premium soft-yet-springy ride. The Gel-Nimbus 28 is RunRepeat's plushness pick and a close rival.",
    keyTech: '~58 mm triple stack: ZoomX over ReactX with dual Air Zoom, plateless',
    runnerUpSlug: 'asics-gel-nimbus-28',
    sources: [
      'https://believeintherun.com/shoe-reviews/best-road-running-shoes-of-2025/',
      'https://www.roadtrailrun.com/2025/11/roadtrailrun-best-road-running-shoes-of.html',
    ],
  },
  {
    label: 'Stability',
    slug: 'asics-gel-kayano-32',
    confidence: 'near-tie',
    why: "RunRepeat's best stability shoe of 2026 — 'stable as a table' with best-in-class lab-measured grip and a wide, supportive base using geometry-based 4D Guidance rather than a corrective wedge. The Adrenaline GTS 25 is the lighter, more versatile co-leader.",
    keyTech: 'FF Blast+ with the 4D Guidance System (geometry-based support)',
    runnerUpSlug: 'brooks-adrenaline-gts-25',
    sources: [
      'https://runrepeat.com/guides/best-stability-running-shoes',
      'https://www.outsideonline.com/outdoor-gear/run/best-stability-shoes/',
    ],
  },
  {
    label: 'Budget',
    slug: 'puma-velocity-nitro-4',
    confidence: 'near-tie',
    why: "Believe in the Run's best daily trainer of 2025 and the standout value pick — supercritical Nitro foam and a PUMAGRIP outsole punch well above the price. For the true sub-£75 bracket, RunRepeat's winner is the Nike Revolution 8.",
    keyTech: 'Nitro (nitrogen-infused EVA), plateless, PUMAGRIP outsole',
    runnerUpSlug: 'nike-revolution-8',
    sources: [
      'https://believeintherun.com/shoe-reviews/best-road-running-shoes-of-2025/',
      'https://runrepeat.com/guides/best-cheap-running-shoes',
    ],
  },
  {
    label: 'Trail · all-round',
    slug: 'hoka-speedgoat-7',
    confidence: 'clear',
    why: "iRunFar's best all-around trail shoe of 2026 — the single-quiver 'if you buy one trail shoe this year, buy this' pick — balancing deep cushioning, full Vibram Megagrip traction and durability from daily trails to ultras. The Prodigio Pro is the credible runner-up.",
    keyTech: 'Supercritical foam on 5 mm Vibram Megagrip lugs, protective rockered geometry',
    runnerUpSlug: 'la-sportiva-prodigio-pro',
    sources: [
      'https://www.irunfar.com/best-trail-running-shoes',
      'https://www.treelinereview.com/gearreviews/hoka-speedgoat-7-trail-running-shoes-review',
    ],
  },
  {
    label: 'Trail · technical / mountain',
    slug: 'la-sportiva-prodigio-pro',
    confidence: 'clear',
    why: "iRunFar's pick for technical / mountain terrain in 2026 — 'one of the best all-around outsole designs', with FriXion rubber that grips wet rock better than Vibram and a precise, agile, protective ride the Speedgoat can't match on the hardest ground.",
    keyTech: 'Sticky FriXion full-coverage outsole, lively nitrogen-EVA, precise mountain fit',
    runnerUpSlug: 'merrell-agility-peak-5',
    sources: [
      'https://www.irunfar.com/best-trail-running-shoes',
      'https://runrepeat.com/guides/best-trail-running-shoes',
    ],
  },
];

const BEST_BY_SLUG = new Map(CONSENSUS_BEST.map((p) => [p.slug, p]));
const RUNNER_UP_BY_SLUG = new Map(
  CONSENSUS_BEST.filter((p) => p.runnerUpSlug).map((p) => [p.runnerUpSlug!, p]),
);

/** The class this shoe is the critics' best-in-class for, if any. */
export const consensusBestForSlug = (slug: string): ConsensusPick | undefined => BEST_BY_SLUG.get(slug);
/** The class this shoe is the critics' runner-up / co-leader for, if any. */
export const consensusRunnerUpForSlug = (slug: string): ConsensusPick | undefined => RUNNER_UP_BY_SLUG.get(slug);
