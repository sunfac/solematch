import type { Evidence } from '@/types/match';

export interface EvidenceRule {
  id: string;
  statement: string;
  citation: string;
  url: string;
  confidence: Evidence;
  effectNote?: string;
}

/**
 * The complete evidence base the engine is allowed to act on.
 * Every Reason chip in the UI must reference one of these ids.
 * Published verbatim on /methodology. Ruleset version: 2026-06.
 */
export const RULES: Record<string, EvidenceRule> = {
  'plate-pace-scaling': {
    id: 'plate-pace-scaling',
    statement:
      'Carbon-plate + high-resilience-foam shoes improve running economy by roughly 2.5-4% at faster paces, but the benefit shrinks toward zero around 10 km/h and varies a lot between individuals.',
    citation:
      'Hoogkamer et al. 2018 (Sports Medicine); Kobayashi et al. 2026 meta-analysis (14 trials, n=271, RE -2.88%); Dominy & Joubert 2022 (-1.4% at 12 km/h, not significant at 10 km/h)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12827780/',
    confidence: 'STRONG',
    effectNote: 'Pooled running economy -2.88% (95% CI -4.57 to -1.19); benefit pace-dependent',
  },
  'rotation-injury': {
    id: 'rotation-injury',
    statement:
      'Runners rotating more than one pair of shoes in parallel showed about 39% lower running-injury hazard than single-shoe runners, plausibly because varied shoe geometry distributes load across different tissues.',
    citation: 'Malisoux et al. 2015, Scand J Med Sci Sports (n=264, HR 0.614, 95% CI 0.389-0.969)',
    url: 'https://www.fitasaphysio.com/uploads/4/3/3/4/43345381/parallel_use_of_2_pairs_of_running_shoes_decreases_injury.pdf',
    confidence: 'MODERATE',
    effectNote: 'Single prospective cohort, 22 weeks',
  },
  'mass-economy': {
    id: 'mass-economy',
    statement:
      'Every 100 g added per shoe costs roughly 1% in metabolic energy, which is why lighter shoes are favoured where the foam and geometry are otherwise equal — and why plates are not rewarded on easy days.',
    citation: 'Hoogkamer, Kram et al. 2016, Med Sci Sports Exerc (0.78% per 100 g/shoe in 3000 m time trials)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/27327023/',
    confidence: 'STRONG',
  },
  'drop-experience': {
    id: 'drop-experience',
    statement:
      'Heel-toe drop made no overall difference to injury rates, but low drop (0-6 mm) appeared protective for newer runners while raising risk in regular, experienced runners — so we respect what you are used to.',
    citation: 'Malisoux et al. 2016, Am J Sports Med (RCT, n=553, 0/6/10 mm)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26961261/',
    confidence: 'MODERATE',
  },
  'soft-midsole-light-runners': {
    id: 'soft-midsole-light-runners',
    statement:
      'Softer midsoles modestly reduced injury risk overall — and the benefit concentrated in lighter runners, not heavier ones.',
    citation: 'Malisoux et al. 2020, Am J Sports Med (RCT, n=848; hard-shoe SHR 1.52 overall, 1.80 in lighter runners)',
    url: 'https://journals.sagepub.com/doi/abs/10.1177/0363546519892578',
    confidence: 'MODERATE',
  },
  'durable-foam-heavier': {
    id: 'durable-foam-heavier',
    statement:
      'Higher body mass compresses foam harder and wears shoes faster, so durable foams and robust outsoles keep their ride longer for heavier runners. This is a durability and feel recommendation — body mass alone was NOT associated with injury risk.',
    citation: 'Industry durability data; injury null-finding from Malisoux et al. 2020 (body mass SHR 1.00)',
    url: 'https://journals.sagepub.com/doi/abs/10.1177/0363546519892578',
    confidence: 'EMERGING',
  },
  'masters-rocker': {
    id: 'masters-rocker',
    statement:
      'Ageing reduces calf and ankle propulsive power; rockered geometries and stiffer, cushioned shoes can offload the calf-ankle complex. Plausible mechanism, not yet proven in trials — pair with calf strengthening.',
    citation: 'Ageing plantarflexor biomechanics literature; advanced-footwear offloading studies 2024-2025',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12098673/',
    confidence: 'EMERGING',
  },
  'plate-bone-stress': {
    id: 'plate-bone-stress',
    statement:
      'Case reports link high training volume in rigid carbon-plate shoes to navicular (midfoot) bone-stress injuries; the rigid plate shifts load to the midfoot. We cap rigid-plate shoes to race day for runners with bone-stress history — flexible nylon plates are not implicated.',
    citation: 'Tenforde, Hoenig, Saxena & Hollander 2023, Sports Medicine (case series, n=5)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10356879/',
    confidence: 'EMERGING',
    effectNote: 'Precautionary — case series, plausible mechanism',
  },
  'achilles-drop': {
    id: 'achilles-drop',
    statement:
      'Lower drops mechanically increase calf and Achilles load, so with a calf or Achilles history we steer away from sudden moves to low-drop shoes and slightly favour 8 mm+ drops and rockered rides. Mechanistic reasoning, not trial-proven.',
    citation: 'Plantarflexor loading mechanics; advanced-footwear Achilles-load studies 2024-2025',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12098673/',
    confidence: 'EMERGING',
  },
  'no-pronation-matching': {
    id: 'no-pronation-matching',
    statement:
      'Matching shoes to foot type or pronation does not reduce injuries — pronation was not associated with injury in 927 novices, and a review of 12 trials (11,240 runners) found no benefit. We therefore never prescribe stability shoes from foot type; supportive-feel is offered purely as a preference.',
    citation: 'Nielsen et al. 2014, Br J Sports Med; 2022 systematic review (12 RCTs, n=11,240)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/23766439/',
    confidence: 'STRONG',
    effectNote: 'Strong evidence AGAINST the traditional paradigm',
  },
  'comfort-tiebreak': {
    id: 'comfort-tiebreak',
    statement:
      'Comfort is not proven to prevent injury, but comfortable shoes are run in more consistently and may run slightly more economically — so comfort and fit break ties between otherwise-equal options.',
    citation: 'Nigg et al. 2015, Br J Sports Med (comfort-filter framework); Malisoux cohort secondary analysis 2025 (weak/no injury association)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26221015/',
    confidence: 'FIT & FEEL',
  },
  'foam-energy-return': {
    id: 'foam-energy-return',
    statement:
      'PEBA-class foams return roughly 80-87% of energy versus about 40-52% for traditional EVA and TPU, while being lighter — but they break down faster, which is why PEBA is prioritised for racing and durable foams for daily mileage.',
    citation: 'Materials lab data (energy-return benchmarking, 2023-2025); bending-stiffness x foam interaction studies',
    url: 'https://runrepeat.com/guides/running-shoe-foams-guide',
    confidence: 'STRONG',
    effectNote: 'Lab measurement, not outcome trials',
  },
  'womens-last': {
    id: 'womens-last',
    statement:
      'Women on average have a narrower heel, relatively wider forefoot and higher arch, so models built on a women-specific last tend to fit better out of the box. Fit only — there is no good evidence women respond differently to supershoes.',
    citation: 'Anatomical last/fit literature; sex-response gap noted in Kobayashi et al. 2026 (only 3/14 trials included women)',
    url: 'https://run.outsideonline.com/gear/women-its-not-your-imagination-your-running-shoe-was-designed-for-men/',
    confidence: 'MODERATE',
  },
  'transition-gradual': {
    id: 'transition-gradual',
    statement:
      'Running form only partially adapts to a new drop or geometry even after months, and abrupt switches to plates, maximal stacks or low drops are the riskiest moments — so any big change should be phased in over several weeks.',
    citation: 'Malisoux et al. 2017 (six-month drop-adaptation RCT); Tenforde et al. 2023 transition guidance',
    url: 'https://pubmed.ncbi.nlm.nih.gov/28365220/',
    confidence: 'MODERATE',
  },
  'fit-continuity': {
    id: 'fit-continuity',
    statement:
      'A good fitter anchors on what already works on your feet: shoes sharing the brand last, foam class and geometry of a shoe you love tend to fit and feel familiar — and the formula of a shoe you disliked is worth steering around. Known roomy-toe-box lasts (Altra, Topo and similar) serve wide-forefoot preferences.',
    citation: 'Professional fitting practice; brand last consistency (e.g. Fleet Feet outfitting process)',
    url: 'https://www.fleetfeet.com/fit-process',
    confidence: 'FIT & FEEL',
  },
  'community-consensus': {
    id: 'community-consensus',
    statement:
      'When independent expert reviewers and the running community converge on the same shoe, that consensus is a useful real-world signal for ride quality and reliability — shown as a separate community signal, never dominant over the evidence.',
    citation: 'RunRepeat / Believe in the Run / Road Trail Run / Doctors of Running 2025-26 awards; r/RunningShoeGeeks sentiment',
    url: 'https://believeintherun.com/shoe-reviews/best-road-running-shoes-of-2025/',
    confidence: 'FIT & FEEL',
  },
};

export const RULESET_VERSION = '2026-06';
