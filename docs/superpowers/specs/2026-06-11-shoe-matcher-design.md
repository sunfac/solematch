# SoleMatch — Science-Backed Running Shoe Matching App
## Design Document v1.0 — 11 June 2026

> Working title **SoleMatch** (alternatives: StrideLab, The Rotation, ShoeCard — final name TBC with owner).
> One-liner: *"FIFA Ultimate Team card reveals for your perfect running shoe rotation — backed by actual sports science."*

---

## 1. Vision & Product Summary

A React Native Web app (Expo) that matches runners to **real, currently-on-sale running shoes** based on their metrics (weight, age, sex), training profile, intent (race day / tempo / daily / recovery zone-2) and budget. Results are revealed as **neon, FIFA-style holographic shoe cards** — a 3D-feeling rotating shoe with a six-stat attribute panel beside it — designed to be screenshotted and shared.

Differentiators (validated against competitors — RunRepeat, Fleet Feet fit id, Brooks Shoe Finder, Neatsy):

1. **Honest science.** Every recommendation reason carries a citation and a confidence badge (`STRONG` / `MODERATE` / `EMERGING` / `FIT & FEEL` — defined §3.3). Competitors key off foot shape or one-off quizzes; none grounds recommendations in the current evidence base — and much of what shoe shops tell people (pronation matching, "heavy runners need max cushion") is contradicted by RCTs.
2. **Rotation building, not just single shoes.** The single most evidence-backed injury-relevant lever in footwear research is rotating multiple differing pairs (Malisoux 2015: hazard ratio 0.614 ≈ 39% lower injury rate). We build budget-aware rotations by training role.
3. **Strava-powered precision (Phase 2).** Strava is the only mainstream API exposing per-shoe mileage (gear endpoint). We can see actual weekly volume, real paces, and how many km are on the user's current shoes — no competitor does this.
4. **The reveal.** Shoe discovery as a pack-opening moment: stadium dark, spotlights, category banner, card slam, stat count-up, holographic foil tilt. Commerce UI borrows Nike.com's restraint; the reveal borrows EA FC's dopamine engine.

Monetisation: affiliate commission on retailer click-throughs (UK-first: Runners Need 8% via Webgains, SportsShoes/Nike via Awin; Skimlinks as day-one coverage; US later: AvantLink/Running Warehouse when reopened, Zappos, brand programs). Affiliate datafeeds double as the **legal source of product imagery**.

**Positioning rule (legal + scientific):** the app optimises **performance, comfort and fit** and helps manage load via rotation. It does **not** claim to prevent or treat injury, and it is not a medical device. Injury-history inputs only make defaults more conservative and trigger "consider a physio" nudges.

---

## 2. Users & Core Flows

### Personas
- **PB-chaser** (25–45, races 10k–marathon, owns 2+ pairs): wants race-day shoe + rotation tuning. High affiliate intent, knows supershoes.
- **Committed improver** (30–55, 20–50 km/wk): heard of carbon plates, overwhelmed by choice; wants one trustworthy answer and a budget rotation.
- **Returner / new runner** (any age): needs a single comfortable daily shoe; myth-vulnerable ("I was told I overpronate"); budget-sensitive.

### Core flow (MVP, no account required)
1. **Landing** — hero card animation loop, "Find my shoe" CTA, science credibility strip ("Built on 25+ peer-reviewed studies").
2. **Quiz** — 11 steps, one question per screen, metric/imperial toggle, ~90 seconds (full spec §6.3).
3. **Matching suspense** — 1.5–2.5 s "scanning" screen while the engine runs (doubles as API latency cover).
4. **Reveal** — FIFA-style walkout per shoe (skippable; reduced-motion safe). Single match = 1 card; rotation = sequential pack opening, then a fanned summary.
5. **Result detail** — rotating shoe display, six-stat panel, Match %, "Why this shoe" (top 3 reasons with evidence badges), price comparison across retailers (affiliate links + disclosure), alternates carousel.
6. **Save / share** — share card image (OG-generated); optional email capture to save results (full accounts in Phase 2).

### Phase-2 flow additions
- Sign-in (Supabase auth: email magic link + Apple/Google).
- **Strava connect** — pulls weight, 4-week volume, paces, race efforts and per-shoe mileage; quiz collapses to ~4 questions; "Your Pegasus has 680 km on it — time to plan a replacement" nudges.
- Saved rotations, price-drop alerts, re-match when new models release.

---

## 3. Science Foundation

Full research dossier with URLs lives in §13 / appendix. The engine encodes only what follows.

### 3.1 Key findings the engine uses

