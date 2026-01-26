import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  replitId: text("replit_id").unique(),
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
});

export const syllabi = pgTable("syllabi", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  audienceLevel: text("audience_level").notNull(), // 'Beginner', 'Intermediate', 'Advanced'
  durationWeeks: integer("duration_weeks").notNull(),
  status: text("status").notNull().default('draft'), // 'draft', 'published'
  content: jsonb("content").notNull(), // Stores weeks and steps
  creatorId: integer("creator_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const enrollments = pgTable("enrollments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id),
  syllabusId: integer("syllabus_id").references(() => syllabi.id),
  status: text("status").notNull().default('in-progress'), // 'in-progress', 'completed'
  currentWeekIndex: integer("current_week_index").default(1),
  completedStepIds: jsonb("completed_step_ids").default([]),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertSyllabusSchema = createInsertSchema(syllabi).omit({ id: true, createdAt: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, joinedAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Syllabus = typeof syllabi.$inferSelect;
export type InsertSyllabus = z.infer<typeof insertSyllabusSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
