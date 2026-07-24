create extension if not exists pg_trgm with schema extensions;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.movies (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  slug text not null unique,
  title text not null,
  original_title text,
  synopsis text not null default '',
  release_year smallint check (release_year between 1888 and 2200),
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  maturity_rating text not null default 'T13' check (maturity_rating in ('P', 'K', 'T13', 'T16', 'T18')),
  poster_url text,
  backdrop_url text,
  trailer_url text,
  video_path text,
  storage_provider text not null default 'cloudflare_r2',
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  popularity_score numeric(12, 4) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  season_number integer not null default 1 check (season_number > 0),
  episode_number integer not null check (episode_number > 0),
  title text not null,
  synopsis text not null default '',
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  video_path text,
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (movie_id, season_number, episode_number)
);

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.movie_genres (
  movie_id uuid not null references public.movies(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (movie_id, genre_id)
);

create table public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  position_seconds integer not null default 0 check (position_seconds >= 0),
  completed boolean not null default false,
  watched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, movie_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'published' check (status in ('pending', 'published', 'hidden')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  provider text not null default 'sepay',
  provider_transaction_id text,
  reference_code text not null unique,
  amount_vnd bigint not null check (amount_vnd > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired', 'refunded')),
  payload jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index movies_status_published_idx on public.movies (status, published_at desc, popularity_score desc);
create index movies_release_year_idx on public.movies (release_year desc) where status = 'published';
create index movies_title_trgm_idx on public.movies using gin (title extensions.gin_trgm_ops);
create index movies_original_title_trgm_idx on public.movies using gin (original_title extensions.gin_trgm_ops);
create index episodes_movie_status_idx on public.episodes (movie_id, status, season_number, episode_number);
create index movie_genres_genre_movie_idx on public.movie_genres (genre_id, movie_id);
create index watch_history_user_updated_idx on public.watch_history (user_id, updated_at desc);
create index watch_history_movie_watched_idx on public.watch_history (movie_id, watched_at desc);
create index favorites_user_created_idx on public.favorites (user_id, created_at desc);
create index favorites_movie_created_idx on public.favorites (movie_id, created_at desc);
create index comments_movie_created_idx on public.comments (movie_id, created_at desc) where deleted_at is null;
create index comments_user_created_idx on public.comments (user_id, created_at desc);
create index payments_user_created_idx on public.payments (user_id, created_at desc);
create unique index payments_provider_transaction_uq on public.payments (provider, provider_transaction_id)
  where provider_transaction_id is not null;

alter table public.users enable row level security;
alter table public.movies enable row level security;
alter table public.episodes enable row level security;
alter table public.genres enable row level security;
alter table public.movie_genres enable row level security;
alter table public.watch_history enable row level security;
alter table public.favorites enable row level security;
alter table public.comments enable row level security;
alter table public.payments enable row level security;

create policy users_select_own on public.users for select to authenticated
  using ((select auth.uid()) = id);
create policy users_update_own on public.users for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy movies_read_published on public.movies for select to anon, authenticated
  using (status = 'published');
create policy episodes_read_published on public.episodes for select to anon, authenticated
  using (status = 'published' and exists (
    select 1 from public.movies where movies.id = episodes.movie_id and movies.status = 'published'
  ));
create policy genres_read_all on public.genres for select to anon, authenticated using (true);
create policy movie_genres_read_published on public.movie_genres for select to anon, authenticated
  using (exists (
    select 1 from public.movies where movies.id = movie_genres.movie_id and movies.status = 'published'
  ));
create policy watch_history_select_own on public.watch_history for select to authenticated
  using ((select auth.uid()) = user_id);
create policy watch_history_insert_own on public.watch_history for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy watch_history_update_own on public.watch_history for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy watch_history_delete_own on public.watch_history for delete to authenticated
  using ((select auth.uid()) = user_id);
create policy favorites_select_own on public.favorites for select to authenticated
  using ((select auth.uid()) = user_id);
create policy favorites_insert_own on public.favorites for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy favorites_update_own on public.favorites for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy favorites_delete_own on public.favorites for delete to authenticated
  using ((select auth.uid()) = user_id);
create policy comments_read_published on public.comments for select to anon, authenticated
  using (status = 'published' and deleted_at is null);
create policy comments_insert_own on public.comments for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy comments_update_own on public.comments for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy comments_delete_own on public.comments for delete to authenticated
  using ((select auth.uid()) = user_id);
create policy payments_select_own on public.payments for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace view public.movie_catalog
with (security_invoker = true)
as
select
  m.id,
  m.external_id,
  m.slug,
  m.title,
  m.original_title,
  m.synopsis,
  m.release_year,
  m.duration_seconds,
  m.maturity_rating,
  m.poster_url,
  m.backdrop_url,
  m.trailer_url,
  m.video_path,
  m.storage_provider,
  m.popularity_score,
  m.metadata,
  m.published_at,
  coalesce(array_agg(g.name order by g.name) filter (where g.id is not null), '{}') as genres
from public.movies m
left join public.movie_genres mg on mg.movie_id = m.id
left join public.genres g on g.id = mg.genre_id
where m.status = 'published'
group by m.id;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.movies, public.episodes, public.genres, public.movie_genres, public.comments, public.movie_catalog to anon;
grant select on public.users, public.movies, public.episodes, public.genres, public.movie_genres,
  public.watch_history, public.favorites, public.comments, public.payments, public.movie_catalog to authenticated;
grant insert, update, delete on public.watch_history, public.favorites, public.comments to authenticated;
grant update on public.users to authenticated;
grant all privileges on all tables in schema public to service_role;
