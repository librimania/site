import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const teacherAccounts = sqliteTable("teacher_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull().default("Teacher"),
  passwordHash: text("password_hash"),
  passwordSalt: text("password_salt"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  accessCode: text("access_code").notNull().unique(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  lastSeenAt: text("last_seen_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const authSessions = sqliteTable("auth_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  accountType: text("account_type", { enum: ["teacher", "student"] }).notNull(),
  teacherId: integer("teacher_id").references(() => teacherAccounts.id, { onDelete: "cascade" }),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [index("idx_auth_sessions_expires_at").on(table.expiresAt)]);

export const progress = sqliteTable("progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  materialId: text("material_id").notNull(),
  materialTitle: text("material_title").notNull(),
  percent: integer("percent").notNull().default(0),
  score: text("score"),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const liveSessions = sqliteTable("live_sessions", {
  id: text("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  materialType: text("material_type").notNull().default("workbook"),
  materialTitle: text("material_title").notNull().default("Present Simple"),
  page: integer("page").notNull().default(1),
  teacherCursorX: integer("teacher_cursor_x").notNull().default(30),
  teacherCursorY: integer("teacher_cursor_y").notNull().default(30),
  studentCursorX: integer("student_cursor_x").notNull().default(70),
  studentCursorY: integer("student_cursor_y").notNull().default(60),
  studentAnswer: text("student_answer").notNull().default(""),
  teacherNote: text("teacher_note").notNull().default(""),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const groups = sqliteTable("groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const studentGroups = sqliteTable("student_groups", {
  studentId: integer("student_id").primaryKey().references(() => students.id, { onDelete: "cascade" }),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
});

export const teacherNotes = sqliteTable("teacher_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull().unique().references(() => students.id, { onDelete: "cascade" }),
  note: text("note").notNull().default(""),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const lessonFocus = sqliteTable("lesson_focus", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  materialId: text("material_id").notNull(),
  materialTitle: text("material_title").notNull(),
  groupId: integer("group_id").references(() => groups.id, { onDelete: "cascade" }),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const materialCatalog = sqliteTable("material_catalog", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  materialType: text("material_type").notNull(),
  route: text("route").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const studentMaterials = sqliteTable("student_materials", {
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  materialId: text("material_id").notNull().references(() => materialCatalog.id, { onDelete: "cascade" }),
  assignedBy: integer("assigned_by").references(() => teacherAccounts.id, { onDelete: "set null" }),
  assignedAt: text("assigned_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  primaryKey({ columns: [table.studentId, table.materialId] }),
  index("idx_student_materials_material_id").on(table.materialId),
]);

export const writingProgress = sqliteTable("writing_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  exam: text("exam").notNull(),
  topicId: text("topic_id").notNull(),
  essayId: text("essay_id").notNull(),
  stage: text("stage").notNull().default("vocabulary"),
  draft: text("draft").notNull().default(""),
  teacherFeedback: text("teacher_feedback").notNull().default(""),
  score: integer("score"),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [index("idx_writing_progress_student_id").on(table.studentId)]);

export const vocabularyEntries = sqliteTable("vocabulary_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  word: text("word").notNull(),
  translation: text("translation").notNull().default(""),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [index("idx_vocabulary_entries_student_id").on(table.studentId)]);

