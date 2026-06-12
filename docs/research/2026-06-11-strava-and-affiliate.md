# Research Dossier 4: Strava Integration & Affiliate Monetisation
*Researched 11 June 2026.*

## (A) Strava Integration Assessment

### API capabilities (confirmed current)
**OAuth scopes:** `read`, `read_all`, `profile:read_all`, `profile:write`, `activity:read`, `activity:read_all`, `activity:write`.

**Relevant endpoints:**
- `GET /athlete` (DetailedAthlete, needs `profile:read_all`) — includes **`weight`** (kg) and **`shoes[]`** array (id, primary, name, distance).
- `GET /gears/{id}` (DetailedGear) — **per-shoe**: `brand_name`, `model_name`, `distance` (lifetime metres), `description`. → "your Pegasus has 680 km on it" logic.
- `GET /athlete/activities` — activities carry `gear_id` (runs attributable to shoes).
- `GET /athletes/{id}/stats` — recent/YTD/all-time totals.

**Rate limits (default):** 200 req/15 min, 2,000/day overall; 100/15 min, 1,000/day non-upload reads.

**Developer program (changed 1 June 2026):**
- New apps start **Single Player Mode** (1 athlete).
- **Standard Tier**: self-upgrade to ~10 athletes; >10 (to 9,999) requires app review (case-by-case). **New Standard Tier devs must hold a paid Strava subscription** (~US$11.99/mo).
- **Extended Access Tier**: review-gated, higher limits, no subscription.
- Club endpoints retire 1 Sept 2026; header auth + `api-v3.strava.com` mandatory by 1 June 2027.

### November 2024 API Agreement — key quoted terms
1. **AI/ML:** "You may not use the Strava API Materials (including Strava Data), directly or indirectly, for any **model training** related to artificial intelligence, machine learning or similar applications." (Restriction is on *training*, not inference — but see enforcement.)
2. **Analytics (broadest clause):** "You may not process or disclose Strava Data, even publicly viewable Strava Data, including in an **aggregated or de-identified manner**, for the purposes of, including but not limited to, **analytics, analyses, customer insights generation, and products or services improvements**."
3. **Display-to-owner (Section 2.3):** "Strava Data provided by a specific user can only be displayed or disclosed in your Developer Application **to that user**."
4. **Look-alike:** no apps that "compete with or replicate Strava functionality" / its "distinctive look and feel".
5. **Officially preserved use cases (Strava press release Nov 2024):** "coaching platforms focused on providing feedback to users and **tools that help users understand their data and performance**."

### Is "user's own data → recommendation for that user" permissible?
**Yes in principle** — squarely inside the preserved category; display-to-owner satisfied by design. NOT permissible: training models on Strava data; cross-user aggregation ("runners like you"); using Strava data to improve the algorithm; showing data to others.

**Grey zone — LLM inference:** developer-forum question (own data → Claude/GPT inference-only) unanswered by Strava, unresolved as of May 2026. Enforcement precedent: **StravaChat** ordered shut down (even with LLM-never-sees-data architecture), then reversed after backlash. Strava launched its own **MCP connector** (subscription-gated) as "the supported path" for AI access — it wants to own that lane.

### Verdict: CAUTION (conditional GO)
Conditions: deterministic/rule-based engine (no model training on Strava data), **hard firewall between Strava data and any LLM**, per-user display only, no aggregation, minimal scopes, "Compatible with Strava" branding, honour deauth webhooks with prompt deletion, raise affiliate-commerce question in writing during app review. Risks: broad analytics clause, erratic enforcement, terms changed twice in 19 months, paid sub now required, >10-athlete review not guaranteed.

### Alternatives
| Option | Approval | Cost | Gear data? | Notes |
|---|---|---|---|---|
| Garmin Connect Developer API | Business-use form, ~2 days + call | Free | **No gear/shoes exposed** | Good for activities/health only |
| Apple HealthKit | App Store review | Free | No gear concept | iOS-only; Guideline 5.1.3 bars health data → advertising/commerce — careful |
| Manual entry / GPX | None | Free | User-entered | Zero platform risk; MVP default |

