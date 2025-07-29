import { type User, type InsertUser, type SavingsGoal, type InsertSavingsGoal, type UpdateSavingsGoal } from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private savingsGoals: Map<string, SavingsGoal>;

  constructor() {
    this.users = new Map();
    this.savingsGoals = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getSavingsGoal(id: string): Promise<SavingsGoal | undefined> {
    return this.savingsGoals.get(id);
  }

  async getSavingsGoalsByUser(userId?: string): Promise<SavingsGoal[]> {
    if (!userId) {
      return Array.from(this.savingsGoals.values()).filter(goal => goal.isActive);
    }
    return Array.from(this.savingsGoals.values()).filter(
      goal => goal.userId === userId && goal.isActive
    );
  }

  async createSavingsGoal(insertGoal: InsertSavingsGoal): Promise<SavingsGoal> {
    const id = randomUUID();
    const now = new Date();
    const goal: SavingsGoal = {
      ...insertGoal,
      id,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      currentSavings: insertGoal.currentSavings || 0,
    };
    this.savingsGoals.set(id, goal);
    return goal;
  }

  async updateSavingsGoal(id: string, updateGoal: UpdateSavingsGoal): Promise<SavingsGoal | undefined> {
    const existingGoal = this.savingsGoals.get(id);
    if (!existingGoal) return undefined;

    const updatedGoal: SavingsGoal = {
      ...existingGoal,
      ...updateGoal,
      updatedAt: new Date(),
    };
    this.savingsGoals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteSavingsGoal(id: string): Promise<boolean> {
    const goal = this.savingsGoals.get(id);
    if (!goal) return false;
    
    // Soft delete
    const updatedGoal = { ...goal, isActive: false, updatedAt: new Date() };
    this.savingsGoals.set(id, updatedGoal);
    return true;
  }
}

export const storage = new MemStorage();
