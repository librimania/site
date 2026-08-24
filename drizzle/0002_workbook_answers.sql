CREATE TABLE IF NOT EXISTS `workbook_answers` (
  `student_id` integer NOT NULL,
  `workbook_id` text NOT NULL,
  `exercise_id` text NOT NULL,
  `item_id` text NOT NULL,
  `answer` text NOT NULL DEFAULT '',
  `is_correct` integer,
  `feedback` text,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(`student_id`,`workbook_id`,`exercise_id`,`item_id`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);

