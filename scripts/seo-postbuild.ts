/**
 * Post-export SEO step. Expo's single-output build emits one dist/index.html
 * with a bare <title> — adequate for the SPA but a wasteland for SEO and
 * social shares (Facebook/Twitter/Discord bots don't run JS). This script:
 *
 *  1. Rewrites dist/index.html with rich default meta (title, description,
 *     canonical, OG, Twitter, JSON-LD) — the homepage card.
 *  2. Emits dist/shoe/<slug>/index.html for every current shoe — a tiny
 *     static stub with shoe-specific OG so social bots get the right card.
 *     The SPA client-side router takes over once a real user lands.
 *  3. Emits dist/sitemap.xml listing every public route, and dist/robots.txt
 *     allowing all crawlers + pointing at the sitemap.
 *
 * Run after `npm run export:web`: npx tsx scripts/seo-postbuild.ts
 * Vercel does both via `buildCommand` (see package.json:build).
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import shoes from '../src/data/shoes.json';
import { LEGACY_SLUGS } from '../src/data/catalogue';
import { CATEGORY_CONTENT, CATEGORY_ORDER } from '../src/data/categories';
import { SCORED } from '../src/scores/formulas';
import {
  CAT_LABEL,
  categoryFallbackMain,
  escapeHtml,
  homeFallbackMain,
  injectFallbackBody,
  shoeFallbackMain,
  type RankedSeoShoe,
  type SeoShoe,
} from './seo-content';

interface Shoe extends SeoShoe {
  status: 'current' | 'superseded' | 'upcoming';
}

const SITE_URL = process.env.SOLEMATCH_SITE_URL ?? 'https://solematch.app';
/**
 * Origin the social-card IMAGE actually resolves on. og:image must be an
 * absolute URL that loads or the unfurl is blank — and the canonical domain
 * (SITE_URL) may not have DNS yet, so default the image origin to the live
 * deployment. Canonical/og:url stay on SITE_URL for SEO; only the image bytes
 * are served from here. Override once the canonical domain is live.
 */
const ASSET_URL = process.env.SOLEMATCH_ASSET_URL ?? 'https://solematch-production.up.railway.app';
const SITE_NAME = 'SoleMatch';
const SITE_DESC =
  'Find your perfect running shoe. A quick quiz drives an evidence-cited engine across 100+ road & trail shoes — independent, unbiased matching that cites the research.';
const SKIMLINKS_ID = process.env.EXPO_PUBLIC_SKIMLINKS_ID;
/**
 * Skimlinks client-side auto-wrap: belt and braces for the server-side wrap in
 * `lib/affiliate.ts`. The JS rewrites any merchant link on the page at click
 * time — covers cases where the server wrap might miss (legacy URLs, links
 * in markdown content, etc.). Only injected when the publisher ID is set.
 */
const skimlinksTag = SKIMLINKS_ID
  ? `<script type="text/javascript" src="https://s.skimresources.com/js/${SKIMLINKS_ID}.skimlinks.js" defer></script>`
  : '';

const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const HOME_HTML = join(DIST, 'index.html');

// Indexable detail pages: current shoes PLUS the one-back previous-gen models
// (isLegacy) — they're browsable/matchable and high-search-volume, so they earn
// their own crawlable stub + sitemap entry.
const INDEXED_SHOES = (shoes as Shoe[]).filter(
  (s) => s.status === 'current' || LEGACY_SLUGS.has(s.slug),
);

function metaBlock(opts: {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  jsonLd?: object;
}): string {
  const { title, description, canonical, ogImage, jsonLd } = opts;
  const img = ogImage ?? `${ASSET_URL}/og-default.png`;
  const tags: string[] = [
    // Paint the brand-dark background before React mounts — the SPA shell sets
    // no body colour, so without this the app flashes white on every cold load
    // (matches color.bg / theme-color #0A0B0F).
    `<style>html,body{background:#0A0B0F;color-scheme:dark}</style>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    `<meta name="theme-color" content="#0A0B0F" />`,
  ];
  if (jsonLd) {
    tags.push(
      `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
    );
  }
  if (skimlinksTag) tags.push(skimlinksTag);
  return tags.join('\n    ');
}

const homeHtml = readFileSync(HOME_HTML, 'utf8');
const homeTitle = `${SITE_NAME} — science-backed running shoe matching`;
const homeMeta = metaBlock({
  title: homeTitle,
  description: SITE_DESC,
  canonical: `${SITE_URL}/`,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESC,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
  },
});

// brand voice: the public pitch is "independent / unbiased", never "commission"
if (/commission/i.test(homeMeta)) {
  throw new Error('homepage meta must not mention commission — brand voice is independent/unbiased');
}

