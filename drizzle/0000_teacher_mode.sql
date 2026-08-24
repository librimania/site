CREATE TABLE `students` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`access_code` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`last_seen_at` text,
	`created_at` text NOT NULL,
	CONSTRAINT "students_access_code_unique" UNIQUE("access_code")
);
--> statement-breakpoint
CREATE TABLE `progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`material_id` text NOT NULL,
	`material_title` text NOT NULL,
	`percent` integer DEFAULT 0 NOT NULL,
	`score` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_progress_student_id` ON `progress` (`student_id`);
--> statement-breakpoint
CREATE TABLE `live_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`material_type` text DEFAULT 'workbook' NOT NULL,
	`material_title` text DEFAULT 'Present Simple' NOT NULL,
	`page` integer DEFAULT 1 NOT NULL,
	`teacher_cursor_x` integer DEFAULT 30 NOT NULL,
	`teacher_cursor_y` integer DEFAULT 30 NOT NULL,
	`student_cursor_x` integer DEFAULT 70 NOT NULL,
	`student_cursor_y` integer DEFAULT 60 NOT NULL,
	`student_answer` text DEFAULT '' NOT NULL,
	`teacher_note` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_live_sessions_student` ON `live_sessions` (`student_id`,`active`);

