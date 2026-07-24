create policy payment_events_deny_client_access
on public.payment_events
for all
to anon, authenticated
using (false)
with check (false);

drop policy managed_titles_read_published on public.managed_titles;
drop policy managed_titles_admin_all on public.managed_titles;

create policy managed_titles_read_published_anon
on public.managed_titles for select to anon
using (status = 'published');

create policy managed_titles_read_visible_authenticated
on public.managed_titles for select to authenticated
using (
  status = 'published'
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

create policy managed_titles_admin_insert
on public.managed_titles for insert to authenticated
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy managed_titles_admin_update
on public.managed_titles for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy managed_titles_admin_delete
on public.managed_titles for delete to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy imported_movies_read_all on public.imported_movies;
drop policy imported_movies_admin_all on public.imported_movies;

create policy imported_movies_read_all_anon
on public.imported_movies for select to anon using (true);

create policy imported_movies_read_all_authenticated
on public.imported_movies for select to authenticated using (true);

create policy imported_movies_admin_insert
on public.imported_movies for insert to authenticated
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy imported_movies_admin_update
on public.imported_movies for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy imported_movies_admin_delete
on public.imported_movies for delete to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
