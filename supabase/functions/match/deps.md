# Bundling the engine for the Edge Function

The function imports `./engine.bundle.js`, generated from the app's engine so web
and Edge always run identical logic. Regenerate after any engine/data change:

```powershell
npx esbuild src/engine/index.ts --bundle --format=esm --alias:@=./src --outfile=supabase/functions/match/engine.bundle.js
```

Notes:
- `--alias:@=./src` resolves the `@/*` path alias used by the engine's value
  imports (`@/data/catalogue`, `@/scores/formulas`, `@/data/rules`).
- esbuild inlines zod and `shoes.json`/`offers.json` into the bundle — a few
  hundred KB, comfortably inside Edge Function limits.
- The wrapper's own zod comes from `npm:zod@4` (Deno npm specifier) for request
  validation; the bundled engine carries its own copy internally.
- The generated bundle is build output: it is gitignored and produced at deploy
  time by the runbook in ../../README.md.
