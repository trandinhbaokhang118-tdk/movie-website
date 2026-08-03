CREATE TABLE `editorial_contents` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`excerpt` text NOT NULL,
	`body` text NOT NULL,
	`category` text NOT NULL,
	`cover_url` text,
	`media_url` text,
	`scheduled_at` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`engagement_count` integer DEFAULT 0 NOT NULL,
	`completion_rate` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`published_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `editorial_contents_slug_uq` ON `editorial_contents` (`slug`);--> statement-breakpoint
CREATE INDEX `editorial_contents_kind_status_idx` ON `editorial_contents` (`kind`,`status`,`updated_at`);