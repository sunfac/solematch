# Affiliate To‑Do

Living checklist for monetisation. **Golden rule:** only set a retailer's merchant‑ID
env var *after* you're **Joined/Approved** for that advertiser in the network — routing
a retailer through a network you're not approved for **loses the Skimlinks fallback**
(the link still works for users, but earns £0 until approval). Every `EXPO_PUBLIC_*`
goes in **Railway → Variables** and needs a redeploy (they're inlined at build time).

---

## 0. Foundation
- [ ] **Get a proper domain** — several programmes reject `*.railway.app` subdomains, so
      this gates approvals. `solematch.app` is already our SEO canonical.
  - Register/confirm **solematch.app**, point DNS → Railway, add it as a Railway domain.
  - Then set `SOLEMATCH_SITE_URL=https://solematch.app` and `SOLEMATCH_ASSET_URL=https://solematch.app`
    and redeploy (canonical + OG image origin move off the railway host).
  - Use the real domain on each affiliate application.
- [x] **Skimlinks live** (publisher `304673X1792859`) — universal fallback (~75% passthrough).
- [x] **Affiliate wrapping fixed** — was silently dead on web (dynamic env not inlined). Now static + CI‑guarded.

## 1. Awin — LIVE (publisher `2933885`)
Already set + routing direct: **SportsShoes 20544**, **Nike 16327**, **Pro:Direct 6895**, **Running Point 16204**.
Join each below in Awin (→ *Join Programme*, most auto‑approve), then set the var:
- [ ] **Voodoo Running** — `118219` · **12%** (best rate) → `EXPO_PUBLIC_AWIN_MID_VOODOO=118219` · *needs buy‑option added*
- [ ] **Hoka UK** — `17203` (brand‑direct) → `EXPO_PUBLIC_AWIN_MID_HOKA=17203` · *already a brand offer → routes direct on set*
- [ ] **On UK** — `124260` → `EXPO_PUBLIC_AWIN_MID_ON=124260` · *already a brand offer*
- [ ] **Salomon UK** — `86257` → `EXPO_PUBLIC_AWIN_MID_SALOMON=86257` · *already a brand offer*
- [ ] **Wiggle UK** — `1857` (~4%) → `EXPO_PUBLIC_AWIN_MID_WIGGLE=1857` · *needs buy‑option + verified search URL*
- [ ] **Altra UK** — `40812` → `EXPO_PUBLIC_AWIN_MID_ALTRA=40812` · *needs buy‑option*
- ~~Foot Locker / The Sports Edit / Sweatband~~ — lifestyle/activewear, skip.
- ~~JD Sports UK~~ — invite‑only (PID‑1431); the ROW programme (22169) **excludes the UK**, so skip.

## 2. Webgains — application pending
- [ ] **Runners Need** — programme `5503` · **8%** → `EXPO_PUBLIC_WEBGAINS_ID=<your id>` + `EXPO_PUBLIC_WEBGAINS_MID_RUNNERS_NEED=5503` · *already an offer (currently "browse →")*
- [ ] Cotswold Outdoor — `7795` · 6% (trail/outdoor, optional)

## 3. Rakuten Advertising UK — to set up
Unlocks two **brand‑direct** programmes available nowhere else. ⚠️ Rakuten announced an
alliance with **impact.com** (Apr 2026) — it's migrating to Impact's platform, so confirm
the current tracking integration when you join.
- [ ] **Saucony UK** — **7%** brand‑direct → `EXPO_PUBLIC_RAKUTEN_ID=<your id>` + `EXPO_PUBLIC_RAKUTEN_MID_SAUCONY=<mid from dashboard>` · *Saucony shoes get a brand offer*
- [ ] **Asics UK** — ~3% brand‑direct → `EXPO_PUBLIC_RAKUTEN_MID_ASICS=<mid from dashboard>`
- (Rakuten MIDs only show after approval — grab them from your dashboard.)

## 4. Impact — optional
- [ ] **Adidas** + **New Balance** (both Impact UK) → `EXPO_PUBLIC_IMPACT_ID=<your id>` (one ID covers both; merchants already wired)

## 5. Amazon Associates UK — quickest win
- [ ] → `EXPO_PUBLIC_AMAZON_TAG=<yourtag-21>` (instant approval; every shoe has an Amazon offer)

---

## Code wiring status
- **Routing: DONE for all of the above.** The dispatcher (`src/lib/affiliate.ts`) already maps every
  retailer/brand to its network — Awin: SportsShoes, Nike, Pro:Direct, Running Point, Hoka, On,
  Salomon, Voodoo, Wiggle, Altra · Rakuten: Saucony, Asics · Impact: Adidas, New Balance ·
  Webgains: Runners Need. Each activates the instant its env var is set.
- **Buy‑options: TO DO.** Hoka/On/Salomon/Nike/Adidas already appear as brand offers, so they route
  direct on MID‑set. New retailers still need a "where to buy" entry per shoe:
  - Voodoo Running — `https://voodoorunning.com/search?q=<model>` (✅ verified 200)
  - Wiggle — search URL needs confirming (the obvious patterns 404/redirect)
  - Altra — `altrarunning.com` search URL needs confirming
  - (ping me and I'll add these the same way as the price/image sourcing)

## Verify after any change
1. Click a **Where to buy** link on the live site → confirm it routes via the right network
   (`awin1.com/cread.php` / `click.linksynergy.com` / `impact-radius.com`) with your `clickref`/sub‑ID.
2. Check that network's dashboard for the click within a few hours.
3. The CI build fails if affiliate env is ever read dynamically again (the bug that zeroed commission).
