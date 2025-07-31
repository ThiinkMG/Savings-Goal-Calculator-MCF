import { users, savingsGoals, type User, type InsertUser, type SavingsGoal, type InsertSavingsGoal, type UpdateSavingsGoal } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Savings Goals
  getSavingsGoal(id: string): Promise<SavingsGoal | undefined>;
  getSavingsGoalsByUser(userId?: string): Promise<SavingsGoal[]>;
  createSavingsGoal(goal: InsertSavingsGoal): Promise<SavingsGoal>;
  updateSavingsGoal(id: string, goal: UpdateSavingsGoal): Promise<SavingsGoal | undefined>;
  deleteSavingsGoal(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getSavingsGoal(id: string): Promise<SavingsGoal | undefined> {
    const [goal] = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id));
    return goal || undefined;
  }

  async getSavingsGoalsByUser(userId?: string): Promise<SavingsGoal[]> {
    if (!userId) {
      return await db.select().from(savingsGoals).where(eq(savingsGoals.isActive, true));
    }
    return await db.select().from(savingsGoals).where(
      eq(savingsGoals.userId, userId)
    );
  }

  async createSavingsGoal(insertGoal: InsertSavingsGoal): Promise<SavingsGoal> {
    const [goal] = await db
      .insert(savingsGoals)
      .values({
        ...insertGoal,
        currentSavings: insertGoal.currentSavings || 0,
      })
      .returning();
    return goal;
  }

  async updateSavingsGoal(id: string, updateGoal: UpdateSavingsGoal): Promise<SavingsGoal | undefined> {
    const [goal] = await db
      .update(savingsGoals)
      .set({
        ...updateGoal,
        updatedAt: new Date(),
      })
      .where(eq(savingsGoals.id, id))
      .returning();
    return goal || undefined;
  }

  async deleteSavingsGoal(id: string): Promise<boolean> {
    const [goal] = await db
      .update(savingsGoals)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(savingsGoals.id, id))
      .returning();
    return !!goal;
  }
}

export const storage = new DatabaseStorage();
