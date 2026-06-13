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

interface Shoe {
  slug: string;
  brand: string;
  model: string;
  version: string;
  status: string;
}

/** Official brand storefront hosts per brand — a PDP URL must match one. */
const BRAND_HOSTS: Record<string, string[]> = {
  Nike: ['nike.com'],
  Adidas: ['adidas.co.uk', 'adidas.com'],
  Asics: ['asics.com'],
  Saucony: ['saucony.com'],
  Hoka: ['hoka.com'],
  'New Balance': ['newbalance.co.uk', 'newbalance.com', 'newbalance.eu'],
  Puma: ['puma.com', 'uk.puma.com'],
  On: ['on.com', 'on-running.com'],
  Brooks: ['brooksrunning.com'],
  Mizuno: ['mizuno.com', 'emea.mizuno.com', 'mizunousa.com'],
  'Under Armour': ['underarmour.com', 'underarmour.co.uk'],
  Kiprun: ['decathlon.co.uk', 'decathlon.com'],
  Anta: ['anta.com'],
  'Li-Ning': ['lining.com', 'l-ning.com'],
  '361 Degrees': ['361sport.com', '361usa.com', '361europe.com'],
  Skechers: ['skechers.com', 'skechers.co.uk'],
  Altra: ['altrarunning.com'],
  Topo: ['topoathletic.com'],
  Salomon: ['salomon.com'],
  Reebok: ['reebok.com', 'reebok.eu'],
  Diadora: ['diadora.com'],
};

/**
 * Targets are derived from the catalogue: every CURRENT shoe missing an image
 * gets a harvest job. Searches use plain product names (no `site:` filter —
 * firecrawl over-filters; no inline quotes — cmd.exe shell:true splits them).
 * Brand-host post-filter keeps the brand PDP, drops resellers/reviews.
 */
function buildTargets(devImages: Record<string, unknown>): Target[] {
  const shoesPath = join(__dirname, '..', 'src', 'data', 'shoes.json');
  const shoes = JSON.parse(readFileSync(shoesPath, 'utf8')) as Shoe[];
  const targets: Target[] = [];
  for (const s of shoes) {
    if (s.status !== 'current') continue;
    if (devImages[s.slug]) continue;
    const brandHosts = BRAND_HOSTS[s.brand];
    if (!brandHosts) continue; // no known official storefront → silhouette fallback
    const version = s.version && s.version !== '1' ? ` ${s.version}` : '';
    targets.push({
      slug: s.slug,
      query: `${s.brand} ${s.model}${version} mens running shoes`,
      brandHosts,
    });
  }
  return targets;
}

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

const allTargets = buildTargets(devImages);
const targets = allTargets
  .filter((t) => (only ? only.has(t.slug) : true))
  .slice(0, limit === Infinity ? Infinity : limit);

console.log(`harvesting ${targets.length} shoes (${allTargets.length} missing images, ${Object.keys(devImages).length} already have them)`);

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
