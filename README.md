# SoleMatch

Science-backed running shoe matching with FIFA-style card reveals. An Expo (React Native Web) app: an 11-step quiz feeds a deterministic, evidence-cited matching engine over a curated catalogue of ~60 current road shoes, recommending a single shoe or a budget-aware rotation (race / tempo / daily / recovery), revealed as neon holographic cards. Every recommendation reason carries a peer-reviewed citation and a confidence badge. Monetised by affiliate links (UK-first).

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

| Var | Purpose | Without it |
|---|---|---|
| `EXPO_PUBLIC_SKIMLINKS_ID` | Wraps outbound retailer links for commission | Plain links, no tracking |
| `EXPO_PUBLIC_POSTHOG_KEY` | Analytics events | `console.debug` fallback |
| `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Phase-2 remote data mode | Bundled static catalogue |
| `EXPO_PUBLIC_PREVIEW_IMAGES` | `1` enables brand-site product images from `devImages.json` — **local preview only, never set on deployed builds** until affiliate image licences exist | Tier-coloured shoe silhouettes |

## Data freshness

The market cycles ~12 months, so the catalogue is built to refresh: `src/data/shoes.json` is the
single source (validated by tests), `scripts/gen-offers.ts` regenerates offers, and
`scripts/calibrate.ts` re-ranks tiers after any change — test invariants are authoritative over
formula constants (plan decision 8). Refresh cadence: quarterly review + release-watch
(Phase 2 automates this via the Supabase cron per spec §5.4); the landing page shows the
catalogue stamp.

## Owner checklist (launch + Phase 2)

1. **Affiliate sign-ups:** Skimlinks (instant — set `EXPO_PUBLIC_SKIMLINKS_ID`), then Awin (Nike, SportsShoes), Webgains (Runners Need 8%), Adidas via Impact. Datafeed ingestion (live prices + licensed imagery) is Phase 2 — see spec §9.
2. **Hosting:** deploy `dist/` (Vercel / EAS Hosting / any static host) + custom domain. Then build the **OG share-card endpoint** (deferred per plan decision 5).
3. **Email capture:** Phase 2 (plan decision 6). **Sentry:** Phase 2 (decision 7).
4. **Supabase:** when ready, follow [supabase/README.md](supabase/README.md) (create project → push migration → seed → deploy `match` function → set env vars).
5. **Strava (Phase 2):** developer app + paid sub (~$12/mo) + compliance memo per spec §8.
6. **Imagery:** offers currently link brand sites with images only where press-kit licensed; Skimlinks Product Search API images unlock once the publisher ID exists.

## Status (12 June 2026)

MVP complete and gate-verified: `tsc` clean · 92 unit tests green · 3 Playwright E2E green against the static export · `expo export` clean. Lighthouse not yet run — score it against `npm run e2e:serve` before launch (spec P1 target ≥85 mobile).

## Architecture notes

- `src/engine`, `src/data`, `src/scores` are **pure TypeScript** (no React imports) — the deterministic matching engine, fully unit-tested, importable by app and (Phase 2) Supabase Edge Function alike. No ML, no LLM in the matching path (Strava-compliance + honest-science policy, spec §4/§8).
- Tiers are distribution-based (top 10% ELITE / 25% GOLD / 40% SILVER / rest BRONZE) — plan decision 9.
- Reveal FX are web-first: reanimated orchestration + CSS holographic foil (`HoloFoil.web.tsx`); native Skia port is Phase 3.