const popularShoes = INDEXED_SHOES.filter((s) => s.status === 'current').slice(0, 12);
const categoryLinks = CATEGORY_ORDER.map((k) => ({ key: k, label: CATEGORY_CONTENT[k].label }));
const newHome = injectFallbackBody(
  homeHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(homeTitle)}</title>`)
    .replace(/<\/head>/, `    ${homeMeta}\n  </head>`),
  homeFallbackMain({ description: SITE_DESC, popular: popularShoes, categories: categoryLinks }),
);
writeFileSync(HOME_HTML, newHome);
console.log(`+ homepage meta + crawlable body -> ${HOME_HTML}`);

// ---- social-share card ------------------------------------------------------
// Ship the pre-rendered OG card (committed; regenerate with gen-og-card.ts).
// Plain fs copy so the deploy build never needs a browser. A missing card means
// broken unfurl images everywhere, so fail loudly rather than silently.
const OG_SRC = join(ROOT, 'assets', 'og', 'og-default.png');
if (!existsSync(OG_SRC)) {
  throw new Error(`OG card missing at ${OG_SRC} — run: npx tsx scripts/gen-og-card.ts`);
}
copyFileSync(OG_SRC, join(DIST, 'og-default.png'));
console.log(`+ og-default.png -> ${join(DIST, 'og-default.png')}`);

// ---- per-shoe static stubs --------------------------------------------------
let shoeStubs = 0;
for (const s of INDEXED_SHOES) {
  const dir = join(DIST, 'shoe', s.slug);
  mkdirSync(dir, { recursive: true });
  const catLabel = CAT_LABEL[s.category] ?? 'Running shoe';
  const title = `${s.brand} ${s.model} ${s.version} — match score & honest review · ${SITE_NAME}`;
  const desc = `${catLabel}. ${s.consensus} See if it fits your stride — a quick quiz, an evidence-cited engine, independent matching.`;
  const canonical = `${SITE_URL}/shoe/${s.slug}`;
  const meta = metaBlock({
    title,
    description: desc,
    canonical,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${s.brand} ${s.model} ${s.version}`.trim(),
      brand: { '@type': 'Brand', name: s.brand },
      category: 'Running shoe',
      description: s.consensus,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'GBP',
        price: s.msrpGbp,
        url: canonical,
      },
    },
  });
  // re-use the SPA shell but with shoe-specific head (social bots get the right
  // card) AND crawlable body content + internal links (search bots get real,
  // indexable text instead of an empty root div); the SPA router takes over
  // client-side once a real visitor lands.
  const related = INDEXED_SHOES.filter(
    (r) => r.category === s.category && r.slug !== s.slug,
  ).slice(0, 4);
  const stub = injectFallbackBody(
    homeHtml
      .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
      .replace(/<\/head>/, `    ${meta}\n  </head>`),
    shoeFallbackMain(s, related),
  );
  writeFileSync(join(dir, 'index.html'), stub);
  shoeStubs++;
}
console.log(`+ ${shoeStubs} per-shoe static stubs -> dist/shoe/<slug>/index.html`);

// ---- category landing pages -------------------------------------------------
// /best/<category> — crawlable, engine-ranked "best running shoes" hubs that
// target head search terms and funnel into the quiz. Same shape as the shoe
// stubs: category-specific head + crawlable body; the SPA route
// (app/best/[category].tsx) takes over once a real visitor lands.
let catStubs = 0;
for (const key of CATEGORY_ORDER) {
  const c = CATEGORY_CONTENT[key];
  const ranked: RankedSeoShoe[] = INDEXED_SHOES.filter((s) => s.category === key)
    .map((s) => ({ ...s, overall: SCORED.get(s.slug)?.overall ?? 0 }))
    .sort((a, b) => b.overall - a.overall);
  const canonical = `${SITE_URL}/best/${key}`;
  const meta = metaBlock({
    title: c.seoTitle,
    description: c.seoDescription,
    canonical,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: c.h1,
      description: c.seoDescription,
      itemListElement: ranked.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/shoe/${s.slug}`,
        name: `${s.brand} ${s.model} ${s.version}`.trim(),
      })),
    },
  });
  const siblings = CATEGORY_ORDER.filter((k) => k !== key).map((k) => ({
    key: k as string,
    label: CATEGORY_CONTENT[k].label,
  }));
  const stub = injectFallbackBody(
    homeHtml
      .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(c.seoTitle)}</title>`)
      .replace(/<\/head>/, `    ${meta}\n  </head>`),
    categoryFallbackMain({ h1: c.h1, intro: c.intro, shoes: ranked, siblings }),
  );
  const dir = join(DIST, 'best', key);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), stub);
  catStubs++;
}
console.log(`+ ${catStubs} category landing pages -> dist/best/<category>/index.html`);

// ---- sitemap + robots -------------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
const urls = [
  { loc: `${SITE_URL}/`, prio: '1.0' },
  { loc: `${SITE_URL}/quiz/1`, prio: '0.9' },
  { loc: `${SITE_URL}/browse`, prio: '0.7' },
  { loc: `${SITE_URL}/methodology`, prio: '0.6' },
  { loc: `${SITE_URL}/legal/disclosure`, prio: '0.3' },
  { loc: `${SITE_URL}/legal/privacy`, prio: '0.3' },
  { loc: `${SITE_URL}/legal/terms`, prio: '0.3' },
  ...CATEGORY_ORDER.map((k) => ({ loc: `${SITE_URL}/best/${k}`, prio: '0.8' })),
  ...INDEXED_SHOES.map((s) => ({ loc: `${SITE_URL}/shoe/${s.slug}`, prio: '0.8' })),
];

const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map(
      (u) =>
        `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${u.prio}</priority></url>`,
    )
    .join('\n') +
  '\n</urlset>\n';
writeFileSync(join(DIST, 'sitemap.xml'), sitemap);
console.log(`+ sitemap.xml (${urls.length} urls) -> ${join(DIST, 'sitemap.xml')}`);

const robots = `# Allow all crawlers; the matching engine is public.
User-agent: *
Allow: /
Disallow: /share/

Sitemap: ${SITE_URL}/sitemap.xml
`;
writeFileSync(join(DIST, 'robots.txt'), robots);
console.log(`+ robots.txt -> ${join(DIST, 'robots.txt')}`);
