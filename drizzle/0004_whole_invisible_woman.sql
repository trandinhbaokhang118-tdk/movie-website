CREATE TABLE `managed_titles` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`original_title` text NOT NULL,
	`release_year` integer NOT NULL,
	`content_type` text DEFAULT 'movie' NOT NULL,
	`genres` text NOT NULL,
	`maturity` text DEFAULT 'T13' NOT NULL,
	`duration` text NOT NULL,
	`synopsis` text NOT NULL,
	`poster_url` text,
	`video_url` text,
	`license_name` text NOT NULL,
	`license_url` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`published_at` text
);
--> statement-breakpoint
ALTER TABLE `users` ADD `status` text DEFAULT 'active' NOT NULL;