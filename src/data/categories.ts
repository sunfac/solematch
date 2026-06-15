import type { Category } from '@/types/shoe';

/**
 * Editorial content for the category landing pages (`/best/<category>`). Single
 * source of truth shared by the in-app route (`app/best/[category].tsx`) and the
 * crawlable static stub (`scripts/seo-postbuild.ts`) so the page a search
 * visitor lands on and the HTML a crawler indexes never drift apart. Copy is
 * evidence-led and brand-neutral — the ranking is the engine's, not marketing.
 */
export interface CategoryContent {
  key: Category;
  /** Lowercase inline label, e.g. "race-day". */
  label: string;
  /** Page H1. */
  h1: string;
  /** 1–2 sentence intro, shown on the page and emitted as crawlable copy. */
  intro: string;
  /** <title> for the static stub. */
  seoTitle: string;
  /** <meta name="description"> for the static stub. */
  seoDescription: string;
}

/** Display order across the hub + sitemap. */
export const CATEGORY_ORDER: Category[] = [
  'race',
  'tempo',
  'daily',
  'max_cushion',
  'stability',
  'trail',
  'budget',
];

export const CATEGORY_CONTENT: Record<Category, CategoryContent> = {
  race: {
    key: 'race',
    label: 'race-day',
    h1: 'Best race-day running shoes',
    intro:
      'Carbon-plated super-shoes built for one thing — a fast race. We rank them on propulsion, weight and energy return, the specs that actually move your finish time, each weighed against the published evidence rather than the marketing.',
    seoTitle: 'Best race-day running shoes — ranked by the science · SoleMatch',
    seoDescription:
      'The fastest carbon-plate marathon and 5K shoes, ranked by an independent engine on propulsion, weight and energy return — not marketing budgets. Find your personal match in 2 minutes.',
  },
  tempo: {
    key: 'tempo',
    label: 'tempo',
    h1: 'Best tempo & workout running shoes',
    intro:
      'Light, responsive trainers for threshold and interval days — quick enough to turn over, tough enough to repeat. Ranked on responsiveness, weight and value so your hard days land where they should.',
    seoTitle: 'Best tempo & workout running shoes — ranked by the science · SoleMatch',
    seoDescription:
      'The best lightweight tempo and interval trainers, ranked by an independent engine on responsiveness, weight and value. See which fits your stride and goals.',
  },
  daily: {
    key: 'daily',
    label: 'daily trainer',
    h1: 'Best daily trainer running shoes',
    intro:
      'The everyday workhorses you log most of your miles in — balanced cushioning, durability and an honest ride. Ranked on the blend that holds up week after week, not the hype of launch day.',
    seoTitle: 'Best daily trainer running shoes — ranked by the science · SoleMatch',
    seoDescription:
      'The best everyday running shoes for easy and steady miles, ranked by an independent engine on cushioning, durability and ride. Match one to your stride and budget.',
  },
  max_cushion: {
    key: 'max_cushion',
    label: 'max-cushion',
    h1: 'Best max-cushion running shoes',
    intro:
      'Maximum stack, maximum protection — built to take the sting out of long, slow miles and recovery days. Ranked on cushioning, comfort and how planted they stay as fatigue sets in.',
    seoTitle: 'Best max-cushion running shoes — ranked by the science · SoleMatch',
    seoDescription:
      'The best high-stack, max-cushion running shoes for long runs and recovery, ranked by an independent engine on cushioning, comfort and stability. Find your match.',
  },
  stability: {
    key: 'stability',
    label: 'stability',
    h1: 'Best stability running shoes',
    intro:
      'Guidance for runners who overpronate or just want a planted, supportive ride — modern stability without the old corrective clunk. Ranked on support, comfort and the quality of the ride.',
    seoTitle: 'Best stability running shoes — ranked by the science · SoleMatch',
    seoDescription:
      'The best stability and support running shoes for overpronation, ranked by an independent engine on support, comfort and ride — no marketing spin. See your personal match.',
  },
  trail: {
    key: 'trail',
    label: 'trail',
    h1: 'Best trail running shoes',
    intro:
      'Grip, protection and sure footing for the off-road — ranked on outsole traction, ground protection and how stable they stay over loose and technical terrain.',
    seoTitle: 'Best trail running shoes — ranked by the science · SoleMatch',
    seoDescription:
      'The best trail running shoes for off-road and technical terrain, ranked by an independent engine on grip, protection and stability. Match one to your terrain and stride.',
  },
  budget: {
    key: 'budget',
    label: 'budget',
    h1: 'Best budget running shoes',
    intro:
      'Proven mileage without the flagship price — honest trainers that punch well above their cost. Ranked on value: how much ride and durability you get for each pound.',
    seoTitle: 'Best budget running shoes — ranked by the science · SoleMatch',
    seoDescription:
      'The best value running shoes under flagship prices, ranked by an independent engine on ride and durability per pound. Find a dependable trainer that fits your budget.',
  },
};