| # | Finding | Source | Effect size | Confidence |
|---|---|---|---|---|
| 1 | Shoe mass costs energy: ~1% metabolic cost per 100 g per shoe; 3000 m time +0.78%/100 g | Hoogkamer & Kram 2016, MSSE | ~1%/100 g | **Strong** |
| 2 | Carbon-plate + PEBA "supershoes" improve running economy ~2.5–3% on average (originally 4% vs flats) | Hoogkamer 2018; Kobayashi 2026 meta-analysis (14 trials, n=271): RE −2.88% | −2.6 to −4% | **Strong** |
| 3 | Supershoe response is individual: +9.7% to −1.1% (some non/negative responders) | 2023 meta-analytic data | huge spread | **Strong (that variability exists)** |
| 4 | Supershoe benefit shrinks at slower speeds: −1.4% at 12 km/h, −0.9% (NS) at 10 km/h vs 2.7–4.2% at 14–18 km/h | Dominy & Joubert 2022 | see left | **Moderate** |
| 5 | Rotating >1 pair in parallel → 39% lower injury hazard (HR 0.614, CI 0.389–0.969) | Malisoux 2015, n=264 prospective | −39% | **Moderate** |
| 6 | Heel drop: no overall injury difference (0/6/10 mm); low drop protective for novices but ↑risk in regular runners | Malisoux 2016 RCT, n=553 | interaction | **Moderate** |
| 7 | Softer midsoles modestly ↓injury vs hard — but benefit concentrated in **lighter** runners; body mass alone ≠ injury risk | Malisoux 2020 RCT, n=848; hard-shoe SHR 1.52 overall, 1.80 light runners, 1.23 (NS) heavy | see left | **Moderate** |
| 8 | Max-cushion shoes ↑impact peak (+10.7%) & loading rate (+12.3%) at speed; 6-week habituation doesn't normalise it | Kulmala 2018; Hannigan & Pollard 2019 | see left | **Moderate** |
| 9 | Pronation does NOT predict injury; matching shoe to foot type doesn't reduce injury (12 RCTs, n=11,240) | Nielsen 2014; 2022 systematic review | null | **Strong (against)** |
| 10 | Comfort filter (Nigg 2015) unproven for injury; comfort still matters for adherence/economy | Nigg 2015; Malisoux cohort secondary analysis 2025 | weak/null | **Weak** |
| 11 | PEBA foams: ~80–87% energy return vs EVA/TPU ~40–52%; PEBA lighter but less durable; TPU most durable | Lab/industry data | see left | **Strong (lab)** |
| 12 | Carbon-plate shoes linked to navicular bone-stress injuries in case series; recommend gradual transition + volume caps | Tenforde et al. 2023, Sports Medicine (n=5) | case series | **Weak (precautionary)** |
| 13 | Masters runners lose plantarflexor power; rockers/stiff shoes may offload calf-ankle | Aging biomechanics literature | mechanism | **Weak / Expert opinion** |
| 14 | Women: different last needs (narrower heel, wider relative forefoot); 1.8–2.3× bone-stress injury rate driven mainly by energy availability (RED-S), not footwear; supershoe sex-response understudied | Anatomical + epi literature | — | Last: **Moderate**; rest: noted, not score-driving |

### 3.2 Myths we explicitly do NOT encode (anti-requirements)

