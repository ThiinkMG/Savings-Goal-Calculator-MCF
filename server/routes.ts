import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSavingsGoalSchema, updateSavingsGoalSchema } from "@shared/schema";
import { z } from "zod";
import { requireAuth, register, login, logout, getCurrentUser, type AuthenticatedRequest } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", requireAuth, getCurrentUser);
  // Get all savings goals (with auth)
  app.get("/api/savings-goals", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const goals = await storage.getSavingsGoalsByUser(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch savings goals" });
    }
  });

  // Get specific savings goal (with auth and ownership check)
  app.get("/api/savings-goals/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const goal = await storage.getSavingsGoal(req.params.id);
      if (!goal) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      
      // Check ownership - user can only access their own goals
      const userId = req.session.userId;
      if (!userId || goal.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch savings goal" });
    }
  });

  // Create new savings goal (with auth)
  app.post("/api/savings-goals", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const validatedData = insertSavingsGoalSchema.parse({
        ...req.body,
        userId: userId // Ensure goal is tied to current user
      });
      const goal = await storage.createSavingsGoal(validatedData);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create savings goal" });
    }
  });

  // Update savings goal (with auth and ownership check)
  app.patch("/api/savings-goals/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // First check if goal exists and user owns it
      const existingGoal = await storage.getSavingsGoal(req.params.id);
      if (!existingGoal) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      
      const userId = req.session.userId;
      if (!userId || existingGoal.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = updateSavingsGoalSchema.parse(req.body);
      const goal = await storage.updateSavingsGoal(req.params.id, validatedData);
      res.json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update savings goal" });
    }
  });

  // Delete savings goal (with auth and ownership check)
  app.delete("/api/savings-goals/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // First check if goal exists and user owns it
      const existingGoal = await storage.getSavingsGoal(req.params.id);
      if (!existingGoal) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      
      const userId = req.session.userId;
      if (!userId || existingGoal.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteSavingsGoal(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      res.json({ message: "Savings goal deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete savings goal" });
    }
  });

  // Calculate savings scenarios
  app.post("/api/calculate-scenarios", async (req, res) => {
    try {
      const { targetAmount, currentSavings, targetDate, monthlyCapacity } = req.body;
      
      const target = parseFloat(targetAmount) || 0;
      const current = parseFloat(currentSavings) || 0;
      const capacity = parseFloat(monthlyCapacity) || 0;
      const endDate = new Date(targetDate);
      const today = new Date();
      
      if (target <= 0 || endDate <= today) {
        return res.status(400).json({ message: "Invalid calculation parameters" });
      }
      
      const monthsRemaining = Math.max(1, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      const amountNeeded = Math.max(0, target - current);
      const monthlyRequired = amountNeeded / monthsRemaining;
      const progressPercent = Math.min(100, (current / target) * 100);
      
      // What-if scenarios
      const scenario50More = {
        monthlyAmount: monthlyRequired + 50,
        monthsSaved: Math.max(0, monthsRemaining - Math.ceil(amountNeeded / (monthlyRequired + 50)))
      };
      
      const scenario100More = {
        monthlyAmount: monthlyRequired + 100,
        monthsSaved: Math.max(0, monthsRemaining - Math.ceil(amountNeeded / (monthlyRequired + 100)))
      };
      
      const isFeasible = monthlyRequired <= capacity;
      
      res.json({
        monthlyRequired: Math.round(monthlyRequired),
        monthsRemaining,
        amountNeeded,
        progressPercent: Math.round(progressPercent * 100) / 100,
        isFeasible,
        scenarios: {
          save50More: scenario50More,
          save100More: scenario100More
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate scenarios" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
