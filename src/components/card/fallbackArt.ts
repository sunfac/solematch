import type { Category } from '@/types/shoe';

/**
 * Original, brand-free category art (gpt-image-1, 512px WebP, transparent) used
 * as the card image wherever a real licensed product photo doesn't exist yet.
 * Because it's generated original art — no logos, no trade dress, no scraped
 * brand photography — it carries no licensing risk and ships to production.
 *
 * One image PER CATEGORY, shape-matched to the build (race low and sleek,
 * max-cushion tall and chunky), so the fallback still communicates the spec.
 * It is REPRESENTATIVE, not the specific shoe — the card surfaces that so a
 * generic racer is never mistaken for the exact model (regenerate via
 * scripts/gen-fallbacks.py). Returns undefined for any category without art
 * (e.g. a newly-added category before its image exists) so the caller can fall
 * back to the line-art silhouette rather than crash.
 */
const ART: Partial<Record<Category, number>> = {
  race: require('../../../assets/fallback/race.webp'),
  tempo: require('../../../assets/fallback/tempo.webp'),
  daily: require('../../../assets/fallback/daily.webp'),
  max_cushion: require('../../../assets/fallback/max_cushion.webp'),
  stability: require('../../../assets/fallback/stability.webp'),
  budget: require('../../../assets/fallback/budget.webp'),
  trail: require('../../../assets/fallback/trail.webp'),
};

export function fallbackArt(category: Category): number | undefined {
  return ART[category];
}