1. No pronation/arch-type gating for injury prevention (refuted). Stability shoes appear only as a *user preference* and for pronation-specific pathology nudges — never auto-prescribed "because flat feet".
2. No "heavier runners must have max cushion" rule (refuted — Malisoux 2020). Body mass drives **durability** recommendations (durable foams, robust outsoles), framed as longevity/feel.
3. No fixed "4% faster" promises — benefit is individual and pace-dependent; copy says "studied average ~3% economy improvement at faster paces; responses vary".
4. No "more cushion = less impact" copy (it's backwards at speed).
5. No "low drop is safer" or "high drop is safer" universal claims — experience-dependent guidance only.
6. No supershoes-as-daily-trainers recommendations; rotation caps plate-shoe volume.
7. No injury-prevention guarantees anywhere in UI copy. Footer disclaimer + physio nudges on injury flags.

### 3.3 Claims & confidence UI
Every "Why this shoe" reason chip shows a badge: `STRONG` (green) / `MODERATE` (amber) / `EMERGING` (grey) / `FIT & FEEL` (blue, for comfort/preference logic). Tapping opens the citation in a science drawer. A public **/methodology** page lists every rule + citation (this is also the SEO/credibility moat).

---

## 4. Matching Engine

Deterministic, rule-based, server-side TypeScript (Supabase Edge Function). **No ML, no LLM in the matching path** — this is both honest-science policy and a hard Strava-compliance requirement (their API agreement bans model training on Strava data and AI-inference policy is unresolved; a deterministic engine with a data firewall is the safe architecture). Same engine runs in unit tests with table-driven fixtures.

### 4.1 Inputs (normalised to SI on entry)

| Group | Fields | Required |
|---|---|---|
| Body | sex (M/F/prefer not to say), age, weight (height not collected in v1; schema reserves the column) | yes (per brief) |
| Training | weekly volume, typical easy pace OR recent race (distance + time), experience (new <6 mo / regular / high-mileage 50 km+ wk) | volume + one pace signal |
| Intent | mode: single shoe vs rotation; roles wanted: race / tempo / daily / recovery; race distance target | yes |
| Preferences | budget (per shoe or total), brand likes/blocks, fit (wide/narrow/roomy toe box), stability *preference*, current shoe + verdict (optional). Surface is fixed to **road in v1** (no quiz question; trail category + question arrive Phase 2+) | budget yes; rest optional |
| Flags | injury history checkboxes (calf/Achilles, shin/bone-stress, knee, plantar fascia) — optional, privacy-framed | no |
| Context | units (metric/imperial), region (UK/US/EU → currency + retailers) | auto-detected, editable |

### 4.2 Pipeline

```
profile → [1 normalise] → [2 hard filters] → [3 role plan] → [4 per-role scoring]
        → [5 rotation optimiser] → [6 explanations] → results JSON
```

1. **Normalise** units; derive pace class from race result (Riegel adjustment) or easy pace (easy ≈ race pace + 60–90 s/km).
2. **Hard filters:** region availability; budget ceiling (+ a "10% stretch" pool scored separately); width if wide/narrow required; brand blocks; surface.
3. **Role plan.** *Rotation mode:* <25 km/wk → 1–2 shoes; 25–50 → 2–3 (daily + tempo/race); >50 → 3–4 (daily, recovery, tempo, race). Rationale shown with Malisoux 2015 badge. Budget allocated by role priority given the user's goal (racer: race shoe protected; improver: daily shoe protected). *Single-shoe mode:* the scoring role is the user's selected primary intent from quiz step 7; if they pick "one shoe for everything", score against a blended daily-role profile with versatility weighting (favours super-trainer/daily categories that also handle tempo), and surface a "racers also add later" hint.
4. **Per-role scoring** (0–100 per shoe): `score = w_cat·categoryFit + Σ modifiers`:
   - **Race role:** plate+PEBA weighting **scaled by pace** — full weight at marathon pace ≤4:35/km, then a **continuous linear taper from 4:35/km down to −70% at 6:15/km, flooring at −70% for anything slower** (no undefined bands); below ~5:30/km the taper also progressively promotes lightweight/bouncy non-plated racers + super-trainers as race options (Dominy & Joubert). Distance matters: 5k/10k promotes low-mass low-stack racers; marathon promotes max-legal-stack.
   - **Tempo:** plated trainers/super-trainers; durability matters (PEBA-with-protection or TPEE).
   - **Daily:** durable foams (TPU/EVA/blends), consensus comfort, moderate weight; plate not rewarded (mass penalty without easy-pace benefit, Hoogkamer 2016 + Dominy & Joubert).
   - **Recovery:** softness/cushion + comfort consensus; plates lightly penalised (Tenforde precaution; zero benefit at easy pace).
   - **Body mass:** >85 kg boosts durable-foam, wide-platform, robust-outsole shoes (framed durability/stability-of-feel); does NOT force max stack. ≤60 kg slightly boosts softer midsoles (Malisoux 2020).
   - **Experience × drop:** novices — low drop not penalised; experienced runners currently in 8–12 mm — low-drop shoes get a transition warning and slight penalty unless user opted in (Malisoux 2016/2017).
   - **Age:** 50+ slightly boosts rockered, cushioned trainers (badge: EMERGING).
   - **Sex:** where a model has a women's-specific last, surface it in fit notes for female users; no score change for supershoe response (understudied — honesty over fake precision).
   - **Injury flags (per-flag, explicit):** *bone-stress/midfoot* → plate shoes capped to race-day only + conservative copy (badge: EMERGING, precautionary — the only flag that changes scores materially). *Calf/Achilles* → low-drop picks (<6 mm) suppressed unless the user is habitually low-drop; ≥8 mm drop and rockered options get a small boost (badge: EMERGING, mechanistic). *Knee* → **no shoe-attribute change** (evidence null) — nudge only. *Plantar fascia* → nudge only. Every flag adds conservative-transition copy + a "consider a physio" nudge; none triggers diagnosis language.
   - **Stability preference:** if user wants supported feel → stability category eligible & boosted; never auto-prescribed.
   - **Consensus:** community/editorial consensus contributes a visible, separate `COMMUNITY` sub-signal (max +5), never silently dominant.
5. **Rotation optimiser:** greedy pick per role by score, then pairwise swap pass to (a) fit total budget, (b) enforce **diversity constraints** — at least two distinct foam platforms and meaningful geometry variation (Δdrop ≥ 2 mm or differing plate status) across the rotation, per the load-variation rationale of Malisoux 2015; (c) deduplicate near-identical shoes. If budget can't cover the role plan → recommend the best **do-it-all super-trainer** (e.g. Evo SL class) + a phased "add next" roadmap.
6. **Explanations:** top 3 scored contributions per pick rendered as reason chips with evidence badges; alternates = next 2 per role.

### 4.3 Outputs
```jsonc
{
  "mode": "rotation",
  "roles": [{
    "role": "race",
    "pick": { "shoeId": "...", "match": 94, "reasons": [{ "text": "...", "evidence": "STRONG", "ruleId": "plate-pace-scaling" }], "offers": [...] },
    "alternates": [ ... ]
  }],
  "totals": { "cost": 412, "budget": 450, "currency": "GBP" },
  "engineVersion": "1.0.0", "rulesetVersion": "2026-06"
}
```
Engine + ruleset versions stored with every match (reproducibility; lets us A/B rule changes later).

### 4.4 Testing
Table-driven unit tests: ~30 named personas (e.g. "82 kg, 46, M, 5:45/km, 30 km/wk, £300 rotation, Achilles history") with asserted invariants (no plate in recovery slot; budget respected; diversity constraint met; novice not pushed to 0 mm; etc.). Property tests: determinism (same input → same output), budget never exceeded, every reason cites an existing rule. Engine is pure → 100% unit-testable without mocks.

---

## 5. Shoe Database & Data Ops

### 5.1 Seed catalogue (researched June 2026 — full table in appendix data file)
~60 current road shoes across 6 categories, all specs verified against brand/retailer sources:

- **Race (carbon):** Nike Alphafly 4 / Vaporfly 4 / Streakfly 2, Adidas Adios Pro 4 / Evo 3 (£450 halo), Asics Metaspeed Sky/Edge Tokyo + Ray, Saucony Endorphin Elite 2 / Pro 5, Hoka Cielo X1 3.0 / Rocket X 3, NB SC Elite v5, Puma Fast-R 3 / Deviate Elite 4, On Cloudboom Strike, Brooks Hyperion Elite 5, Mizuno Hyperwarp Pure, UA Velociti Elite 3…
- **Tempo/super-trainer:** Saucony Endorphin Speed 5, Adidas Boston 13, Asics Magic Speed 5 / Superblast 3 / Megablast, Hoka Mach X 3, Mizuno Neo Vista 2, NB Rebel v5, Nike Zoom Fly 6, Puma Deviate Nitro 3…
- **Daily:** Adidas Evo SL (the 2025-26 consensus shoe), Asics Novablast 5, Nike Pegasus 42, Brooks Ghost 17, Saucony Ride 19, Puma Velocity Nitro 4, Mizuno Wave Rider 29, On Cloudsurfer 2, Hoka Clifton 10, NB 880v15, Altra Experience Flow 3, Topo Phantom 4…
- **Max cushion/recovery:** Nike Vomero 18 / Plus / Premium, Asics Gel-Nimbus 28, NB 1080v15, Hoka Bondi 9 / Skyward X 2, Saucony Triumph 23, Brooks Glycerin Max 2, On Cloudsurfer Max, Salomon Aero Glide 3…
- **Stability:** Asics Kayano 32, Brooks Adrenaline GTS 25, Nike Structure 26, Saucony Guide 19 / Hurricane 25, Hoka Arahi 8, NB Vongo v6, Puma ForeverRun 2, Mizuno Wave Inspire 22…
- **Budget (≤£100):** Nike Revolution 8 / Winflo 12, Adidas Duramo Speed 2, Saucony Axon 4, NB Kaiha Road…

Per shoe: brand, model, version, MSRP USD+GBP, weight (men's US9, source size flagged), drop, stack (heel/forefoot), foam name + class (PEBA/TPEE/TPU/EVA/blend), plate (carbon/composite/none), category, width options, women's-specific last flag, our own one-line consensus (original wording synthesised from ≥3 sources), athlete/race associations (factual), source URLs, status (current/superseded/upcoming) + successor link.

**"Extensive" strategy:** quality-first 60 at launch → 100–150 within 3 months via the same pipeline. Matching integrity beats raw count; every shoe must have verified specs or it poisons the scores.

### 5.2 FIFA-style attribute scores (our own IP, formula-derived)
Six 0–99 stats computed from specs + curated inputs (formula versioned, published on /methodology):

| Stat | Driver |
|---|---|
| **SPD** Speed | plate type, foam class energy-return band, weight, stack geometry |
| **CSH** Cushion | stack height, foam softness class |
| **STB** Stability | guidance features, platform width, sidewalls (curated 1–5 input × formula) |
| **LGT** Lightness | grams, inverse-normalised within category context |
| **DUR** Durability | foam class (TPU>EVA>TPEE>PEBA), outsole coverage (curated), reviewer-reported wear |
| **VAL** Value | street price vs category median, adjusted by DUR |

Overall = role-weighted max → **card tier**: 89+ `ELITE` (neon holo), 83–88 `GOLD`, 75–82 `SILVER`, <75 `BRONZE`. Match % is user-specific and separate from the static stats. We never display RunRepeat scores or lab data (their IP); our scores derive from manufacturer facts + our own curation, with sources linked.

### 5.3 Data licensing rules (from research)
- Specs/prices/race results = facts, not copyrightable (Feist) — safe to store from brand/retailer sources.
- RunRepeat lab data & scores, reviewer text = their IP (+ UK/EU database right) — never bulk-copy; link out; short attributed quotes only; our consensus lines are original synthesis.
- Product images: **only via affiliate datafeed licence** (image displayed alongside live tracked link to the supplying retailer; purge on programme exit) or brand press kits/own photography. No scraping Nike CDN for production assets.
- Athlete associations stated factually ("worn by the winner of London 2026"); never imply the athlete/brand endorses *us*.

### 5.4 Freshness ops
- Daily cron (Edge Function): re-ingest affiliate feeds → offers table (price, stock, image URL, `feed_updated_at`); stale offers (>48 h) hidden; prices timestamped in UI ("price as of today").
- Quarterly catalogue review + release-watch list (the market cycles ~12 months; Endorphin Elite 3, Triumph 24, Skyward X 2 land June 2026; Hyperion Elite 6 Aug; Novablast 6 H2). `status/successor` fields drive "newer version available" ribbons.

### 5.5 Schema (Postgres / Supabase)
```
brands(id, name, slug)
shoes(id, brand_id, model, version, slug, category, msrp_usd, msrp_gbp, weight_g,
      drop_mm, stack_heel_mm, stack_ff_mm, foam_name, foam_class, plate,
      width_options[], womens_last bool, surface, release_date, status, successor_id,
      consensus_line, athlete_notes, source_urls jsonb)
shoe_scores(shoe_id, spd, csh, stb, lgt, dur, val, overall, tier, formula_version)
evidence_rules(id, key, statement, citation, url, confidence, effect_note)
offers(id, shoe_id, retailer, network, region, price, currency, affiliate_url,
       image_url, in_stock, feed_updated_at)
profiles(id, user_id?, units, region, sex, birth_year, weight_kg, height_cm,
         weekly_km, easy_pace_s, race_results jsonb, experience, intents[],
         injury_flags[], fit_prefs jsonb, brand_prefs jsonb, budget jsonb)
matches(id, profile_snapshot jsonb, results jsonb, engine_version, ruleset_version,
        share_slug, created_at)
strava_connections(user_id, athlete_id, access_token_enc, refresh_token_enc,
                   scopes, status, connected_at)        -- Phase 2
strava_gear(user_id, gear_id, name, brand, model, distance_m, matched_shoe_id, synced_at)
click_events(id, match_id, offer_id, subid, ts)          -- revenue attribution
```
RLS on all user tables; tokens encrypted (pgsodium); anonymous matches keyed by share_slug.

---

## 6. UX & Design Language

### 6.1 Two registers, one dark theme
Research extracted Nike.com's system (Helvetica Now, #111111 ink on white, #F5F5F5 image tiles, single #FA5400 accent, pill CTAs, no shadows, product-supplies-the-colour) and EA FC's reveal anatomy. We fuse them: **"Stadium" dark theme everywhere** (the reveal must own the app's identity), with Nike's *restraint* applied inside it — monochrome chrome, generous whitespace, one accent at a time, pill buttons, big quiet type; neon is reserved for moments (reveal, tier glow, CTAs).

**Tokens (draft):**
| Token | Value | Use |
|---|---|---|
| bg | `#0A0B0F` | app background (stadium night) |
| surface | `#14161C` / `#1B1E26` | cards, inputs (radius 16; pills 999) |
| ink | `#F5F6F7` / muted `#9AA0AC` | text |
| volt | `#C8FF00` | primary accent, CTAs, STRONG badges |
| cyan | `#00E5FF` | secondary glow, links |
| amber | `#FFB020` | MODERATE badges (distinct from gold tier) |
| magenta | `#FF2DD4` | ELITE holo accents only |
| gold | `#FFC857` | GOLD tier |
| Typography | **Inter** (UI, 400/500 — Helvetica Now stand-in) + **Archivo** (condensed caps display: stats, ratings, banners) | Nike uses weight-restraint + size for hierarchy; we copy that |
| Imagery | shoe cutout PNGs on transparent/radial-glow tiles, lateral ¾ hero angle (Nike's), soft contact shadow | from affiliate feeds |
| Spec rows | label/value rows exactly like Nike PDP ("Drop — 8 mm" with info tooltips) | result detail |

Accessibility: WCAG AA contrast on all neon-on-dark pairs (volt/cyan pass on #0A0B0F; never body text in magenta); `prefers-reduced-motion` → skip straight to results; full keyboard/RTL-safe forms; touch targets ≥44 px.

### 6.2 The Reveal (storyboard, ~4.5 s, skippable, haptics on native)
1. **Suspense (1.5–2.5 s, covers API):** dark stage, scanning line over silhouette, cycling micro-copy ("Weighing 14 carbon plates…", "Reading the evidence…").
2. **Stage dims** further (the FUT "shades darker" tell); two spotlight cones converge (0.4 s).
3. **Role banner drops & waves:** "RACE DAY" in Archivo caps (0.6 s).
4. **Tease beats:** brand crest silhouette glow → Match % odometer spin-up (0.8 s).
5. **ELITE tier only:** firework Lottie burst above card position (0.4 s).
6. **Card slam** + screen shake + haptic; diagonal shine sweep across card face (0.5 s).
7. **Stat count-up:** six stats tick from 0, staggered 80 ms; neon rim pulse; shoe image pops with counter-parallax (1.2 s).
8. **Idle state:** holographic foil shimmer + parallax tilt tracking pointer (web) / gyroscope (native); CTAs fade in: *Why this shoe · Where to buy · Next card* (rotation reveals run as a pack: card → card → fanned summary).

### 6.3 Quiz spec (one question per screen, progress bar, ~90 s)
0. Units & region auto-detected (UK→metric+£) — switchable inline at every numeric input (kg/lb st, cm/ft-in, km/mi, min/km–min/mi).
1. "What are we matching today?" → **One perfect shoe** / **A rotation**.
2. Sex (M / F / prefer not to say — copy explains it only tunes fit notes).
3. Age (slider).
4. Weight (+ optional height).
5. Weekly volume (slider with runner-friendly bands).
6. Pace signal: recent race (distance picker + time) OR typical easy pace OR "not sure" (→ conservative defaults).
7. Intent detail: racing? distance + date. Rotation: roles auto-proposed from volume, user can toggle.
8. Experience + current shoe (searchable picker, optional, + love/hate toggle).
9. Fit & preferences: width, toe box, supported-feel preference, brand love/block chips.
10. Budget: per-shoe or total slider (£/$ by region) + "show me a stretch pick" toggle.
11. Optional: injury history checkboxes behind a "personalise further" disclosure with privacy note + non-medical disclaimer. **Health inputs are special-category data under UK GDPR** — explicit opt-in consent checkbox with purpose statement before these are stored; skippable without penalty; deletable from settings.
Then → suspense → reveal.

Strava-connected users (Phase 2) skip 3–6 (pre-filled, editable).

### 6.4 Screens
Landing · Quiz (11 steps) · Reveal · Results summary (fan) · Shoe detail (display + stats + reasons + offers + spec rows + alternates) · Compare (2–3 shoes side-by-side stat bars) · Browse all (filterable grid, Nike-style 3-col cards) · Methodology (the rules + citations, public) · Profile/Settings (units, region, Strava, data deletion) · Legal (affiliate disclosure, privacy, terms).

---

## 7. Technical Architecture

### 7.1 Stack
| Layer | Choice | Why |
|---|---|---|
| App | **Expo SDK 54+ / React Native 0.8x / TypeScript / expo-router** | one codebase → web (primary launch target) + iOS/Android (Phase 3); file-based routing on all platforms |
| Styling | **NativeWind 4** + design tokens | Tailwind ergonomics, web+native parity |
| State | **Zustand** (quiz/local) + **TanStack Query** (server) | light, proven |
| Animation/FX | **react-native-reanimated 4** + **react-native-gesture-handler** + **@shopify/react-native-skia** (foil/glow shaders — works on web via CanvasKit WASM, ~2.9 MB lazy-loaded) + **lottie (dotlottie-react-native)** for fireworks/confetti + **expo-haptics**, **expo-sensors** (gyro tilt) | the entire FUT reveal runs cross-platform at 60 fps |
| 3D hero (web, Phase 2/3) | **react-three-fiber 9 + drei 10**, GLB + Draco/KTX2, lazy-mounted | r3f's *native* path (expo-gl) is currently broken/unstable — research confirmed; native falls back to Tier 2 |
| Backend | **Supabase** (Postgres, RLS, Auth, Storage, Edge Functions, cron) | solo-dev velocity, free→$25/mo, server-side engine + Strava token custody |
| Hosting | EAS Hosting or Vercel (web), EAS Build (native later) | |
| Analytics | PostHog (EU cloud) + click subIDs for revenue attribution | |
| Errors | Sentry (expo plugin) | |

### 7.2 The 3D shoe display — tiered (research-validated)
- **Tier 1 (every shoe, MVP): FUT pseudo-3D card.** Layers: gradient stage → neon rim → shoe cutout PNG (counter-parallax) → Skia foil/glare shader (pokemon-cards-css recipe ported to SkSL) → stat panel. Pointer/gyro tilt. Works identically web+native today.
- **Tier 2 (top shoes, Phase 2): 360° sprite spin** — 36-frame drag-to-rotate component (~100 lines, preloaded images), same card frame. Frames from own turntable photography (~£150 rig) or licensed services (PhotoSpherix-style); affiliate feeds rarely include 360 sets.
- **Tier 3 (5–10 hero shoes, Phase 3): true GLB 3D** on web via r3f (`PresentationControls`, `Environment`, `ContactShadows`); photogrammetry per shoe (30–60 min capture + 1–3 h cleanup, RealityScan/Polycam → GLB ≤30 MB, ≤100 k tris, DPR cap 2). Native shows Tier 2. Sketchfab CC models = dev placeholders only (trademark risk on branded meshes).

"Real images in a 3D rotating screen" is satisfied at Tier 1 from day one (tilt + parallax + foil reads as 3D), upgraded progressively.

### 7.3 Services & jobs (Edge Functions)
- `POST /match` — profile in, results out (engine).
- `GET /shoes`, `GET /shoes/:slug`, `GET /offers/:shoeId`.
- `POST /events/click` — affiliate redirect with subID logging (server-side redirect so links stay swappable).
- Cron: `feeds-refresh` (daily — Awin/Webgains/Skimlinks product feeds → offers), `catalogue-watch` (weekly — flags shoes >11 months old for review).
- Phase 2: `strava/oauth-callback`, `strava/sync` (pull athlete, stats, gear), `strava/deauth-webhook` (delete Strava data immediately — compliance), `strava/disconnect`.

### 7.4 Performance budgets
Web TTI < 3 s on mid-tier mobile/4G; reveal 60 fps (Skia layers, no JS-thread animation); images AVIF/WebP via CDN params at display size; Skia WASM + r3f code-split and lazy; quiz usable before WASM arrives.

---

## 8. Strava Integration (Phase 2) — Compliance-First

Research verdict: **CAUTION / conditional GO.** Strava's stated-permitted category explicitly includes "tools that help users understand their data and performance"; our pattern (user's own data → recommendation shown only to that user) fits. Hard constraints from the Nov-2024 API agreement + June-2026 developer program:

| Constraint | Our compliance |
|---|---|
| No AI/ML **training** on Strava data | Engine is deterministic; Strava data never enters any model training, ever |
| Broad analytics clause (no aggregation/insights across users) | Strava data used per-user only, never aggregated, never used to tune the algorithm; algorithm improvements come from published science + non-Strava feedback |
| Display only to the data's owner | Results private by default; share cards contain zero Strava-derived fields (share renders from quiz-equivalent snapshot) |
| No LLM grey zone (StravaChat precedent) | Hard firewall: Strava fields are never sent to any LLM service |
| Tiers: Single Player (1 user) → Standard (~10, self-serve; **requires paid Strava sub ~$12/mo**) → review for >10 athletes | Build in Single Player, beta on Standard, apply for review with this compliance memo; raise affiliate question in writing during review |
| Branding/look-alike rules | "Compatible with Strava" badge per guidelines; no feed/segment UI imitation |
| Deauthorisation | Webhook → immediate deletion of Strava-derived data; user-facing disconnect button does the same |

**What we pull (minimal scopes `read`, `profile:read_all`, `activity:read`):** weight (profile), 4-week volume & pace distribution (activities/stats), per-shoe mileage (`athlete.shoes[]` + `GET /gears/{id}` — brand/model/lifetime distance). Powers: pre-filled quiz, plate-benefit pace scaling on real paces, current-rotation detection (match gear names to our DB), replacement timing ("Pegasus 41: 680 km — most trainers are reviewed at 500–800 km").

**Fallbacks (always available):** manual entry (MVP default) and GPX/CSV upload later; Garmin lacks a gear API; Apple HealthKit blocks commerce use of health data — Strava remains the only per-shoe-mileage source, which is exactly why it's worth the compliance care.

---

## 9. Monetisation — Affiliate

### 9.1 Strategy (UK-first, US-ready)
| Wave | Programmes | Why |
|---|---|---|
| Day 1 | **Skimlinks** (auto-affiliates 48 k merchants, 75/25 split) + **Awin** applications (Nike up to ~7%, SportsShoes ~3–6%) + **Webgains → Runners Need (8%, daily datafeed)** | instant coverage while direct approvals process |
| Month 1–3 | Adidas (Impact ~7–10%), Hoka (Rakuten 3–14%), Asics, New Balance, Saucony, On | brand-direct rates beat aggregator net |
| US expansion | Zappos (~6–7%), Road Runner (~6%), Holabird (AvantLink), **Running Warehouse when programme reopens** (90-day cookie) | region-detected offers |
| Avoid/deprioritise | Brooks direct (1.5% — route via retailers), Amazon (4%/24 h cookie — fallback only, strict 24 h price-freshness rules) | poor economics |

Mechanics: every offer row carries network + affiliate URL + subID (`match_id:shoe:placement`) → click_events → revenue attribution per shoe/placement. Price comparison across 2+ retailers per shoe both converts better and hedges single-programme rejection. **Disclosure:** persistent "We may earn commission" note on every offers module + /affiliates page (FTC + UK ASA/CAP compliant).

Unit economics (researched benchmarks): specialist-retailer conversion 2–5.5%, AOV £75–£140, ~6–8% commission ⇒ **EPC ≈ $0.20–0.35** on high-intent personalised clicks. Personalised recommendation traffic is the highest-intent affiliate traffic that exists; 1,000 result-views/mo at 30% CTR ≈ £50–90/mo early on — scales with traffic + share loop.

### 9.2 Imagery = datafeeds (the elegant bit)
Affiliate datafeeds (Awin `aw_image_url`, Webgains daily feed, AvantLink mandates product images) grant approved affiliates a licence to display product images **alongside live tracked links to that retailer**. Rules engine: image always paired with its supplying retailer's link; images purged if programme ends; daily refresh. This makes the entire visual catalogue legal and free — and aligns imagery with revenue.

---

## 10. Build Phases

### Phase 0 — Foundations (week 0–1)
Repo (move code off OneDrive to `C:\dev\solematch`; git + GitHub), Expo scaffold + router + NativeWind + tokens, Supabase project + schema + RLS, CI (typecheck/lint/test/preview deploy), seed script importing the researched 60-shoe catalogue (JSON in repo), affiliate applications submitted (Skimlinks live same-day), domain + legal page stubs. **Exit:** deployed skeleton with seeded DB.

### Phase 1 — MVP (weeks 2–6) → public launch
Quiz (11 steps, units/regions) · engine v1 + full test suite · scores formula v1 + tier assignment · Tier-1 FUT card + full reveal sequence (Skia foil, Lottie fireworks, haptics-ready) · results/rotation summary/detail/compare/browse · offers via Skimlinks links + manual price snapshot, disclosure · **interim shoe imagery: Skimlinks Product Search API images (licensed when paired with their links) + brand press-kit cutouts for the top ~20 hero shoes** (full multi-network datafeed pipeline lands Phase 2) · /methodology page with all rules + citations · share cards (server-rendered OG images) · PostHog + Sentry · web deploy on custom domain. **Exit criteria:** quiz→reveal E2E (Playwright) green; engine tests green; Lighthouse perf ≥85 mobile; 20-person friends-and-family test; first affiliate click tracked end-to-end.

### Phase 2 — Accounts, Strava, live prices (weeks 7–12)
Supabase auth + saved matches/rotations · Strava connect (Single Player → Standard; review application submitted with compliance memo) · gear-mileage features + replacement nudges · Awin/Webgains datafeed ingestion (live prices + licensed images, daily cron) · price-drop alerts (email) · 360 spins for top ~10 shoes · catalogue → 100+. **Exit:** Strava beta with 10 users; live prices on >80% of catalogue; first £100 affiliate month.

### Phase 3 — Native + community + 3D heroes (month 4+)
iOS/Android via EAS (gyro tilt + haptics shine here) · r3f hero 3D for 5–10 flagships (web) · community layer: user ownership votes, "runners like you chose", own review snippets (our data asset replacing editorial dependence) · re-match on new releases ("Vaporfly 5 is out — your card is outdated") · US retailer wave · evaluate premium tier (advanced rotation planner, race-day calculators).

---

## 11. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Strava ToS volatility (changed twice in 19 months; analytics clause broad; AI-inference unresolved) | High | Manual-entry-first design (Strava is enhancement, not dependency); deterministic engine + LLM firewall; written clearance during review; feature-flag kill switch |
| Affiliate approvals need a live, credible site | Medium | Launch on Skimlinks (no approval) + methodology content for credibility; apply to networks with the live MVP |
| Shoe market churn (~12-month cycles) | Medium | status/successor schema, weekly watch job, quarterly review; "newer version" ribbons |
| Image licence termination by a programme | Medium | Multi-network sourcing per shoe; nightly licence-state check; press-kit/own-photo fallback for top 20 |
| Health/medical claims exposure | High | Claims policy (§1, §3.2), no injury-prevention claims, physio nudges, disclaimers, UK ASA-aware copy review |
| RN Web 3D performance / r3f-native instability | Medium | Tiered display; Tier 1 is pure Skia/reanimated (proven cross-platform); 3D web-only and lazy |
| Score credibility attacks ("made-up numbers") | Medium | Published formulas + versioning on /methodology; cite every input; never copy others' scores |
| Solo-dev scope creep | High | Phase gates above; rotation of cut-first features: compare tool, 360 spins, alerts |
| OneDrive + git corruption | Low | Code lives in `C:\dev`, OneDrive keeps docs only |

---

## 12. Open Questions (for owner review)

1. **Name/brand:** run with SoleMatch, or workshop names before domain purchase?
2. **Region:** UK-first launch confirmed? (Plan assumes UK→US order.)
3. **Scope check:** road running only for v1 (trail in catalogue Phase 2+)? Recommended: yes.
4. **MVP anonymity:** launch without accounts (email capture only)? Recommended: yes — friction kills quiz funnels.
5. **Budget OK** for running costs? (~£0–30/mo Phase 1; +Strava sub ~$12/mo Phase 2; Apple $99/yr Phase 3; optional turntable rig ~£150.)
6. **Shoe purchases for photography/3D:** appetite to buy/borrow hero shoes for Tier 2/3 assets, or defer?
7. **"3D rotating" interpretation:** MVP ships the FUT-style tilt/parallax/holo card for every shoe (reads as 3D, 60 fps everywhere), with drag-to-rotate 360 spins in Phase 2 and true free-rotation 3D models for hero shoes in Phase 3 (research found the true-3D native path currently unstable, hence tiering). Sign off that this staged interpretation meets the brief?

---

## 13. Research Provenance

Four parallel research streams (June 2026), full source URLs archived in `docs/research/`:
1. **Sports science** — 25+ studies: Hoogkamer & Kram 2016/2018; Kobayashi 2026 meta-analysis; Dominy & Joubert 2022; Malisoux 2015/2016/2017/2020; Kulmala 2018; Hannigan & Pollard 2019; Nielsen 2014; Nigg 2015 (+2025 secondary analysis); Tenforde 2023; foam/materials and masters/sex-differences literature.
2. **Market catalogue** — ~60 shoes, specs multi-source verified (brand sites, The Run Testers, RunRepeat guides, BITR, RTR, DOR best-of lists); 2026 race associations (Sawe 1:59:30 London WR in Adios Pro Evo 3; Korir Boston CR in Metaspeed prototype; Obiri NYC in Cloudboom Strike LS).
3. **Design & display tech** — nike.com live extraction (type/colour/layout/PDP patterns); EA FC walkout anatomy; r3f/expo-gl native instability finding; Skia-on-web validation; pokemon-cards-css foil technique; photogrammetry/360 sourcing.
4. **Integrations & monetisation** — Strava API agreement quotes + June 2026 developer-program changes + StravaChat enforcement precedent; gear endpoint confirmation; affiliate programme table (rates/cookies/datafeeds, Wiggle deceased, Running Warehouse paused); imagery-licence assessment; competitor scan.

*Caveats inherited from research: a handful of `~` prices need re-verification at seed time; brand affiliate rates confirmed on application; Strava tier details re-checked at Phase 2 start.*
