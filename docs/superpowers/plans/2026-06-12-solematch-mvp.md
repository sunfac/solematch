# SoleMatch MVP (Phase 0 + Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the SoleMatch web MVP — an 11-step quiz feeding a deterministic, evidence-cited matching engine over a 60-shoe seeded catalogue, revealed as FIFA-style neon holo cards, with affiliate-ready offer links — built in `C:\dev\solematch`, runnable and fully tested locally with zero external accounts.

**Architecture:** Single Expo (React Native Web) app, TypeScript strict. The matching engine and shoe data are pure, RN-free TypeScript modules (`src/engine`, `src/data`) unit-tested with Jest and consumed directly by the app in MVP "static mode"; a thin Supabase Edge Function wrapper around the same engine plus the full SQL schema ship in `supabase/` ready for Phase-2 provisioning. Reveal effects are web-first: reanimated orchestration + a CSS holographic foil in a `.web.tsx` component (the pokemon-cards-css technique), with native Skia port deferred to Phase 3 per spec §7.2 tiering.

**Tech Stack:** Expo SDK latest (expo-router, TypeScript strict), react-native-reanimated, react-native-gesture-handler, expo-linear-gradient, zustand, zod, Jest (jest-expo), Playwright (web E2E), Supabase SQL + Deno Edge Function (artifacts only in MVP).

**Source spec:** `docs/superpowers/specs/2026-06-11-shoe-matcher-design.md` (copied into the repo in Task 2). Research dossiers in `docs/research/` are the data/citation source of truth.

**Plan-level decisions (deviations from spec, with rationale):**
1. **Styling = StyleSheet + `src/theme/tokens.ts`**, not NativeWind (spec §7.1). Rationale: removes babel/metro config risk on RN Web for a solo greenfield; tokens module preserves the design system; NativeWind can be adopted later without rework. Visual output unchanged.
2. **Engine runs client-side in MVP** from the shared package (spec §7.3 puts it in an Edge Function). Rationale: MVP is anonymous with no Strava data (the compliance driver lands Phase 2); the Edge Function wrapper is still written and committed, so the switch is a deploy, not a rewrite.
3. **Fireworks/confetti = bespoke SVG/reanimated particle burst**, not Lottie (spec §7.1). Rationale: no asset sourcing/licensing, fewer deps; visually equivalent at MVP scale.
4. **Compare screen and Skia foil are stretch tasks** (Task 19) per spec §11 cut-first list.
5. **Server-rendered OG share cards (spec §2.6, §10 P1) are DEFERRED to the hosting step** — they require a deployed rendering endpoint (owner-gated hosting). MVP ships a client-side "copy my result" share (text summary + link placeholder); the share-card endpoint is documented in README as a launch-week task.
6. **Optional email capture (spec §2.6) is DEFERRED to Phase 2** — it needs a backend store; MVP is fully anonymous. Documented in README owner checklist.
7. **Sentry wiring lands Phase 2** — no SENTRY_DSN row in MVP env table; PostHog adapter only (console fallback).
8. **Test invariants are AUTHORITATIVE over formula constants.** The numeric constants in Tasks 7/8/10 are calibrated starting points; the executor has explicit latitude to tune constants/weights so the named invariants pass — but may NOT weaken an invariant without flagging it, since invariants encode spec behaviour (§4.2, §5.2).
9. **Tiers are distribution-based** (top 10% ELITE / next 25% GOLD / next 40% SILVER / rest BRONZE by overall rank), deviating from spec §5.2's absolute bands. Rationale: absolute bands fight formula drift and can leave the tier system empty or inflated as the market moves; percentile tiers track the live catalogue (FUT itself is distribution-tuned). The methodology page publishes the percentile rule.

**Owner-blocked items (build everything, wire via env, never block):** Skimlinks/Awin/Webgains IDs, PostHog key, Supabase project, domain/hosting, GitHub remote. Each gets a no-op/console fallback adapter so the app is fully functional without them. (Sentry is Phase 2 entirely — decision 7.)

---

## File Structure (target)

```
C:\dev\solematch\
├─ app.json / package.json / tsconfig.json / jest.config.js / .gitignore
├─ playwright.config.ts
├─ docs/                          ← spec, dossiers, this plan (copied from OneDrive)
├─ src/
│  ├─ app/                        ← expo-router routes
│  │  ├─ _layout.tsx              ← stack, dark theme, fonts
│  │  ├─ index.tsx                ← landing
│  │  ├─ quiz/[step].tsx          ← config-driven quiz
│  │  ├─ reveal.tsx               ← suspense + card walkout
│  │  ├─ results.tsx              ← rotation fan / summary
│  │  ├─ shoe/[slug].tsx          ← detail: stats, reasons, offers
│  │  ├─ browse.tsx               ← filterable grid
│  │  ├─ methodology.tsx          ← rules + citations (public)
│  │  ├─ settings.tsx             ← units/region
│  │  └─ legal/{disclosure,privacy,terms}.tsx
│  ├─ theme/tokens.ts
│  ├─ types/{shoe.ts, profile.ts, match.ts}
│  ├─ data/
│  │  ├─ shoes.json               ← 60-shoe catalogue (from dossier 2)
│  │  ├─ catalogue.ts             ← zod schema, loader, category medians
│  │  └─ rules.ts                 ← evidence rules + citations (from dossier 1)
│  ├─ scores/formulas.ts          ← SPD/CSH/STB/LGT/DUR/VAL + tier (v1)
│  ├─ engine/
│  │  ├─ units.ts  paces.ts  filters.ts  rolePlan.ts
│  │  ├─ modifiers.ts  scoring.ts  rotation.ts  explain.ts  index.ts
│  ├─ state/quizStore.ts          ← zustand (quiz inputs + unit/region defaults, in-memory)
│  ├─ state/resultsStore.ts       ← zustand (last MatchResult for reveal/results/detail)
│  ├─ components/
│  │  ├─ ui/{Screen,PillButton,StatBar,Badge,UnitInput,ProgressDots}.tsx
│  │  ├─ card/{ShoeCard,StatPanel,TierFrame,HoloFoil.web,HoloFoil}.tsx
│  │  └─ reveal/{RevealSequence,RoleBanner,CountUp,ParticleBurst,useTilt}.ts(x)
│  └─ lib/{affiliate.ts, analytics.ts, region.ts, format.ts}
├─ supabase/
│  ├─ migrations/0001_init.sql
│  ├─ functions/match/index.ts    ← Deno wrapper around engine
│  └─ seed/seed.ts
├─ e2e/happy-path.spec.ts
└─ .github/workflows/ci.yml
```

