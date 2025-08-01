import { users, savingsGoals, verificationCodes, type User, type InsertUser, type SavingsGoal, type InsertSavingsGoal, type UpdateSavingsGoal } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, lt, gt, sql } from "drizzle-orm";
import { googleSheetsService } from "./googleSheetsService";
import bcrypt from 'bcryptjs';

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: string, newPassword: string): Promise<boolean>;
  incrementFailedAttempts(userId: string): Promise<void>;
  lockUser(userId: string, lockDuration: number): Promise<void>;
  unlockUser(userId: string): Promise<void>;
  updateLastLogin(userId: string): Promise<void>;
  
  // Verification codes
  createVerificationCode(userId: string, code: string, type: string, method: string): Promise<string>;
  verifyCode(code: string, identifier: string, type: string): Promise<{ valid: boolean; userId?: string }>;
  markCodeAsUsed(codeId: string): Promise<void>;
  
  // Savings Goals
  getSavingsGoal(id: string): Promise<SavingsGoal | undefined>;
  getSavingsGoalsByUser(userId: string): Promise<SavingsGoal[]>;
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

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    // Auto-detect if identifier is email, phone, or username
    const isEmail = identifier.includes('@');
    const isPhone = /^[\+]?[1-9][\d]{0,15}$/.test(identifier.replace(/[\s\-\(\)]/g, ''));
    
    if (isEmail) {
      // Search by email
      const [user] = await db.select().from(users).where(eq(users.email, identifier));
      return user || undefined;
    } else if (isPhone) {
      // Search by phone number
      const [user] = await db.select().from(users).where(eq(users.phoneNumber, identifier));
      return user || undefined;
    } else {
      // Search by username
      const [user] = await db.select().from(users).where(eq(users.username, identifier));
      return user || undefined;
    }
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        failedLoginAttempts: 0,
        isLocked: false,
        lockoutUntil: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result.length > 0;
  }

  async incrementFailedAttempts(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        failedLoginAttempts: sql`failed_login_attempts + 1`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async lockUser(userId: string, lockDurationMinutes: number): Promise<void> {
    const lockUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
    await db
      .update(users)
      .set({ 
        isLocked: true,
        lockoutUntil: lockUntil,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async unlockUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        isLocked: false,
        lockoutUntil: null,
        failedLoginAttempts: 0,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async createVerificationCode(userId: string, code: string, type: string, method: string): Promise<string> {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    const [verificationCode] = await db
      .insert(verificationCodes)
      .values({
        userId,
        code,
        type,
        method,
        expiresAt,
        used: false
      })
      .returning();
    
    return verificationCode.id;
  }

  async verifyCode(code: string, identifier: string, type: string): Promise<{ valid: boolean; userId?: string }> {
    // Find user by identifier
    const user = await this.getUserByIdentifier(identifier);
    if (!user) {
      return { valid: false };
    }

    // Find valid, unused, non-expired code
    const [verificationCode] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, user.id),
          eq(verificationCodes.code, code),
          eq(verificationCodes.type, type),
          eq(verificationCodes.used, false),
          gt(verificationCodes.expiresAt, new Date())
        )
      );

    if (!verificationCode) {
      return { valid: false };
    }

    return { valid: true, userId: user.id };
  }

  async markCodeAsUsed(codeId: string): Promise<void> {
    await db
      .update(verificationCodes)
      .set({ used: true })
      .where(eq(verificationCodes.id, codeId));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    
    // Sync to Google Sheets if target spreadsheet is set
    try {
      const targetSpreadsheetId = googleSheetsService.getTargetSpreadsheet();
      if (targetSpreadsheetId) {
        await googleSheetsService.syncUser(user.id, targetSpreadsheetId);
      }
    } catch (error) {
      console.error('Failed to sync user to Google Sheets:', error);
    }
    
    return user;
  }

  async getSavingsGoal(id: string): Promise<SavingsGoal | undefined> {
    const [goal] = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id));
    return goal || undefined;
  }

  async getSavingsGoalsByUser(userId: string): Promise<SavingsGoal[]> {
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
    
    // Sync to Google Sheets if target spreadsheet is set
    try {
      const targetSpreadsheetId = googleSheetsService.getTargetSpreadsheet();
      if (targetSpreadsheetId) {
        await googleSheetsService.syncGoal(goal.id, targetSpreadsheetId);
      }
    } catch (error) {
      console.error('Failed to sync goal to Google Sheets:', error);
    }
    
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
    
    // Sync to Google Sheets if target spreadsheet is set
    if (goal) {
      try {
        const targetSpreadsheetId = googleSheetsService.getTargetSpreadsheet();
        if (targetSpreadsheetId) {
          await googleSheetsService.syncGoal(goal.id, targetSpreadsheetId);
        }
      } catch (error) {
        console.error('Failed to sync updated goal to Google Sheets:', error);
      }
    }
    
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
    
    // Sync to Google Sheets if target spreadsheet is set
    if (goal) {
      try {
        const targetSpreadsheetId = googleSheetsService.getTargetSpreadsheet();
        if (targetSpreadsheetId) {
          await googleSheetsService.syncGoal(goal.id, targetSpreadsheetId);
        }
      } catch (error) {
        console.error('Failed to sync deleted goal to Google Sheets:', error);
      }
    }
    
    return !!goal;
  }
}

export const storage = new DatabaseStorage();
