CREATE INDEX `playback_created_movie_idx` ON `playback_sessions` (`created_at`,`movie_id`);--> statement-breakpoint
CREATE INDEX `reactions_updated_movie_idx` ON `title_reactions` (`updated_at`,`movie_id`);--> statement-breakpoint
CREATE INDEX `progress_profile_updated_idx` ON `watch_progress` (`user_id`,`profile_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `watchlist_profile_created_idx` ON `watchlist` (`user_id`,`profile_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `watchlist_created_movie_idx` ON `watchlist` (`created_at`,`movie_id`);