Engine/data/scores files import **nothing from React/RN** (pure TS) — that is what keeps them unit-testable and Deno-portable.

---

### Task 0: Environment verification

**Files:** none.

- [ ] **Step 1: Check toolchain**

Run: `node -v; npm -v; git --version`
Expected: node ≥ 20.x, npm ≥ 10, git present. If node missing/old → STOP and surface to owner (do not auto-install runtimes).

- [ ] **Step 2: Check target dir is free**

Run (PowerShell): `Test-Path C:\dev\solematch`
Expected: `False` (or empty dir). If it exists non-empty, STOP and surface.

### Task 1: Scaffold Expo app

**Files:** Create: entire app skeleton via CLI at `C:\dev\solematch`.

- [ ] **Step 1: Scaffold**

Run: `npx create-expo-app@latest C:\dev\solematch --template blank-typescript --no-install` then `cd C:\dev\solematch; npm install`
Expected: project created, deps installed. (`--no-install` first keeps the create step fast/deterministic; install separately so failures are distinguishable.)

- [ ] **Step 2: Add runtime deps**

Run: `npx expo install expo-router react-native-reanimated react-native-gesture-handler expo-linear-gradient react-native-safe-area-context react-native-screens expo-haptics expo-status-bar expo-web-browser expo-image @expo-google-fonts/inter @expo-google-fonts/archivo expo-font expo-linking expo-constants`
Then: `npm i zustand zod`
Expected: clean install. Use `npx expo install` (not bare npm) for Expo-managed packages so versions match the SDK.

- [ ] **Step 3: Add dev deps**

Run: `npm i -D jest jest-expo @types/jest typescript tsx serve @playwright/test prettier`
Expected: clean install. (`tsx` runs TS scripts zero-config on Windows — used by the seed generator; `serve` hosts the static export for E2E.)

- [ ] **Step 4: Configure expo-router + strict TS**

Modify `package.json`: set `"main": "expo-router/entry"`. Modify `app.json`: add `"scheme": "solematch"`, `"web": {"bundler": "metro", "output": "single"}`, plugins `["expo-router"]`. Modify `tsconfig.json`: `"strict": true`, path alias `"@/*": ["src/*"]` with `"baseUrl": "."`. Add `jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
```

- [ ] **Step 5: Boot check**

Create `src/app/_layout.tsx` (minimal Stack) and `src/app/index.tsx` (`<Text>SoleMatch</Text>`). Run: `npx expo export --platform web`
Expected: export succeeds (CI-friendly smoke test; faster and non-blocking vs holding a dev server open).

- [ ] **Step 6: Commit**

`git init` defaults from create-expo-app may already exist — ensure repo: `git init` (idempotent), `git add -A; git commit -m "chore: scaffold Expo app (router, strict TS, jest)"`. Set repo-local identity first: `git config user.name "William Bly"; git config user.email "williambly@gmail.com"`.

### Task 2: Bring docs into repo

**Files:** Create: `docs/` (copy of spec, 4 dossiers, this plan), `README.md`.

- [ ] **Step 1: Copy docs**

Run (PowerShell): `Copy-Item "C:\Users\willi\OneDrive - FD\BUSINESS\AI\RUNNING\docs" -Destination C:\dev\solematch\docs -Recurse`
Expected: `docs/superpowers/specs/...design.md`, `docs/research/*.md`, `docs/superpowers/plans/*.md` present in repo.

- [ ] **Step 2: README**

Create `README.md`: one-paragraph product summary, pointer to spec/plan, `npm test` / `npx expo start` / `npx expo export --platform web` commands, owner-env table (EXPO_PUBLIC_SKIMLINKS_ID, EXPO_PUBLIC_POSTHOG_KEY, EXPO_PUBLIC_SUPABASE_URL/ANON_KEY — all optional), and an **owner checklist**: affiliate sign-ups (Skimlinks → Awin → Webgains), hosting + OG share-card endpoint (deferred per plan decision 5), email capture (Phase 2, decision 6), Sentry (Phase 2, decision 7), Supabase provisioning runbook pointer.

- [ ] **Step 3: Commit**

`git add -A; git commit -m "docs: import spec, research dossiers, and MVP plan"`

### Task 3: Design tokens + base UI kit

**Files:** Create: `src/theme/tokens.ts`, `src/components/ui/Screen.tsx`, `PillButton.tsx`, `Badge.tsx`, `StatBar.tsx`, `ProgressDots.tsx`. Modify: `src/app/_layout.tsx` (fonts, dark background).

- [ ] **Step 1: tokens.ts** (complete file)

```ts
export const color = {
  bg: '#0A0B0F', surface: '#14161C', surface2: '#1B1E26',
  ink: '#F5F6F7', muted: '#9AA0AC', line: '#2A2E38',
  volt: '#C8FF00', cyan: '#00E5FF', magenta: '#FF2DD4',
  gold: '#FFC857', amber: '#FFB020',
  voltDim: '#1A200A', cyanDim: '#06222A', amberDim: '#241A06',
} as const;
export const radius = { card: 18, pill: 999, input: 14 } as const;
export const space = (n: number) => n * 4;
export const font = {
  ui: 'Inter_400Regular', uiMed: 'Inter_500Medium',
  display: 'Archivo_600SemiBold', // condensed caps for stats/banners
} as const;
export const evidenceColor = {
  STRONG: color.volt, MODERATE: color.amber,
  EMERGING: color.muted, 'FIT & FEEL': color.cyan,
} as const;
export const tierColor = {
  ELITE: color.magenta, GOLD: color.gold, SILVER: '#C9D1E0', BRONZE: '#B08D57',
} as const;
```

- [ ] **Step 2: UI kit components** — `Screen` (SafeArea + bg + maxWidth 480 centered for web), `PillButton` (variant primary volt / ghost), `Badge` (evidence + tier variants from tokens), `StatBar` (label, value 0-99, animated width bar), `ProgressDots` (n of m). Each ≤60 lines, StyleSheet, no inline hex (tokens only).

- [ ] **Step 3: Load fonts in `_layout.tsx`** via `useFonts` from `@expo-google-fonts/inter` + `.../archivo`; set Stack `screenOptions={{ headerShown:false, contentStyle:{ backgroundColor: color.bg } }}`; render `null` until fonts ready.

- [ ] **Step 4: Visual smoke + commit**

Run: `npx expo export --platform web` → succeeds. `git add -A; git commit -m "feat: design tokens and base UI kit"`

### Task 4: Domain types

**Files:** Create: `src/types/shoe.ts`, `src/types/profile.ts`, `src/types/match.ts`.

- [ ] **Step 1: shoe.ts** (complete)

