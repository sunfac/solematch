/**
 * Link-health checker (owner item 3): verifies every offers.json URL actually
 * resolves and isn't an empty search page. Designed to run after gen-offers and
 * on a schedule once the price job exists.
 *
 * Verdicts per URL:
 *   OK               2xx and no "no results" marker found
 *   EMPTY            2xx but the page explicitly says no results were found
 *   SSR_EMPTY        as EMPTY but on a retailer whose SSR shell is known to lie
 *                    (results hydrate client-side) — advisory only
 *   SUSPECT_REDIRECT 2xx but redirected somewhere that dropped the search query
 *   BLOCKED          403/406/418/429/503 or header-bomb bot-wall — NOT proof the
 *                    link fails for humans; needs manual or datafeed verification
 *   HTTP_<code>      hard HTTP failure (404 = definitively broken)
 *   TIMEOUT / ERROR  network-level failure
 *
 * Usage: npx tsx scripts/check-links.ts [--sample N] [--retailer Name]
 * Output: pipe rows (slug|retailer|verdict|status|url) for every non-OK link,
 * then a per-retailer summary table.
 */
import offersJson from '../src/data/offers.json';

interface Offer {
  retailer: string;
  region: string;
  url: string;
  priceGbp: number;
  checkedAt: string;
}

const OFFERS = offersJson as Record<string, Offer[]>;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';

/**
 * Retailers whose static HTML carries "no results" text on healthy pages —
 * Nike/Puma hydrate results client-side over an empty SSR shell; Brooks ships
 * a hidden search-overlay template on every page. EMPTY downgrades to advisory.
 */
const SSR_UNRELIABLE = new Set(['Nike', 'Puma', 'Brooks']);

const NO_RESULTS = [
  /no results/i,
  /0 results/i,
  /nothing (?:was )?found/i,
  /no products? (?:were )?found/i,
  /couldn'?t find any/i,
  /we did(?:n'|no)t find/i,
  /no matching products/i,
  /returned no results/i,
  /try a different search/i,
  /0 items? found/i,
];

interface CheckResult {
  slug: string;
  retailer: string;
  url: string;
  verdict: string;
  status: number | string;
  finalUrl?: string;
}

async function check(slug: string, retailer: string, url: string): Promise<CheckResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
    });
    const status = res.status;
    if (status === 403 || status === 406 || status === 418 || status === 429 || status === 503) {
      return { slug, retailer, url, verdict: 'BLOCKED', status };
    }
    if (!res.ok) {
      return { slug, retailer, url, verdict: `HTTP_${status}`, status };
    }
    const finalUrl = res.url || url;
    // strip script/style blocks first — JS bundles carry "no results" template
    // strings that false-positive the sniff on fully healthy pages
    const body = (await res.text())
      .slice(0, 800_000)
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '');
    if (NO_RESULTS.some((re) => re.test(body))) {
      // Nike/Puma serve a "no results" SSR shell then hydrate real results
      // client-side (firecrawl-verified) — advisory, not a dead link
      const verdict = SSR_UNRELIABLE.has(retailer) ? 'SSR_EMPTY' : 'EMPTY';
      return { slug, retailer, url, verdict, status, finalUrl };
    }
    // search query dropped by a redirect (e.g. bounced to homepage) = silent failure
    const hadQuery = /[?&]q(?:uery)?=/.test(url);
    const lostQuery = hadQuery && !/[?&]q(?:uery)?=/.test(finalUrl);
    if (lostQuery) {
      return { slug, retailer, url, verdict: 'SUSPECT_REDIRECT', status, finalUrl };
    }
    return { slug, retailer, url, verdict: 'OK', status };
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    // giant header blocks (Hoka) overflow undici's limit but render fine in
    // real browsers — that's a bot-wall-class signal, not a dead link
    const cause = e instanceof Error ? (e.cause as { code?: string } | undefined) : undefined;
    const headerBomb = cause?.code === 'UND_ERR_HEADERS_OVERFLOW';
    return {
      slug,
      retailer,
      url,
      verdict: aborted ? 'TIMEOUT' : headerBomb ? 'BLOCKED' : 'ERROR',
      status: '-',
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const sampleIdx = args.indexOf('--sample');
  const sample = sampleIdx >= 0 ? Number(args[sampleIdx + 1]) : Infinity;
  const retIdx = args.indexOf('--retailer');
  const retailerFilter = retIdx >= 0 ? args[retIdx + 1].toLowerCase() : null;

  let jobs: Array<{ slug: string; retailer: string; url: string }> = Object.entries(OFFERS).flatMap(
    ([slug, offers]) => offers.map((o) => ({ slug, retailer: o.retailer, url: o.url })),
  );
  if (retailerFilter) jobs = jobs.filter((j) => j.retailer.toLowerCase() === retailerFilter);
  if (jobs.length > sample) {
    // deterministic spread: every Nth so all retailers stay represented
    const step = jobs.length / sample;
    jobs = Array.from({ length: sample }, (_, i) => jobs[Math.floor(i * step)]);
  }

  const results: CheckResult[] = [];
  const CONCURRENCY = 8;
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, async () => {
      while (next < jobs.length) {
        const j = jobs[next++];
        results.push(await check(j.slug, j.retailer, j.url));
      }
    }),
  );

  const bad = results.filter((r) => r.verdict !== 'OK');
  for (const r of bad) {
    console.log(`${r.slug}|${r.retailer}|${r.verdict}|${r.status}|${r.url}${r.finalUrl && r.finalUrl !== r.url ? `|→ ${r.finalUrl}` : ''}`);
  }

  const byRetailer = new Map<string, Map<string, number>>();
  for (const r of results) {
    const m = byRetailer.get(r.retailer) ?? new Map<string, number>();
    m.set(r.verdict, (m.get(r.verdict) ?? 0) + 1);
    byRetailer.set(r.retailer, m);
  }
  console.log(`\nchecked ${results.length} links`);
  for (const [retailer, verdicts] of [...byRetailer.entries()].sort()) {
    const parts = [...verdicts.entries()].sort().map(([v, n]) => `${v}:${n}`);
    console.log(`  ${retailer.padEnd(14)} ${parts.join('  ')}`);
  }
}

main();
