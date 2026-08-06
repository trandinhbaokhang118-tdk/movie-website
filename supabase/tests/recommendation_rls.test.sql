begin;

create extension if not exists pgtap with schema extensions;
select plan(15);

select has_extension('vector', 'pgvector extension is installed');
select has_column('public', 'movies', 'embedding', 'movies has an embedding column');
select has_column('public', 'movies', 'embedding_model_version', 'embedding version is explicit');
select has_table('public', 'recommendation_models', 'model registry exists');
select has_table('public', 'recommendation_impressions', 'impression log exists');
select has_table('public', 'recommendation_feedback', 'feedback log exists');
select has_index('public', 'recommendation_models', 'recommendation_models_one_active_uq', 'only one active model is allowed');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'viewer-one@cinewave.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Viewer One"}', now(), now()
  ),
  (
    '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'viewer-two@cinewave.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Viewer Two"}', now(), now()
  );

insert into public.movies (
  id, external_id, slug, title, synopsis, maturity_rating, status, published_at
) values (
  '20000000-0000-0000-0000-000000000001', 'test-movie-1', 'test-movie-1',
  'Test Movie 1', 'RLS fixture', 'T13', 'published', now()
);

select set_config(
  'test.viewer_two_profile_id',
  (select id::text from public.profiles where user_id = '10000000-0000-0000-0000-000000000002'),
  true
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","app_metadata":{"role":"viewer"}}', true);

select results_eq(
  $$select count(*) from public.recommendation_models$$,
  array[2::bigint],
  'authenticated viewers can read released model metadata'
);

select lives_ok(
  $$insert into public.recommendation_feedback (profile_id, movie_id, model_version, event_type)
    select id, '20000000-0000-0000-0000-000000000001', 'cinewave-hybrid-tfidf-v1.0.0', 'play'
    from public.profiles where user_id = '10000000-0000-0000-0000-000000000001'$$,
  'viewer can write feedback for their own profile'
);

select results_eq(
  $$select count(*) from public.recommendation_feedback$$,
  array[1::bigint],
  'viewer can read only their own feedback'
);

select throws_ok(
  $$insert into public.recommendation_feedback (profile_id, movie_id, model_version, event_type)
    values (current_setting('test.viewer_two_profile_id')::uuid,
      '20000000-0000-0000-0000-000000000001', 'cinewave-hybrid-tfidf-v1.0.0', 'play')$$,
  '42501',
  'new row violates row-level security policy for table "recommendation_feedback"',
  'viewer cannot write feedback for another profile'
);

select results_eq(
  $$select count(*) from public.recommendation_impressions$$,
  array[0::bigint],
  'viewer cannot see service-owned impression logs'
);

reset role;
insert into public.recommendation_impressions (profile_id, model_version, surface, movie_ids, reason_codes)
select id, 'cinewave-hybrid-tfidf-v1.0.0', 'home_for_you',
  array['20000000-0000-0000-0000-000000000001'::uuid], '["similar_content"]'::jsonb
from public.profiles
where user_id in ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","app_metadata":{"role":"admin"}}', true);

select results_eq(
  $$select count(*) from public.recommendation_impressions$$,
  array[2::bigint],
  'admin can audit all impression logs'
);

select lives_ok(
  $$insert into public.recommendation_models (model_version, algorithm, status, artifact_checksum)
    values ('cinewave-test-draft-v1', 'test', 'draft', 'test:checksum')$$,
  'admin can register a model version'
);

reset role;
set local role anon;
select throws_ok(
  $$select count(*) from public.recommendation_models$$,
  '42501',
  'permission denied for table recommendation_models',
  'anonymous users cannot read model metadata'
);

select * from finish();
rollback;
