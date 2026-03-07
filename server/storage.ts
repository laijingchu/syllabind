import {
  type User, type InsertUser,
  type Binder, type InsertBinder,
  type Enrollment, type InsertEnrollment,
  type Week, type InsertWeek,
  type Step, type InsertStep,
  type Submission, type InsertSubmission,
  type CompletedStep, type InsertCompletedStep,
  type Subscription, type InsertSubscription,
  type CreditTransaction, type InsertCreditTransaction,
  type Category, type Tag, type BinderTag,
  users, binders, enrollments, weeks, steps, submissions, completedSteps, subscriptions, siteSettings,
  categories, tags, binderTags, creditTransactions
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql, asc, desc, inArray, ilike, count, gt, isNotNull } from "drizzle-orm";

// Extended types for nested data
export interface WeekWithSteps extends Week {
  steps: Step[];
}

export interface BinderWithContent extends Binder {
  weeks: WeekWithSteps[];
}

// Catalog search parameters
export interface CatalogSearchParams {
  query?: string;
  category?: string | string[]; // category slug(s)
  level?: string; // audience level
  visibility?: string; // 'public' | 'unlisted' | 'private' (default: 'public')
  curator?: string[]; // filter by curator username(s)
  sort?: 'newest' | 'popular' | 'relevance';
  limit?: number;
  offset?: number;
}

