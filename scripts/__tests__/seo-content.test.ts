import {
  shoeFallbackMain,
  homeFallbackMain,
  categoryFallbackMain,
  injectFallbackBody,
  type RankedSeoShoe,
  type SeoShoe,
} from '../seo-content';

const ALPHAFLY: SeoShoe = {
  slug: 'nike-alphafly-3',
  brand: 'Nike',
  model: 'Alphafly',
  version: '3',
  category: 'race',
  msrpGbp: 285,
  consensus: 'Proven max-propulsion marathon shoe.',
  weightG: 218,
  dropMm: 8,
  stackHeelMm: 40,
  stackFfMm: 32,
  foamName: 'ZoomX',
  foamClass: 'PEBA',
  plate: 'carbon',
  widths: ['standard'],
  releaseYear: 2024,
  athleteNotes: "Kiptum's official world-record shoe.",
};

const RELATED: SeoShoe[] = [
  { slug: 'adidas-adios-pro-4', brand: 'Adidas', model: 'Adios Pro', version: '4', category: 'race', msrpGbp: 250, consensus: 'x' },
];

describe('shoeFallbackMain', () => {
  const html = shoeFallbackMain(ALPHAFLY, RELATED);

  it('leads with an H1 carrying the full shoe name', () => {
    expect(html).toContain('<h1>Nike Alphafly 3 — match score');
  });

  it('includes the consensus prose and key specs', () => {
    expect(html).toContain('Proven max-propulsion marathon shoe.');
    expect(html).toContain('<li>Weight: 218 g</li>');
    expect(html).toContain('<li>Heel-to-toe drop: 8 mm</li>');
    expect(html).toContain('40 mm heel / 32 mm forefoot');
    expect(html).toContain('ZoomX (PEBA), carbon plate');
    expect(html).toContain('<li>RRP: £285</li>');
  });

  it('surfaces athlete notes when present', () => {
    expect(html).toContain("Kiptum's official world-record shoe.");
  });

  it('links internally to the quiz, methodology and related shoes', () => {
    expect(html).toContain('href="/quiz/1"');
    expect(html).toContain('href="/methodology"');
    expect(html).toContain('href="/shoe/adidas-adios-pro-4"');
  });

  it('omits spec rows for absent fields and never crashes', () => {
    const sparse: SeoShoe = {
      slug: 'x-y-1', brand: 'X', model: 'Y', version: '1', category: 'daily', msrpGbp: 120, consensus: 'ok',
    };
    const out = shoeFallbackMain(sparse);
    expect(out).not.toContain('Weight:');
    expect(out).toContain('<li>RRP: £120</li>');
    expect(out).not.toContain('Related running shoes');
  });

  it('escapes HTML-significant characters in shoe data', () => {
    const tricky = { ...ALPHAFLY, model: 'Pro & <Race>' };
    expect(shoeFallbackMain(tricky)).toContain('Pro &amp; &lt;Race&gt;');
  });

  it('never mentions commission (brand voice is independent/unbiased)', () => {
    expect(html.toLowerCase()).not.toContain('commission');
  });
});

describe('categoryFallbackMain', () => {
  const ranked: RankedSeoShoe[] = [
    { ...ALPHAFLY, overall: 96 },
    { slug: 'adidas-adios-pro-4', brand: 'Adidas', model: 'Adios Pro', version: '4', category: 'race', msrpGbp: 250, consensus: 'x', weightG: 207, overall: 94 },
  ];
  const html = categoryFallbackMain({
    h1: 'Best race-day running shoes',
    intro: 'Carbon-plated super-shoes built for one thing.',
    shoes: ranked,
    siblings: [{ key: 'trail', label: 'trail' }],
  });

  it('renders the H1, intro and an ordered ranked list with ratings', () => {
    expect(html).toContain('<h1>Best race-day running shoes</h1>');
    expect(html).toContain('Carbon-plated super-shoes built for one thing.');
    expect(html).toContain('<ol>');
    expect(html).toContain('<a href="/shoe/nike-alphafly-3">Nike Alphafly 3</a> — 96 rating');
    expect(html).toContain('£250');
  });

  it('links to the quiz, methodology and sibling category pages', () => {
    expect(html).toContain('href="/quiz/1"');
    expect(html).toContain('href="/methodology"');
    expect(html).toContain('href="/best/trail"');
  });
});

describe('homeFallbackMain', () => {
  const html = homeFallbackMain({
    description: 'Find your perfect running shoe.',
    popular: RELATED,
    categories: [
      { key: 'race', label: 'race-day' },
      { key: 'stability', label: 'stability' },
    ],
  });

  it('has the homepage H1 and the primary funnel links', () => {
    expect(html).toContain('<h1>SoleMatch');
    expect(html).toContain('href="/quiz/1"');
    expect(html).toContain('href="/browse"');
    expect(html).toContain('href="/methodology"');
  });

  it('lists popular shoes and category landing pages as internal links', () => {
    expect(html).toContain('href="/shoe/adidas-adios-pro-4"');
    expect(html).toContain('href="/best/race"');
    expect(html).toContain('href="/best/stability"');
    expect(html).toContain('Best race-day running shoes');
  });
});

describe('injectFallbackBody', () => {
  const shell = '<body>\n    <div id="root"></div>\n  <script src="/entry.js" defer></script>\n</body>';

  it('inserts the fallback main hidden-by-default with a no-JS override, keeping the root', () => {
    const out = injectFallbackBody(shell, '<h1>Hi</h1>');
    expect(out).toContain('<div id="root"></div>');
    expect(out).toContain('<main id="seo-fallback"');
    expect(out).toContain('<h1>Hi</h1>');
    // hidden by default for JS visitors (no flash), restored for no-JS crawlers
    expect(out).toContain('#seo-fallback{display:none}');
    expect(out).toContain('<noscript>');
    expect(out).toContain('display:block!important');
    // the hide rule must precede the element so it never paints
    expect(out.indexOf('display:none')).toBeLessThan(out.indexOf('<main id="seo-fallback"'));
    // root must still precede the entry bundle
    expect(out.indexOf('id="root"')).toBeLessThan(out.indexOf('entry.js'));
  });

  it('treats $ sequences in content literally (no String.replace pattern bugs)', () => {
    const out = injectFallbackBody(shell, 'price $5 $& $1 done');
    expect(out).toContain('price $5 $& $1 done');
  });
});
