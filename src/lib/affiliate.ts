import devImagesRaw from '@/data/devImages.json';
import offersRaw from '@/data/offers.json';

const DEV_IMAGES: Record<string, string> = devImagesRaw as Record<string, string>;

export interface Offer {
  retailer: string;
  region: 'UK' | 'US';
  url: string;
  priceGbp: number;
  imageUrl?: string;
  checkedAt: string;
}

const OFFERS: Record<string, Offer[]> = offersRaw as Record<string, Offer[]>;

/**
 * Wrap a retailer URL for commission when the Skimlinks publisher id is
 * configured; pass through untouched otherwise (owner-blocked items never
 * block — plan). subId format: matchId:slug:placement for revenue attribution.
 * Env is read per-call so configuration changes apply without a rebuild of
 * this module (and so both branches are unit-testable).
 */
export function buildAffiliateUrl(offer: Offer, subId: string): string {
  const id = process.env.EXPO_PUBLIC_SKIMLINKS_ID;
  if (!id) return offer.url;
  const params = new URLSearchParams({ id, xs: '1', url: offer.url, xcust: subId });
  return `https://go.skimresources.com/?${params.toString()}`;
}

export function offersFor(slug: string, region: 'UK' | 'US' = 'UK'): Offer[] {
  const all = OFFERS[slug] ?? [];
  const regional = all.filter((o) => o.region === region);
  return regional.length > 0 ? regional : all;
}

/**
 * Product image resolution. Licensed sources (offer feeds / press kits) always
 * win. devImages.json holds official brand-site product images for LOCAL
 * PREVIEW ONLY — gated by hostname, so they can show on localhost but can
 * never leak to a deployed domain until affiliate image licences exist
 * (spec §5.3 / §9.2), at which point licensed feed images replace them anyway.
 */
const isLocalPreview =
  typeof window !== 'undefined' &&
  /^(localhost|127\.|0\.0\.0\.0)/.test(window.location?.hostname ?? '');

export function imageFor(slug: string): string | undefined {
  const licensed = (OFFERS[slug] ?? []).find((o) => o.imageUrl)?.imageUrl;
  if (licensed) return licensed;
  if (isLocalPreview) return DEV_IMAGES[slug];
  return undefined;
}
