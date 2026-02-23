import {
  type User, type InsertUser,
  type Syllabus, type InsertSyllabus,
  type Enrollment, type InsertEnrollment,
  type Week, type InsertWeek,
  type Step, type InsertStep,
  type Submission, type InsertSubmission,
  type CompletedStep, type InsertCompletedStep,
  type Subscription, type InsertSubscription,
  type Category, type Tag, type SyllabindTag,
  users, syllabinds, enrollments, weeks, steps, submissions, completedSteps, subscriptions, siteSettings,
  categories, tags, syllabindTags
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, asc, desc, inArray, ilike, count } from "drizzle-orm";

// Extended types for nested data
export interface WeekWithSteps extends Week {
  steps: Step[];
}

export interface SyllabusWithContent extends Syllabus {
  weeks: WeekWithSteps[];
}

// Catalog search parameters
export interface CatalogSearchParams {
  query?: string;
  category?: string; // category slug
  level?: string; // audience level
  sort?: 'newest' | 'popular' | 'relevance';
  limit?: number;
  offset?: number;
}

export interface CatalogSearchResult {
  syllabinds: any[];
  total: number;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByReplitId(replitId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;

  // Syllabus operations
  getSyllabus(id: number): Promise<Syllabus | undefined>;
  getSyllabusWithContent(id: number): Promise<SyllabusWithContent | undefined>;
  listSyllabinds(): Promise<Syllabus[]>;
  listPublishedSyllabinds(): Promise<Syllabus[]>;
  getSyllabindsByCreator(username: string): Promise<Syllabus[]>;
  createSyllabus(syllabus: InsertSyllabus): Promise<Syllabus>;
  updateSyllabus(id: number, syllabus: Partial<Syllabus>): Promise<Syllabus>;
  deleteSyllabus(id: number): Promise<void>;
  batchDeleteSyllabinds(ids: number[]): Promise<void>;

  // Bulk content operations
  saveWeeksAndSteps(syllabusId: number, weeksData: Array<{ index: number; title?: string; description?: string; steps: Array<Omit<InsertStep, 'weekId'>> }>): Promise<WeekWithSteps[]>;

  // Week operations
  createWeek(week: InsertWeek): Promise<Week>;
  getWeeksBySyllabusId(syllabusId: number): Promise<Week[]>;
  updateWeek(weekId: number, updates: Partial<Week>): Promise<Week>;

  // Step operations
  createStep(step: InsertStep): Promise<Step>;
  getStep(stepId: number): Promise<Step | undefined>;
  getStepsByWeekId(weekId: number): Promise<Step[]>;
  updateStepUrl(stepId: number, url: string): Promise<Step>;
  updateStep(stepId: number, updates: Partial<Step>): Promise<Step>;
  deleteStep(stepId: number): Promise<void>;
  deleteStepsByWeekId(weekId: number): Promise<void>;
  deleteWeeksBySyllabusId(syllabusId: number): Promise<void>;

  // Week operations (single)
  getWeek(weekId: number): Promise<Week | undefined>;

  // Submission operations
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissionsByEnrollmentId(enrollmentId: number): Promise<Submission[]>;
  updateSubmissionFeedback(id: number, feedback: string, grade: string, rubricUrl?: string): Promise<Submission>;

  // Learner operations
  getLearnersBySyllabusId(syllabusId: number): Promise<any[]>;
  getClassmatesBySyllabusId(syllabusId: number): Promise<{ classmates: any[]; totalEnrolled: number }>;
  updateEnrollmentShareProfile(enrollmentId: number, shareProfile: boolean): Promise<Enrollment>;

  // Enrollment operations
  getEnrollment(studentId: string, syllabusId: number): Promise<Enrollment | undefined>;
  getUserEnrollments(studentId: string): Promise<Enrollment[]>;
  getEnrollmentById(id: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment>;

  // Completion tracking
  markStepCompleted(enrollmentId: number, stepId: number): Promise<CompletedStep | undefined>;
  markStepIncomplete(enrollmentId: number, stepId: number): Promise<void>;
  getCompletedSteps(enrollmentId: number): Promise<number[]>;
  isStepCompleted(enrollmentId: number, stepId: number): Promise<boolean>;

  // Analytics
  getStepCompletionRates(syllabusId: number): Promise<Array<{ stepId: number; completionCount: number; completionRate: number }>>;
  getAverageCompletionTimes(syllabusId: number): Promise<Array<{ stepId: number; avgMinutes: number }>>;


  // Subscription operations
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  upsertSubscription(data: InsertSubscription): Promise<Subscription>;
  updateSubscriptionByStripeId(stripeSubscriptionId: string, updates: Partial<Subscription>): Promise<Subscription | undefined>;
  countSyllabindsByCreator(username: string): Promise<number>;

  // Site settings
  getSiteSetting(key: string): Promise<string | null>;
  setSiteSetting(key: string, value: string): Promise<void>;

  // Category operations
  listCategories(): Promise<Category[]>;

  // Tag operations
  listTags(query?: string): Promise<Tag[]>;
  getTagsBySyllabindId(syllabusId: number): Promise<Tag[]>;
  findOrCreateTag(name: string): Promise<Tag>;
  setSyllabindTags(syllabusId: number, tagNames: string[]): Promise<Tag[]>;

  // Catalog search
  searchCatalog(params: CatalogSearchParams): Promise<CatalogSearchResult>;

  // Search vector
  refreshSearchVector(syllabusId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByReplitId(replitId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.replitId, replitId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, update: Partial<User>): Promise<User> {
    if (!update || Object.keys(update).length === 0) {
      const existing = await this.getUser(id);
      if (!existing) throw new Error("User not found");
      return existing;
    }
    const [user] = await db.update(users).set(update).where(eq(users.id, id)).returning();
    return user;
  }

  async getSyllabus(id: number): Promise<Syllabus | undefined> {
    const [syllabus] = await db.select().from(syllabinds).where(eq(syllabinds.id, id));
    return syllabus;
  }

  async listSyllabinds(): Promise<Syllabus[]> {
    const rows = await db
      .select({
        syllabus: syllabinds,
        creatorName: users.name,
        creatorUsername: users.username,
        creatorAvatarUrl: users.avatarUrl,
        creatorBio: users.bio,
        creatorExpertise: users.expertise,
        creatorProfileTitle: users.profileTitle,
        creatorLinkedin: users.linkedin,
        creatorTwitter: users.twitter,
        creatorThreads: users.threads,
        creatorWebsite: users.website,
        creatorSchedulingUrl: users.schedulingUrl,
      })
      .from(syllabinds)
      .leftJoin(users, eq(syllabinds.creatorId, users.username));

    return rows.map(row => ({
      ...row.syllabus,
      creator: row.creatorUsername ? {
        name: row.creatorName,
        username: row.creatorUsername,
        avatarUrl: row.creatorAvatarUrl,
        bio: row.creatorBio,
        expertise: row.creatorExpertise,
        profileTitle: row.creatorProfileTitle,
        linkedin: row.creatorLinkedin,
        twitter: row.creatorTwitter,
        threads: row.creatorThreads,
        website: row.creatorWebsite,
        schedulingUrl: row.creatorSchedulingUrl,
      } : undefined,
    }));
  }

  async listPublishedSyllabinds(): Promise<Syllabus[]> {
    return await db.select().from(syllabinds).where(
      and(eq(syllabinds.status, 'published'), eq(syllabinds.visibility, 'public'))
    );
  }

  async getSyllabindsByCreator(username: string): Promise<Syllabus[]> {
    return await db.select().from(syllabinds).where(eq(syllabinds.creatorId, username));
  }

  async createSyllabus(insertSyllabus: InsertSyllabus): Promise<Syllabus> {
    const [syllabus] = await db.insert(syllabinds).values(insertSyllabus).returning();
    return syllabus;
  }

  async updateSyllabus(id: number, update: Partial<Syllabus>): Promise<Syllabus> {
    // Filter out immutable fields (id, creatorId), readonly fields, and nested objects
    const { id: _id, creatorId: _creatorId, createdAt, updatedAt, weeks, ...updateData } = update as Partial<Syllabus> & { weeks?: unknown };

    // Automatically set updatedAt to current time
    const [syllabus] = await db.update(syllabinds).set({
      ...updateData,
      updatedAt: new Date()
    }).where(eq(syllabinds.id, id)).returning();
    return syllabus;
  }

  async deleteSyllabus(id: number): Promise<void> {
    await db.delete(syllabinds).where(eq(syllabinds.id, id));
  }

  async batchDeleteSyllabinds(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await db.delete(syllabinds).where(inArray(syllabinds.id, ids));
  }

  async getEnrollment(studentId: string, syllabusId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(
      and(eq(enrollments.studentId, studentId), eq(enrollments.syllabusId, syllabusId))
    );
    return enrollment;
  }

  async getUserEnrollments(studentId: string): Promise<Enrollment[]> {
    // Return only active enrollments (exclude dropped)
    return await db.select()
      .from(enrollments)
      .where(and(
        eq(enrollments.studentId, studentId),
        sql`${enrollments.status} != 'dropped'`
      ));
  }

  async getEnrollmentById(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values(insertEnrollment).returning();
    return enrollment;
  }

  // Mark all in-progress enrollments for a user as dropped (used when switching syllabinds)
  async dropActiveEnrollments(studentId: string, exceptSyllabusId?: number): Promise<void> {
    if (exceptSyllabusId) {
      await db.update(enrollments)
        .set({ status: 'dropped' })
        .where(and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.status, 'in-progress'),
          sql`${enrollments.syllabusId} != ${exceptSyllabusId}`
        ));
    } else {
      await db.update(enrollments)
        .set({ status: 'dropped' })
        .where(and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.status, 'in-progress')
        ));
    }
  }

  async updateEnrollment(id: number, update: Partial<Enrollment>): Promise<Enrollment> {
    // Filter out readonly timestamp fields
    const { joinedAt, ...updateData } = update;

    const [enrollment] = await db.update(enrollments).set(updateData).where(eq(enrollments.id, id)).returning();
    return enrollment;
  }

  // Completion tracking methods
  async markStepCompleted(enrollmentId: number, stepId: number): Promise<CompletedStep | undefined> {
    const [completion] = await db.insert(completedSteps)
      .values({ enrollmentId, stepId })
      .onConflictDoNothing()
      .returning();
    return completion;
  }

  async markStepIncomplete(enrollmentId: number, stepId: number): Promise<void> {
    await db.delete(completedSteps)
      .where(and(
        eq(completedSteps.enrollmentId, enrollmentId),
        eq(completedSteps.stepId, stepId)
      ));
  }

  async getCompletedSteps(enrollmentId: number): Promise<number[]> {
    const completions = await db.select({ stepId: completedSteps.stepId })
      .from(completedSteps)
      .where(eq(completedSteps.enrollmentId, enrollmentId));
    return completions.map(c => c.stepId);
  }

  async isStepCompleted(enrollmentId: number, stepId: number): Promise<boolean> {
    const [result] = await db.select()
      .from(completedSteps)
      .where(and(
        eq(completedSteps.enrollmentId, enrollmentId),
        eq(completedSteps.stepId, stepId)
      ))
      .limit(1);
    return !!result;
  }

  // Analytics methods
  async getStepCompletionRates(syllabusId: number): Promise<Array<{ stepId: number; completionCount: number; completionRate: number }>> {
    const totalEnrollments = await db.select({ count: sql<number>`cast(count(*) as int)` })
      .from(enrollments)
      .where(eq(enrollments.syllabusId, syllabusId));

    const stepCompletions = await db.select({
      stepId: completedSteps.stepId,
      completionCount: sql<number>`cast(count(*) as int)`
    })
    .from(completedSteps)
    .innerJoin(enrollments, eq(completedSteps.enrollmentId, enrollments.id))
    .where(eq(enrollments.syllabusId, syllabusId))
    .groupBy(completedSteps.stepId);

    const total = totalEnrollments[0]?.count || 1;

    return stepCompletions.map(s => ({
      stepId: s.stepId,
      completionCount: s.completionCount,
      completionRate: (s.completionCount / total) * 100
    }));
  }

  async getAverageCompletionTimes(syllabusId: number): Promise<Array<{ stepId: number; avgMinutes: number }>> {
    const result = await db.select({
      stepId: completedSteps.stepId,
      avgMinutes: sql<number>`cast(AVG(EXTRACT(EPOCH FROM (${completedSteps.completedAt} - ${enrollments.joinedAt})) / 60) as float)`
    })
    .from(completedSteps)
    .innerJoin(enrollments, eq(completedSteps.enrollmentId, enrollments.id))
    .where(eq(enrollments.syllabusId, syllabusId))
    .groupBy(completedSteps.stepId);

    return result;
  }

  // Week operations
  async createWeek(insertWeek: InsertWeek): Promise<Week> {
    const [week] = await db.insert(weeks).values(insertWeek).returning();
    return week;
  }

  async getWeeksBySyllabusId(syllabusId: number): Promise<Week[]> {
    return await db.select().from(weeks).where(eq(weeks.syllabusId, syllabusId));
  }

  async getWeek(weekId: number): Promise<Week | undefined> {
    const [week] = await db.select().from(weeks).where(eq(weeks.id, weekId));
    return week;
  }

  // Step operations
  async createStep(insertStep: InsertStep): Promise<Step> {
    const [step] = await db.insert(steps).values(insertStep).returning();
    return step;
  }

  async getStepsByWeekId(weekId: number): Promise<Step[]> {
    return await db.select().from(steps).where(eq(steps.weekId, weekId));
  }

  async getStep(stepId: number): Promise<Step | undefined> {
    const [step] = await db.select().from(steps).where(eq(steps.id, stepId));
    return step;
  }

  async updateStepUrl(stepId: number, url: string): Promise<Step> {
    const [step] = await db.update(steps).set({ url }).where(eq(steps.id, stepId)).returning();
    return step;
  }

  async updateStep(stepId: number, updates: Partial<Step>): Promise<Step> {
    const [step] = await db.update(steps).set(updates).where(eq(steps.id, stepId)).returning();
    return step;
  }

  async deleteStepsByWeekId(weekId: number): Promise<void> {
    await db.delete(steps).where(eq(steps.weekId, weekId));
  }

  // Submission operations
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db.insert(submissions).values(insertSubmission).returning();
    return submission;
  }

  async getSubmission(id: number): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission;
  }

  async getSubmissionsByEnrollmentId(enrollmentId: number): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.enrollmentId, enrollmentId));
  }

  async updateSubmissionFeedback(
    id: number,
    feedback: string,
    grade: string,
    rubricUrl?: string
  ): Promise<Submission> {
    const [submission] = await db.update(submissions)
      .set({ feedback, grade, rubricUrl })
      .where(eq(submissions.id, id))
      .returning();
    return submission;
  }

  // Syllabus with content operations
  async getSyllabusWithContent(id: number): Promise<SyllabusWithContent | undefined> {
    // Get syllabus
    const syllabus = await this.getSyllabus(id);
    if (!syllabus) return undefined;

    // Get weeks for this syllabus
    const weeksData = await db.select()
      .from(weeks)
      .where(eq(weeks.syllabusId, id))
      .orderBy(asc(weeks.index));

    // Deduplicate weeks by index — keep only the latest (highest ID) per index.
    // This handles corrupted data from concurrent generation race conditions.
    const weeksByIndex = new Map<number, typeof weeksData[number]>();
    for (const week of weeksData) {
      const existing = weeksByIndex.get(week.index);
      if (!existing || week.id > existing.id) {
        weeksByIndex.set(week.index, week);
      }
    }
    const dedupedWeeks = Array.from(weeksByIndex.values())
      .sort((a, b) => a.index - b.index);

    // Get steps for each week
    const weeksWithSteps: WeekWithSteps[] = await Promise.all(
      dedupedWeeks.map(async (week) => {
        const stepsData = await db.select()
          .from(steps)
          .where(eq(steps.weekId, week.id))
          .orderBy(asc(steps.position));
        return { ...week, steps: stepsData };
      })
    );

    return { ...syllabus, weeks: weeksWithSteps };
  }

  // Learner operations
  async getLearnersBySyllabusId(syllabusId: number): Promise<any[]> {
    // Get all active enrollments for this syllabus (exclude dropped)
    const enrollmentsData = await db.select()
      .from(enrollments)
      .where(and(
        eq(enrollments.syllabusId, syllabusId),
        sql`${enrollments.status} != 'dropped'`
      ));

    // Get user data for each enrollment
    const learners = await Promise.all(
      enrollmentsData.map(async (enrollment) => {
        const user = await this.getUserByUsername(enrollment.studentId!);
        return {
          user,
          status: enrollment.status,
          joinedDate: enrollment.joinedAt?.toISOString(),
          enrollmentId: enrollment.id
        };
      })
    );

    return learners;
  }

  async getClassmatesBySyllabusId(syllabusId: number): Promise<{ classmates: any[]; totalEnrolled: number }> {
    // Get total active enrollment count (including private users)
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(and(
        eq(enrollments.syllabusId, syllabusId),
        sql`${enrollments.status} != 'dropped'`
      ));
    const totalEnrolled = Number(countResult?.count || 0);

    // Get active enrollments that opted into sharing (exclude dropped)
    const enrollmentsData = await db.select()
      .from(enrollments)
      .where(and(
        eq(enrollments.syllabusId, syllabusId),
        eq(enrollments.shareProfile, true),
        sql`${enrollments.status} != 'dropped'`
      ));

    const classmates = await Promise.all(
      enrollmentsData.map(async (enrollment) => {
        const user = await this.getUserByUsername(enrollment.studentId!);
        if (!user) return null;
        return {
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            linkedin: user.linkedin,
            twitter: user.twitter,
            threads: user.threads,
            website: user.website,
          },
          status: enrollment.status,
          joinedDate: enrollment.joinedAt?.toISOString(),
          enrollmentId: enrollment.id
        };
      })
    );

    return { classmates: classmates.filter(Boolean), totalEnrolled };
  }

  async updateEnrollmentShareProfile(enrollmentId: number, shareProfile: boolean): Promise<Enrollment> {
    const [enrollment] = await db.update(enrollments)
      .set({ shareProfile })
      .where(eq(enrollments.id, enrollmentId))
      .returning();
    return enrollment;
  }

  // Comprehensive analytics for a syllabus
  async getSyllabusAnalytics(syllabusId: number): Promise<{
    learnersStarted: number;
    learnersCompleted: number;
    completionRate: number;
    averageProgress: number;
    weekReach: Array<{ week: string; weekIndex: number; percentage: number; learnerCount: number; learnerNames: string[] }>;
    stepDropoff: Array<{ stepId: number; weekIndex: number; stepTitle: string; dropoffRate: number; completionCount: number }>;
    topDropoutStep: { weekIndex: number; stepTitle: string; dropoffRate: number } | null;
  }> {
    // Get all active enrollments for this syllabus (exclude dropped)
    const syllabusEnrollments = await db.select()
      .from(enrollments)
      .where(and(
        eq(enrollments.syllabusId, syllabusId),
        sql`${enrollments.status} != 'dropped'`
      ));

    const learnersStarted = syllabusEnrollments.length;
    const learnersCompleted = syllabusEnrollments.filter(e => e.status === 'completed').length;
    const completionRate = learnersStarted > 0 ? Math.round((learnersCompleted / learnersStarted) * 100) : 0;

    // Get syllabus content structure
    const syllabusWeeks = await db.select()
      .from(weeks)
      .where(eq(weeks.syllabusId, syllabusId))
      .orderBy(asc(weeks.index));

    // Get all steps with their week info
    const allSteps: Array<{ stepId: number; weekId: number; weekIndex: number; stepTitle: string; position: number }> = [];
    for (const week of syllabusWeeks) {
      const weekSteps = await db.select()
        .from(steps)
        .where(eq(steps.weekId, week.id))
        .orderBy(asc(steps.position));
      for (const step of weekSteps) {
        allSteps.push({
          stepId: step.id,
          weekId: week.id,
          weekIndex: week.index,
          stepTitle: step.title,
          position: step.position
        });
      }
    }

    const totalSteps = allSteps.length;

    // Get completion data for each enrollment
    let totalProgressSum = 0;
    const weekReachCounts: Record<number, number> = {};
    const weekCurrentLearners: Record<number, string[]> = {}; // Learners currently AT this week
    const stepCompletionCounts: Record<number, number> = {};

    // Initialize counts and learner arrays
    for (const week of syllabusWeeks) {
      weekReachCounts[week.index] = 0;
      weekCurrentLearners[week.index] = [];
    }
    for (const step of allSteps) {
      stepCompletionCounts[step.stepId] = 0;
    }

    // Calculate progress for each enrollment
    for (const enrollment of syllabusEnrollments) {
      const completedStepIds = await this.getCompletedSteps(enrollment.id);
      const completedCount = completedStepIds.length;

      // Get learner name for this enrollment
      const learner = await this.getUserByUsername(enrollment.studentId!);
      const learnerName = learner?.name || enrollment.studentId || 'Unknown';

      // Calculate individual progress
      const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
      totalProgressSum += progress;

      // Track step completions
      for (const stepId of completedStepIds) {
        if (stepCompletionCounts[stepId] !== undefined) {
          stepCompletionCounts[stepId]++;
        }
      }

      // Determine which weeks were reached (at least started)
      const completedStepSet = new Set(completedStepIds);
      for (const week of syllabusWeeks) {
        const weekSteps = allSteps.filter(s => s.weekIndex === week.index);
        const hasAnyStepInWeek = weekSteps.some(s => completedStepSet.has(s.stepId));
        // Count if learner has reached this week
        if (hasAnyStepInWeek || (enrollment.currentWeekIndex && enrollment.currentWeekIndex >= week.index)) {
          weekReachCounts[week.index]++;
        }
      }

      // Track which week the learner is currently on (their active position)
      // Only show in the week they're currently at, not all weeks they've passed
      const currentWeek = enrollment.currentWeekIndex || 1;
      if (weekCurrentLearners[currentWeek]) {
        weekCurrentLearners[currentWeek].push(learnerName);
      }
    }

    const averageProgress = learnersStarted > 0 ? Math.round(totalProgressSum / learnersStarted) : 0;

    // Build week reach data
    const weekReach = syllabusWeeks.map(week => ({
      week: `Week ${week.index}`,
      weekIndex: week.index,
      percentage: learnersStarted > 0 ? Math.round((weekReachCounts[week.index] / learnersStarted) * 100) : 0,
      learnerCount: weekReachCounts[week.index],
      learnerNames: weekCurrentLearners[week.index] // Learners currently AT this week
    }));

    // Calculate step dropoff rates
    const stepDropoff = allSteps.map((step, index) => {
      const completionCount = stepCompletionCounts[step.stepId];
      const previousStepCompletion = index > 0
        ? stepCompletionCounts[allSteps[index - 1].stepId]
        : learnersStarted;

      const dropoffRate = previousStepCompletion > 0
        ? Math.round(((previousStepCompletion - completionCount) / previousStepCompletion) * 100)
        : 0;

      return {
        stepId: step.stepId,
        weekIndex: step.weekIndex,
        stepTitle: step.stepTitle,
        dropoffRate: Math.max(0, dropoffRate),
        completionCount
      };
    });

    // Find top dropout step (highest dropoff rate with meaningful sample)
    const significantDropoffs = stepDropoff.filter(s => s.dropoffRate > 0);
    const topDropoutStep = significantDropoffs.length > 0
      ? significantDropoffs.reduce((max, s) => s.dropoffRate > max.dropoffRate ? s : max)
      : null;

    return {
      learnersStarted,
      learnersCompleted,
      completionRate,
      averageProgress,
      weekReach,
      stepDropoff,
      topDropoutStep: topDropoutStep ? {
        weekIndex: topDropoutStep.weekIndex,
        stepTitle: topDropoutStep.stepTitle,
        dropoffRate: topDropoutStep.dropoffRate
      } : null
    };
  }

  async updateWeek(weekId: number, updates: Partial<Week>): Promise<Week> {
    const [week] = await db
      .update(weeks)
      .set(updates)
      .where(eq(weeks.id, weekId))
      .returning();
    return week;
  }

  async deleteStep(stepId: number): Promise<void> {
    await db.delete(steps).where(eq(steps.id, stepId));
  }

  async deleteWeeksBySyllabusId(syllabusId: number): Promise<void> {
    // Steps are deleted via CASCADE when weeks are deleted
    await db.delete(weeks).where(eq(weeks.syllabusId, syllabusId));
  }

  async saveWeeksAndSteps(
    syllabusId: number,
    weeksData: Array<{ index: number; title?: string; description?: string; steps: Array<Omit<InsertStep, 'weekId'>> }>
  ): Promise<WeekWithSteps[]> {
    // Delete existing weeks (steps cascade)
    await this.deleteWeeksBySyllabusId(syllabusId);

    const result: WeekWithSteps[] = [];

    for (const weekData of weeksData) {
      const [week] = await db.insert(weeks).values({
        syllabusId,
        index: weekData.index,
        title: weekData.title || null,
        description: weekData.description || null,
      }).returning();

      const weekSteps: Step[] = [];
      for (const stepData of weekData.steps) {
        const [step] = await db.insert(steps).values({
          weekId: week.id,
          position: stepData.position,
          type: stepData.type,
          title: stepData.title,
          url: stepData.url || null,
          note: stepData.note || null,
          author: stepData.author || null,
          creationDate: stepData.creationDate || null,
          mediaType: stepData.mediaType || null,
          promptText: stepData.promptText || null,
          estimatedMinutes: stepData.estimatedMinutes || null,
        }).returning();
        weekSteps.push(step);
      }

      result.push({ ...week, steps: weekSteps });
    }

    // Refresh search vector with new week content
    await this.refreshSearchVector(syllabusId);

    return result;
  }


  // Subscription operations
  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
    return sub;
  }

  async upsertSubscription(data: InsertSubscription): Promise<Subscription> {
    const [sub] = await db.insert(subscriptions)
      .values(data)
      .onConflictDoUpdate({
        target: subscriptions.stripeSubscriptionId,
        set: {
          status: data.status,
          stripePriceId: data.stripePriceId,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          updatedAt: new Date(),
        }
      })
      .returning();
    return sub;
  }

  async updateSubscriptionByStripeId(stripeSubscriptionId: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const { id: _id, ...updateData } = updates;
    const [sub] = await db.update(subscriptions)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning();
    return sub;
  }

  async countSyllabindsByCreator(username: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`cast(count(*) as int)` })
      .from(syllabinds)
      .where(eq(syllabinds.creatorId, username));
    return result?.count || 0;
  }

  async getSiteSetting(key: string): Promise<string | null> {
    const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return row?.value ?? null;
  }

  async setSiteSetting(key: string, value: string): Promise<void> {
    await db.insert(siteSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date() },
      });
  }

  // Category operations
  async listCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.displayOrder));
  }

  // Tag operations
  async listTags(query?: string): Promise<Tag[]> {
    if (query) {
      return await db.select().from(tags)
        .where(ilike(tags.name, `%${query}%`))
        .orderBy(asc(tags.name))
        .limit(20);
    }
    return await db.select().from(tags).orderBy(asc(tags.name)).limit(50);
  }

  async getTagsBySyllabindId(syllabusId: number): Promise<Tag[]> {
    const rows = await db.select({ tag: tags })
      .from(syllabindTags)
      .innerJoin(tags, eq(syllabindTags.tagId, tags.id))
      .where(eq(syllabindTags.syllabusId, syllabusId));
    return rows.map(r => r.tag);
  }

  async findOrCreateTag(name: string): Promise<Tag> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const [existing] = await db.select().from(tags).where(eq(tags.slug, slug));
    if (existing) return existing;
    const [created] = await db.insert(tags).values({ name: name.trim(), slug }).returning();
    return created;
  }

  async setSyllabindTags(syllabusId: number, tagNames: string[]): Promise<Tag[]> {
    // Enforce max 5 tags
    const trimmed = tagNames.slice(0, 5);

    // Delete existing tags
    await db.delete(syllabindTags).where(eq(syllabindTags.syllabusId, syllabusId));

    if (trimmed.length === 0) return [];

    // Find or create each tag
    const resultTags: Tag[] = [];
    for (const name of trimmed) {
      const tag = await this.findOrCreateTag(name);
      resultTags.push(tag);
      await db.insert(syllabindTags)
        .values({ syllabusId, tagId: tag.id })
        .onConflictDoNothing();
    }

    // Refresh search vector to include new tag names
    await this.refreshSearchVector(syllabusId);

    return resultTags;
  }

  // Catalog search
  async searchCatalog(params: CatalogSearchParams): Promise<CatalogSearchResult> {
    const {
      query,
      category,
      level,
      sort = 'newest',
      limit: resultLimit = 20,
      offset: resultOffset = 0
    } = params;

    // Build WHERE conditions: always filter published + public
    const conditions: any[] = [
      sql`${syllabinds.status} = 'published'`,
      sql`${syllabinds.visibility} = 'public'`,
    ];

    if (category) {
      conditions.push(sql`${categories.slug} = ${category}`);
    }

    if (level) {
      conditions.push(sql`${syllabinds.audienceLevel} = ${level}`);
    }

    if (query) {
      conditions.push(sql`${syllabinds.searchVector} @@ plainto_tsquery('english', ${query})`);
    }

    const whereClause = sql.join(conditions, sql` AND `);

    // Determine ORDER BY
    let orderByClause;
    if (sort === 'relevance' && query) {
      orderByClause = sql`ts_rank(${syllabinds.searchVector}, plainto_tsquery('english', ${query})) DESC`;
    } else if (sort === 'popular') {
      orderByClause = sql`${syllabinds.studentActive} DESC NULLS LAST, ${syllabinds.createdAt} DESC`;
    } else {
      orderByClause = sql`${syllabinds.createdAt} DESC`;
    }

    // Count query
    const [countResult] = await db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(syllabinds)
      .leftJoin(categories, eq(syllabinds.categoryId, categories.id))
      .where(whereClause);

    const total = countResult?.total || 0;

    // Main data query with creator join
    const rows = await db
      .select({
        syllabus: syllabinds,
        categoryName: categories.name,
        categorySlug: categories.slug,
        creatorName: users.name,
        creatorUsername: users.username,
        creatorAvatarUrl: users.avatarUrl,
        creatorBio: users.bio,
        creatorExpertise: users.expertise,
        creatorProfileTitle: users.profileTitle,
        creatorLinkedin: users.linkedin,
        creatorTwitter: users.twitter,
        creatorThreads: users.threads,
        creatorWebsite: users.website,
        creatorSchedulingUrl: users.schedulingUrl,
      })
      .from(syllabinds)
      .leftJoin(categories, eq(syllabinds.categoryId, categories.id))
      .leftJoin(users, eq(syllabinds.creatorId, users.username))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(resultLimit)
      .offset(resultOffset);

    // Fetch tags for each syllabind
    const syllabindsList = await Promise.all(rows.map(async (row) => {
      const syllabindTags = await this.getTagsBySyllabindId(row.syllabus.id);
      return {
        ...row.syllabus,
        category: row.categoryName ? { name: row.categoryName, slug: row.categorySlug } : null,
        tags: syllabindTags,
        creator: row.creatorUsername ? {
          name: row.creatorName,
          username: row.creatorUsername,
          avatarUrl: row.creatorAvatarUrl,
          bio: row.creatorBio,
          expertise: row.creatorExpertise,
          profileTitle: row.creatorProfileTitle,
          linkedin: row.creatorLinkedin,
          twitter: row.creatorTwitter,
          threads: row.creatorThreads,
          website: row.creatorWebsite,
          schedulingUrl: row.creatorSchedulingUrl,
        } : undefined,
      };
    }));

    return { syllabinds: syllabindsList, total };
  }

  // Refresh search vector for a syllabind (includes week content and tag names)
  async refreshSearchVector(syllabusId: number): Promise<void> {
    // Get syllabind basic info (trigger handles title/description on save)
    // Here we add week titles + tag names
    const weekRows = await db.select({ title: weeks.title, description: weeks.description })
      .from(weeks).where(eq(weeks.syllabusId, syllabusId));

    const tagRows = await this.getTagsBySyllabindId(syllabusId);
    const tagText = tagRows.map(t => t.name).join(' ');
    const weekText = weekRows.map(w => [w.title || '', w.description || ''].join(' ')).join(' ');

    await db.execute(sql`
      UPDATE syllabi SET search_vector =
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', ${weekText}), 'C') ||
        setweight(to_tsvector('english', ${tagText}), 'D')
      WHERE id = ${syllabusId}
    `);
  }

}

export const storage = new DatabaseStorage();
