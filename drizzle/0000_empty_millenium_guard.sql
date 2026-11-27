CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `releases` (
	`id` text PRIMARY KEY NOT NULL,
	`version_name` text NOT NULL,
	`version_code` integer NOT NULL,
	`release_date` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`min_android` text NOT NULL,
	`min_sdk` integer NOT NULL,
	`sha256` text NOT NULL,
	`signer_sha256` text NOT NULL,
	`object_key` text NOT NULL,
	`release_notes` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`active` integer DEFAULT false NOT NULL,
	`downloads` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `releases_version_code_unique` ON `releases` (`version_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `releases_object_key_unique` ON `releases` (`object_key`);--> statement-breakpoint
CREATE TABLE `screenshots` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`alt` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `screenshots_object_key_unique` ON `screenshots` (`object_key`);