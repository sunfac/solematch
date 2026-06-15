/**
 * Pure builders for the crawlable HTML that `seo-postbuild.ts` injects into each
 * exported page. Expo's web export ships a JS-only SPA shell (an empty
 * `<div id="root">`), so a crawler that doesn't execute JS — or Google on a
 * tight crawl budget — sees no body content at all. These functions emit real,
 * escaped, internally-linked content that lives in the static HTML for crawlers
 * and is hidden the instant the SPA boots: progressive enhancement, not
 * cloaking — the default (no-JS) state is visible and matches what the app
 * renders. Kept side-effect-free + exported so the markup is unit-tested rather
 * than asserted through a built artifact (mirrors `src/lib/share.ts`).
 */

export interface SeoShoe {
  slug: string;
  brand: string;
  model: string;
  version: string;
  category: string;
  msrpGbp: number;
  consensus: string;
  weightG?: number;
  dropMm?: number;
  stackHeelMm?: number;
  stackFfMm?: number;
  foamName?: string;
  foamClass?: string;
  plate?: string;
  widths?: string[];
  releaseYear?: number;
  athleteNotes?: string;
}

/** Human label for a shoe category. */
export const CAT_LABEL: Record<string, string> = {
  race: 'Race-day shoe',
  tempo: 'Tempo shoe',
  daily: 'Daily trainer',
  max_cushion: 'Max-cushion trainer',
  stability: 'Stability shoe',
  trail: 'Trail shoe',
  budget: 'Budget trainer',
};

export const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const fullName = (s: Pick<SeoShoe, 'brand' | 'model' | 'version'>) =>
  `${s.brand} ${s.model} ${s.version}`.trim();

const linkItem = (s: SeoShoe) =>
  `<li><a href="/shoe/${s.slug}">${escapeHtml(fullName(s))}</a></li>`;

/** Spec `<li>`s — emitted only for fields that are actually present. */
function specItems(s: SeoShoe): string {
  const items: string[] = [`<li>Type: ${escapeHtml(CAT_LABEL[s.category] ?? 'Running shoe')}</li>`];
  if (s.weightG) items.push(`<li>Weight: ${s.weightG} g</li>`);
  if (s.dropMm != null) items.push(`<li>Heel-to-toe drop: ${s.dropMm} mm</li>`);
  if (s.stackHeelMm != null) {
    const ff = s.stackFfMm != null ? ` / ${s.stackFfMm} mm forefoot` : '';
    items.push(`<li>Stack height: ${s.stackHeelMm} mm heel${ff}</li>`);
  }
  const midsole = [s.foamName, s.foamClass && `(${s.foamClass})`].filter(Boolean).join(' ');
  if (midsole) {
    const plate = s.plate && s.plate !== 'none' ? `, ${escapeHtml(s.plate)} plate` : '';
    items.push(`<li>Midsole: ${escapeHtml(midsole)}${plate}</li>`);
  }
  if (s.widths && s.widths.length) items.push(`<li>Widths: ${escapeHtml(s.widths.join(', '))}</li>`);
  items.push(`<li>RRP: £${s.msrpGbp}</li>`);
  if (s.releaseYear) items.push(`<li>Released: ${s.releaseYear}</li>`);
  return items.join('');
}

/** Crawlable body content for a single shoe detail page. */
export function shoeFallbackMain(shoe: SeoShoe, related: SeoShoe[] = []): string {
  const nm = escapeHtml(fullName(shoe));
  const cat = escapeHtml(CAT_LABEL[shoe.category] ?? 'Running shoe');
  const brandModel = escapeHtml(`${shoe.brand} ${shoe.model}`.trim());
  const athlete = shoe.athleteNotes
    ? `<h2>On the run</h2><p>${escapeHtml(shoe.athleteNotes)}</p>`
    : '';
  const relatedHtml = related.length
    ? `<h2>Related running shoes</h2><ul>${related.map(linkItem).join('')}</ul>`
    : '';
  return [
    `<nav aria-label="Breadcrumb"><a href="/">SoleMatch</a> › <a href="/browse">All shoes</a> › ${nm}</nav>`,
    `<h1>${nm} — match score &amp; honest review</h1>`,
    `<p>${cat}. ${escapeHtml(shoe.consensus)}</p>`,
    `<h2>Specifications</h2><ul>${specItems(shoe)}</ul>`,
    athlete,
    `<p><a href="/quiz/1">Take the free 2-minute quiz</a> to see how the ${brandModel} scores for your stride, goals and budget, or <a href="/methodology">read the methodology</a> behind every match.</p>`,
    relatedHtml,
  ]
    .filter(Boolean)
    .join('');
}

/** Crawlable body content for the homepage. */
export function homeFallbackMain(opts: { description: string; popular?: SeoShoe[] }): string {
  const popular = opts.popular ?? [];
  const popularHtml = popular.length
    ? `<h2>Popular running shoes</h2><ul>${popular.map(linkItem).join('')}</ul>`
    : '';
  return [
    `<h1>SoleMatch — science-backed running shoe matching</h1>`,
    `<p>${escapeHtml(opts.description)}</p>`,
    `<p><a href="/quiz/1">Start the free 2-minute quiz</a> · <a href="/browse">Browse all running shoes</a> · <a href="/methodology">How the matching works</a></p>`,
    popularHtml,
  ]
    .filter(Boolean)
    .join('');
}

/**
 * Insert a crawlable `<main>` after the SPA root and hide it the moment JS runs.
 * The inline script executes during parse (before the deferred app bundle), so
 * real users never see it; the `<noscript>` re-enables scrolling for the (rare)
 * no-JS visitor because the shell sets `body{overflow:hidden}`. Uses a replacer
 * function so `$` sequences in the content aren't treated as `String.replace`
 * special patterns.
 */
export function injectFallbackBody(html: string, mainInner: string): string {
  const block =
    `<div id="root"></div>\n` +
    `    <main id="seo-fallback" class="seo-fallback">${mainInner}</main>\n` +
    `    <noscript><style>body{overflow:auto!important}</style></noscript>\n` +
    `    <script>(function(){var f=document.getElementById('seo-fallback');if(f){f.style.display='none';}})();</script>`;
  return html.replace('<div id="root"></div>', () => block);
}
