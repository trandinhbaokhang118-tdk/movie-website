create index comments_parent_idx on public.comments (parent_id) where parent_id is not null;
create index watch_history_episode_idx on public.watch_history (episode_id) where episode_id is not null;
