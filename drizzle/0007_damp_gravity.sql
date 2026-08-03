CREATE TABLE `runtime_metadata` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);

-- Account device and profile appearance columns are owned by
-- 0007_account_devices_appearance.sql so fresh and resumed deployments agree.
