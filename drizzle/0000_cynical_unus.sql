CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`event` text NOT NULL,
	`target` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_time` ON `audit` (`created`);--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`difficulty` text NOT NULL,
	`points` integer NOT NULL,
	`summary` text NOT NULL,
	`description` text NOT NULL,
	`tags` text NOT NULL,
	`artifact` text DEFAULT '' NOT NULL,
	`environment` text,
	`prerequisite` text,
	`featured` integer DEFAULT 0 NOT NULL,
	`flag_hash` text NOT NULL,
	`hint` text NOT NULL,
	`hint_cost` integer NOT NULL,
	`published` integer DEFAULT 1 NOT NULL,
	`author_id` text
);
--> statement-breakpoint
CREATE TABLE `limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `session_expiry` ON `sessions` (`expires`);--> statement-breakpoint
CREATE TABLE `solves` (
	`id` text PRIMARY KEY NOT NULL,
	`principal` text NOT NULL,
	`user_id` text NOT NULL,
	`challenge_id` text NOT NULL,
	`points` integer NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_solve_per_principal` ON `solves` (`principal`,`challenge_id`);--> statement-breakpoint
CREATE INDEX `solves_challenge` ON `solves` (`challenge_id`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`principal` text NOT NULL,
	`user_id` text NOT NULL,
	`challenge_id` text NOT NULL,
	`correct` integer NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `submissions_principal_time` ON `submissions` (`principal`,`created`);--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_id` text NOT NULL,
	`invite_hash` text NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_name_unique` ON `teams` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `teams_invite_hash_unique` ON `teams` (`invite_hash`);--> statement-breakpoint
CREATE TABLE `unlocks` (
	`id` text PRIMARY KEY NOT NULL,
	`principal` text NOT NULL,
	`challenge_id` text NOT NULL,
	`cost` integer NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_unlock_per_principal` ON `unlocks` (`principal`,`challenge_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'player' NOT NULL,
	`team_id` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_name_unique` ON `users` (`name`);