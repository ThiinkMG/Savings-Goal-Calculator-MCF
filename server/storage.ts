import { users, savingsGoals, verificationCodes, type User, type InsertUser, type SavingsGoal, type InsertSavingsGoal, type UpdateSavingsGoal } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, lt, gt, sql } from "drizzle-orm";
import { googleSheetsService } from "./googleSheetsService";
import bcrypt from 'bcryptjs';

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByWixId(wixUserId: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  getAllUsers?(): Promise<User[]>;
  createUser(user: InsertUser & { wixUserId?: string }): Promise<User>;
  updateUserPassword(userId: string, newPassword: string): Promise<boolean>;
  updateUsername(userId: string, newUsername: string): Promise<boolean>;
  updatePhoneNumber(userId: string, newPhoneNumber: string): Promise<boolean>;
  updateEmail(userId: string, newEmail: string): Promise<boolean>;
  updateUserWixId(userId: string, wixUserId: string): Promise<boolean>;
  incrementFailedAttempts(userId: string): Promise<void>;
  lockUser(userId: string, lockDuration: number): Promise<void>;
  unlockUser(userId: string): Promise<void>;
  updateLastLogin(userId: string): Promise<void>;
  
  // Savings goals methods for Wix adaptor
  getSavingsGoalsByUserId?(userId: string): Promise<SavingsGoal[]>;
  getSavingsGoalById?(goalId: string): Promise<SavingsGoal | undefined>;
  createSavingsGoal?(goal: InsertSavingsGoal): Promise<SavingsGoal>;
  updateSavingsGoal?(goalId: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal | undefined>;
  deleteSavingsGoal?(goalId: string): Promise<boolean>;
  
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

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByWixId(wixUserId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.wixUserId, wixUserId));
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
    const result = await db
      .update(users)
      .set({ 
        password: newPassword,
        failedLoginAttempts: 0,
        isLocked: false,
        lockoutUntil: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result.length > 0;
  }

  async updateUsername(userId: string, newUsername: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ 
        username: newUsername,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    // Sync changes to Wix if user is linked
    if (result.length > 0 && result[0].wixUserId) {
      try {
        const { wixSyncService } = await import('./wixSync');
        const wixResult = await wixSyncService.updateWixUser(result[0]);
        if (!wixResult.success) {
          console.error('Failed to sync username update to Wix:', wixResult.error);
        }
      } catch (error) {
        console.error('Failed to sync username to Wix:', error);
      }
    }
    
    return result.length > 0;
  }

  async updatePhoneNumber(userId: string, newPhoneNumber: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ 
        phoneNumber: newPhoneNumber,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    // Sync changes to Wix if user is linked
    if (result.length > 0 && result[0].wixUserId) {
      try {
        const { wixSyncService } = await import('./wixSync');
        const wixResult = await wixSyncService.updateWixUser(result[0]);
        if (!wixResult.success) {
          console.error('Failed to sync phone update to Wix:', wixResult.error);
        }
      } catch (error) {
        console.error('Failed to sync phone to Wix:', error);
      }
    }
    
    return result.length > 0;
  }

  async updateEmail(userId: string, newEmail: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ 
        email: newEmail,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    // Sync changes to Wix if user is linked
    if (result.length > 0 && result[0].wixUserId) {
      try {
        const { wixSyncService } = await import('./wixSync');
        const wixResult = await wixSyncService.updateWixUser(result[0]);
        if (!wixResult.success) {
          console.error('Failed to sync email update to Wix:', wixResult.error);
        }
      } catch (error) {
        console.error('Failed to sync email to Wix:', error);
      }
    }
    
    return result.length > 0;
  }

  async updateUserWixId(userId: string, wixUserId: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ 
        wixUserId: wixUserId,
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

  async createUser(insertUser: InsertUser & { wixUserId?: string }): Promise<User> {
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

    // Sync to Wix if user was created locally (no wixUserId)
    if (!insertUser.wixUserId) {
      try {
        const { wixSyncService } = await import('./wixSync');
        const wixResult = await wixSyncService.createWixUser(user);
        if (!wixResult.success) {
          console.error('Failed to sync new user to Wix:', wixResult.error);
        }
      } catch (error) {
        console.error('Failed to sync user to Wix:', error);
      }
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

  // Additional methods for Wix Database Adaptor
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getSavingsGoalsByUserId(userId: string): Promise<SavingsGoal[]> {
    return await db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId));
  }

  async getSavingsGoalById(goalId: string): Promise<SavingsGoal | undefined> {
    const [goal] = await db.select().from(savingsGoals).where(eq(savingsGoals.id, goalId));
    return goal || undefined;
  }

  async createSavingsGoal(goal: InsertSavingsGoal): Promise<SavingsGoal> {
    const [newGoal] = await db
      .insert(savingsGoals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async updateSavingsGoal(goalId: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal | undefined> {
    const [updatedGoal] = await db
      .update(savingsGoals)
      .set(updates)
      .where(eq(savingsGoals.id, goalId))
      .returning();
    return updatedGoal || undefined;
  }

  async deleteSavingsGoal(goalId: string): Promise<boolean> {
    const result = await db
      .delete(savingsGoals)
      .where(eq(savingsGoals.id, goalId))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
