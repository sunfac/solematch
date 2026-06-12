# SoleMatch Monetisation Playbook — making referral commission actually work
*12 June 2026. Mechanics-first: every line here maps to a real programme's real rules.*

## The one-sentence model
High-intent, personalised recommendation traffic → multi-retailer price comparison → tracked
outbound clicks with per-match attribution → commission on the sale, never on the ranking.

## Network mechanics (what actually pays, and how)

| Programme | How links work | SubID field | Payout reality |
|---|---|---|---|
| **Skimlinks** (live day one) | Server-side wrap `go.skimresources.com/?id=<pub>&url=<any merchant url>` — works on search AND product URLs for ~48k merchants incl. SportsShoes, Zappos | `xcust` (already wired: `matchId:slug:placement`) | 75% of commission passed through; ~£50 payout threshold; slow (60-90 day merchant approval cycles on payment, not on linking) |
| **Webgains → Runners Need** (the UK anchor: 8%) | Apply → approved → **daily product datafeed (CSV)**: per-SKU deep link + price + stock + image. Replace our search URLs with exact PDP deep links | `clickref` query param | 30-day cookie; datafeed solves three problems at once: broken links, live prices, licensed images |
| **Awin → Nike UK (~7%), SportsShoes (3-6%)** | Apply to network, then per-advertiser approval. Link Builder/API converts any approved-advertiser URL to a tracked link | `clickref` | 30-day cookie (Nike 7-day on voucher traffic); Create-a-Feed gives `aw_deep_link` + `aw_image_url` per SKU |
| **Impact → Adidas (~7-10%)** | Same pattern: approval → product catalog API → tracked deep links | `subId1` | Among the best brand rates |
| **Rakuten → Hoka (3-14%)** | Same pattern | `u1` | Verify UK availability on application |
| **Amazon Associates** | Last resort: 4% shoes, 24h cookie, strict price-display rules | `tag` + tracking IDs | Only where no specialist carries a shoe |

**Implementation consequence:** `buildAffiliateUrl()` becomes per-retailer: Skimlinks wrap as
default, swapped to native `clickref`/`subId1` deep links as each programme approves. The
`offers.json` schema already carries `retailer` so the switch is data, not code. The Phase-2
datafeed cron (spec §5.4) turns search URLs into per-SKU deep links with live prices — that is
the single highest-leverage monetisation task remaining.

## Attribution loop (knowing what earns)
`xcust/clickref = matchId:slug:placement` → networks report it back per conversion → join against
PostHog `offer_click` events → earnings per shoe, per placement (reveal vs results vs detail),
per match profile. This tells us which surfaces convert WITHOUT ever letting commission touch
the ranking.

## In-app conversion levers (status)
- ✅ Reveal: "Where to buy · £X" is now the primary CTA at the peak-emotion moment
- ✅ Results: every role row's price is a one-tap best-offer outbound link
- ✅ Detail: multi-retailer price comparison with checked dates
- ✅ Stretch picks (+10% budget) — premium upsell, honestly labelled
- ✅ Budget-allocation notes — trust that the cheaper pick was *reasoned*, not cheap
- ⏳ Price-drop value plays: previous-gen flagships discounted on new releases (needs the live
  price job — see next-session brief)
- ⏳ Replacement timing via Strava gear mileage (Phase 2: "your Pegasus has 680 km — here's its
  successor at £X") — the highest-intent trigger in running retail and our moat
- ⏳ Saved-match email + price-drop alerts (Phase 2, needs accounts)

## The trust contract (why this converts at all)
Disclosure on every offer surface; commission NEVER reorders recommendations (published on
/methodology); evidence citations adjacent to every buy button. A recommendation engine that
visibly is not for sale is the entire conversion advantage over retailer quizzes.

## Realistic numbers (from research benchmarks)
Specialist CR 2-5.5%, AOV £75-140, blended 5-8% commission ⇒ EPC £0.15-0.30 on result-page
clicks. 1,000 matches/month × ~1.8 outbound CTR points ≈ £80-160/month early; scales linearly
with traffic and with datafeed deep-linking (search-URL → PDP deep-link typically 1.5-2× CTR-to-cart).
