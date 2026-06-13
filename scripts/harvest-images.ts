/**
 * Cross-platform port of .firecrawl/scratchpad/harvest-images.sh (the bash
 * version assumes jq + Unix grep). For each slug in HARVEST_TARGETS, search
 * for the brand PDP, scrape it, extract the og:image URL, save the path:
 *   .firecrawl/images/url-<slug>.txt — the source PDP
 *   .firecrawl/images/h-<slug>.html  — the raw HTML
 *   src/data/devImages.json          — { url, cut: false } registered
 *
 * Localhost-gated by lib/affiliate.ts (spec §5.3); production keeps silhouettes.
 *
 * Usage: npx tsx scripts/harvest-images.ts [--only slug1,slug2,...] [--limit N]
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface Target {
  slug: string;
  query: string;
  /** brand host substrings considered legitimate sources (PDP URLs must match one) */
  brandHosts: string[];
}

/**
 * Searches use plain product names (no `site:` filter — firecrawl over-filters
 * with that and returns nothing; no inline quotes either — under cmd.exe
 * shell:true those split into multiple argv tokens, which firecrawl rejects).
 * Brand-host post-filter on the result list catches resellers/reviews while
 * keeping the brand PDP.
 */
const HARVEST_TARGETS: Target[] = [
  { slug: 'brooks-launch-12', query: 'Brooks Launch 12 mens running shoes', brandHosts: ['brooksrunning.com'] },
  { slug: 'brooks-ghost-17', query: 'Brooks Ghost 17 mens running shoes', brandHosts: ['brooksrunning.com'] },
  { slug: 'brooks-ghost-max-3', query: 'Brooks Ghost Max 3 mens running shoes', brandHosts: ['brooksrunning.com'] },
  { slug: 'brooks-glycerin-23', query: 'Brooks Glycerin 23 mens running shoes', brandHosts: ['brooksrunning.com'] },
  { slug: 'new-balance-rebel-v5', query: 'FuelCell Rebel v5 mens New Balance', brandHosts: ['newbalance.co.uk', 'newbalance.com', 'newbalance.eu'] },
  { slug: 'new-balance-880v15', query: 'New Balance 880v15 mens road running', brandHosts: ['newbalance.co.uk', 'newbalance.com', 'newbalance.eu'] },
  { slug: 'new-balance-1080v15', query: 'Fresh Foam X 1080v15 mens road running', brandHosts: ['newbalance.co.uk', 'newbalance.com', 'newbalance.eu'] },
  { slug: 'new-balance-more-v6', query: 'Fresh Foam X More v6 mens New Balance', brandHosts: ['newbalance.co.uk', 'newbalance.com', 'newbalance.eu'] },
  { slug: 'nike-streakfly-2', query: 'Nike Streakfly 2 mens road racing', brandHosts: ['nike.com'] },
  { slug: 'nike-pegasus-premium', query: 'Nike Pegasus Premium mens road running', brandHosts: ['nike.com'] },
  { slug: 'nike-vomero-18', query: 'Nike Vomero 18 mens road running', brandHosts: ['nike.com'] },
  { slug: 'hoka-cielo-x1-3', query: 'Hoka Cielo X1 3.0 mens racing', brandHosts: ['hoka.com'] },
  { slug: 'hoka-clifton-10', query: 'Hoka Clifton 10 mens running shoes', brandHosts: ['hoka.com'] },
  { slug: 'hoka-mach-7', query: 'Hoka Mach 7 mens running shoes', brandHosts: ['hoka.com'] },
  { slug: 'hoka-skyflow', query: 'Hoka Skyflow mens running shoes', brandHosts: ['hoka.com'] },
  { slug: 'on-cloudmonster-3', query: 'On Cloudmonster 3 mens running shoes', brandHosts: ['on.com', 'on-running.com'] },
  { slug: 'on-cloudsurfer-2', query: 'On Cloudsurfer 2 mens running shoes', brandHosts: ['on.com', 'on-running.com'] },
  { slug: 'saucony-triumph-24', query: 'Saucony Triumph 24 mens running shoes', brandHosts: ['saucony.com'] },
  { slug: 'saucony-endorphin-pro-5', query: 'Saucony Endorphin Pro 5 mens racing', brandHosts: ['saucony.com'] },
  { slug: 'saucony-ride-19', query: 'Saucony Ride 19 mens running shoes', brandHosts: ['saucony.com'] },
  { slug: 'asics-superblast-3', query: 'Asics Superblast 3 mens running shoes', brandHosts: ['asics.com'] },
  { slug: 'asics-magic-speed-5', query: 'Asics Magic Speed 5 mens running shoes', brandHosts: ['asics.com'] },
  { slug: 'asics-gel-nimbus-28', query: 'Asics Gel-Nimbus 28 mens running shoes', brandHosts: ['asics.com'] },
  { slug: 'puma-velocity-nitro-4', query: 'Puma Velocity Nitro 4 mens running shoes', brandHosts: ['puma.com', 'uk.puma.com'] },
  { slug: 'puma-deviate-nitro-elite-4', query: 'Puma Deviate Nitro Elite 4 racing', brandHosts: ['puma.com', 'uk.puma.com'] },
];

