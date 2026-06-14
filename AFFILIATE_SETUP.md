# Affiliate / commission setup

## Current state (verified live)
- **Skimlinks is live** on production (`EXPO_PUBLIC_SKIMLINKS_ID` set in Railway).
  Every outbound retailer link is wrapped via `go.skimresources.com` with an
  `xcust` sub-ID (`matchId:slug:placement`), and the client-side auto-wrap script
  is on every page. Confirm earnings at **hub.skimlinks.com** (Clicks → Commissions).
- Skimlinks pays a **passthrough** rate (~75% of the merchant's commission). The
  dispatcher in `src/lib/affiliate.ts` already supports the **direct** networks
  below, which pay the **full** rate. Each activates the moment its env var(s) are
  set in Railway — no code change, just redeploy. Until then, links fall through
  to Skimlinks (so nothing breaks).

## Activate a direct network (highest rate first)
Set these in **Railway → Variables**, then redeploy. `EXPO_PUBLIC_*` is inlined at
build time, so a rebuild is required for changes to take effect.

| Network | Env var(s) | Covers | Rate | Sign up |
|---|---|---|---|---|
| **Amazon Associates UK** | `EXPO_PUBLIC_AMAZON_TAG` (e.g. `solematch-21`) | Amazon UK | ~3–4%, instant approval | affiliate-program.amazon.co.uk |
| **Awin** | `EXPO_PUBLIC_AWIN_ID` + per-merchant `EXPO_PUBLIC_AWIN_MID_SPORTSSHOES`, `…_NIKE`, `…_SAUCONY`, `…_MIZUNO` | SportsShoes, Nike, Saucony, Mizuno | 7–10% | ui.awin.com (apply per advertiser) |
| **Impact** | `EXPO_PUBLIC_IMPACT_ID` | Adidas | ~7–10% | impact.com |
| **Rakuten** | `EXPO_PUBLIC_RAKUTEN_ID` + `EXPO_PUBLIC_RAKUTEN_MID_HOKA` | Hoka | ~3–14% | rakutenadvertising.com |
| **Webgains** | `EXPO_PUBLIC_WEBGAINS_ID` + `EXPO_PUBLIC_WEBGAINS_MID_RUNNERS_NEED` | Runners Need | ~8% | webgains.com |

The merchant-ID (`*_MID_*`) values come from each network's dashboard once the
advertiser approves you. The retailer→network mapping lives in
`AWIN_MERCHANTS` / `IMPACT_MERCHANTS` / `RAKUTEN_MERCHANTS` / `WEBGAINS_MERCHANTS`.

## How to verify any network is live
1. `curl -s https://<host>/_expo/static/js/web/entry-*.js | grep -o "go.skimresources.com\|awin1.com\|linksynergy\|impact-radius"`
   confirms the wrap code shipped.
2. On the live site, click a **Where to buy** link and confirm it routes through
   the network's domain (e.g. `awin1.com/cread.php…&clickref=<matchId:slug:…>`).
3. Check the network dashboard for the click (sub-ID = `matchId:slug:placement`),
   so you can see exactly which match and which shoe earned.

## Priority recommendation
1. **Amazon Associates UK** — instant approval, immediate incremental revenue.
2. **Awin** for SportsShoes — it's the default retailer on most offers and a
   marquee 8–10% programme; biggest uplift over Skimlinks passthrough.
3. Impact (Adidas) + Rakuten (Hoka) as those brands' shoes convert.
