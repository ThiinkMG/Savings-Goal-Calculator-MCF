import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, json, boolean, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name"),
  email: text("email").unique(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  phoneVerified: boolean("phone_verified").default(false),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  wixUserId: text("wix_user_id").unique(), // Store original Wix user ID for sync reference
  membershipTier: varchar("membership_tier", { length: 50 }).default("free"),
  learningProgress: json("learning_progress").default([]),
  preferences: json("preferences").default({}),
  lastWixSync: timestamp("last_wix_sync"),
  syncEnabled: boolean("sync_enabled").default(true),
  isLocked: boolean("is_locked").default(false),
  lockoutUntil: timestamp("lockout_until"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const verificationCodes = pgTable("verification_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  code: varchar("code", { length: 6 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'password_reset', 'username_recovery'
  method: varchar("method", { length: 10 }).notNull(), // 'email', 'sms'
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savingsGoals = pgTable("savings_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  goalType: text("goal_type").notNull(),
  targetAmount: real("target_amount").notNull(),
  currentSavings: real("current_savings").default(0),
  targetDate: timestamp("target_date").notNull(),
  monthlyCapacity: real("monthly_capacity"),
  status: varchar("status", { length: 20 }).default("active"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Track guest usage to prevent abuse
export const guestTracking = pgTable("guest_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(), // Support IPv6
  browserFingerprint: text("browser_fingerprint").notNull(),
  dailyGoalCount: integer("daily_goal_count").default(0),
  dailyPdfCount: integer("daily_pdf_count").default(0),
  lastResetDate: timestamp("last_reset_date").notNull(),
  nextResetTime: timestamp("next_reset_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const goalTypes = [
  'education',
  'emergency',
  'home',
  'vacation',
  'car',
  'retirement',
  'investment',
  'other'
] as const;

export const insertUserSchema = createInsertSchema(users).pick({
  fullName: true,
  email: true,
  phoneNumber: true,
  username: true,
  password: true,
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email, phone, or username is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Email or phone number is required"),
});

export const verifyCodeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
  identifier: z.string().min(1, "Identifier is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const insertVerificationCodeSchema = createInsertSchema(verificationCodes).omit({
  id: true,
  createdAt: true,
});

export const insertSavingsGoalSchema = createInsertSchema(savingsGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  goalType: z.enum(goalTypes),
  targetAmount: z.number().positive(),
  currentSavings: z.number().min(0).default(0),
  monthlyCapacity: z.number().positive().nullable().optional(),
  userId: z.string(),
  targetDate: z.string().or(z.date()).transform((val) => new Date(val)),
  status: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateSavingsGoalSchema = insertSavingsGoalSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type UpdateSavingsGoal = z.infer<typeof updateSavingsGoalSchema>;
export type GoalType = typeof goalTypes[number];
export type GuestTracking = typeof guestTracking.$inferSelect;
