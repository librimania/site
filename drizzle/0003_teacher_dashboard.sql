CREATE TABLE IF NOT EXISTS `groups` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL UNIQUE,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `student_groups` (
  `student_id` integer PRIMARY KEY NOT NULL,
  `group_id` integer NOT NULL,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_student_groups_group_id` ON `student_groups` (`group_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `teacher_notes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `student_id` integer NOT NULL UNIQUE,
  `note` text NOT NULL DEFAULT '',
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `lesson_focus` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `material_id` text NOT NULL,
  `material_title` text NOT NULL,
  `group_id` integer,
  `active` integer NOT NULL DEFAULT 1,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_lesson_focus_active` ON `lesson_focus` (`active`);

