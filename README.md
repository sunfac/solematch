# SoleMatch

**Live: [solematch-production.up.railway.app](https://solematch-production.up.railway.app)**

Science-backed running shoe matching with FIFA-style card reveals. An Expo (React Native Web) app: an 11-step quiz feeds a deterministic, evidence-cited matching engine over a curated catalogue of 100+ current road shoes, recommending a single shoe or a budget-aware rotation (race / tempo / daily / recovery), revealed as neon holographic cards. Every recommendation reason carries a peer-reviewed citation and a confidence badge. Monetised by affiliate links (UK-first).

- **Spec:** [docs/superpowers/specs/2026-06-11-shoe-matcher-design.md](docs/superpowers/specs/2026-06-11-shoe-matcher-design.md)
- **Plan:** [docs/superpowers/plans/2026-06-12-solematch-mvp.md](docs/superpowers/plans/2026-06-12-solematch-mvp.md)
- **Research dossiers:** [docs/research/](docs/research/) (sports science, shoe catalogue, design/3D tech, Strava/affiliate)

## Commands

| Command | What |
|---|---|
| `npm run web` | Dev server (web) |
| `npm test` | Jest unit suite (engine, data, formulas) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run export:web` | Static web build → `dist/` |
| `npm run e2e` | Playwright happy path vs the static export |

## Environment (all optional — app fully works without them)

Affiliate dispatch is per-retailer with cascade fallback: direct programmes
beat Skimlinks beats raw passthrough. Set the env vars below as each
network approves you — the wire activates without code changes.

| Var | Activates | Rate | Time to live |
|---|---|---|---|
| `EXPO_PUBLIC_AMAZON_TAG` | Amazon Associates (Amazon UK SKUs) | 4%, 24h cookie | Instant signup |
| `EXPO_PUBLIC_AWIN_ID` + `EXPO_PUBLIC_AWIN_MID_<RETAILER>` | Awin direct (Nike, SportsShoes, Mizuno, Saucony — set the MID per advertiser as approved) | 7-10% | ~1 week |
| `EXPO_PUBLIC_WEBGAINS_ID` + `EXPO_PUBLIC_WEBGAINS_MID_RUNNERS_NEED` | Webgains direct (Runners Need 8%) | 8% | ~1 week |
| `EXPO_PUBLIC_IMPACT_ID` | Impact direct (Adidas) | ~7-10% | Days |
| `EXPO_PUBLIC_SKIMLINKS_ID` | Skimlinks passthrough fallback for ~48k merchants | 75% of merchant's rate | Instant signup |
| `EXPO_PUBLIC_POSTHOG_KEY` | Analytics events | — | — |
| `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Phase-2 remote data mode | — | — |
| (no flag — hostname-gated) | Official brand product images render on **localhost only**; deployed domains show tier-coloured silhouettes until licensed feed imagery | — | — |

## Data freshness — what's automated, what isn't

`src/data/shoes.json` is the single source of truth (zod-validated by the
test suite), `scripts/gen-offers.ts` regenerates offers, `scripts/calibrate.ts`
re-ranks tiers. Test invariants are authoritative over formula constants
(plan decision 8).

The infrastructure below exists and is wired; the trigger frequency is
honest about what's actually live:

| Script | What it does | Triggered by |
|---|---|---|
| [`scripts/check-prices.ts`](scripts/check-prices.ts) | Live retailer price scrape → `streetPriceGbp` + `priceDropped` | **GitHub Actions weekly** ([`.github/workflows/freshness.yml`](.github/workflows/freshness.yml)) — opens a PR if anything changed. Manual: `npx tsx scripts/check-prices.ts`. |
| [`scripts/check-links.ts`](scripts/check-links.ts) | HTTP + "no results" health check across every offer URL | Same weekly job (diagnostic artifact attached to the workflow run). |
| [`scripts/harvest-images.ts`](scripts/harvest-images.ts) | Discover & register brand-site og:images | Manual on catalogue expansion. |
| [`scripts/ingest-research.ts`](scripts/ingest-research.ts) | Validated pipe-row ingester (ADD / AUDIT / SIGHT) | Manual when a research pass produces rows. |

Catalogue churn (new releases, retired models) is still manual research —
the same dispatch pattern the catalogue-expansion brief documents. The
weekly cron PRs prices + link health; it does NOT auto-merge — owner
reviews before the snapshot goes live.

Required GitHub Actions secrets: `FIRECRAWL_API_KEY` (free tier covers the
weekly run).

## Launch in 30 minutes (the path to first commission)

The two hard blockers between this repo and £1 of revenue are an affiliate
ID and a public URL. Both are free and fast.

1. **Skimlinks publisher ID** (10 min, instant approval):
   sign up at [skimlinks.com](https://skimlinks.com), grab your publisher ID,
   set `EXPO_PUBLIC_SKIMLINKS_ID` as a Vercel project env var. Without this,
   `buildAffiliateUrl()` passes raw URLs through and earns zero commission on
   every click — covered by [`src/lib/__tests__/affiliate.test.ts`](src/lib/__tests__/affiliate.test.ts).

2. **Deploy to Vercel** (15 min, free tier):
   ```sh
   npm i -g vercel    # one-off
   vercel             # link to a new project, accept defaults
   vercel --prod      # ship dist/ to a *.vercel.app URL
   ```
   [`vercel.json`](vercel.json) wires up the build, SPA rewrites, and immutable
   asset caching. Custom domain via the Vercel dashboard (5 min more).

3. **First traffic** — Reddit r/RunningShoeGeeks "I built a science-backed
   match engine, looking for feedback" + ProductHunt + an r/Marathon_Training
   "what did you think?" thread historically drive 200-1000 first-week
   sessions. With 2-5% click-out CTR and ~6% blended commission (spec §9.3),
   that's £20-150 first-week revenue at zero cost.

## Owner checklist (post-launch + Phase 2)

1. **More affiliate networks** — each one approved roughly doubles the rate
   on its brand vs the 75% Skimlinks passthrough. Order them by ROI:
   - **Amazon Associates** — instant signup, 4% but slowest cookie. Set
     `EXPO_PUBLIC_AMAZON_TAG`. The wire is live the moment Railway redeploys.
   - **Awin** — ~1 week. Apply, get publisher ID, then apply per advertiser
     (Nike UK first — ~7%). Set `EXPO_PUBLIC_AWIN_ID` and then
     `EXPO_PUBLIC_AWIN_MID_NIKE` (and one per other approved advertiser)
     as each merchant ID lands. The dispatcher gates per-merchant so you can
     activate them one at a time.
   - **Webgains** — ~1 week. Runners Need direct at 8% is the biggest single
     UK rate. Set `EXPO_PUBLIC_WEBGAINS_ID` + `EXPO_PUBLIC_WEBGAINS_MID_RUNNERS_NEED`.
   - **Impact** — days. Adidas direct ~10%. Set `EXPO_PUBLIC_IMPACT_ID`.
   - **Rakuten** — Hoka direct (3-14% — verify UK availability on application).
2. **Datafeed ingestion** replaces [`scripts/check-prices.ts`](scripts/check-prices.ts)
   with per-SKU prices + licensed images (spec §5.4) — kills false-positive
   scrapes and unlocks brand imagery legally.
3. **Email capture** (plan decision 6). **Sentry** (decision 7). **Strava
   integration** (~$12/mo dev sub + compliance memo, spec §8) — the moat:
   "your Pegasus has 680 km, here's its successor at £X" is the highest-
   intent trigger in running retail.
4. **Supabase** for Phase-2 remote data mode — see
   [supabase/README.md](supabase/README.md).

## Status (13 June 2026)

Launch-ready: 101-shoe catalogue (98 current), 17 brands, deterministic engine
with forefoot-shape fit dimension and 86-96 match-quality calibration. 30
official product images (localhost-gated). Every retailer link health-
verified ([`scripts/check-links.ts`](scripts/check-links.ts)). Live price-drop
pipeline ([`scripts/check-prices.ts`](scripts/check-prices.ts), scheduled cron).
SEO baseline: 105-URL sitemap + 98 per-shoe static OG stubs ([`scripts/seo-postbuild.ts`](scripts/seo-postbuild.ts)).
`vercel.json` ready. Gate: `tsc` clean · 115 unit tests green · 3 Playwright E2E
green · `expo export` clean. Lighthouse score against `npm run e2e:serve`
before launch (spec P1 target ≥85 mobile).

## Architecture notes

- `src/engine`, `src/data`, `src/scores` are **pure TypeScript** (no React imports) — the deterministic matching engine, fully unit-tested, importable by app and (Phase 2) Supabase Edge Function alike. No ML, no LLM in the matching path (Strava-compliance + honest-science policy, spec §4/§8).
- Tiers are distribution-based (top 10% ELITE / 25% GOLD / 40% SILVER / rest BRONZE) — plan decision 9.
- Reveal FX are web-first: reanimated orchestration + CSS holographic foil (`HoloFoil.web.tsx`); native Skia port is Phase 3.
