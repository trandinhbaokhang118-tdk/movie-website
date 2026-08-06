begin;

create extension if not exists vector with schema extensions;

alter table public.movies
  add column if not exists embedding extensions.vector(384),
  add column if not exists embedding_model_version text,
  add column if not exists embedding_updated_at timestamptz;

comment on column public.movies.embedding is
  'Content embedding keyed by movies.id. Do not add an ANN index until recall/latency benchmarks justify it.';

create table public.recommendation_models (
  model_version text primary key,
  algorithm text not null,
  status text not null check (status in ('draft', 'shadow', 'canary', 'active', 'killed')),
  artifact_checksum text not null,
  feature_contract jsonb not null default '{}'::jsonb,
  offline_metrics jsonb not null default '{}'::jsonb,
  rollout_percent numeric(5, 2) not null default 0 check (rollout_percent between 0 and 100),
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  retired_at timestamptz
);

create unique index recommendation_models_one_active_uq
  on public.recommendation_models ((status)) where status = 'active';

create table public.recommendation_impressions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  model_version text not null references public.recommendation_models(model_version),
  surface text not null,
  movie_ids uuid[] not null check (cardinality(movie_ids) between 1 and 100),
  reason_codes jsonb not null default '[]'::jsonb check (jsonb_typeof(reason_codes) = 'array'),
  experiment_key text,
  variant text,
  created_at timestamptz not null default now(),
  unique (profile_id, request_id)
);

create table public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  impression_id uuid references public.recommendation_impressions(id) on delete set null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  model_version text references public.recommendation_models(model_version),
  event_type text not null check (event_type in ('impression', 'play', 'complete', 'save', 'like', 'love', 'not_for_me')),
  completion_ratio numeric(5, 4) check (completion_ratio between 0 and 1),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index recommendation_impressions_profile_created_idx
  on public.recommendation_impressions (profile_id, created_at desc);
create index recommendation_impressions_model_created_idx
  on public.recommendation_impressions (model_version, created_at desc);
create index recommendation_feedback_profile_created_idx
  on public.recommendation_feedback (profile_id, occurred_at desc);
create index recommendation_feedback_movie_created_idx
  on public.recommendation_feedback (movie_id, occurred_at desc);

alter table public.recommendation_models enable row level security;
alter table public.recommendation_impressions enable row level security;
alter table public.recommendation_feedback enable row level security;

create policy recommendation_models_read_released
on public.recommendation_models for select to authenticated
using (
  status in ('shadow', 'canary', 'active')
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

create policy recommendation_models_admin_all
on public.recommendation_models for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy recommendation_impressions_admin_select
on public.recommendation_impressions for select to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy recommendation_feedback_select_own
on public.recommendation_feedback for select to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = profile_id and p.user_id = (select auth.uid())
));

create policy recommendation_feedback_insert_own
on public.recommendation_feedback for insert to authenticated
with check (exists (
  select 1 from public.profiles p
  where p.id = profile_id and p.user_id = (select auth.uid())
));

create policy recommendation_feedback_admin_select
on public.recommendation_feedback for select to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

revoke all privileges on public.recommendation_models, public.recommendation_impressions,
  public.recommendation_feedback from anon, authenticated;
grant select, insert, update, delete on public.recommendation_models to authenticated;
grant select on public.recommendation_impressions to authenticated;
grant select, insert on public.recommendation_feedback to authenticated;
grant all privileges on public.recommendation_models, public.recommendation_impressions,
  public.recommendation_feedback to service_role;

insert into public.recommendation_models (
  model_version, algorithm, status, artifact_checksum, feature_contract, offline_metrics, rollout_percent, activated_at
) values
  (
    'cinewave-baseline-v1.0.0', 'editorial_popularity', 'active', 'builtin:cinewave-baseline-v1.0.0',
    '{"identity":"movie_id","signals":["editorial_match","trend"]}'::jsonb,
    '{}'::jsonb, 100, now()
  ),
  (
    'cinewave-hybrid-tfidf-v1.0.0', 'tfidf_hybrid_mmr', 'shadow', 'builtin:cinewave-hybrid-tfidf-v1.0.0',
    '{"identity":"movie_id","signals":["tfidf","reaction","completion","recency","trend","novelty"]}'::jsonb,
    '{"dataset_version":"cinewave-offline-eval-v1","minimum_recall_at_3":0.8}'::jsonb, 0, null
  )
on conflict (model_version) do nothing;

-- Intentionally no HNSW/IVFFlat index here. Add one in a later migration only
-- after exact-search recall, p95 latency, build time, and memory have been benchmarked.

commit;
