CREATE TABLE IF NOT EXISTS `teacher_accounts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL UNIQUE,
  `display_name` text NOT NULL DEFAULT 'Teacher',
  `password_hash` text,
  `password_salt` text,
  `active` integer NOT NULL DEFAULT 1,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `auth_sessions` (
  `token_hash` text PRIMARY KEY NOT NULL,
  `account_type` text NOT NULL CHECK (`account_type` IN ('teacher', 'student')),
  `teacher_id` integer,
  `student_id` integer,
  `expires_at` text NOT NULL,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((`account_type` = 'teacher' AND `teacher_id` IS NOT NULL AND `student_id` IS NULL)
    OR (`account_type` = 'student' AND `student_id` IS NOT NULL AND `teacher_id` IS NULL)),
  FOREIGN KEY (`teacher_id`) REFERENCES `teacher_accounts`(`id`) ON DELETE cascade,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_auth_sessions_expires_at` ON `auth_sessions` (`expires_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `material_catalog` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `material_type` text NOT NULL,
  `route` text NOT NULL,
  `active` integer NOT NULL DEFAULT 1,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `student_materials` (
  `student_id` integer NOT NULL,
  `material_id` text NOT NULL,
  `assigned_by` integer,
  `assigned_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`, `material_id`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade,
  FOREIGN KEY (`material_id`) REFERENCES `material_catalog`(`id`) ON DELETE cascade,
  FOREIGN KEY (`assigned_by`) REFERENCES `teacher_accounts`(`id`) ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_student_materials_material_id` ON `student_materials` (`material_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `writing_progress` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `student_id` integer NOT NULL,
  `exam` text NOT NULL,
  `topic_id` text NOT NULL,
  `essay_id` text NOT NULL,
  `stage` text NOT NULL DEFAULT 'vocabulary',
  `draft` text NOT NULL DEFAULT '',
  `teacher_feedback` text NOT NULL DEFAULT '',
  `score` integer,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_writing_progress_student_id` ON `writing_progress` (`student_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `vocabulary_entries` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `student_id` integer NOT NULL,
  `word` text NOT NULL,
  `translation` text NOT NULL DEFAULT '',
  `note` text NOT NULL DEFAULT '',
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_vocabulary_entries_student_id` ON `vocabulary_entries` (`student_id`);
--> statement-breakpoint
INSERT INTO `material_catalog` (`id`, `title`, `material_type`, `route`)
VALUES
  ('present-simple-travel', 'Present Simple: Travel Edition', 'workbook', '/workbooks/present-simple-travel'),
  ('phil-casey-flight-adventure', 'Phil & Casey: Flight Adventure', 'game', 'https://phil-casey-flight-adventure.rinercomconstruct.chatgpt.site/'),
  ('writing-trainer-bac', 'BAC Writing Trainer', 'writing-trainer', '/writing-trainer/bac')
ON CONFLICT (`id`) DO UPDATE SET
  `title` = excluded.`title`,
  `material_type` = excluded.`material_type`,
  `route` = excluded.`route`,
  `updated_at` = CURRENT_TIMESTAMP;
--> statement-breakpoint
PRAGMA optimize;

