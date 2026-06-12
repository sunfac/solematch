# Next-session brief: the affiliate-machine improvement loop
*Written 12 June 2026 for a FRESH session at `C:\dev\solematch`. Owner-mandated objective and
constraints below — read this file, the README, and `docs/monetisation-playbook.md` before acting.
Note: owner's plan limits reset 22:30 Europe/London on 2026-06-12 — subagents before that may die.*

## The objective (owner's words, structured)
Run an improvement loop: **add value to the consumer (genuine shoe-selection help) while
maximising commission returns / driving shoe sales**, implementable across existing affiliate
programmes. You may refine the objective. You may split work into isolated Fable 5 subagent jobs
to avoid context overload (one job = one agent = one verifiable outcome). Every iteration must
end with the full gate green: `npx tsc --noEmit` · `npx jest` · `npx playwright test` · `npx expo
export --platform web`, committed.

## Hard constraints (do not trade away)
1. Commission NEVER influences ranking (published promise on /methodology — the trust contract).
2. No injury-prevention claims; evidence badges stay honest (spec §3.2 myths list).
3. Test invariants are authoritative over formula constants (plan decision 8); never weaken one
   silently. Re-run `scripts/calibrate.ts` after catalogue/formula changes.
4. Unlicensed brand imagery stays localhost-gated until affiliate licences exist.
5. Deterministic engine; no ML/LLM in the matching path (Strava compliance, spec §8).

## Owner's queued work items (verbatim intent, with pointers)
1. **Add way more running shoes** — extend `src/data/shoes.json` (zod-validated; tests assert
   per-category minimums). Research agent prompt pattern exists in this session's history; a
   pipe-format spec was used. After adding: `npx tsx scripts/gen-offers.ts`, recalibrate, run gate.
2. **Fit-depth vs variability paradox (owner's sharp framing):** an extensive catalogue is
   pointless if the same few shoes always win — but variability for its own sake recommends worse
   shoes. Resolution direction: deepen LEGITIMATE differentiators (fit dimensions: last shape,
   forefoot width data, heel hold; surface/weather; cadence/strike if collectable) so different
   runners genuinely rank shoes differently; keep the ±0.8 published tie-jitter as the only
   arbitrary variety. Audit with `scripts/probe-sensitivity.ts` (extend its persona grid).
3. **Broken shop links on matches** — brand-site search URL patterns in `scripts/gen-offers.ts`
   were never all verified (On, Puma, Asics suspects). Fix properly via retailer datafeed deep
   links (see playbook) or verify/repair each search pattern with a link-checker script
   (HTTP status + "no results" sniff) run as a scheduled job.
4. **Missing images** — only 12 shoes have imagery (8 harvested + 4 AI-cut). Harvest the rest via
   the firecrawl og:image pipeline (`.firecrawl/scratchpad/harvest-images.sh` pattern), cut via
   `scripts/cut-images.py`, register in `src/data/localShoeImages.ts` / `devImages.json`.
5. **Female catalogue + match quality** — extend women's-specific coverage (womensLast data is
   thin and binary; consider per-shoe women's variants with their own weights/drops where brands
   publish them) so female users see higher-percentage matches.
6. **Sub-mid-80s matches feel weak** — owner judgement: anything under ~85 reads weak unless the
   budget is genuinely tight. Calibrate match ceilings/normalisation so strong honest picks land
   86-96 (do NOT inflate dishonestly — improve the underlying fit logic and candidate depth first).
7. **Price-drop value plays** — previous-gen flagships discounted at new releases are genuine
   value picks (e.g. superseded racers). Needs a LIVE price research job (scheduled: firecrawl
   against retailer pages or datafeeds once approved) feeding a `streetPriceGbp` + `priceDropped`
   flag → VAL recalculation → "was £X, now £Y" UI → also surfaces NEW RELEASES to add (same job
   updates the catalogue: owner explicitly wants this to be the release-watch mechanism).
8. **Affiliate-machine improvements** — work through `docs/monetisation-playbook.md` ⏳ items:
   datafeed ingestion (highest leverage), per-network link builders keyed by retailer, link-health
   checker, placement-level conversion analysis via subIDs.

## Suggested loop shape (refine as you see fit)
Each iteration: (a) pick ONE item above; (b) if research-heavy, dispatch an isolated Fable 5
agent with a tight, self-contained prompt and a pipe/JSON output contract; (c) implement;
(d) gate + commit; (e) re-probe sensitivity/calibration if data or engine changed; (f) log the
iteration's consumer-value and commission-value in one line each. Use `/loop` or repeat manually.
Stop conditions: gate red twice on the same item (surface to owner), or owner redirects.

## State as of handoff (all green, 23 commits)
110 unit tests · 3 E2E · typecheck · export clean. Engine: evidence-cited modifiers incl.
fitter-grade current-shoe anchoring + toe-box expertise; right-sized rotations (80% per-slot
quality bar); pruned exhaustive combo optimiser; published tie-jitter. UI: 9-step auto-advancing
quiz; match-quality card framing (market tiers only in catalogue surfaces); AI-generated
unbranded hero; AI-cut transparent product images; reveal with brand-tease + evidence chip +
primary buy CTA; results carousel + best-offer links + budget-allocation notes. Ops:
`gen-offers.ts`, `cut-images.py`, `gen-hero.py`, `gen-views.py` (multi-angle PoC for future
360/3D), `calibrate.ts`, `probe-sensitivity.ts`. Supabase artifacts deploy-deferred. Celebrity
sightings + catalogue-expansion research NOT done (agents died on plan limits) — re-run those
agent prompts (in session history) first; only SOURCED sightings may ship (endorsement risk).