```ts
export type FoamClass = 'PEBA' | 'TPEE' | 'TPU' | 'EVA' | 'BLEND';
export type Plate = 'carbon' | 'composite' | 'none';
export type Category = 'race' | 'tempo' | 'daily' | 'max_cushion' | 'stability' | 'budget';
export type Tier = 'ELITE' | 'GOLD' | 'SILVER' | 'BRONZE';
export interface Shoe {
  id: string; brand: string; model: string; version: string; slug: string;
  category: Category;
  msrpUsd: number; msrpGbp: number; priceApprox?: boolean;
  weightG: number; dropMm: number; stackHeelMm: number; stackFfMm: number;
  foamName: string; foamClass: FoamClass; plate: Plate;
  widths: string[]; womensLast: boolean;
  softness: 1 | 2 | 3 | 4 | 5;     // curated: 1 firm → 5 plush
  stability: 1 | 2 | 3 | 4 | 5;    // curated: 1 unstable → 5 max guidance
  outsole: 1 | 2 | 3 | 4 | 5;      // curated rubber coverage/durability
  consensus: string; athleteNotes?: string; sources: string[];
  status: 'current' | 'superseded' | 'upcoming'; releaseYear: number;
  specEstimated?: boolean; // true where stack/etc. estimated pending brand-site verification
}
export interface ShoeScores {
  spd: number; csh: number; stb: number; lgt: number; dur: number; val: number;
  overall: number; tier: Tier; formulaVersion: 1;
}
```

- [ ] **Step 2: profile.ts** (complete)

```ts
export type Sex = 'M' | 'F' | 'NA';
export type Experience = 'new' | 'regular' | 'high';
export type Role = 'race' | 'tempo' | 'daily' | 'recovery';
export type InjuryFlag = 'bone_stress' | 'achilles_calf' | 'knee' | 'plantar';
export type Units = 'metric' | 'imperial';
export interface Profile {
  units: Units; region: 'UK' | 'US';
  sex: Sex; age: number; weightKg: number;
  weeklyKm: number;
  easyPaceSecPerKm?: number;
  race?: { distanceKm: number; timeSec: number };
  experience: Experience;
  mode: 'single' | 'rotation';
  primaryIntent: Role | 'everything';
  raceDistanceTargetKm?: 5 | 10 | 21.1 | 42.2;
  budget: { type: 'perShoe' | 'total'; amountGbp: number; stretch: boolean };
  brandBlocks: string[]; brandLoves: string[];
  fit: { wide: boolean; roomyToe: boolean };
  wantsStability: boolean;
  injuryFlags: InjuryFlag[];
  currentShoeSlug?: string; currentShoeVerdict?: 'love' | 'meh' | 'hate';
}
```

- [ ] **Step 3: match.ts** (complete)

```ts
import type { Role } from './profile';
import type { Shoe, ShoeScores } from './shoe';
export type Evidence = 'STRONG' | 'MODERATE' | 'EMERGING' | 'FIT & FEEL';
export interface Reason { text: string; evidence: Evidence; ruleId: string }
export interface ScoredShoe {
  shoe: Shoe; scores: ShoeScores; match: number; reasons: Reason[];
  roleScore: number;
}
export interface RoleResult { role: Role; pick: ScoredShoe; alternates: ScoredShoe[] }
export interface MatchResult {
  mode: 'single' | 'rotation';
  roles: RoleResult[];
  totals: { costGbp: number; budgetGbp: number };
  engineVersion: string; rulesetVersion: string;
  notes: string[]; // e.g. budget-shortfall roadmap, transition warnings
}
```

- [ ] **Step 4: Typecheck + commit** — `npx tsc --noEmit` → clean. Commit `feat: domain types`.

### Task 5: Shoe catalogue data

**Files:** Create: `src/data/shoes.json`, `src/data/catalogue.ts`, `src/data/__tests__/catalogue.test.ts`.

- [ ] **Step 1: Write zod schema + loader `catalogue.ts`** (complete)

```ts
import { z } from 'zod';
import raw from './shoes.json';
import type { Shoe, Category } from '@/types/shoe';
const shoeSchema = z.object({
  id: z.string().min(1), brand: z.string(), model: z.string(), version: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.enum(['race','tempo','daily','max_cushion','stability','budget']),
  msrpUsd: z.number().positive(), msrpGbp: z.number().positive(),
  priceApprox: z.boolean().optional(),
  weightG: z.number().min(90).max(400), dropMm: z.number().min(0).max(14),
  stackHeelMm: z.number().min(20).max(60), stackFfMm: z.number().min(10).max(50),
  foamName: z.string(), foamClass: z.enum(['PEBA','TPEE','TPU','EVA','BLEND']),
  plate: z.enum(['carbon','composite','none']),
  widths: z.array(z.string()), womensLast: z.boolean(),
  softness: z.number().int().min(1).max(5),
  stability: z.number().int().min(1).max(5),
  outsole: z.number().int().min(1).max(5),
  consensus: z.string().min(10), athleteNotes: z.string().optional(),
  sources: z.array(z.string().url()).min(1),
  status: z.enum(['current','superseded','upcoming']),
  releaseYear: z.number().int().min(2023).max(2027),
});
export const SHOES: Shoe[] = z.array(shoeSchema).parse(raw) as Shoe[];
export const bySlug = new Map(SHOES.map(s => [s.slug, s]));
export function categoryMedianGbp(cat: Category): number {
  const p = SHOES.filter(s => s.category === cat).map(s => s.msrpGbp).sort((a,b)=>a-b);
  return p.length % 2 ? p[(p.length-1)/2] : (p[p.length/2-1]+p[p.length/2])/2;
}
```

- [ ] **Step 2: Transcribe the catalogue → `shoes.json`.** Source: `docs/research/2026-06-11-shoe-catalogue.md` section (A). Transcribe ALL listed shoes (~60: 20 race, 10 tempo, 12 daily, 11 max_cushion, 9 stability, 5 budget — adjust to the dossier tables; skip "Also notable" extras except Evo SL-class ones already in tables). Rules: `priceApprox: true` wherever the dossier marks `~`; curate `softness/stability/outsole` 1–5 from the consensus lines (e.g. Endorphin Elite 2 softness 5 stability 2; Kayano 32 stability 5; race shoes outsole 2); every shoe ≥1 source URL from the dossier; slugs kebab-case (`nike-vaporfly-4`).
  **Fields the dossier lacks — explicit defaults (do not stall, do not silently invent):** `widths: ["standard"]` unless the consensus line names width options (Ghost 17 "widths to 4E", Kayano "2E/4E", Vomero 18 "wide options", Revolution 8 "wide available" → add "wide"); `womensLast: false` except models known to ship women's-specific builds (Adrenaline GTS, Ghost, Kayano, Vaporfly/Alphafly, Pegasus, 1080 — set true with the brand-site source); `status: "current"` everywhere except dossier-noted successions (Alphafly 3 → superseded by Alphafly 4); `releaseYear` inferred from the dossier's release notes (e.g. "April 2026", "Jan 2026") else the model-cycle context. **Budget-table shoes have no stack column:** set estimated stacks and mark `specEstimated: true` (Revolution 8 ≈ 30/20, Winflo 12 ≈ 36/26, Duramo Speed 2 ≈ 33/27, Axon 4 ≈ 38/34, Kaiha Road ≈ 36/30) — a quick brand-site check to replace estimates is authorized but must not block the task. Add `specEstimated: z.boolean().optional()` to the zod schema.
  Example entry (format reference):