export interface CatalogSearchResult {
  binders: any[];
  total: number;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByReplitId(replitId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Binder operations
  getBinder(id: number): Promise<Binder | undefined>;
  getBinderWithContent(id: number): Promise<BinderWithContent | undefined>;
  listBinders(): Promise<Binder[]>;
  listPublishedBinders(): Promise<Binder[]>;
  getBindersByCurator(username: string): Promise<Binder[]>;
  createBinder(binder: InsertBinder): Promise<Binder>;
  updateBinder(id: number, binder: Partial<Binder>): Promise<Binder>;
  deleteBinder(id: number): Promise<void>;
  batchDeleteBinders(ids: number[]): Promise<void>;

  // Bulk content operations
  saveWeeksAndSteps(binderId: number, weeksData: Array<{ index: number; title?: string; description?: string; steps: Array<Omit<InsertStep, 'weekId'>> }>): Promise<WeekWithSteps[]>;

  // Week operations
  createWeek(week: InsertWeek): Promise<Week>;
  getWeeksByBinderId(binderId: number): Promise<Week[]>;
  updateWeek(weekId: number, updates: Partial<Week>): Promise<Week>;

  // Step operations
  createStep(step: InsertStep): Promise<Step>;
  getStep(stepId: number): Promise<Step | undefined>;
  getStepsByWeekId(weekId: number): Promise<Step[]>;
  updateStepUrl(stepId: number, url: string): Promise<Step>;
  updateStep(stepId: number, updates: Partial<Step>): Promise<Step>;
  deleteStep(stepId: number): Promise<void>;
  deleteStepsByWeekId(weekId: number): Promise<void>;
  deleteWeeksByBinderId(binderId: number): Promise<void>;

  // Week operations (single)
  getWeek(weekId: number): Promise<Week | undefined>;

  // Submission operations
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissionsByEnrollmentId(enrollmentId: number): Promise<Submission[]>;
  updateSubmissionFeedback(id: number, feedback: string, grade: string, rubricUrl?: string): Promise<Submission>;

  // Reader operations
  getReadersByBinderId(binderId: number): Promise<any[]>;
  getClassmatesByBinderId(binderId: number): Promise<{ classmates: any[]; totalEnrolled: number }>;
  updateEnrollmentShareProfile(enrollmentId: number, shareProfile: boolean): Promise<Enrollment>;

  // Enrollment operations
  getEnrollment(readerId: string, binderId: number): Promise<Enrollment | undefined>;
  getUserEnrollments(readerId: string): Promise<Enrollment[]>;
  getEnrollmentById(id: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment>;

  // Completion tracking
  markStepCompleted(enrollmentId: number, stepId: number): Promise<CompletedStep | undefined>;
  markStepIncomplete(enrollmentId: number, stepId: number): Promise<void>;
  getCompletedSteps(enrollmentId: number): Promise<number[]>;
  isStepCompleted(enrollmentId: number, stepId: number): Promise<boolean>;

  // Analytics
  getStepCompletionRates(binderId: number): Promise<Array<{ stepId: number; completionCount: number; completionRate: number }>>;
  getAverageCompletionTimes(binderId: number): Promise<Array<{ stepId: number; avgMinutes: number }>>;


  // Subscription operations
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  upsertSubscription(data: InsertSubscription): Promise<Subscription>;
  updateSubscriptionByStripeId(stripeSubscriptionId: string, updates: Partial<Subscription>): Promise<Subscription | undefined>;
  countBindersByCurator(username: string): Promise<number>;

  // Site settings
  getSiteSetting(key: string): Promise<string | null>;
  setSiteSetting(key: string, value: string): Promise<void>;

  // Category operations
  listCategories(): Promise<Category[]>;
  initializeDefaultCategories(): Promise<void>;

  // Tag operations
  listTags(query?: string): Promise<Tag[]>;
  getTagsByBinderId(binderId: number): Promise<Tag[]>;
  findOrCreateTag(name: string): Promise<Tag>;
  setBinderTags(binderId: number, tagNames: string[]): Promise<Tag[]>;

  // Catalog search
  searchCatalog(params: CatalogSearchParams): Promise<CatalogSearchResult>;

  // Search vector
  refreshSearchVector(binderId: number): Promise<void>;

  // Generation tracking
  incrementGenerationCount(username: string): Promise<void>;
  getGenerationInfo(username: string): Promise<{ generationCount: number; lastGeneratedAt: Date | null }>;

  // Credit operations
  getCreditBalance(userId: string): Promise<number>;
  getCreditTransactions(userId: string, limit?: number, offset?: number): Promise<CreditTransaction[]>;
  deductCredits(userId: string, amount: number, type: string, description: string, metadata?: string): Promise<{ transactionId: number; newBalance: number }>;
  grantCredits(userId: string, amount: number, type: string, description: string, metadata?: string): Promise<{ transactionId: number; newBalance: number }>;
  countActiveEnrollments(username: string): Promise<number>;
  countManualBinders(username: string): Promise<number>;

  // Binder review queue
  getBindersByStatus(status: string): Promise<any[]>;

  // Demo binders
  getDemoBinders(): Promise<BinderWithContent[]>;

  // Notification methods
  getCuratorUnreadNotifications(username: string, ackedAt: Date | null): Promise<Array<{ binderId: number; title: string; status: string; reviewNote: string | null }>>;
  getAdminUnreadCount(ackedAt: Date | null): Promise<number>;
  acknowledgeNotifications(userId: string): Promise<void>;
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

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getBinder(id: number): Promise<Binder | undefined> {
    const [binder] = await db.select().from(binders).where(eq(binders.id, id));
    return binder;
  }

  async listBinders(): Promise<Binder[]> {
    const rows = await db
      .select({
        binder: binders,
        curatorName: users.name,
        curatorUsername: users.username,
        curatorAvatarUrl: users.avatarUrl,
        curatorBio: users.bio,
        curatorExpertise: users.expertise,
        curatorProfileTitle: users.profileTitle,
        curatorLinkedin: users.linkedin,
        curatorTwitter: users.twitter,
        curatorThreads: users.threads,
        curatorWebsite: users.website,
        curatorSchedulingUrl: users.schedulingUrl,
      })
      .from(binders)
      .leftJoin(users, eq(binders.curatorId, users.username));

    return rows.map((row: any) => ({
      ...row.binder,
      curator: row.curatorUsername ? {
        name: row.curatorName,
        username: row.curatorUsername,
        avatarUrl: row.curatorAvatarUrl,
        bio: row.curatorBio,
        expertise: row.curatorExpertise,
        profileTitle: row.curatorProfileTitle,
        linkedin: row.curatorLinkedin,
        twitter: row.curatorTwitter,
        threads: row.curatorThreads,
        website: row.curatorWebsite,
        // Only expose scheduling URL for published binders
        schedulingUrl: row.binder.status === 'published' ? row.curatorSchedulingUrl : null,
      } : undefined,
    }));
  }

  async listPublishedBinders(): Promise<Binder[]> {
    return await db.select().from(binders).where(
      and(eq(binders.status, 'published'), eq(binders.visibility, 'public'))
    );
  }

  async getBindersByCurator(username: string): Promise<Binder[]> {
    return await db.select().from(binders).where(eq(binders.curatorId, username));
  }

  async createBinder(insertBinder: InsertBinder): Promise<Binder> {
    const [binder] = await db.insert(binders).values(insertBinder).returning();
    return binder;
  }

  async updateBinder(id: number, update: Partial<Binder>): Promise<Binder> {
    // Filter out immutable fields (id, curatorId), readonly fields, and nested objects
    const { id: _id, curatorId: _curatorId, createdAt, updatedAt, weeks, ...updateData } = update as Partial<Binder> & { weeks?: unknown };

    // Automatically set updatedAt to current time
    const [binder] = await db.update(binders).set({
      ...updateData,
      updatedAt: new Date()
    }).where(eq(binders.id, id)).returning();
    return binder;
  }

  async deleteBinder(id: number): Promise<void> {
    await db.delete(binders).where(eq(binders.id, id));
  }

  async batchDeleteBinders(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await db.delete(binders).where(inArray(binders.id, ids));
  }

  async getEnrollment(readerId: string, binderId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(
      and(eq(enrollments.readerId, readerId), eq(enrollments.binderId, binderId))
    );
    return enrollment;
  }

  async getUserEnrollments(readerId: string): Promise<Enrollment[]> {
    // Return only active enrollments (exclude dropped)
    return await db.select()
      .from(enrollments)
      .where(and(
        eq(enrollments.readerId, readerId),
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

  // Mark all in-progress enrollments for a user as dropped (used when switching binders)
  async dropActiveEnrollments(readerId: string, exceptBinderId?: number): Promise<void> {
    if (exceptBinderId) {
      await db.update(enrollments)
        .set({ status: 'dropped' })
        .where(and(
          eq(enrollments.readerId, readerId),
          eq(enrollments.status, 'in-progress'),
          sql`${enrollments.binderId} != ${exceptBinderId}`
        ));
    } else {
      await db.update(enrollments)
        .set({ status: 'dropped' })
        .where(and(
          eq(enrollments.readerId, readerId),
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
    return completions.map((c: any) => c.stepId);
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
  async getStepCompletionRates(binderId: number): Promise<Array<{ stepId: number; completionCount: number; completionRate: number }>> {
    const totalEnrollments = await db.select({ count: sql<number>`cast(count(*) as int)` })
      .from(enrollments)
      .where(eq(enrollments.binderId, binderId));

    const stepCompletions = await db.select({
      stepId: completedSteps.stepId,
      completionCount: sql<number>`cast(count(*) as int)`
    })
    .from(completedSteps)
    .innerJoin(enrollments, eq(completedSteps.enrollmentId, enrollments.id))
    .where(eq(enrollments.binderId, binderId))
    .groupBy(completedSteps.stepId);

    const total = totalEnrollments[0]?.count || 1;

    return stepCompletions.map((s: any) => ({
      stepId: s.stepId,
      completionCount: s.completionCount,
      completionRate: (s.completionCount / total) * 100
    }));
  }

  async getAverageCompletionTimes(binderId: number): Promise<Array<{ stepId: number; avgMinutes: number }>> {
    const result = await db.select({
      stepId: completedSteps.stepId,
      avgMinutes: sql<number>`cast(AVG(EXTRACT(EPOCH FROM (${completedSteps.completedAt} - ${enrollments.joinedAt})) / 60) as float)`
    })
    .from(completedSteps)
    .innerJoin(enrollments, eq(completedSteps.enrollmentId, enrollments.id))
    .where(eq(enrollments.binderId, binderId))
    .groupBy(completedSteps.stepId);

    return result;
  }

  // Week operations
  async createWeek(insertWeek: InsertWeek): Promise<Week> {
    const [week] = await db.insert(weeks).values(insertWeek).returning();
    return week;
  }

  async getWeeksByBinderId(binderId: number): Promise<Week[]> {
    return await db.select().from(weeks).where(eq(weeks.binderId, binderId));
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

  // Binder with content operations
  async getBinderWithContent(id: number): Promise<BinderWithContent | undefined> {
    // Get binder
    const binder = await this.getBinder(id);
    if (!binder) return undefined;

    // Get weeks for this binder
    const weeksData = await db.select()
      .from(weeks)
      .where(eq(weeks.binderId, id))
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

    return { ...binder, weeks: weeksWithSteps };
  }

  // Reader operations
  async getReadersByBinderId(binderId: number): Promise<any[]> {
    // Get all active enrollments for this binder (exclude dropped)
    const enrollmentsData = await db.select()
      .from(enrollments)
      .where(and(
        eq(enrollments.binderId, binderId),
        sql`${enrollments.status} != 'dropped'`
      ));

    // Get user data for each enrollment
    const readers = await Promise.all(
      enrollmentsData.map(async (enrollment: any) => {
        const user = await this.getUserByUsername(enrollment.readerId!);
        return {
          user,
          status: enrollment.status,
          joinedDate: enrollment.joinedAt?.toISOString(),
          enrollmentId: enrollment.id
        };
      })
    );

    return readers;
  }

  async getClassmatesByBinderId(binderId: number): Promise<{ classmates: any[]; totalEnrolled: number }> {
    // Get total active enrollment count (including private users)
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(and(
        eq(enrollments.binderId, binderId),
        sql`${enrollments.status} != 'dropped'`
      ));
    const totalEnrolled = Number(countResult?.count || 0);

    // Get active enrollments that opted into sharing (exclude dropped)
    const enrollmentsData = await db.select()
      .from(enrollments)
      .where(and(
        eq(enrollments.binderId, binderId),
        eq(enrollments.shareProfile, true),
        sql`${enrollments.status} != 'dropped'`
      ));

    const classmates = await Promise.all(
      enrollmentsData.map(async (enrollment: any) => {
        const user = await this.getUserByUsername(enrollment.readerId!);
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

  // Comprehensive analytics for a binder
  async getBinderAnalytics(binderId: number): Promise<{
    readersStarted: number;
    readersCompleted: number;
    completionRate: number;
    averageProgress: number;
    weekReach: Array<{ week: string; weekIndex: number; percentage: number; readerCount: number; readerNames: string[] }>;
    stepDropoff: Array<{ stepId: number; weekIndex: number; stepTitle: string; dropoffRate: number; completionCount: number }>;
    topDropoutStep: { weekIndex: number; stepTitle: string; dropoffRate: number } | null;
  }> {
    // Get all active enrollments for this binder (exclude dropped)
    const binderEnrollments = await db.select()
      .from(enrollments)
      .where(and(
        eq(enrollments.binderId, binderId),
        sql`${enrollments.status} != 'dropped'`
      ));

    const readersStarted = binderEnrollments.length;
    const readersCompleted = binderEnrollments.filter((e: any) => e.status === 'completed').length;
    const completionRate = readersStarted > 0 ? Math.round((readersCompleted / readersStarted) * 100) : 0;

    // Get binder content structure
    const binderWeeks = await db.select()
      .from(weeks)
      .where(eq(weeks.binderId, binderId))
      .orderBy(asc(weeks.index));

    // Get all steps with their week info
    const allSteps: Array<{ stepId: number; weekId: number; weekIndex: number; stepTitle: string; position: number }> = [];
    for (const week of binderWeeks) {
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
    const weekCurrentReaders: Record<number, string[]> = {}; // Readers currently AT this week
    const stepCompletionCounts: Record<number, number> = {};

    // Initialize counts and reader arrays
    for (const week of binderWeeks) {
      weekReachCounts[week.index] = 0;
      weekCurrentReaders[week.index] = [];
    }
    for (const step of allSteps) {
      stepCompletionCounts[step.stepId] = 0;
    }

    // Calculate progress for each enrollment
    for (const enrollment of binderEnrollments) {
      const completedStepIds = await this.getCompletedSteps(enrollment.id);
      const completedCount = completedStepIds.length;

      // Get reader name for this enrollment
      const reader = await this.getUserByUsername(enrollment.readerId!);
      const readerName = reader?.name || enrollment.readerId || 'Unknown';

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
      for (const week of binderWeeks) {
        const weekSteps = allSteps.filter(s => s.weekIndex === week.index);
        const hasAnyStepInWeek = weekSteps.some(s => completedStepSet.has(s.stepId));
        // Count if reader has reached this week
        if (hasAnyStepInWeek || (enrollment.currentWeekIndex && enrollment.currentWeekIndex >= week.index)) {
          weekReachCounts[week.index]++;
        }
      }

      // Track which week the reader is currently on (their active position)
      // Only show in the week they're currently at, not all weeks they've passed
      const currentWeek = enrollment.currentWeekIndex || 1;
      if (weekCurrentReaders[currentWeek]) {
        weekCurrentReaders[currentWeek].push(readerName);
      }
    }

    const averageProgress = readersStarted > 0 ? Math.round(totalProgressSum / readersStarted) : 0;

    // Build week reach data
    const weekReach = binderWeeks.map((week: any) => ({
      week: `Week ${week.index}`,
      weekIndex: week.index,
      percentage: readersStarted > 0 ? Math.round((weekReachCounts[week.index] / readersStarted) * 100) : 0,
      readerCount: weekReachCounts[week.index],
      readerNames: weekCurrentReaders[week.index] // Readers currently AT this week
    }));

    // Calculate step dropoff rates
    const stepDropoff = allSteps.map((step, index) => {
      const completionCount = stepCompletionCounts[step.stepId];
      const previousStepCompletion = index > 0
        ? stepCompletionCounts[allSteps[index - 1].stepId]
        : readersStarted;

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
      readersStarted,
      readersCompleted,
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

  async deleteWeeksByBinderId(binderId: number): Promise<void> {
    // Steps are deleted via CASCADE when weeks are deleted
    await db.delete(weeks).where(eq(weeks.binderId, binderId));
  }

  async saveWeeksAndSteps(
    binderId: number,
    weeksData: Array<{ index: number; title?: string; description?: string; steps: Array<Omit<InsertStep, 'weekId'>> }>
  ): Promise<WeekWithSteps[]> {
    // Delete existing weeks (steps cascade)
    await this.deleteWeeksByBinderId(binderId);

    const result: WeekWithSteps[] = [];

    for (const weekData of weeksData) {
      const [week] = await db.insert(weeks).values({
        binderId,
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
    await this.refreshSearchVector(binderId);

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

  async countBindersByCurator(username: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`cast(count(*) as int)` })
      .from(binders)
      .where(eq(binders.curatorId, username));
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

  async initializeDefaultCategories(): Promise<void> {
    const existing = await db.select({ id: categories.id }).from(categories).limit(1);
    if (existing.length > 0) return;
    await db.insert(categories).values([
      { name: 'Design', slug: 'design', description: 'Visual design, UX, product design, and design thinking', displayOrder: 1 },
      { name: 'Technology', slug: 'technology', description: 'Software engineering, AI, data science, and emerging tech', displayOrder: 2 },
      { name: 'Business', slug: 'business', description: 'Strategy, entrepreneurship, management, and leadership', displayOrder: 3 },
      { name: 'Science', slug: 'science', description: 'Natural sciences, research methods, and scientific thinking', displayOrder: 4 },
      { name: 'Arts & Culture', slug: 'arts-culture', description: 'Literature, history, art, music, and cultural studies', displayOrder: 5 },
      { name: 'Social Sciences', slug: 'social-sciences', description: 'Psychology, sociology, economics, and political science', displayOrder: 6 },
      { name: 'Humanities', slug: 'humanities', description: 'Philosophy, history, languages, and the study of human culture', displayOrder: 7 },
      { name: 'Personal Development', slug: 'personal-development', description: 'Productivity, communication, habits, and self-improvement', displayOrder: 8 },
      { name: 'Other', slug: 'other', description: "Topics that don't fit neatly into other categories", displayOrder: 9 },
    ]).onConflictDoNothing();
  }

  // Tag operations
  async listTags(query?: string): Promise<any[]> {
    const baseQuery = db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        createdAt: tags.createdAt,
        usageCount: sql<number>`cast(count(${binderTags.binderId}) as int)`,
      })
      .from(tags)
      .leftJoin(binderTags, eq(tags.id, binderTags.tagId))
      .groupBy(tags.id, tags.name, tags.slug, tags.createdAt);

    if (query) {
      return await baseQuery
        .where(ilike(tags.name, `%${query}%`))
        .orderBy(sql`count(${binderTags.binderId}) DESC`, asc(tags.name))
        .limit(20);
    }
    return await baseQuery
      .orderBy(sql`count(${binderTags.binderId}) DESC`, asc(tags.name))
      .limit(50);
  }

  async getTagsByBinderId(binderId: number): Promise<Tag[]> {
    const rows = await db.select({ tag: tags })
      .from(binderTags)
      .innerJoin(tags, eq(binderTags.tagId, tags.id))
      .where(eq(binderTags.binderId, binderId));
    return rows.map((r: any) => r.tag);
  }

  async findOrCreateTag(name: string): Promise<Tag> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const [existing] = await db.select().from(tags).where(eq(tags.slug, slug));
    if (existing) return existing;
    const [created] = await db.insert(tags).values({ name: name.trim(), slug }).returning();
    return created;
  }

  async setBinderTags(binderId: number, tagNames: string[]): Promise<Tag[]> {
    // Enforce max 5 tags
    const trimmed = tagNames.slice(0, 5);

    // Delete existing tags
    await db.delete(binderTags).where(eq(binderTags.binderId, binderId));

    if (trimmed.length === 0) return [];

    // Find or create each tag
    const resultTags: Tag[] = [];
    for (const name of trimmed) {
      const tag = await this.findOrCreateTag(name);
      resultTags.push(tag);
      await db.insert(binderTags)
        .values({ binderId, tagId: tag.id })
        .onConflictDoNothing();
    }

    // Refresh search vector to include new tag names
    await this.refreshSearchVector(binderId);

    return resultTags;
  }

  // Catalog search
  async searchCatalog(params: CatalogSearchParams): Promise<CatalogSearchResult> {
    const {
      query,
      category,
      level,
      visibility = 'public',
      curator,
      sort = 'newest',
      limit: resultLimit = 20,
      offset: resultOffset = 0
    } = params;

    // Build WHERE conditions: always filter published; visibility is configurable
    const conditions: any[] = [
      sql`${binders.status} = 'published'`,
      sql`${binders.visibility} = ${visibility}`,
    ];

    if (category) {
      const cats = Array.isArray(category) ? category : [category];
      conditions.push(sql`${categories.slug} IN ${cats}`);
    }

    if (level) {
      conditions.push(sql`${binders.audienceLevel} = ${level}`);
    }

    if (curator && curator.length > 0) {
      conditions.push(sql`${binders.curatorId} IN ${curator}`);
    }

    // Full-text search with ILIKE fallback for stop-word-only queries (e.g. "how to")
    if (query) {
      conditions.push(sql`(
        (plainto_tsquery('english', ${query})::text != '' AND ${binders.searchVector} @@ plainto_tsquery('english', ${query}))
        OR
        (plainto_tsquery('english', ${query})::text = '' AND (${binders.title} ILIKE ${'%' + query + '%'} OR ${binders.description} ILIKE ${'%' + query + '%'}))
      )`);
    }

    const whereClause = sql.join(conditions, sql` AND `);

    // Determine ORDER BY
    let orderByClause;
    if (sort === 'relevance' && query) {
      orderByClause = sql`ts_rank(${binders.searchVector}, plainto_tsquery('english', ${query})) DESC`;
    } else if (sort === 'popular') {
      orderByClause = sql`${binders.readerActive} DESC NULLS LAST, ${binders.createdAt} DESC`;
    } else {
      orderByClause = sql`${binders.createdAt} DESC`;
    }

    // Count query
    const [countResult] = await db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(binders)
      .leftJoin(categories, eq(binders.categoryId, categories.id))
      .where(whereClause);

    const total = countResult?.total || 0;

    // Main data query with curator join
    const rows = await db
      .select({
        binder: binders,
        categoryName: categories.name,
        categorySlug: categories.slug,
        curatorName: users.name,
        curatorUsername: users.username,
        curatorAvatarUrl: users.avatarUrl,
        curatorBio: users.bio,
        curatorExpertise: users.expertise,
        curatorProfileTitle: users.profileTitle,
        curatorLinkedin: users.linkedin,
        curatorTwitter: users.twitter,
        curatorThreads: users.threads,
        curatorWebsite: users.website,
        curatorSchedulingUrl: users.schedulingUrl,
      })
      .from(binders)
      .leftJoin(categories, eq(binders.categoryId, categories.id))
      .leftJoin(users, eq(binders.curatorId, users.username))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(resultLimit)
      .offset(resultOffset);

    // Fetch tags for each binder
    const bindersList = await Promise.all(rows.map(async (row: any) => {
      const rowBinderTags = await this.getTagsByBinderId(row.binder.id);
      return {
        ...row.binder,
        category: row.categoryName ? { name: row.categoryName, slug: row.categorySlug } : null,
        tags: rowBinderTags,
        curator: row.curatorUsername ? {
          name: row.curatorName,
          username: row.curatorUsername,
          avatarUrl: row.curatorAvatarUrl,
          bio: row.curatorBio,
          expertise: row.curatorExpertise,
          profileTitle: row.curatorProfileTitle,
          linkedin: row.curatorLinkedin,
          twitter: row.curatorTwitter,
          threads: row.curatorThreads,
          website: row.curatorWebsite,
          // Only expose scheduling URL for published binders
          schedulingUrl: row.binder.status === 'published' ? row.curatorSchedulingUrl : null,
        } : undefined,
      };
    }));

    return { binders: bindersList, total };
  }

  // Generation tracking
  async incrementGenerationCount(username: string): Promise<void> {
    await db.update(users)
      .set({
        generationCount: sql`${users.generationCount} + 1`,
        lastGeneratedAt: new Date(),
      })
      .where(eq(users.username, username));
  }

  async getGenerationInfo(username: string): Promise<{ generationCount: number; lastGeneratedAt: Date | null }> {
    const [user] = await db.select({
      generationCount: users.generationCount,
      lastGeneratedAt: users.lastGeneratedAt,
    }).from(users).where(eq(users.username, username));
    return {
      generationCount: user?.generationCount ?? 0,
      lastGeneratedAt: user?.lastGeneratedAt ?? null,
    };
  }

  // Binder review queue
  async getBindersByStatus(status: string): Promise<any[]> {
    const rows = await db
      .select({
        binder: binders,
        curatorName: users.name,
        curatorUsername: users.username,
        curatorAvatarUrl: users.avatarUrl,
      })
      .from(binders)
      .leftJoin(users, eq(binders.curatorId, users.username))
      .where(eq(binders.status, status))
      .orderBy(asc(binders.submittedAt));

    return rows.map((row: any) => ({
      ...row.binder,
      curator: row.curatorUsername ? {
        name: row.curatorName,
        username: row.curatorUsername,
        avatarUrl: row.curatorAvatarUrl,
      } : undefined,
    }));
  }

  // Demo binders
  async getDemoBinders(): Promise<BinderWithContent[]> {
    const demoBinders = await db.select().from(binders).where(eq(binders.isDemo, true));
    const results = await Promise.all(demoBinders.map((b: any) => this.getBinderWithContent(b.id)));
    return results.filter((b): b is BinderWithContent => b !== undefined);
  }

  // Notification methods
  async getCuratorUnreadNotifications(username: string, ackedAt: Date | null): Promise<Array<{ binderId: number; title: string; status: string; reviewNote: string | null }>> {
    const conditions = [
      eq(binders.curatorId, username),
      isNotNull(binders.reviewedAt),
    ];

    if (ackedAt) {
      conditions.push(gt(binders.reviewedAt, ackedAt));
    }

    const rows = await db.select({
      binderId: binders.id,
      title: binders.title,
      status: binders.status,
      reviewNote: binders.reviewNote,
    })
    .from(binders)
    .where(and(...conditions));

    return rows;
  }

  async getAdminUnreadCount(ackedAt: Date | null): Promise<number> {
    const conditions: any[] = [
      eq(binders.status, 'pending_review'),
    ];

    if (ackedAt) {
      conditions.push(gt(binders.submittedAt, ackedAt));
    }

    const [result] = await db.select({ count: sql<number>`cast(count(*) as int)` })
      .from(binders)
      .where(and(...conditions));

    return result?.count || 0;
  }

  async acknowledgeNotifications(userId: string): Promise<void> {
    await db.update(users)
      .set({ notificationsAckedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Credit operations
  async getCreditBalance(userId: string): Promise<number> {
    const [user] = await db.select({ creditBalance: users.creditBalance }).from(users).where(eq(users.id, userId));
    return user?.creditBalance ?? 0;
  }

  async getCreditTransactions(userId: string, limit = 50, offset = 0): Promise<CreditTransaction[]> {
    return db.select().from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async deductCredits(userId: string, amount: number, type: string, description: string, metadata?: string): Promise<{ transactionId: number; newBalance: number }> {
    // Atomic deduction with row lock via raw SQL
    const result = await db.execute(sql`
      WITH updated AS (
        UPDATE users SET credit_balance = credit_balance - ${amount}
        WHERE id = ${userId} AND credit_balance >= ${amount}
        RETURNING credit_balance
      )
      INSERT INTO credit_transactions (user_id, amount, balance, type, description, metadata)
      SELECT ${userId}, ${-amount}, updated.credit_balance, ${type}, ${description}, ${metadata ?? null}
      FROM updated
      RETURNING id, balance
    `);
    const row = (result as any).rows?.[0];
    if (!row) {
      throw new Error('INSUFFICIENT_CREDITS');
    }
    return { transactionId: row.id, newBalance: row.balance };
  }

  async grantCredits(userId: string, amount: number, type: string, description: string, metadata?: string): Promise<{ transactionId: number; newBalance: number }> {
    const result = await db.execute(sql`
      WITH updated AS (
        UPDATE users SET credit_balance = credit_balance + ${amount}
        WHERE id = ${userId}
        RETURNING credit_balance
      )
      INSERT INTO credit_transactions (user_id, amount, balance, type, description, metadata)
      SELECT ${userId}, ${amount}, updated.credit_balance, ${type}, ${description}, ${metadata ?? null}
      FROM updated
      RETURNING id, balance
    `);
    const row = (result as any).rows?.[0];
    if (!row) {
      throw new Error('User not found');
    }
    return { transactionId: row.id, newBalance: row.balance };
  }

  async countActiveEnrollments(username: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`cast(count(*) as int)` })
      .from(enrollments)
      .where(and(
        eq(enrollments.readerId, username),
        eq(enrollments.status, 'in-progress')
      ));
    return result?.count ?? 0;
  }

  async countManualBinders(username: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`cast(count(*) as int)` })
      .from(binders)
      .where(and(
        eq(binders.curatorId, username),
        eq(binders.isAiGenerated, false)
      ));
    return result?.count ?? 0;
  }

  // Refresh search vector for a binder (includes week content and tag names)
  async refreshSearchVector(binderId: number): Promise<void> {
    const weekRows = await db.select({ title: weeks.title, description: weeks.description })
      .from(weeks).where(eq(weeks.binderId, binderId));

    const tagRows = await this.getTagsByBinderId(binderId);
    const tagText = tagRows.map(t => t.name).join(' ');
    const weekText = weekRows.map((w: any) => [w.title || '', w.description || ''].join(' ')).join(' ');

    await db.execute(sql`
      UPDATE binders SET search_vector =
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', ${weekText}), 'C') ||
        setweight(to_tsvector('english', ${tagText}), 'D')
      WHERE id = ${binderId}
    `);
  }

}

export const storage = new DatabaseStorage();