**Strava is the only mainstream API exposing per-shoe mileage — a genuine moat worth the compliance care.**

## (B) Affiliate Programme Table

| Programme | Network | Rate | Cookie | Datafeed+images | Region | Notes |
|---|---|---|---|---|---|---|
| Running Warehouse | AvantLink (in-house managed) | ~5–10% historic | **90 days** | Yes (AvantLink) | US | **Paused to new affiliates June 2026** — apply on reopen; prefers US-based |
| Zappos | Impact/FlexOffers/Skimlinks | ~6–7% | 14 d | Yes | US | Huge catalogue |
| Road Runner Sports | CJ + AvantLink | ~6% (5–10%) | 7–30 d | Yes | US | Runs own quiz |
| Fleet Feet | FlexOffers | ~6.4% | 30 d | Yes | US | AOV $140, ~2% CR |
| Holabird Sports | AvantLink | n/a | n/a | Yes | US | CR 4.5–5.5%, AOV $95–100 benchmark |
| SportsShoes.com | **Awin** | ~3–6% | 30 d | Yes (Create-a-Feed incl. `aw_image_url`) | UK/global | UK's biggest running specialist |
| Runners Need | **Webgains** | **8%** (2% voucher) | 30 d | **Yes — full daily datafeed** | UK | High approval rate |
| Pro:Direct Running | Group (Awin/Skimlinks) | ~3–5% | n/a | Likely group feed | UK | Verify running coverage on application |
| Wiggle | — | — | — | — | UK | **Dead** (administration Mar 2024; Frasers bought IP only) |
| Amazon Associates | Amazon | **4%** shoes + perf multipliers | **24 h** | PA-API → Creators API (PA-API v5 retiring 2026); images via live API only | US+UK | High shoe return rates erode net; strict price-freshness (≤24h) |
| Nike | **Awin** (UK/EU) | up to ~7% full-price / 4% sale (up to 11% cited) | 30 d (7 voucher) | Awin feed | US+UK | SNKRS non-commissionable |
| Adidas | **Impact** | ~7–10% | 30 d | Impact catalog | US+UK | Among best brand rates |
| Asics | CJ (US) / Awin / CF | ~3–6% | 30 d | Network feed | US+UK | |
| Brooks | CJ | **1.5%** | 30 d | CJ feed | US | Stingy — route Brooks demand via retailers |
| Hoka | Rakuten (US) / Awin (EU) | 3–14% | 30 d | Yes | US+UK | Best headline brand rate |
| On Running | Partnerize/Awin | ~5% typical | n/a | Network feed | US+UK | Verify on application |
| New Balance | Impact | 2% (to ~8% promo) | 30 d | Impact catalog | US+UK | |
| Saucony | Network (Wolverine) | 4–7% | 30 d | Network feed | US+UK | |
| Skimlinks | aggregator | **75/25 split**, 48k merchants | per merchant | Product Search API w/ images | US+UK | Easiest start; sacrifices 25% |
| Sovrn Commerce | aggregator | ~75/25, 30k merchants | per merchant | API w/ product data | US+UK | Same trade-off |

**Economics:** specialist CR 2–5.5%, AOV $95–140/£75. 6% × $120 AOV × 3% CR ⇒ **EPC ≈ $0.20–0.35** on high-intent traffic (personalised recommendation clicks = top band). Amazon 4%/24h = fallback only. **Freshness:** Amazon ≤24h or staleness disclosure; Awin/AvantLink/Webgains feeds daily — re-ingest daily, timestamp prices. FTC (US) + ASA/CAP (UK) disclosure wherever links appear.

## (C) Imagery-via-Datafeed Legal Assessment
**Confirmed: AvantLink requires merchants to include product images in feeds** ("used in product ad tools that affiliates utilize"); affiliate docs describe matching readers to products using feed data. Awin (Create-a-Feed `aw_image_url`), Webgains, CJ, Impact, Rakuten operate the same way; Skimlinks/Sovrn expose product APIs with images.