```json
{
  "id": "nike-vaporfly-4", "brand": "Nike", "model": "Vaporfly", "version": "4",
  "slug": "nike-vaporfly-4", "category": "race",
  "msrpUsd": 260, "msrpGbp": 240,
  "weightG": 166, "dropMm": 6, "stackHeelMm": 36, "stackFfMm": 30,
  "foamName": "ZoomX", "foamClass": "PEBA", "plate": "carbon",
  "widths": ["standard"], "womensLast": true,
  "softness": 3, "stability": 2, "outsole": 2,
  "consensus": "Lightest mainline Vaporfly ever; snappier lower-stack ride — the consensus default race shoe.",
  "athleteNotes": "The most common amateur PB shoe of the supershoe era.",
  "sources": ["https://runrepeat.com/guides/best-carbon-plate-running-shoes"],
  "status": "current", "releaseYear": 2025
}
```

- [ ] **Step 3: Validation test `catalogue.test.ts`**

```ts
import { SHOES, categoryMedianGbp } from '../catalogue';
test('catalogue loads and validates', () => { expect(SHOES.length).toBeGreaterThanOrEqual(55); });
test('every category populated', () => {
  for (const c of ['race','tempo','daily','max_cushion','stability','budget'] as const)
    expect(SHOES.filter(s => s.category === c).length).toBeGreaterThanOrEqual(5);
});
test('slugs unique', () => {
  expect(new Set(SHOES.map(s => s.slug)).size).toBe(SHOES.length);
});
test('medians sane', () => { expect(categoryMedianGbp('race')).toBeGreaterThan(180); });
```

- [ ] **Step 4: Run** `npx jest src/data` → PASS (fix transcription errors until green). Commit `feat: 60-shoe seed catalogue with zod validation`.

### Task 6: Evidence rules module

**Files:** Create: `src/data/rules.ts`, `src/data/__tests__/rules.test.ts`.

- [ ] **Step 1: rules.ts** — transcribe from `docs/research/2026-06-11-sports-science.md` (complete structure, all ~14 rules):

```ts
import type { Evidence } from '@/types/match';
export interface EvidenceRule {
  id: string; statement: string; citation: string; url: string;
  confidence: Evidence; effectNote?: string;
}
export const RULES: Record<string, EvidenceRule> = {
  'plate-pace-scaling': {
    id: 'plate-pace-scaling',
    statement: 'Carbon-plate + PEBA shoes improve running economy ~2.5–4% at faster paces; the benefit shrinks toward zero around 10 km/h.',
    citation: 'Hoogkamer et al. 2018; Kobayashi et al. 2026 meta-analysis; Dominy & Joubert 2022',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12827780/',
    confidence: 'STRONG', effectNote: 'RE −2.88% pooled; −1.4% at 12 km/h, NS at 10 km/h',
  },
  'rotation-injury': {
    id: 'rotation-injury',
    statement: 'Rotating more than one pair in parallel was associated with ~39% lower running-injury hazard.',
    citation: 'Malisoux et al. 2015, Scand J Med Sci Sports (HR 0.614, 95% CI 0.389–0.969)',
    url: 'https://www.fitasaphysio.com/uploads/4/3/3/4/43345381/parallel_use_of_2_pairs_of_running_shoes_decreases_injury.pdf',
    confidence: 'MODERATE',
  },
  // ... 'mass-economy' (Hoogkamer 2016, STRONG), 'drop-experience' (Malisoux 2016, MODERATE),
  // 'soft-midsole-light-runners' (Malisoux 2020, MODERATE), 'durable-foam-heavier' (EMERGING),
  // 'masters-rocker' (EMERGING), 'plate-bone-stress' (Tenforde 2023, EMERGING),
  // 'achilles-drop' (EMERGING), 'no-pronation-matching' (Nielsen 2014 + 2022 review, STRONG),
  // 'comfort-tiebreak' (Nigg 2015, FIT & FEEL), 'foam-energy-return' (STRONG),
  // 'womens-last' (MODERATE), 'transition-gradual' (Malisoux 2017, MODERATE)
};
```
(Executor: fill every rule completely from dossier 1 — statement, citation with effect size, URL, confidence. No placeholders.)

- [ ] **Step 2: Test** — every rule has non-empty statement/citation/url, valid confidence, `id === key`. Run `npx jest src/data` → PASS. Commit `feat: evidence rules with citations`.

### Task 7: Attribute score formulas (the FIFA stats)

**Files:** Create: `src/scores/formulas.ts`, `src/scores/__tests__/formulas.test.ts`.

- [ ] **Step 1: formulas.ts** (complete v1 — deterministic from shoe fields)

