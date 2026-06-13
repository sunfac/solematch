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
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import shoes from '../src/data/shoes.json';

interface Shoe {
  slug: string;
  brand: string;
  model: string;
  version: string;
  category: string;
  msrpGbp: number;
  consensus: string;
  status: 'current' | 'superseded' | 'upcoming';
}

const SITE_URL = process.env.SOLEMATCH_SITE_URL ?? 'https://solematch.app';
const SITE_NAME = 'SoleMatch';
const SITE_DESC =
  'Science-backed running-shoe matching. An 11-step quiz feeds a deterministic, evidence-cited engine over 100+ road shoes — every recommendation cites peer-reviewed research, commission never reorders the ranking.';

const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const HOME_HTML = join(DIST, 'index.html');

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CURRENT_SHOES = (shoes as Shoe[]).filter((s) => s.status === 'current');

function metaBlock(opts: {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  jsonLd?: object;
}): string {
  const { title, description, canonical, ogImage, jsonLd } = opts;
  const img = ogImage ?? `${SITE_URL}/og-default.png`;
  const tags: string[] = [
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

const newHome = homeHtml
  .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(homeTitle)}</title>`)
  .replace(/<\/head>/, `    ${homeMeta}\n  </head>`);
writeFileSync(HOME_HTML, newHome);
console.log(`+ homepage meta -> ${HOME_HTML}`);

// ---- per-shoe static stubs --------------------------------------------------
let shoeStubs = 0;
for (const s of CURRENT_SHOES) {
  const dir = join(DIST, 'shoe', s.slug);
  mkdirSync(dir, { recursive: true });
  const title = `${s.brand} ${s.model} ${s.version} — match score & honest review · ${SITE_NAME}`;
  const desc = `${s.consensus} See if it matches your stride: 11-question quiz, evidence-cited engine, no commission bias.`;
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
  // re-use the SPA shell but with shoe-specific head: social bots see the
  // right card, then the SPA router picks up /shoe/<slug> client-side
  const stub = homeHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<\/head>/, `    ${meta}\n  </head>`);
  writeFileSync(join(dir, 'index.html'), stub);
  shoeStubs++;
}
console.log(`+ ${shoeStubs} per-shoe static stubs -> dist/shoe/<slug>/index.html`);

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
  ...CURRENT_SHOES.map((s) => ({ loc: `${SITE_URL}/shoe/${s.slug}`, prio: '0.8' })),
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
