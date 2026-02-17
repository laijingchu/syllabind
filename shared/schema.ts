import { pgTable, text, integer, boolean, jsonb, timestamp, varchar, serial, primaryKey, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

/**
 * SCHEMA NOTE:
 * - Foreign keys for creator_id and student_id reference users.username (unique)
 * - Other user references use users.id (UUID)
 * - Fully normalized schema: Only sessions.sess uses JSONB (required by express-session)
 * - Step completion tracking uses completed_steps junction table
 */

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [
    index("sessions_expire_idx").on(table.expire),
  ]
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(),
  password: text("password"),
  replitId: text("replit_id").unique(),
  googleId: text("google_id").unique(),
  appleId: text("apple_id").unique(),
  username: text("username").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  isCreator: boolean("is_creator").default(false),
  bio: text("bio"),
  expertise: text("expertise"),
  linkedin: text("linkedin"),
  website: text("website"),
  twitter: text("twitter"),
  threads: text("threads"),
  shareProfile: boolean("share_profile").default(true),
  authProvider: text("auth_provider").default('email'),
});

export const syllabinds = pgTable("syllabi", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  audienceLevel: text("audience_level").notNull(), // 'Beginner', 'Intermediate', 'Advanced'
  durationWeeks: integer("duration_weeks").notNull(),
  status: text("status").notNull().default('draft'), // 'draft', 'published'
  creatorId: text("creator_id").references(() => users.username, { onDelete: 'set null', onUpdate: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  studentActive: integer("student_active").default(0),
  studentsCompleted: integer("students_completed").default(0),
}, (table) => [
  index("syllabi_creator_id_idx").on(table.creatorId),
  index("syllabi_status_idx").on(table.status),
]);

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").references(() => users.username, { onDelete: 'cascade', onUpdate: 'cascade' }),
  syllabusId: integer("syllabus_id").references(() => syllabinds.id),
  status: text("status").notNull().default('in-progress'), // 'in-progress', 'completed', 'dropped'
  currentWeekIndex: integer("current_week_index").default(1),
  shareProfile: boolean("share_profile").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  uniqueIndex("enrollments_student_syllabus_idx").on(table.studentId, table.syllabusId),
  index("enrollments_student_id_idx").on(table.studentId),
  index("enrollments_syllabus_id_idx").on(table.syllabusId),
]);

// Normalized tables for syllabus content
export const weeks = pgTable("weeks", {
  id: serial("id").primaryKey(),
  syllabusId: integer("syllabus_id")
    .references(() => syllabinds.id, { onDelete: 'cascade' })
    .notNull(),
  index: integer("index").notNull(), // 1, 2, 3, 4...
  title: text("title"),
  description: text("description"),
}, (table) => [
  index("weeks_syllabus_id_idx").on(table.syllabusId),
  uniqueIndex("weeks_syllabus_id_index_idx").on(table.syllabusId, table.index),
]);

export const steps = pgTable("steps", {
  id: serial("id").primaryKey(),
  weekId: integer("week_id")
    .references(() => weeks.id, { onDelete: 'cascade' })
    .notNull(),
  position: integer("position").notNull(), // Order within week
  type: text("type").notNull(), // 'reading' | 'exercise'
  title: text("title").notNull(),
  url: text("url"),
  note: text("note"),
  author: text("author"),
  creationDate: text("creation_date"),
  mediaType: text("media_type"), // 'Book' | 'Youtube video' | 'Blog/Article' | 'Podcast'
  promptText: text("prompt_text"),
  estimatedMinutes: integer("estimated_minutes"),
}, (table) => [
  index("steps_week_id_idx").on(table.weekId),
]);

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id")
    .references(() => enrollments.id, { onDelete: 'cascade' })
    .notNull(),
  stepId: integer("step_id")
    .references(() => steps.id, { onDelete: 'cascade' })
    .notNull(),
  answer: text("answer").notNull(),
  isShared: boolean("is_shared").default(false).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  // Creator feedback fields
  feedback: text("feedback"),
  grade: text("grade"),
  rubricUrl: text("rubric_url"),
}, (table) => [
  index("submissions_enrollment_id_idx").on(table.enrollmentId),
  index("submissions_step_id_idx").on(table.stepId),
]);

// Normalized completion tracking
export const completedSteps = pgTable("completed_steps", {
  enrollmentId: integer("enrollment_id")
    .references(() => enrollments.id, { onDelete: 'cascade' })
    .notNull(),
  stepId: integer("step_id")
    .references(() => steps.id, { onDelete: 'cascade' })
    .notNull(),
  completedAt: timestamp("completed_at")
    .defaultNow()
    .notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.enrollmentId, table.stepId] })
}));

// Cohorts for grouping learners
export const cohorts = pgTable("cohorts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  syllabusId: integer("syllabus_id")
    .references(() => syllabinds.id, { onDelete: 'cascade' })
    .notNull(),
  creatorId: text("creator_id")
    .references(() => users.username, { onDelete: 'set null', onUpdate: 'cascade' }),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cohort membership junction table
export const cohortMembers = pgTable("cohort_members", {
  cohortId: integer("cohort_id")
    .references(() => cohorts.id, { onDelete: 'cascade' })
    .notNull(),
  studentId: text("student_id")
    .references(() => users.username, { onDelete: 'cascade', onUpdate: 'cascade' })
    .notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  role: text("role").default('member').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.cohortId, table.studentId] })
}));

// Chat messages for Syllabind refinement
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  syllabusId: integer("syllabus_id")
    .references(() => syllabinds.id, { onDelete: 'cascade' })
    .notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("chat_messages_syllabus_id_idx").on(table.syllabusId),
]);

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertSyllabusSchema = createInsertSchema(syllabinds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  studentActive: true,
  studentsCompleted: true
});
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, joinedAt: true });
export const insertWeekSchema = createInsertSchema(weeks).omit({ id: true });
export const insertStepSchema = createInsertSchema(steps).omit({ id: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submittedAt: true
});
export const insertCompletedStepSchema = createInsertSchema(completedSteps).omit({
  completedAt: true
});
export const insertCohortSchema = createInsertSchema(cohorts).omit({
  id: true,
  createdAt: true
});
export const insertCohortMemberSchema = createInsertSchema(cohortMembers).omit({
  joinedAt: true
});
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Syllabus = typeof syllabinds.$inferSelect;
export type InsertSyllabus = z.infer<typeof insertSyllabusSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Week = typeof weeks.$inferSelect;
export type InsertWeek = z.infer<typeof insertWeekSchema>;
export type Step = typeof steps.$inferSelect;
export type InsertStep = z.infer<typeof insertStepSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type CompletedStep = typeof completedSteps.$inferSelect;
export type InsertCompletedStep = z.infer<typeof insertCompletedStepSchema>;
export type Cohort = typeof cohorts.$inferSelect;
export type InsertCohort = z.infer<typeof insertCohortSchema>;
export type CohortMember = typeof cohortMembers.$inferSelect;
export type InsertCohortMember = z.infer<typeof insertCohortMemberSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
