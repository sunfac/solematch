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
 * Per-retailer affiliate link dispatch. Each network pays a higher direct
 * rate than the Skimlinks 75%-passthrough fallback, so we route to the
 * direct programme whenever its publisher ID is configured, and fall back
 * to Skimlinks (then to the raw URL) when it isn't.
 *
 * Activation order (env var → effect):
 *   EXPO_PUBLIC_AWIN_ID         → Awin → Nike, SportsShoes, JD Sports, Mizuno, Saucony, Wiggle, Decathlon (7-10%)
 *   EXPO_PUBLIC_WEBGAINS_ID     → Webgains → Runners Need (8%)
 *   EXPO_PUBLIC_IMPACT_ID       → Impact → Adidas (~7-10%)
 *   EXPO_PUBLIC_RAKUTEN_ID      → Rakuten → Hoka, sometimes NB
 *   EXPO_PUBLIC_AMAZON_TAG      → Amazon Associates → Amazon UK (4%, 24h)
 *   EXPO_PUBLIC_SKIMLINKS_ID    → Skimlinks → ~48k merchants (passthrough fallback)
 *
 * subId format: matchId:slug:placement — every network reports it back per
 * conversion so revenue is attributable per match × shoe × placement WITHOUT
 * commission touching ranking (the trust contract).
 */

/** Awin merchant IDs by retailer string. Empty when the user hasn't been
 * approved for that advertiser yet; the wrapper falls through to Skimlinks. */
const AWIN_MERCHANTS: Record<string, string> = {
  // populated as advertisers approve — placeholder string lets us flag retailers
  // we KNOW are in Awin so once the publisher ID is set, the wrap activates
  Nike: 'AWIN_NIKE_MID',
  'Nike UK': 'AWIN_NIKE_MID',
  SportsShoes: 'AWIN_SPORTSSHOES_MID',
  Saucony: 'AWIN_SAUCONY_MID',
  Mizuno: 'AWIN_MIZUNO_MID',
};

const WEBGAINS_MERCHANTS: Record<string, string> = {
  'Runners Need': 'WEBGAINS_RUNNERSNEED_MID',
};

const IMPACT_MERCHANTS: Record<string, string> = {
  Adidas: 'IMPACT_ADIDAS_MID',
};

const env = (k: string): string | undefined => process.env[k];
const enc = encodeURIComponent;

function awinWrap(merchantId: string, awinId: string, url: string, subId: string): string {
  // https://www.awin1.com/cread.php?awinmid=<mid>&awinaffid=<id>&clickref=<sub>&ued=<url>
  return `https://www.awin1.com/cread.php?awinmid=${merchantId}&awinaffid=${enc(awinId)}&clickref=${enc(subId)}&ued=${enc(url)}`;
}

function webgainsWrap(merchantId: string, programId: string, url: string, subId: string): string {
  // https://track.webgains.com/click.html?wgcampaignid=<programId>&wgprogramid=<mid>&wgtarget=<url>&clickref=<sub>
  return `https://track.webgains.com/click.html?wgcampaignid=${enc(programId)}&wgprogramid=${merchantId}&wgtarget=${enc(url)}&clickref=${enc(subId)}`;
}

function impactWrap(impactId: string, url: string, subId: string): string {
  // https://impact-go.com/?id=<id>&url=<url>&subId1=<sub> — Impact gives a custom go-link per publisher
  return `https://goto.impact-radius.com/c/${enc(impactId)}/?u=${enc(url)}&subId1=${enc(subId)}`;
}

function amazonWrap(tag: string, url: string, subId: string): string {
  // Amazon Associates: append ?tag=<tag>&ascsubtag=<sub>
  // strip any existing tag/ascsubtag from the URL first
  const u = new URL(url);
  u.searchParams.set('tag', tag);
  u.searchParams.set('ascsubtag', subId);
  return u.toString();
}

function skimlinksWrap(skimId: string, url: string, subId: string): string {
  const params = new URLSearchParams({ id: skimId, xs: '1', url, xcust: subId });
  return `https://go.skimresources.com/?${params.toString()}`;
}

const isAmazonUrl = (url: string): boolean => /\bamazon\.[a-z.]+\//.test(url);

export function buildAffiliateUrl(offer: Offer, subId: string): string {
  const { retailer, url } = offer;

  // Amazon UK: dedicated wrapper (instant 4%, the fastest network to activate)
  if (isAmazonUrl(url)) {
    const tag = env('EXPO_PUBLIC_AMAZON_TAG');
    if (tag) return amazonWrap(tag, url, subId);
  }

  // Awin: per-advertiser merchant IDs gate the wrap
  const awinId = env('EXPO_PUBLIC_AWIN_ID');
  if (awinId && AWIN_MERCHANTS[retailer]) {
    const mid = env(`EXPO_PUBLIC_AWIN_MID_${retailer.toUpperCase().replace(/\W+/g, '_')}`);
    if (mid) return awinWrap(mid, awinId, url, subId);
  }

  // Webgains (Runners Need is the marquee 8% UK programme)
  const webgainsId = env('EXPO_PUBLIC_WEBGAINS_ID');
  if (webgainsId && WEBGAINS_MERCHANTS[retailer]) {
    const mid = env(`EXPO_PUBLIC_WEBGAINS_MID_${retailer.toUpperCase().replace(/\W+/g, '_')}`);
    if (mid) return webgainsWrap(mid, webgainsId, url, subId);
  }

  // Impact (Adidas direct ~7-10%)
  const impactId = env('EXPO_PUBLIC_IMPACT_ID');
  if (impactId && IMPACT_MERCHANTS[retailer]) {
    return impactWrap(impactId, url, subId);
  }

  // Skimlinks: the passthrough fallback for everything else (~48k merchants)
  const skimId = env('EXPO_PUBLIC_SKIMLINKS_ID');
  if (skimId) return skimlinksWrap(skimId, url, subId);

  // No network configured — raw passthrough (zero commission, but the link works)
  return url;
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
