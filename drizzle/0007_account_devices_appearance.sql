ALTER TABLE `profiles` ADD `avatar_url` text;
--> statement-breakpoint
ALTER TABLE `profiles` ADD `theme` text DEFAULT 'cinewave' NOT NULL;
--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD `user_agent` text;
--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD `ip_address` text;