```ts
import type { Shoe, ShoeScores, Tier } from '@/types/shoe';
import { categoryMedianGbp } from '@/data/catalogue';
const clamp = (n: number, lo = 25, hi = 99) => Math.max(lo, Math.min(hi, Math.round(n)));
const FOAM_ENERGY: Record<Shoe['foamClass'], number> = { PEBA: 92, TPEE: 84, TPU: 68, BLEND: 72, EVA: 58 };
const FOAM_DUR: Record<Shoe['foamClass'], number> = { TPU: 86, EVA: 78, BLEND: 74, TPEE: 64, PEBA: 48 };
const PLATE_SPD: Record<Shoe['plate'], number> = { carbon: 96, composite: 84, none: 55 };
export function lgt(s: Shoe) { return clamp(99 - (s.weightG - 130) * (59 / 190)); }
export function spd(s: Shoe) { return clamp(0.45 * FOAM_ENERGY[s.foamClass] + 0.3 * PLATE_SPD[s.plate] + 0.25 * lgt(s)); }
export function csh(s: Shoe) { return clamp(s.stackHeelMm * 1.45 + s.softness * 6.5); }
export function stb(s: Shoe) { const base = [38, 54, 70, 85, 95][s.stability - 1]; return clamp(base + (s.widths.length > 1 ? 3 : 0)); }
export function dur(s: Shoe) { return clamp(0.62 * FOAM_DUR[s.foamClass] + s.outsole * 7 + (s.category === 'race' ? -6 : 0)); }
export function val(s: Shoe) {
  const med = categoryMedianGbp(s.category);
  return clamp(70 + ((med - s.msrpGbp) / med) * 55 + (dur(s) - 60) * 0.25);
}
const ROLE_WEIGHTS = { // overall = best role expression of the shoe
  race:   { spd: .5,  lgt: .25, csh: .1,  stb: .05, dur: .05, val: .05 },
  tempo:  { spd: .35, lgt: .15, csh: .15, stb: .1,  dur: .15, val: .1 },
  daily:  { spd: .1,  lgt: .1,  csh: .25, stb: .15, dur: .25, val: .15 },
  recovery:{ spd: .05, lgt: .05, csh: .4,  stb: .2,  dur: .15, val: .15 },
} as const;
export function computeScores(s: Shoe): ShoeScores {
  const v = { spd: spd(s), csh: csh(s), stb: stb(s), lgt: lgt(s), dur: dur(s), val: val(s) };
  const overall = Math.max(...Object.values(ROLE_WEIGHTS).map(w =>
    Math.round(w.spd * v.spd + w.csh * v.csh + w.stb * v.stb + w.lgt * v.lgt + w.dur * v.dur + w.val * v.val)));
  return { ...v, overall, tier: 'BRONZE', formulaVersion: 1 }; // tier assigned catalogue-relative below
}
// TIERS ARE DISTRIBUTION-BASED (like FUT itself): rank all current shoes by overall —
// top 10% ELITE, next 25% GOLD, next 40% SILVER, rest BRONZE. This guarantees the tier
// system tracks the live market instead of fighting absolute formula drift.
export function assignTiers(scored: Map<string, ShoeScores>): void {
  const ranked = [...scored.entries()].sort((a, b) => b[1].overall - a[1].overall);
  ranked.forEach(([, sc], i) => {
    const pct = i / ranked.length;
    sc.tier = pct < 0.10 ? 'ELITE' : pct < 0.35 ? 'GOLD' : pct < 0.75 ? 'SILVER' : 'BRONZE';
  });
}
```
Export `SCORED: Map<slug, ShoeScores>` built once from `SHOES` (compute + assignTiers) — app and engine read from it.

- [ ] **Step 2: Tests** — ordering/relative invariants on real catalogue data (NOT absolute thresholds that fight calibration): Vaporfly 4 `spd` > Ghost 17 `spd`; Ghost 17 `dur` > Vaporfly 4 `dur`; Kayano 32 `stb` ≥ 85; `val` of Revolution 8 > `val` of Adios Pro Evo 3; every shoe: all six stats in [25,99]; exactly ⌈10%⌉ of shoes are ELITE and Vaporfly 4 / Metaspeed Ray / Alphafly 4 rank in the top quartile by overall; Adizero Evo SL tier ∈ {ELITE, GOLD} (the consensus shoe must not read as scrap — spec §5.2 credibility); no NaN. Run `npx jest src/scores` → PASS (tune constants per plan decision 8 if needed).

- [ ] **Step 3: Commit** `feat: v1 attribute score formulas + tier assignment`.

### Task 8: Engine — units & paces

**Files:** Create: `src/engine/units.ts`, `src/engine/paces.ts`, tests for both.

- [ ] **Step 1: units.ts** — pure converters (complete): `kgFromLb`, `kgFromSt`, `kmFromMi`, `paceSecPerKmFromMinPerMile`, `fmtPace(secPerKm, units)`, `fmtDist`, `fmtWeight`. Round-trip tests.

- [ ] **Step 2: paces.ts** (complete)

```ts
import type { Profile } from '@/types/profile';
export const RIEGEL_EXP = 1.06;
export function marathonPaceSecPerKm(p: Profile): number | undefined {
  if (p.race) {
    const t42 = p.race.timeSec * Math.pow(42.195 / p.race.distanceKm, RIEGEL_EXP);
    return t42 / 42.195;
  }
  if (p.easyPaceSecPerKm) return p.easyPaceSecPerKm - 75; // easy ≈ MP + 60–90 s/km
  return undefined; // unknown → engine treats as slow/conservative
}
// Plate-benefit taper per spec §4.2: 1.0 at ≤275 s/km, linear to 0.3 at ≥375 s/km
export function plateFactor(mp?: number): number {
  if (mp === undefined) return 0.3;
  if (mp <= 275) return 1;
  if (mp >= 375) return 0.3;
  return 1 - ((mp - 275) / 100) * 0.7;
}
```

- [ ] **Step 3: Tests** — `plateFactor(275)===1`, `plateFactor(375)===0.3`, `plateFactor(325)` ≈ 0.65, monotonic; Riegel: 5k 20:00 → MP ≈ 265–280 s/km (formula yields ≈273). Run → PASS. Commit `feat: engine units and pace model`.

### Task 9: Engine — filters & role plan

**Files:** Create: `src/engine/filters.ts`, `src/engine/rolePlan.ts`, tests.

- [ ] **Step 1: filters.ts** (complete) — `hardFilter(shoes, profile): { eligible: Shoe[]; stretch: Shoe[] }`: status === 'current'; brand not in `brandBlocks`; if `fit.wide` → `widths.length > 1`; budget: perShoe → `msrpGbp ≤ amount` eligible, `≤ amount*1.1` stretch when `stretch` (total-budget mode passes everything through; rotation optimiser enforces the total).

- [ ] **Step 2: rolePlan.ts** (complete) — per spec §4.2-3:

```ts
import type { Profile, Role } from '@/types/profile';
export function planRoles(p: Profile): Role[] {
  if (p.mode === 'single') return [p.primaryIntent === 'everything' ? 'daily' : p.primaryIntent as Role];
  const wantsRace = p.raceDistanceTargetKm !== undefined;
  if (p.weeklyKm < 25) return wantsRace ? ['daily', 'race'] : ['daily'];
  if (p.weeklyKm <= 50) return wantsRace ? ['daily', 'tempo', 'race'] : ['daily', 'tempo'];
  return wantsRace ? ['daily', 'recovery', 'tempo', 'race'] : ['daily', 'recovery', 'tempo'];
}
```
Single+'everything' mode sets a flag the scorer uses for versatility weighting (Task 10).

