CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`storage_key` text NOT NULL,
	`kind` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`original_name` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_assets_storage_key_uq` ON `media_assets` (`storage_key`);--> statement-breakpoint
CREATE INDEX `media_assets_created_idx` ON `media_assets` (`created_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`window_started_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_limits_expires_idx` ON `rate_limits` (`expires_at`);--> statement-breakpoint
ALTER TABLE `managed_titles` ADD `subtitle_url` text;