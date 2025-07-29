import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const savingsGoals = pgTable("savings_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  name: text("name").notNull(),
  goalType: text("goal_type").notNull(),
  targetAmount: real("target_amount").notNull(),
  currentSavings: real("current_savings").default(0),
  targetDate: timestamp("target_date").notNull(),
  monthlyCapacity: real("monthly_capacity"),
  isActive: boolean("is_active").default(true),
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
  username: true,
  password: true,
});

export const insertSavingsGoalSchema = createInsertSchema(savingsGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  goalType: z.enum(goalTypes),
  targetAmount: z.number().positive(),
  currentSavings: z.number().min(0).default(0),
  monthlyCapacity: z.number().positive().optional(),
});

export const updateSavingsGoalSchema = insertSavingsGoalSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type UpdateSavingsGoal = z.infer<typeof updateSavingsGoalSchema>;
export type GoalType = typeof goalTypes[number];
