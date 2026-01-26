import {
  type User, type InsertUser,
  type Syllabus, type InsertSyllabus,
  type Enrollment, type InsertEnrollment,
  type Week, type InsertWeek,
  type Step, type InsertStep,
  type Submission, type InsertSubmission,
  type CompletedStep, type InsertCompletedStep,
  users, syllabi, enrollments, weeks, steps, submissions, completedSteps
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, asc } from "drizzle-orm";

// Extended types for nested data
export interface WeekWithSteps extends Week {
  steps: Step[];
}

export interface SyllabusWithContent extends Syllabus {
  weeks: WeekWithSteps[];
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
  listSyllabi(): Promise<Syllabus[]>;
  listPublishedSyllabi(): Promise<Syllabus[]>;
  getSyllabiByCreator(username: string): Promise<Syllabus[]>;
  createSyllabus(syllabus: InsertSyllabus): Promise<Syllabus>;
  updateSyllabus(id: number, syllabus: Partial<Syllabus>): Promise<Syllabus>;
  deleteSyllabus(id: number): Promise<void>;

  // Week operations
  createWeek(week: InsertWeek): Promise<Week>;
  getWeeksBySyllabusId(syllabusId: number): Promise<Week[]>;

  // Step operations
  createStep(step: InsertStep): Promise<Step>;
  getStepsByWeekId(weekId: number): Promise<Step[]>;

  // Submission operations
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissionsByEnrollmentId(enrollmentId: number): Promise<Submission[]>;
  updateSubmissionFeedback(id: number, feedback: string, grade: string, rubricUrl?: string): Promise<Submission>;

  // Learner operations
  getLearnersBySyllabusId(syllabusId: number): Promise<any[]>;

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
    const [user] = await db.update(users).set(update).where(eq(users.id, id)).returning();
    return user;
  }

  async getSyllabus(id: number): Promise<Syllabus | undefined> {
    const [syllabus] = await db.select().from(syllabi).where(eq(syllabi.id, id));
    return syllabus;
  }

  async listSyllabi(): Promise<Syllabus[]> {
    return await db.select().from(syllabi);
  }

  async listPublishedSyllabi(): Promise<Syllabus[]> {
    return await db.select().from(syllabi).where(eq(syllabi.status, 'published'));
  }

  async getSyllabiByCreator(username: string): Promise<Syllabus[]> {
    return await db.select().from(syllabi).where(eq(syllabi.creatorId, username));
  }

  async createSyllabus(insertSyllabus: InsertSyllabus): Promise<Syllabus> {
    const [syllabus] = await db.insert(syllabi).values(insertSyllabus).returning();
    return syllabus;
  }

  async updateSyllabus(id: number, update: Partial<Syllabus>): Promise<Syllabus> {
    const [syllabus] = await db.update(syllabi).set(update).where(eq(syllabi.id, id)).returning();
    return syllabus;
  }

  async deleteSyllabus(id: number): Promise<void> {
    await db.delete(syllabi).where(eq(syllabi.id, id));
  }

  async getEnrollment(studentId: string, syllabusId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(
      and(eq(enrollments.studentId, studentId), eq(enrollments.syllabusId, syllabusId))
    );
    return enrollment;
  }

  async getUserEnrollments(studentId: string): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }

  async getEnrollmentById(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values(insertEnrollment).returning();
    return enrollment;
  }

  async updateEnrollment(id: number, update: Partial<Enrollment>): Promise<Enrollment> {
    const [enrollment] = await db.update(enrollments).set(update).where(eq(enrollments.id, id)).returning();
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

  // Step operations
  async createStep(insertStep: InsertStep): Promise<Step> {
    const [step] = await db.insert(steps).values(insertStep).returning();
    return step;
  }

  async getStepsByWeekId(weekId: number): Promise<Step[]> {
    return await db.select().from(steps).where(eq(steps.weekId, weekId));
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

    // Get steps for each week
    const weeksWithSteps: WeekWithSteps[] = await Promise.all(
      weeksData.map(async (week) => {
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
    // Get all enrollments for this syllabus
    const enrollmentsData = await db.select()
      .from(enrollments)
      .where(eq(enrollments.syllabusId, syllabusId));

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
}

export const storage = new DatabaseStorage();
