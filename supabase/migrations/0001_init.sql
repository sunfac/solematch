-- SoleMatch schema v1 (spec §5.5). Phase-2 deploy target; Strava tables arrive
-- in a later migration. RLS: public catalogue readable by anon; user tables locked.

create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);
comment on table brands is 'Spec §5.5 — shoe manufacturers';

create table shoes (
  id text primary key,                       -- slug, matches src/data/shoes.json ids
  brand_id uuid not null references brands(id),
  model text not null,
  version text not null,
  slug text not null unique,
  category text not null check (category in ('race','tempo','daily','max_cushion','stability','budget')),
  msrp_usd numeric not null check (msrp_usd > 0),
  msrp_gbp numeric not null check (msrp_gbp > 0),
  price_approx boolean not null default false,
  weight_g numeric not null,
  drop_mm numeric not null,
  stack_heel_mm numeric not null,
  stack_ff_mm numeric not null,
  foam_name text not null,
  foam_class text not null check (foam_class in ('PEBA','TPEE','TPU','EVA','BLEND')),
  plate text not null check (plate in ('carbon','composite','none')),
  widths text[] not null default '{standard}',
  womens_last boolean not null default false,
  softness int not null check (softness between 1 and 5),
  stability int not null check (stability between 1 and 5),
  outsole int not null check (outsole between 1 and 5),
  consensus_line text not null,
  athlete_notes text,
  source_urls jsonb not null default '[]',
  status text not null default 'current' check (status in ('current','superseded','upcoming')),
  successor_id text references shoes(id),
  release_year int not null,
  spec_estimated boolean not null default false,
  updated_at timestamptz not null default now()
);
comment on table shoes is 'Spec §5.5 — catalogue of real shoes, facts only (Feist)';

create table shoe_scores (
  shoe_id text primary key references shoes(id) on delete cascade,
  spd int not null, csh int not null, stb int not null,
  lgt int not null, dur int not null, val int not null,
  overall int not null,
  tier text not null check (tier in ('ELITE','GOLD','SILVER','BRONZE')),
  formula_version int not null,
  computed_at timestamptz not null default now()
);
comment on table shoe_scores is 'Spec §5.2 — derived six-stat card scores, percentile tiers (plan decision 9)';

create table evidence_rules (
  id text primary key,
  statement text not null,
  citation text not null,
  url text not null,
  confidence text not null check (confidence in ('STRONG','MODERATE','EMERGING','FIT & FEEL')),
  effect_note text
);
comment on table evidence_rules is 'Spec §3 — the published evidence base; mirrors src/data/rules.ts';

create table offers (
  id uuid primary key default gen_random_uuid(),
  shoe_id text not null references shoes(id) on delete cascade,
  retailer text not null,
  network text,
  region text not null check (region in ('UK','US')),
  price numeric not null,
  currency text not null default 'GBP',
  affiliate_url text not null,
  image_url text,
  in_stock boolean not null default true,
  feed_updated_at timestamptz not null default now()
);
create index offers_shoe_region on offers(shoe_id, region);
comment on table offers is 'Spec §5.4/§9 — datafeed-ingested prices + licensed imagery (image licence dies with the programme)';

create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  units text not null default 'metric',
  region text not null default 'UK',
  sex text, birth_year int, weight_kg numeric,
  weekly_km numeric, easy_pace_s numeric,
  race_results jsonb, experience text,
  intents text[], injury_flags text[],     -- special-category: explicit consent gated in app
  fit_prefs jsonb, brand_prefs jsonb, budget jsonb,
  created_at timestamptz not null default now()
);
comment on table profiles is 'Spec §5.5 — Phase-2 saved profiles; anonymous MVP never writes here';

create table matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  profile_snapshot jsonb not null,
  results jsonb not null,
  engine_version text not null,
  ruleset_version text not null,
  share_slug text unique,
  created_at timestamptz not null default now()
);
comment on table matches is 'Spec §4.3 — versioned, reproducible match results';

create table click_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete set null,
  offer_id uuid references offers(id) on delete set null,
  sub_id text not null,
  ts timestamptz not null default now()
);
comment on table click_events is 'Spec §9 — affiliate revenue attribution by subId';

-- Row level security
alter table brands enable row level security;
alter table shoes enable row level security;
alter table shoe_scores enable row level security;
alter table evidence_rules enable row level security;
alter table offers enable row level security;
alter table profiles enable row level security;
alter table matches enable row level security;
alter table click_events enable row level security;

create policy "catalogue readable" on brands for select using (true);
create policy "shoes readable" on shoes for select using (true);
create policy "scores readable" on shoe_scores for select using (true);
create policy "rules readable" on evidence_rules for select using (true);
create policy "offers readable" on offers for select using (true);

create policy "own profile" on profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own matches" on matches for select using (auth.uid() = user_id);
create policy "insert matches" on matches for insert with check (true);
create policy "insert clicks" on click_events for insert with check (true);
