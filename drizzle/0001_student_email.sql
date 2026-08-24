ALTER TABLE `students` ADD `email` text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE INDEX `idx_students_email` ON `students` (`email`);

