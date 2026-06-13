import { bySlug } from '@/data/catalogue';
import feed from '@/data/feedImages.json';
import { feedEntryFor } from '@/lib/affiliate';

/**
 * Guards the licensed-datafeed pipeline: whatever scripts/import-datafeed.ts
 * writes must map real catalogue slugs to https images so it ships safely to
 * production. Passes trivially while empty; bites the moment a feed is imported.
 */
describe('licensed feed images', () => {
  const entries = Object.entries(feed as Record<string, { imageUrl: string; checkedAt: string }>);

  test('feedImages.json is a valid object', () => {
    expect(feed && typeof feed === 'object' && !Array.isArray(feed)).toBe(true);
  });

  test('every entry maps a real, current catalogue slug to an https image with a date', () => {
    for (const [slug, e] of entries) {
      const shoe = bySlug.get(slug);
      expect(shoe).toBeDefined();
      expect(shoe!.status).toBe('current');
      expect(typeof e.imageUrl).toBe('string');
      expect(/^https:\/\//.test(e.imageUrl)).toBe(true);
      expect(typeof e.checkedAt).toBe('string');
    }
  });

  test('feedEntryFor returns undefined for an unknown slug', () => {
    expect(feedEntryFor('definitely-not-a-shoe')).toBeUndefined();
  });
});