const ROOT = join(__dirname, '..');
const IMG = join(ROOT, '.firecrawl', 'images');
const SEARCH = join(ROOT, '.firecrawl', 'image-search');
const DEV_PATH = join(ROOT, 'src', 'data', 'devImages.json');

mkdirSync(IMG, { recursive: true });
mkdirSync(SEARCH, { recursive: true });

const args = process.argv.slice(2);
const limit = (() => {
  const i = args.indexOf('--limit');
  return i >= 0 ? Number(args[i + 1]) : Infinity;
})();
const only = (() => {
  const i = args.indexOf('--only');
  return i >= 0 ? new Set(args[i + 1].split(',')) : null;
})();

/**
 * Cross-platform firecrawl invocation. shell:true is required on Windows post-
 * CVE-2024-27980 (Node 22 EINVALs .cmd shims under shell:false). Under shell:
 * true on Windows, Node space-joins argv into a single command line — so any
 * argument with spaces (like our search query) splits into multiple tokens and
 * firecrawl rejects it. We pre-quote space-bearing args so cmd.exe re-parses
 * them as one.
 */
const quoteArg = (a: string): string => (/[\s]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);
async function firecrawl(argv: string[]): Promise<boolean> {
  const quoted = argv.map(quoteArg);
  return new Promise((resolve) => {
    const child = spawn('npx', ['-y', 'firecrawl', ...quoted], { shell: true, stdio: 'ignore' });
    const t = setTimeout(() => child.kill(), 60_000);
    child.on('exit', () => {
      clearTimeout(t);
      resolve(true);
    });
    child.on('error', () => {
      clearTimeout(t);
      resolve(false);
    });
  });
}

/** Pick the first hit whose URL host substring matches the brand. */
function firstBrandUrl(json: string, brandHosts: string[]): string | null {
  try {
    const j = JSON.parse(json);
    const hits = (j?.data?.web ?? []) as Array<{ url?: string }>;
    for (const h of hits) {
      if (!h.url) continue;
      const u = h.url.toLowerCase();
      if (brandHosts.some((host) => u.includes(host))) return h.url;
    }
    return null;
  } catch {
    return null;
  }
}

/** og:image extraction (covers single- and double-quoted attributes, any order). */
function extractOgImage(html: string): string | null {
  for (const re of [
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
  ]) {
    const m = re.exec(html);
    if (m) return m[1].replace(/&amp;/g, '&');
  }
  return null;
}

const devImages: Record<string, { url: string; cut: boolean }> = JSON.parse(
  readFileSync(DEV_PATH, 'utf8'),
);

const targets = HARVEST_TARGETS.filter((t) => (only ? only.has(t.slug) : true))
  .filter((t) => !devImages[t.slug])
  .slice(0, limit === Infinity ? Infinity : limit);

console.log(`harvesting ${targets.length} shoes (skipping ${HARVEST_TARGETS.length - targets.length} already done or filtered)`);

let added = 0;
async function main() {
  for (const t of targets) {
    const searchOut = join(SEARCH, `${t.slug}.json`);
    const urlOut = join(IMG, `url-${t.slug}.txt`);
    const htmlOut = join(IMG, `h-${t.slug}.html`);

    let url: string | null = null;
    if (existsSync(urlOut)) {
      url = readFileSync(urlOut, 'utf8').trim();
    }
    if (!url) {
      if (!existsSync(searchOut)) {
        await firecrawl(['search', t.query, '--limit', '8', '--json', '-o', searchOut]);
      }
      if (existsSync(searchOut)) {
        url = firstBrandUrl(readFileSync(searchOut, 'utf8'), t.brandHosts);
        if (url) writeFileSync(urlOut, url);
      }
    }
    if (!url) {
      console.log(`  -  ${t.slug.padEnd(34)} no PDP url`);
      continue;
    }
    if (!existsSync(htmlOut)) {
      await firecrawl(['scrape', url, '--format', 'rawHtml', '-o', htmlOut]);
    }
    if (!existsSync(htmlOut)) {
      console.log(`  -  ${t.slug.padEnd(34)} scrape failed`);
      continue;
    }
    const html = readFileSync(htmlOut, 'utf8');
    const img = extractOgImage(html);
    if (!img) {
      console.log(`  -  ${t.slug.padEnd(34)} no og:image`);
      continue;
    }
    devImages[t.slug] = { url: img, cut: false };
    added++;
    console.log(`  +  ${t.slug.padEnd(34)} ${img.slice(0, 80)}${img.length > 80 ? '…' : ''}`);
  }

  if (added > 0) {
    const sorted = Object.entries(devImages).sort(([a], [b]) => a.localeCompare(b));
    const body = sorted
      .map(([slug, v]) => `  ${JSON.stringify(slug)}: ${JSON.stringify(v)}`)
      .join(',\n');
    writeFileSync(DEV_PATH, `{\n${body}\n}\n`);
    console.log(`\nwrote ${sorted.length} image refs → ${DEV_PATH} (+${added} new)`);
  } else {
    console.log('\nno changes');
  }
}

main();
