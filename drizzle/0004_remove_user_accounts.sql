-- Remove user-owned records while preserving all application structure,
-- learning materials, Writing Trainer content, and dashboard code.
DELETE FROM `workbook_answers`;
--> statement-breakpoint
DELETE FROM `live_sessions`;
--> statement-breakpoint
DELETE FROM `teacher_notes`;
--> statement-breakpoint
DELETE FROM `student_groups`;
--> statement-breakpoint
DELETE FROM `progress`;
--> statement-breakpoint
DELETE FROM `students`;

