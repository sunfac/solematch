# Affiliate Link Integration — Deployable Plan

Two task tracks: **🧑 YOU** (account/approval actions only you can do) and **🤖 CLAUDE CODE**
(the code/config I execute on your go‑ahead). Phases are ordered by dependency — do them top‑down.

---

## ⚠️ Honest earning status right now
| Network | State | Earning today? |
|---|---|---|
| **Skimlinks** | **awaiting account verification** | ❌ **No** — links wrap via `go.skimresources.com` but a redirect ≠ a paid link until the account is verified |
| **Awin** | publisher `2933885` set; 4 retailers routed direct | ⚠️ **Only** for advertisers you're approved for |
| **Webgains** | application pending | ❌ Not yet |
| **Rakuten** | signed up; publisher account pending approval | ❌ Not yet |

**Bottom line:** the *plumbing* is built and verified live, but the *accounts* are the blocker —
and almost every account verification depends on a **live domain**. So that's Phase 0.

---

## Phase 0 — Domain (the keystone — unblocks Skimlinks + Rakuten approval)
Skimlinks and Rakuten both require a live site on **your own domain**, "live, not under construction."
A `*.railway.app` subdomain will likely fail their review.
- 🧑 Own/register **solematch.app** (already our SEO canonical).
- 🧑 Railway → `solematch` service → Settings → Networking → **Custom Domain** → add `solematch.app` (+ `www`); copy the CNAME target it gives you.
- 🧑 At your domain registrar, add that DNS record; wait for Railway to issue SSL (green tick).
- 🤖 Set `SOLEMATCH_SITE_URL=https://solematch.app` + `SOLEMATCH_ASSET_URL=https://solematch.app`, redeploy (moves canonical + OG image origin onto the real domain).
- 🤖 Re‑verify OG card, sitemap, robots resolve on `solematch.app`.

## Phase 1 — Skimlinks verification (P0: your universal fallback earns nothing until this clears)
- 🧑 Once `solematch.app` is live, log into Skimlinks → confirm the **submitted domain is `solematch.app`** (not the railway URL); resubmit the site for review if needed.
- 🧑 Whitelist `noreply@skimlinks.com`; complete account + payment details. (Verification is usually < 2 business days once the site is live + content‑complete.)
- 🧑 Email Skimlinks support to (a) nudge verification and (b) **ask in writing whether clicks/sales before verification are credited** — don't assume backfill.
- 🤖 Nothing to change — links already wrap with publisher `304673X1792859` + the `placement:slug:detail` sub‑ID; it starts paying automatically on verification.

## Phase 2 — Awin advertiser approvals (your biggest near‑term earner — every shoe → SportsShoes)
- 🧑 In Awin → **Joined Programmes**, confirm you're **Active** for: SportsShoes `20544`, Pro:Direct `6895`, Running Point `16204`, Nike UK `16327`. Apply to any that are pending. ⚠️ Confirm SportsShoes is the **GB** programme.
- 🧑 Apply to the other Awin running programmes (all wired, just not set): Hoka `17203`, On `124260`, Salomon `86257`, **Voodoo Running `118219` (12%!)**, Wiggle `1857`, Altra `40812`.
- 🧑 Tell me which show **Active**.
- 🤖 *(done)* publisher ID + SportsShoes/Nike/Pro:Direct/Running Point MIDs set + routing verified live.
- 🤖 Set each new advertiser's MID env var **as you confirm approval**; if any *set* MID turns out un‑approved (watch SportsShoes), revert it to Skimlinks so it keeps earning.
- 🤖 Add buy‑options for **Voodoo** (URL verified), Wiggle, Altra so they appear as "where to buy".

## Phase 3 — Rakuten (your question — Saucony + ASICS brand‑direct, available nowhere else)
- 🧑 **Confirm you're in the right Rakuten product:** *Rakuten Advertising* (rakutenadvertising.com **Publisher** dashboard, with an **Advertisers** menu) — **not** Rakuten **Rewards** (cashback) or Rakuten.com. If there's no "Advertisers" menu, you joined the wrong one.
- 🧑 **Why you see no merchant offers:** Rakuten **manually approves the publisher account first**, and that approval **requires a live website** — so this is gated until Phase 0. Once your account is approved: **Advertisers → Find Advertisers → search "Saucony" / "ASICS" → Apply** (per‑advertiser approval, like Awin). Track under **Advertisers → My Advertisers**.
- 🧑 Heads‑up: Rakuten is migrating onto **impact.com** (alliance announced Apr 2026, waves through 2026‑27 — partnerships carry over, no need to rejoin). **Consider applying to impact.com directly in parallel** — New Balance + Adidas are on Impact anyway.
- 🧑 When approved for Saucony/ASICS, send me the advertiser MIDs (from the dashboard) + your Rakuten publisher ID.
- 🤖 *(done)* Saucony + ASICS wired to Rakuten; New Balance + Adidas wired to Impact.
- 🤖 Set `EXPO_PUBLIC_RAKUTEN_ID` + Saucony/ASICS MIDs (and `EXPO_PUBLIC_IMPACT_ID` if you go Impact).

## Phase 3b — Impact.com (Brooks + New Balance, direct‑only — and where Rakuten is migrating)
Impact's *unique* value is concentrated but high: **Brooks** runs a single global Impact programme
with **no Awin/Rakuten UK route — Impact is the only direct way to get it**, and **New Balance UK**
is Impact too (both carbon‑racer running brands). Don't over‑rotate: Nike/adidas/Hoka/On/Salomon are
all Awin (already covered). But it's getting more central — as Rakuten migrates onto impact.com
(2026‑27), **ASICS + Saucony will become reachable here as well**, so joining Impact now is forward‑looking.
- 🧑 Sign up as a publisher at **impact.com** (needs the live domain — Phase 0), then apply to **Brooks**
      and **New Balance UK** (per‑advertiser approval). Sensible to do alongside Rakuten since Rakuten is moving here.
- 🧑 When approved, send me your Impact account ID + the campaign IDs (only visible post‑approval).
- 🤖 *(done)* Brooks + New Balance wired to Impact; Adidas corrected to Awin (it's Awin UK, not Impact).
- 🤖 Set `EXPO_PUBLIC_IMPACT_ID`; add brand buy‑options for Brooks / New Balance so they route direct
      (their shoes currently route via SportsShoes/Amazon).

## Phase 4 — Webgains + Amazon (quick adds)
- 🧑 Webgains: once approved, confirm Runners Need (programme `5503`, 8%); send me your Webgains publisher ID.
- 🧑 Amazon Associates UK: apply (instant approval) → send me your tag (e.g. `solematch-21`).
- 🤖 Set `EXPO_PUBLIC_WEBGAINS_ID` + `EXPO_PUBLIC_WEBGAINS_MID_RUNNERS_NEED=5503`; `EXPO_PUBLIC_AMAZON_TAG`.

---

## Standing verification (after any env change)
- 🤖/🧑 Click a **Where to buy** link on the live site → confirm it routes via the right network
  (`awin1.com/cread.php` · `click.linksynergy.com` · `impact-radius.com` · `go.skimresources.com`) carrying your `clickref`/sub‑ID.
- 🧑 Check that network's dashboard shows the click within a few hours.
- Guardrail: CI fails the build if affiliate env is ever read dynamically again (the bug that silently zeroed commission).

## Reference docs
- **[AFFILIATE_TODO.md](AFFILIATE_TODO.md)** — every merchant ID, rate, relevance, and the skip‑list.
- **[AFFILIATE_SETUP.md](AFFILIATE_SETUP.md)** — env‑var mechanics + how to verify each network.
