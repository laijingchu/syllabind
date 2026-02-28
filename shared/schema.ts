import { pgTable, text, integer, boolean, jsonb, timestamp, varchar, serial, primaryKey, index, uniqueIndex, customType } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Custom type for PostgreSQL tsvector (full-text search)
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

/**
 * SCHEMA NOTE:
 * - Foreign keys for curator_id and reader_id reference users.username (unique)
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
  isCurator: boolean("is_curator").default(false),
  bio: text("bio"),
  expertise: text("expertise"),
  linkedin: text("linkedin"),
  website: text("website"),
  twitter: text("twitter"),
  threads: text("threads"),
  profileTitle: text("profile_title"),
  schedulingUrl: text("scheduling_url"),
  shareProfile: boolean("share_profile").default(true),
  authProvider: text("auth_provider").default('email'),
  stripeCustomerId: text("stripe_customer_id").unique(),
  subscriptionStatus: text("subscription_status").notNull().default('free'), // 'free' | 'pro' | 'past_due'
  generationCount: integer("generation_count").notNull().default(0),
  lastGeneratedAt: timestamp("last_generated_at"),
  notificationsAckedAt: timestamp("notifications_acked_at"),
});

// Admin-managed categories for binder discovery
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const binders = pgTable("binders", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  audienceLevel: text("audience_level").notNull(), // 'Beginner', 'Intermediate', 'Advanced'
  durationWeeks: integer("duration_weeks").notNull(),
  status: text("status").notNull().default('draft'), // 'draft', 'pending_review', 'published'
  visibility: text("visibility").notNull().default('public'), // 'public', 'unlisted', 'private'
  curatorId: text("curator_id").references(() => users.username, { onDelete: 'set null', onUpdate: 'cascade' }),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewNote: text("review_note"),
  readerActive: integer("reader_active").default(0),
  readersCompleted: integer("readers_completed").default(0),
  showSchedulingLink: boolean("show_scheduling_link").default(true),
  isDemo: boolean("is_demo").default(false),
  mediaPreference: text("media_preference").default('auto'), // 'auto', 'yes', 'no'
  searchVector: tsvector("search_vector"),
}, (table) => [
  index("binders_curator_id_idx").on(table.curatorId),
  index("binders_status_idx").on(table.status),
  index("binders_status_visibility_idx").on(table.status, table.visibility),
  index("binders_category_id_idx").on(table.categoryId),
]);

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  readerId: text("reader_id").references(() => users.username, { onDelete: 'cascade', onUpdate: 'cascade' }),
  binderId: integer("binder_id").references(() => binders.id, { onDelete: 'cascade' }),
  status: text("status").notNull().default('in-progress'), // 'in-progress', 'completed', 'dropped'
  currentWeekIndex: integer("current_week_index").default(1),
  shareProfile: boolean("share_profile").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  uniqueIndex("enrollments_reader_binder_idx").on(table.readerId, table.binderId),
  index("enrollments_reader_id_idx").on(table.readerId),
  index("enrollments_binder_id_idx").on(table.binderId),
]);

// Normalized tables for binder content
export const weeks = pgTable("weeks", {
  id: serial("id").primaryKey(),
  binderId: integer("binder_id")
    .references(() => binders.id, { onDelete: 'cascade' })
    .notNull(),
  index: integer("index").notNull(), // 1, 2, 3, 4...
  title: text("title"),
  description: text("description"),
}, (table) => [
  index("weeks_binder_id_idx").on(table.binderId),
  uniqueIndex("weeks_binder_id_index_idx").on(table.binderId, table.index),
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
  // Curator feedback fields
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

// Cohorts for grouping readers
export const cohorts = pgTable("cohorts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  binderId: integer("binder_id")
    .references(() => binders.id, { onDelete: 'cascade' })
    .notNull(),
  curatorId: text("curator_id")
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
  readerId: text("reader_id")
    .references(() => users.username, { onDelete: 'cascade', onUpdate: 'cascade' })
    .notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  role: text("role").default('member').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.cohortId, table.readerId] })
}));

// Subscription audit trail
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").unique().notNull(),
  stripePriceId: text("stripe_price_id"),
  status: text("status").notNull(), // Mirrors Stripe status
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("subscriptions_user_id_idx").on(table.userId),
  index("subscriptions_stripe_subscription_id_idx").on(table.stripeSubscriptionId),
]);

// Waitlist for alpha gating
export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // 'reader' | 'curator' | 'both'
  occupation: text("occupation").notNull(),
  occupationDetail: text("occupation_detail"),
  topicInterest: text("topic_interest"),
  referralSource: text("referral_source"),
  appeals: text("appeals").notNull(), // comma-separated keys
  status: text("status").notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
}, (table) => [
  index("waitlist_status_idx").on(table.status),
  index("waitlist_created_at_idx").on(table.createdAt),
]);

// Site-wide settings (admin-configurable key-value pairs)
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Free-form tags for binder discovery
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Junction table: binder <-> tags (many-to-many)
export const binderTags = pgTable("binder_tags", {
  binderId: integer("binder_id")
    .references(() => binders.id, { onDelete: 'cascade' })
    .notNull(),
  tagId: integer("tag_id")
    .references(() => tags.id, { onDelete: 'cascade' })
    .notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.binderId, table.tagId] }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertBinderSchema = createInsertSchema(binders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  reviewNote: true,
  readerActive: true,
  readersCompleted: true
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
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaitlistSchema = createInsertSchema(waitlist).omit({ id: true, status: true, adminNote: true, createdAt: true, reviewedAt: true });
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ id: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertTagSchema = createInsertSchema(tags).omit({ id: true, createdAt: true });
export const insertBinderTagSchema = createInsertSchema(binderTags);

export type User = typeof users.$inferSelect & { isAdmin?: boolean };
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Binder = typeof binders.$inferSelect;
export type InsertBinder = z.infer<typeof insertBinderSchema>;
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
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type WaitlistEntry = typeof waitlist.$inferSelect;
export type InsertWaitlistEntry = z.infer<typeof insertWaitlistSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type BinderTag = typeof binderTags.$inferSelect;
export type InsertBinderTag = z.infer<typeof insertBinderTagSchema>;

// Password validation
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "At least one letter", test: (pw: string) => /[a-zA-Z]/.test(pw) },
  { label: "At least one number", test: (pw: string) => /[0-9]/.test(pw) },
];
