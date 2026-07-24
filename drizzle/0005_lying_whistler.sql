CREATE TABLE `payment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`provider_transaction_id` text NOT NULL,
	`invoice_id` text,
	`amount_vnd` integer NOT NULL,
	`payload_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_events_provider_tx_uq` ON `payment_events` (`provider`,`provider_transaction_id`);--> statement-breakpoint
CREATE TABLE `payment_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_code` text NOT NULL,
	`amount_vnd` integer NOT NULL,
	`transfer_content` text NOT NULL,
	`provider` text DEFAULT 'sepay' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`provider_transaction_id` text,
	`reference_code` text,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`paid_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_invoices_transfer_uq` ON `payment_invoices` (`transfer_content`);