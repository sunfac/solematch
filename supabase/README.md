# Supabase runbook (Phase 2 — owner steps)

Everything here is deploy-deferred per the plan: the MVP runs fully client-side
from the bundled catalogue; flipping to remote data is a deploy, not a rewrite.

1. Create a project at supabase.com → note the project ref, URL and anon key.
2. Install the CLI and link: `supabase login`, `supabase link --project-ref <ref>`.
3. Apply the schema: `supabase db push` (runs `migrations/0001_init.sql`).
4. Generate and apply the seed:
   ```powershell
   npx tsx supabase/seed/seed.ts
   # then paste/run supabase/seed/seed.sql in the SQL editor (or psql)
   ```
5. Bundle the engine and deploy the function (see `functions/match/deps.md`):
   ```powershell
   npx esbuild src/engine/index.ts --bundle --format=esm --alias:@=./src --outfile=supabase/functions/match/engine.bundle.js
   supabase functions deploy match
   ```
6. Set app env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
7. Flip the data mode: `src/data/catalogue.ts` is the single switch point — swap
   the static import for a fetch of `shoes` + `shoe_scores` (kept deliberately
   trivial; the rest of the app only consumes `SHOES`/`SCORED`).

Strava tables, deauth webhook and the daily datafeed cron are Phase-2 migrations
on top of this baseline (spec §7.3/§8).
