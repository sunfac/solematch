import offersRaw from '@/data/offers.json';

export interface Offer {
  retailer: string;
  region: 'UK' | 'US';
  url: string;
  priceGbp: number;
  imageUrl?: string;
  checkedAt: string;
}

const OFFERS: Record<string, Offer[]> = offersRaw as Record<string, Offer[]>;

const SKIMLINKS_ID = process.env.EXPO_PUBLIC_SKIMLINKS_ID;

/**
 * Wrap a retailer URL for commission when the Skimlinks publisher id is
 * configured; pass through untouched otherwise (owner-blocked items never
 * block — plan). subId format: matchId:slug:placement for revenue attribution.
 */
export function buildAffiliateUrl(offer: Offer, subId: string): string {
  if (!SKIMLINKS_ID) return offer.url;
  const params = new URLSearchParams({
    id: SKIMLINKS_ID,
    xs: '1',
    url: offer.url,
    xcust: subId,
  });
  return `https://go.skimresources.com/?${params.toString()}`;
}

export function offersFor(slug: string, region: 'UK' | 'US' = 'UK'): Offer[] {
  const all = OFFERS[slug] ?? [];
  const regional = all.filter((o) => o.region === region);
  return regional.length > 0 ? regional : all;
}

/** Licensed product image where one exists (press-kit/brand newsroom seeded). */
export function imageFor(slug: string): string | undefined {
  return (OFFERS[slug] ?? []).find((o) => o.imageUrl)?.imageUrl;
}
