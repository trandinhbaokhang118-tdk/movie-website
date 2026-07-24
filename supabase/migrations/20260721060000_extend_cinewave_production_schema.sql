-- CineWave production domains that complement the public movie catalog.
-- Administrative access is derived from immutable auth.app_metadata, never user_metadata.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  avatar_color text not null default '#8b7cff',
  avatar_url text,
  theme text not null default 'cinewave',
  maturity_rating text not null default 'T18' check (maturity_rating in ('P', 'K', 'T13', 'T16', 'T18')),
  is_kids boolean not null default false,
  locale text not null default 'vi-VN',
  subtitle_language text not null default 'vi',
  autoplay_next boolean not null default true,
  autoplay_previews boolean not null default false,
  pin_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.watch_history
  add column profile_id uuid references public.profiles(id) on delete cascade;
alter table public.favorites
  add column profile_id uuid references public.profiles(id) on delete cascade;
alter table public.favorites drop constraint favorites_user_id_movie_id_key;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null check (plan_code in ('free', 'basic', 'standard', 'premium')),
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  current_period_end timestamptz not null,
  provider text not null default 'cinewave',
  provider_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  provider text not null,
  provider_transaction_id text not null,
  amount_vnd bigint not null check (amount_vnd > 0),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_transaction_id)
);

create table public.playback_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'closed', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.title_reactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  reaction text not null check (reaction in ('love', 'like', 'not_for_me')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, movie_id)
);

create table public.content_rights (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  territory text not null default 'VN',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'approved' check (status in ('pending', 'approved', 'revoked', 'expired')),
  license_reference text not null,
  license_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (movie_id, territory, starts_at)
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  privacy_class text not null default 'essential' check (privacy_class in ('essential', 'analytics')),
  created_at timestamptz not null default now()
);

create table public.managed_titles (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid references public.movies(id) on delete set null,
  title text not null,
  original_title text not null default '',
  release_year smallint check (release_year between 1888 and 2200),
  content_type text not null default 'movie' check (content_type in ('movie', 'series')),
  genres text[] not null default '{}',
  maturity_rating text not null default 'T13',
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  synopsis text not null default '',
  poster_url text,
  video_url text,
  license_name text not null,
  license_url text not null,
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.imported_movies (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'tmdb',
  provider_id bigint not null,
  title text not null,
  original_title text not null default '',
  release_year smallint check (release_year between 1888 and 2200),
  overview text not null default '',
  poster_url text,
  backdrop_url text,
  vote_average numeric(4, 2) not null default 0,
  popularity numeric(12, 4) not null default 0,
  trailer_key text,
  trailer_site text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_id)
);

create table public.catalog_sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  actor_id uuid references auth.users(id) on delete set null,
  status text not null check (status in ('running', 'completed', 'failed')),
  imported_count integer not null default 0 check (imported_count >= 0),
  trailer_count integer not null default 0 check (trailer_count >= 0),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  initial_name text;
begin
  initial_name := coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1), 'CineWave');
  insert into public.users (id, display_name)
  values (new.id, left(initial_name, 120))
  on conflict (id) do nothing;

  insert into public.profiles (user_id, name)
  values (new.id, left(initial_name, 80))
  on conflict (user_id, name) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.handle_new_auth_user() to service_role;

create trigger users_set_updated_at before update on public.users
for each row execute function public.set_updated_at();
create trigger movies_set_updated_at before update on public.movies
for each row execute function public.set_updated_at();
create trigger episodes_set_updated_at before update on public.episodes
for each row execute function public.set_updated_at();
create trigger genres_set_updated_at before update on public.genres
for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();
create trigger playback_sessions_set_updated_at before update on public.playback_sessions
for each row execute function public.set_updated_at();
create trigger title_reactions_set_updated_at before update on public.title_reactions
for each row execute function public.set_updated_at();
create trigger content_rights_set_updated_at before update on public.content_rights
for each row execute function public.set_updated_at();
create trigger managed_titles_set_updated_at before update on public.managed_titles
for each row execute function public.set_updated_at();
create trigger imported_movies_set_updated_at before update on public.imported_movies
for each row execute function public.set_updated_at();

