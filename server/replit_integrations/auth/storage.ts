import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: number): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    const [existing] = await db.select().from(users).where(eq(users.replitId, userData.replitId!));
    if (existing) {
      const [updated] = await db.update(users).set(userData).where(eq(users.id, existing.id)).returning();
      return updated;
    }
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
