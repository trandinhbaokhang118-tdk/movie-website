CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text,
	`event_name` text NOT NULL,
	`properties_json` text DEFAULT '{}' NOT NULL,
	`privacy_class` text DEFAULT 'essential' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_rights` (
	`id` text PRIMARY KEY NOT NULL,
	`movie_id` text NOT NULL,
	`territory` text DEFAULT 'VN' NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`status` text DEFAULT 'approved' NOT NULL,
	`license_reference` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `playback_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`movie_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_code` text NOT NULL,
	`status` text NOT NULL,
	`current_period_end` text NOT NULL,
	`provider` text DEFAULT 'cinewave_sandbox' NOT NULL,
	`provider_customer_id` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `title_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`movie_id` text NOT NULL,
	`reaction` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reaction_profile_movie_uq` ON `title_reactions` (`profile_id`,`movie_id`);--> statement-breakpoint
DROP INDEX `progress_user_movie_uq`;--> statement-breakpoint
ALTER TABLE `watch_progress` ADD `profile_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `watch_progress` SET `profile_id` = COALESCE((SELECT `id` FROM `profiles` WHERE `profiles`.`user_id` = `watch_progress`.`user_id` ORDER BY `created_at` ASC LIMIT 1), '');--> statement-breakpoint
CREATE UNIQUE INDEX `progress_profile_movie_uq` ON `watch_progress` (`profile_id`,`movie_id`);--> statement-breakpoint
DROP INDEX `watchlist_user_movie_uq`;--> statement-breakpoint
ALTER TABLE `watchlist` ADD `profile_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `watchlist` SET `profile_id` = COALESCE((SELECT `id` FROM `profiles` WHERE `profiles`.`user_id` = `watchlist`.`user_id` ORDER BY `created_at` ASC LIMIT 1), '');--> statement-breakpoint
CREATE UNIQUE INDEX `watchlist_profile_movie_uq` ON `watchlist` (`profile_id`,`movie_id`);--> statement-breakpoint
ALTER TABLE `profiles` ADD `locale` text DEFAULT 'vi-VN' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `subtitle_language` text DEFAULT 'vi' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `autoplay_next` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `autoplay_previews` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `pin_hash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `active_profile_id` text;--> statement-breakpoint
UPDATE `users` SET `active_profile_id` = (SELECT `id` FROM `profiles` WHERE `profiles`.`user_id` = `users`.`id` ORDER BY `created_at` ASC LIMIT 1);--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'viewer' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `analytics_consent` integer DEFAULT false NOT NULL;