- [ ] **Step 3: Tests** — table: (mode, weeklyKm, race?) → expected roles; budget filter edges (stretch boundary 110%). Run → PASS. Commit.

### Task 10: Engine — per-role scoring + modifiers

**Files:** Create: `src/engine/modifiers.ts`, `src/engine/scoring.ts`, tests.

- [ ] **Step 1: modifiers.ts** — each modifier is `(shoe, profile, role, ctx) => { delta: number; reason?: Reason }`, complete implementations per spec §4.2 (cites `RULES` ids):
  - `plateByPace`: race role only. Carbon: `+30 * factor − 18 * (1 − factor)` (the penalty term encodes "stiff heavy plate without the economy payoff" at slow paces — Dominy & Joubert). Composite: `+15 * factor`. When `factor < 0.6`, non-carbon shoes with `spd ≥ 70` get `+(0.6 − factor) * 30` ("lighter, bouncier non-plated racers promoted at your pace"). Net effect (verify in tests): at factor 1.0 carbon dominates; at factor 0.3 the best non-carbon options out-rank most carbon race shoes.
  - `raceDistance`: target ≤10k → `+0.15*lgt − 0.1*(stackHeel−30)`; marathon → `+8` if stackHeel ≥ 38.
  - `dailyDurability`: daily role — `+0.25*dur`; plate ≠ none → `−10` (mass-economy rule cite).
  - `recoverySoftness`: recovery — `+0.3*csh`; plate carbon → `−12` (plate-bone-stress precaution cite).
  - `tempoFit`: tempo — `+0.2*spd`, composite/none plate bonus `+5` (durability of platform).
  - `bodyMass`: >85 kg → `+6` if foamClass TPU/EVA/BLEND and outsole ≥ 4 (durable-foam-heavier, EMERGING); ≤60 kg → `+5` if softness ≥ 4 (soft-midsole-light-runners, MODERATE).
  - `experienceDrop`: experience !== 'new' && dropMm < 6 → `−8` + transition note (drop-experience); 'new' → no drop penalty.
  - `age`: ≥50 → `+4` if (stackHeel−stackFf ≥ 6 rocker proxy: stackFf ≥ 30) && csh ≥ 75 (masters-rocker, EMERGING).
  - `injuryFlags`: bone_stress → **carbon**-plate shoes outside race role `−100` (hard exclusion; flexible composite/nylon plates are NOT excluded — Tenforde 2023 concerns rigid CFP; note this distinction in the reason copy), race role cap note; achilles_calf → drop < 6 `−12` unless currentShoe drop < 6, drop ≥ 8 `+4` (achilles-drop — cite the dossier's masters/plantarflexor + AFT-Achilles items; confidence EMERGING, mechanistic); knee/plantar → reason-free nudge in `notes` only (NO score change — null evidence).
  - `stabilityPref`: wantsStability → `+0.2*stb`; NOT wanted → stability-category shoes `−6` outside daily role (never auto-prescribe).
  - `womensFit`: sex 'F' && womensLast → `+3` with fit-note reason (womens-last).
  - `brandLove`: brand in brandLoves → `+3` (FIT & FEEL).
  - `consensusBoost`: max `+5` — curated list of consensus darlings (Evo SL, Novablast 5, Endorphin Speed 5, Vaporfly 4, Metaspeed Ray, Rebel v5) as a const array of slugs ("COMMUNITY" sub-signal, shown separately). Add a `community-consensus` entry to RULES (confidence `FIT & FEEL`, citing the dossier's reviewer-consensus sources) so the every-ruleId-exists test holds.
  - `versatility` (single+everything only): category daily/tempo `+8`; race `−15`.
- [ ] **Step 2: scoring.ts** (complete core)

```ts
const CATEGORY_FIT: Record<Role, Record<Category, number>> = {
  race:     { race: 100, tempo: 72, daily: 40, max_cushion: 15, stability: 20, budget: 25 },
  tempo:    { race: 60, tempo: 100, daily: 70, max_cushion: 30, stability: 45, budget: 45 },
  daily:    { race: 15, tempo: 65, daily: 100, max_cushion: 80, stability: 80, budget: 75 },
  recovery: { race: 5,  tempo: 30, daily: 75, max_cushion: 100, stability: 70, budget: 60 },
};
// roleScore = 0.55 * categoryFit + Σ modifier deltas; match% = normalised vs role max (cap 99)
```
`scoreRole(shoes, profile, role)` returns sorted `ScoredShoe[]` with reasons = top-3 |delta| contributions mapped to RULES (+ always include category-fit line). Match% = `clamp(round(roleScore / THEORETICAL_MAX[role] * 100), 40, 99)` where `THEORETICAL_MAX` is a per-role constant (≈ `0.55*100 + plausible max modifier sum`, tuned so strong picks land ~86–96 — never a degenerate always-99 top pick; spec example shows 94).

- [ ] **Step 3: Tests (table-driven)** — fast racer (MP 270 s/km): top race pick has carbon plate; slow runner (easy pace 420 s/km): race top-3 includes ≥1 non-carbon shoe AND top race pick ≠ pure max-stack carbon marathon shoe; bone_stress: NO **carbon** plate outside race role anywhere in results; heavier runner (90 kg) daily pick foamClass ∈ TPU/EVA/BLEND; wantsStability=false → no stability-category race/tempo picks; top-pick match% ∈ [80, 99] and not uniformly 99 across personas; every reason's ruleId exists in RULES. Run → PASS (tune constants per plan decision 8). Commit `feat: per-role scoring with evidence-cited modifiers`.

### Task 11: Engine — rotation optimiser + assembly

**Files:** Create: `src/engine/rotation.ts`, `src/engine/explain.ts`, `src/engine/index.ts`, tests.

- [ ] **Step 1: rotation.ts** (complete) — greedy top pick per role from Task-10 rankings → enforce constraints via bounded swap pass (≤200 iterations): (a) total budget if `budget.type==='total'` (drop to next-best per role, protect race shoe if racing else daily); (b) diversity: ≥2 distinct foamClass AND any pair differs by Δdrop ≥ 2 OR plate status; (c) dedupe same slug across roles (next-best). If budget unreachable → single best versatile shoe + `notes` roadmap line ("add a race shoe next — est £X").

- [ ] **Step 2: explain.ts** — builds `notes[]`: rotation rationale (cite rotation-injury), transition warnings (drop change vs currentShoe, plate intro — cite transition-gradual), injury nudges ("consider a physio review" for any flag), budget summary.

- [ ] **Step 3: index.ts** — `runMatch(profile: Profile, shoes = SHOES): MatchResult`, `ENGINE_VERSION = '1.0.0'`, `RULESET_VERSION = '2026-06'`. Pure function, no I/O.

- [ ] **Step 4: Tests** — rotation for 60 km/wk racer on £450 total: 3–4 shoes, total ≤ 450, diversity satisfied, race slot carbon; £180 total: 1 shoe + roadmap note; determinism: `JSON.stringify(runMatch(p)) === JSON.stringify(runMatch(p))`. Run → PASS. Commit.

### Task 12: Engine — persona regression suite

**Files:** Create: `src/engine/__tests__/personas.test.ts`.

- [ ] **Step 1:** 10 named personas from spec §4.4 (PB-chaser, returner, masters, female BSI-history, heavy novice, light racer, budget student, zone-2-only, Achilles history, no-pace-data) each asserting 3–5 invariants (never raw snapshot — invariants survive formula tuning).
- [ ] **Step 2:** Full suite: `npx jest` → ALL PASS. `npx tsc --noEmit` → clean. Commit `test: persona regression suite`.

### Task 13: Quiz

**Files:** Create: `src/state/quizStore.ts`, `src/app/quiz/[step].tsx`, `src/components/ui/UnitInput.tsx`; Modify: `src/app/index.tsx` (landing).

- [ ] **Step 1: quizStore.ts** — zustand store: `Partial<Profile>` + `setField`, `currentStep`, `reset`, `toProfile()` (applies defaults: region UK, units metric, conservative pace when absent). **In-memory only in MVP** (no AsyncStorage/localStorage): settings changes (Task 15) mutate this store's defaults for the session; `reset` clears everything including injury flags — the privacy page states this explicitly (nothing stored server-side, nothing persisted across sessions).
- [ ] **Step 2: Step config** — `const STEPS: QuizStep[]` (11 entries per spec §6.3): each `{ id, title, subtitle?, component: 'choice'|'slider'|'unitNumber'|'pace'|'brands'|'budget'|'flags', options?, validate }`. Injury step includes GDPR consent copy + explicit opt-in checkbox + skip link (spec §6.3.11).
- [ ] **Step 3: `quiz/[step].tsx`** — renders config-driven step, ProgressDots, back/next, unit toggle inline on numeric inputs (kg↔st/lb, km↔mi, pace min/km↔min/mi via `units.ts`), brand chips from catalogue brands, current-shoe searchable picker from `SHOES`. Final step routes to `/reveal`.
- [ ] **Step 4: Landing `index.tsx`** — hero: looping idle ShoeCard (Task 14 component, static tilt), strapline, volt CTA → `/quiz/1`, science strip ("Built on 25+ peer-reviewed studies" → `/methodology`), footer links to legal pages.
- [ ] **Step 5: Manual check** — `npx expo start --web`: complete the quiz end-to-end, values persist between steps, units convert correctly. Commit `feat: 11-step quiz with metric/imperial`.

### Task 14: The card + reveal sequence

**Files:** Create: `src/components/card/{ShoeCard,StatPanel,TierFrame,HoloFoil.web.tsx,HoloFoil.tsx}`, `src/components/reveal/{RevealSequence.tsx,RoleBanner.tsx,CountUp.tsx,ParticleBurst.tsx,useTilt.ts}`, `src/app/reveal.tsx`.

- [ ] **Step 1: useTilt.ts** — web: pointermove over card → `{rx, ry}` shared values (reanimated) max ±10°; falls back to a slow idle sway loop (`withRepeat`) when no pointer. (Native gyro = Phase 3; file structure ready.)
- [ ] **Step 2: ShoeCard** — 320×460 layered card: TierFrame (2px tier-coloured border + dim outer ring), shoe image (`expo-image`-rendered remote URL with grey-tile fallback showing brand initial — images land via Task 16 config), counter-parallax (image translates −0.4× of tilt), StatPanel (six StatBars + overall + tier chip), name/meta row. Perspective transform from useTilt.
- [ ] **Step 3: HoloFoil.web.tsx** — absolutely-positioned overlay div via `createElement('div')` with CSS: two layered backgrounds (linear 115deg rainbow strip + radial glare), `mix-blend-mode: color-dodge`, `opacity .35`, background-position driven by tilt values (pokemon-cards-css technique); `HoloFoil.tsx` (native) renders null (Phase 3).
- [ ] **Step 4: Reveal orchestration** — `RevealSequence` phases via reanimated `withDelay/withSequence` exactly per spec §6.2: suspense (scanning line + cycling micro-copy, min 1500 ms) → stage dim → RoleBanner drop+wave → match% odometer (CountUp) → ParticleBurst if tier ELITE (24 SVG circles, radial velocities, gravity decay, 700 ms) → card scale-in slam (0.6→1.04→1, 450 ms) + shine sweep (rotated white gradient translateX) → staggered StatBar count-ups (80 ms apart) → CTAs fade in. "Skip" tappable from t=0 (jump to end state). `prefers-reduced-motion` (web media query) → static instant render.
- [ ] **Step 5: `reveal.tsx`** — runs `runMatch(toProfile())` in `useMemo`, stores result in `src/state/resultsStore.ts` (zustand, holds last MatchResult — create it here), sequential card reveals for rotation (Next card →), final → `/results`. Multi-card pacing per spec ("pack opening").
- [ ] **Step 6: Manual check** — full quiz → reveal at 60 fps, skip works, reduced-motion works. Commit `feat: FUT card reveal sequence with holo foil`.

### Task 15: Results, detail, browse, methodology, legal, settings

**Files:** Create: `src/app/{results,browse,methodology,settings}.tsx`, `src/app/shoe/[slug].tsx`, `src/app/legal/{disclosure,privacy,terms}.tsx`, `src/lib/{region.ts,format.ts}`.

- [ ] **Step 1: results.tsx** — fanned rotation summary (cards overlapped, tap to focus), totals vs budget bar, notes list (transition warnings, physio nudges), per-role row → `/shoe/[slug]`, "Start over", and a **"Copy my result"** button (clipboard text summary: picks + match% + app link placeholder — the client-side share from plan decision 5).
- [ ] **Step 2: shoe/[slug].tsx** — large card (tiltable), Nike-style spec rows (Weight/Drop/Stack/Foam/Plate with info tooltips), "Why this shoe" reason chips with evidence Badges (tap → citation + link), offers block (Task 16) with disclosure line, alternates carousel, consensus + athleteNotes (factual phrasing).
- [ ] **Step 3: browse.tsx** — Nike-listing-style grid (2-col), category filter chips, sorted by overall; card → detail.
- [ ] **Step 4: methodology.tsx** — renders ALL `RULES` grouped by confidence with citations/links, formula explanation (v1, published constants **including the percentile tier rule — plan decision 9**), §3.2 myth list ("what we deliberately don't do"), disclaimer.
- [ ] **Step 5: legal pages** — disclosure (affiliate commission, ASA/FTC wording), privacy (no accounts in MVP, what's stored locally, GDPR note re injury inputs incl. explicit-consent + delete-on-reset), terms (not medical advice). Settings: units/region toggles (persist in quizStore defaults).
- [ ] **Step 6: Manual pass of all routes; commit** `feat: results, detail, browse, methodology, legal`.

### Task 16: Affiliate + analytics adapters

**Files:** Create: `src/lib/affiliate.ts`, `src/lib/analytics.ts`, `src/data/offers.json`, test `src/lib/__tests__/affiliate.test.ts`.

- [ ] **Step 1: offers.json** — per shoe slug: array of `{ retailer: 'SportsShoes'|'RunnersNeed'|'Brand', region: 'UK'|'US', url, priceGbp, imageUrl?, checkedAt: '2026-06-12' }`. Seed with brand-site URLs + 1 UK retailer search-URL per shoe (manual snapshot per spec Phase 1; datafeeds are Phase 2). `imageUrl` only where a licensed source exists (brand press/newsroom) — else omit (card shows branded fallback tile).
- [ ] **Step 2: affiliate.ts** (complete) — `buildAffiliateUrl(offer, subId)`: if `process.env.EXPO_PUBLIC_SKIMLINKS_ID` set → Skimlinks redirect wrap `https://go.skimresources.com?id=<ID>&xs=1&url=<enc>&xcust=<subId>`; else raw URL. `subId = matchId:slug:placement`. Test: wraps when env set, passes through when not, encodes correctly.
- [ ] **Step 3: analytics.ts** — `track(event, props)`: PostHog via fetch if `EXPO_PUBLIC_POSTHOG_KEY` else `console.debug`. Events: quiz_start/step/complete, reveal_view, offer_click (subId). Wire into screens.
- [ ] **Step 4: Run tests; commit** `feat: affiliate link + analytics adapters (env-gated)`.

### Task 17: Supabase artifacts (deploy-deferred)

**Files:** Create: `supabase/migrations/0001_init.sql`, `supabase/functions/match/index.ts`, `supabase/seed/seed.ts`, `supabase/README.md`.

- [ ] **Step 1: 0001_init.sql** — full schema from spec §5.5 (brands, shoes, shoe_scores, evidence_rules, offers, profiles, matches, click_events; RLS enabled, anon read on shoes/scores/rules/offers; strava tables EXCLUDED — Phase 2 migration). Include `comment on` lines tying columns to spec sections. **Also add `"exclude": ["supabase", "dist", "e2e"]` to tsconfig.json** — the Deno wrapper (npm: specifiers, Deno global, generated bundle import) must not enter the app's `tsc --noEmit` / jest graph.
- [ ] **Step 2: Edge wrapper** — Deno handler: parse Profile JSON (zod via `npm:zod` specifier), call `runMatch` from the bundled engine — add `supabase/functions/match/deps.md` documenting the bundling command **with the alias flag** (the engine value-imports `@/data/catalogue` etc.): `npx esbuild src/engine/index.ts --bundle --format=esm --alias:@=./src --outfile=supabase/functions/match/engine.bundle.js` (esbuild inlines zod and shoes.json into the bundle — note resulting size is fine for Edge). Return MatchResult. CORS headers.
- [ ] **Step 3: seed.ts** — reads `src/data/shoes.json` + computed scores → SQL inserts (writes `supabase/seed/seed.sql`). Run generator with tsx (zero-config TS execution, handles `@/` aliases via its tsconfig support): `npx tsx supabase/seed/seed.ts` → file produced, spot-check 3 rows.
- [ ] **Step 4: supabase/README.md** — owner runbook: create project → `supabase db push` → run seed.sql → deploy function → set `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY` → flip `DATA_MODE=remote` (document the single switch point in `catalogue.ts`). Commit `feat: supabase schema, edge wrapper, seed generator (deploy deferred)`.

### Task 18: E2E + CI + export

**Files:** Create: `e2e/happy-path.spec.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`.

- [ ] **Step 1: playwright.config.ts** — run E2E against the **static export, not the dev server** (Metro cold-compile blows navigation timeouts and is non-deterministic in CI): `webServer: { command: 'npm run e2e:serve', url: 'http://localhost:4173', timeout: 180000, reuseExistingServer: true }`, chromium only. Add scripts: `"e2e:serve": "npx expo export --platform web && npx serve dist -s -l 4173"` (`-s` = SPA fallback so deep links like `/methodology` don't 404 against the static export).
- [ ] **Step 2: happy-path.spec.ts** — script the 11 steps with realistic inputs (40 km/wk racer, £400 rotation), skip reveal animation via the Skip control, assert: ≥2 result cards, a carbon-plate shoe in the race slot text, evidence badge visible, offer link href contains expected retailer or skimresources, methodology page renders ≥10 rules.
- [ ] **Step 3: Install browsers + run** — `npx playwright install chromium` then `npx playwright test` → PASS.
- [ ] **Step 4: ci.yml** — on push: `npm ci`, `npx tsc --noEmit`, `npx jest --ci`, `npx expo export --platform web`, `npx playwright install --with-deps chromium && npx playwright test`. (Runs once the owner adds a GitHub remote.)
- [ ] **Step 5: Production export** — `npx expo export --platform web` → `dist/` builds clean; add `npm run` scripts: `test`, `e2e`, `export:web`, `typecheck`. Commit `chore: e2e, CI workflow, web export scripts`.

### Task 19 (stretch, only if all above green): Compare screen + Skia foil

- [ ] Compare: `src/app/compare.tsx` — 2–3 shoes side-by-side StatBars (entry point from browse long-press/checkbox).
- [ ] Skia foil: port HoloFoil to `@shopify/react-native-skia` shader behind a feature flag; keep CSS version as web default unless Skia version measurably better.
- [ ] Commit individually.

### Final gate (verification-before-completion)

- [ ] `npx tsc --noEmit` clean · `npx jest` all green · `npx playwright test` green · `npx expo export --platform web` succeeds
- [ ] Walk every route manually in browser (landing → quiz → reveal → results → detail → browse → methodology → legal → settings)
- [ ] Optional (spec P1 exit criterion, skip if tooling unavailable): Lighthouse mobile perf against the served export — target ≥85; record the score in README either way
- [ ] README owner-checklist accurate (env vars, Supabase runbook, affiliate sign-up reminders, hosting step)
- [ ] Push docs copy of final plan state back to OneDrive docs folder (keep business archive in sync)
