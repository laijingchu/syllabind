import { 
  type User, type InsertUser, 
  type Syllabus, type InsertSyllabus,
  type Enrollment, type InsertEnrollment,
  users, syllabi, enrollments 
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByReplitId(replitId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;

  // Syllabus operations
  getSyllabus(id: number): Promise<Syllabus | undefined>;
  listSyllabi(): Promise<Syllabus[]>;
  createSyllabus(syllabus: InsertSyllabus): Promise<Syllabus>;
  updateSyllabus(id: number, syllabus: Partial<Syllabus>): Promise<Syllabus>;
  deleteSyllabus(id: number): Promise<void>;

  // Enrollment operations
  getEnrollment(userId: number, syllabusId: number): Promise<Enrollment | undefined>;
  getUserEnrollments(userId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
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

  async updateUser(id: number, update: Partial<User>): Promise<User> {
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

  async getEnrollment(userId: number, syllabusId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(
      and(eq(enrollments.userId, userId), eq(enrollments.syllabusId, syllabusId))
    );
    return enrollment;
  }

  async getUserEnrollments(userId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values(insertEnrollment).returning();
    return enrollment;
  }

  async updateEnrollment(id: number, update: Partial<Enrollment>): Promise<Enrollment> {
    const [enrollment] = await db.update(enrollments).set(update).where(eq(enrollments.id, id)).returning();
    return enrollment;
  }
}

export const storage = new DatabaseStorage();
