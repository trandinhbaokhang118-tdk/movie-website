CREATE TABLE `catalog_sync_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`actor_email` text NOT NULL,
	`status` text NOT NULL,
	`imported_count` integer DEFAULT 0 NOT NULL,
	`trailer_count` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `imported_movies` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text DEFAULT 'tmdb' NOT NULL,
	`provider_id` integer NOT NULL,
	`title` text NOT NULL,
	`original_title` text NOT NULL,
	`release_year` integer,
	`overview` text NOT NULL,
	`poster_url` text,
	`backdrop_url` text,
	`vote_average_x10` integer DEFAULT 0 NOT NULL,
	`popularity_x100` integer DEFAULT 0 NOT NULL,
	`trailer_key` text,
	`trailer_site` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `imported_movies_provider_uq` ON `imported_movies` (`provider`,`provider_id`);