Legal shape: approved-affiliate status grants a **limited, revocable licence** to display supplied creative/feed content for promoting that merchant via tracked links. Conditions:
1. Image must accompany a live affiliate link to the supplying retailer (no cross-retailer or decorative use).
2. Licence dies with the relationship — purge on programme exit (see Wiggle).
3. Keep data current (daily); Amazon strictest (24h, API-served images, 3 qualifying sales/180 days to keep access).
4. Brand imagery stays brand IP — some programmes add restrictions (no implied endorsement, MAP rules).
5. Hedge: pull images from 2+ networks per shoe.

**Bottom line: affiliate datafeeds are the legal imagery pipeline, aligning imagery licence with monetisation.**

## (D) Competitor Scan

| Product | Asks | Outputs | Monetisation |
|---|---|---|---|
| RunRepeat shoe finder | Terrain, pace, arch/stability, drop, price filters | Ranked shoes + CoreScore (lab teardowns) + live prices 200+ retailers | Affiliate + ads; "no pay-to-play" |
| Fleet Feet fit id | In-store 3D foot scan (Volumental) + pressure plate | Foot profile + outfitter picks | Retail + insoles; 2M+ scans data asset |
| Running Warehouse SmartLast | Nothing (every shoe lab-measured) | Per-shoe fit data; compare vs owned shoes | Direct retail |
| Brooks Shoe Finder | ~5-min quiz incl. alignment mini-exercises | One Brooks model + science explainers | D2C + zero-party data capture |
| Road Runner Perfect Fit | Quiz / virtual appointment | Shortlist from their range | Retail + VIP membership |
| Neatsy AI | iPhone TrueDepth foot scan | Arch/width profile + AI marketplace picks | Marketplace commissions |

**Gap we exploit:** every incumbent keys off foot shape or a one-off quiz; none consumes actual training load, per-shoe mileage and weight from Strava to recommend and *time* the next purchase. Closest (RunRepeat) is editorial, not personalised.

## (E) Sources
Strava: developers.strava.com/docs/reference/ · /docs/rate-limits/ · /docs/getting-started/ · strava.com/legal/api · press.strava.com/articles/updates-to-stravas-api-agreement · communityhub.strava.com (developer program update 13428; AI inference thread 13256; API FAQ 12906) · dcrainmaker.com/2024/11/stravas-changes-to-kill-off-apps.html · the5krunner.com/2024/11/20 + /2026/06/01 · appsforstrava.com/blog/strava-developer-program-changes-2026/ · support.strava.com (MCP connector) · techrepublic.com (API crackdown)
Garmin/Apple: developer.garmin.com/gc-developer-program/ · forums.garmin.com (gear API absence)
Affiliate: runningwarehouse.com/programs/ · support.avantlink.com (datafeed docs) · roadrunnersports.com/content/affiliates · flexoffers.com (Fleet Feet) · holabirdsports.com/pages/affiliates · directory.fmtc.co (SportsShoes) · webgains.com (Runners Need) · azonpress.com/amazon-affiliate-commission-rates/ · webservices.amazon.com/paapi5/ · ui.awin.com/merchant-profile/16327 (Nike UK) · creator-hero.com (Adidas/Zappos) · afprogs.com (Hoka) · brooksrunning.com/en_us/affiliate-program/ · saucony.com (affiliates) · newbalance.com/affiliate/ · sovrn.com/commerce/ · muddymoles.org.uk + cyclingweekly.com (Wiggle administration)
Competitors: runrepeat.com/about · /testing-methodology · fleetfeet.com/fit-process · wwd.com (Fleet Feet Volumental) · runningwarehouse.com/learningcenter/Smartlast.html · brooksrunning.com/en_us/shoefinder/ · customerexperiencedive.com (Brooks zero-party data) · roadrunnersports.com/shoefinder · techcrunch.com + fashionunited.uk (Neatsy)

**Caveats:** brand rates from directories lag reality — confirm on application; Pro:Direct + On rates unverified; Running Warehouse pause + Strava tier details re-check at build time.
