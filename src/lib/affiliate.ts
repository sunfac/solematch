import { Asset } from 'expo-asset';
import devImagesRaw from '@/data/devImages.json';
import { LOCAL_SHOE_IMAGES } from '@/data/localShoeImages';
import offersRaw from '@/data/offers.json';

export interface ImageRef {
  /** resolved image URI (remote URL or bundled asset URI) */
  source: string;
  /** background-free (transparent) — render floating; otherwise on a light tile */
  cut: boolean;
}

const DEV_IMAGES: Record<string, { url: string; cut: boolean }> = devImagesRaw as Record<
  string,
  { url: string; cut: boolean }
>;

export interface Offer {
  retailer: string;
  region: 'UK' | 'US';
  url: string;
  /** RRP/list price for this offer in GBP. */
  priceGbp: number;
  /**
   * Live street price in GBP from scripts/check-prices.ts (when present and
   * meaningfully under RRP). Drives "was £RRP / now £street" UI surfaces and
   * tilts bestOffer() toward the lower live price.
   */
  streetPriceGbp?: number;
  /** Inferred from streetPriceGbp/priceGbp at check time; cached for ranking. */
  priceDropped?: boolean;
  /**
   * 'search' lands on results for this exact model; 'brand' lands on the
   * retailer's brand range page (used where no url-addressable search exists,
   * e.g. Runners Need until the Webgains datafeed gives per-SKU deep links).
   * Absent = 'search' (pre-kind data).
   */
  kind?: 'search' | 'brand' | 'product';
  imageUrl?: string;
  checkedAt: string;
}

/** The price the runner will actually pay. */
export const payPrice = (o: Offer): number => o.streetPriceGbp ?? o.priceGbp;

/** Model-specific destinations beat brand range pages; among those, lowest payable price wins. */
export function bestOffer(offers: Offer[]): Offer | undefined {
  return [...offers].sort(
    (a, b) =>
      (a.kind === 'brand' ? 1 : 0) - (b.kind === 'brand' ? 1 : 0) || payPrice(a) - payPrice(b),
  )[0];
}

export interface PriceDrop {
  rrpGbp: number;
  streetGbp: number;
  pctOff: number;
}

/** "Was £180, now £140 (22% off)" — surfaced where it matters most. */
export function dropFor(offers: Offer[]): PriceDrop | undefined {
  const dropped = offers.filter((o) => o.streetPriceGbp && o.streetPriceGbp < o.priceGbp);
  if (dropped.length === 0) return undefined;
  // pick the biggest absolute saving for the headline number
  const best = dropped.sort(
    (a, b) => (b.priceGbp - b.streetPriceGbp!) - (a.priceGbp - a.streetPriceGbp!),
  )[0];
  const street = best.streetPriceGbp!;
  return { rrpGbp: best.priceGbp, streetGbp: street, pctOff: Math.round(((best.priceGbp - street) / best.priceGbp) * 100) };
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

export function imageFor(slug: string): ImageRef | undefined {
  const licensed = (OFFERS[slug] ?? []).find((o) => o.imageUrl)?.imageUrl;
  if (licensed) return { source: licensed, cut: false };
  if (!isLocalPreview) return undefined;
  const local = LOCAL_SHOE_IMAGES[slug];
  // expo-image on web rejects bare asset-module numbers — resolve to a URI
  if (local !== undefined) return { source: Asset.fromModule(local).uri, cut: true };
  const dev = DEV_IMAGES[slug];
  if (dev) return { source: dev.url, cut: dev.cut };
  return undefined;
}