create index profiles_user_created_idx on public.profiles (user_id, created_at);
create index watch_history_profile_updated_idx on public.watch_history (profile_id, updated_at desc) where profile_id is not null;
create index favorites_profile_created_idx on public.favorites (profile_id, created_at desc) where profile_id is not null;
create unique index favorites_profile_movie_uq on public.favorites (profile_id, movie_id) where profile_id is not null;
create unique index favorites_user_movie_without_profile_uq on public.favorites (user_id, movie_id) where profile_id is null;
create index subscriptions_user_status_idx on public.subscriptions (user_id, status, current_period_end desc);
create unique index subscriptions_one_current_uq on public.subscriptions (user_id) where status in ('trialing', 'active', 'past_due');
create index payment_events_payment_idx on public.payment_events (payment_id) where payment_id is not null;
create index playback_sessions_user_status_idx on public.playback_sessions (user_id, status, expires_at);
create index playback_sessions_profile_created_idx on public.playback_sessions (profile_id, created_at desc);
create index playback_sessions_movie_created_idx on public.playback_sessions (movie_id, created_at desc);
create index playback_sessions_episode_idx on public.playback_sessions (episode_id) where episode_id is not null;
create index title_reactions_movie_updated_idx on public.title_reactions (movie_id, updated_at desc);
create index content_rights_movie_window_idx on public.content_rights (movie_id, territory, starts_at, ends_at) where status = 'approved';
create index analytics_events_user_created_idx on public.analytics_events (user_id, created_at desc) where user_id is not null;
create index analytics_events_profile_created_idx on public.analytics_events (profile_id, created_at desc) where profile_id is not null;
create index analytics_events_name_created_idx on public.analytics_events (event_name, created_at desc);
create index managed_titles_movie_idx on public.managed_titles (movie_id) where movie_id is not null;
create index managed_titles_status_updated_idx on public.managed_titles (status, updated_at desc);
create index managed_titles_created_by_idx on public.managed_titles (created_by) where created_by is not null;
create index imported_movies_popularity_idx on public.imported_movies (popularity desc, updated_at desc);
create index imported_movies_title_trgm_idx on public.imported_movies using gin (title extensions.gin_trgm_ops);
create index catalog_sync_runs_actor_created_idx on public.catalog_sync_runs (actor_id, created_at desc) where actor_id is not null;
create index catalog_sync_runs_status_created_idx on public.catalog_sync_runs (status, created_at desc);
create index audit_events_actor_created_idx on public.audit_events (actor_id, created_at desc) where actor_id is not null;
create index audit_events_target_created_idx on public.audit_events (target_type, target_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;
alter table public.playback_sessions enable row level security;
alter table public.title_reactions enable row level security;
alter table public.content_rights enable row level security;
alter table public.analytics_events enable row level security;
alter table public.managed_titles enable row level security;
alter table public.imported_movies enable row level security;
alter table public.catalog_sync_runs enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy profiles_delete_own on public.profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy subscriptions_select_own on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy playback_sessions_select_own on public.playback_sessions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy playback_sessions_insert_own on public.playback_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id and exists (
    select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid())
  ));
create policy playback_sessions_update_own on public.playback_sessions for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy playback_sessions_delete_own on public.playback_sessions for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy title_reactions_select_own on public.title_reactions for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid())));
create policy title_reactions_insert_own on public.title_reactions for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid())));
create policy title_reactions_update_own on public.title_reactions for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid())));
create policy title_reactions_delete_own on public.title_reactions for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid())));

create policy content_rights_read_current on public.content_rights for select to anon, authenticated
  using (status = 'approved' and now() between starts_at and ends_at);
create policy analytics_events_insert_own on public.analytics_events for insert to authenticated
  with check (
    ((select auth.uid()) = user_id or user_id is null)
    and (profile_id is null or exists (
      select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid())
    ))
  );
create policy managed_titles_read_published on public.managed_titles for select to anon, authenticated
  using (status = 'published');
create policy imported_movies_read_all on public.imported_movies for select to anon, authenticated using (true);

create policy managed_titles_admin_all on public.managed_titles for all to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy imported_movies_admin_all on public.imported_movies for all to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy catalog_sync_runs_admin_all on public.catalog_sync_runs for all to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy audit_events_admin_select on public.audit_events for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

grant select on public.content_rights, public.managed_titles, public.imported_movies to anon;
grant select on public.profiles, public.subscriptions, public.playback_sessions, public.title_reactions,
  public.content_rights, public.managed_titles, public.imported_movies, public.catalog_sync_runs,
  public.audit_events to authenticated;
grant insert, update, delete on public.profiles, public.playback_sessions, public.title_reactions to authenticated;
grant insert on public.analytics_events to authenticated;
grant insert, update, delete on public.managed_titles, public.imported_movies, public.catalog_sync_runs to authenticated;
grant all privileges on public.profiles, public.subscriptions, public.payment_events, public.playback_sessions,
  public.title_reactions, public.content_rights, public.analytics_events, public.managed_titles,
  public.imported_movies, public.catalog_sync_runs, public.audit_events to service_role;
