import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { insertSavingsGoalSchema, updateSavingsGoalSchema } from "@shared/schema";
import { z } from "zod";

// In-memory storage for goals since we removed authentication
let goals: any[] = [];
let goalIdCounter = 1;

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all savings goals (no auth needed)
  app.get("/api/savings-goals", async (req: Request, res: Response) => {
    try {
      res.json(goals);
    } catch (error) {
      console.error('Fetch savings goals error:', error);
      res.status(500).json({ message: "Failed to fetch savings goals" });
    }
  });

  // Get specific savings goal by ID
  app.get("/api/savings-goals/:id", async (req: Request, res: Response) => {
    try {
      const goal = goals.find(g => g.id === req.params.id);
      if (!goal) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      res.json(goal);
    } catch (error) {
      console.error('Fetch savings goal error:', error);
      res.status(500).json({ message: "Failed to fetch savings goal" });
    }
  });

  // Create new savings goal (no auth needed)
  app.post("/api/savings-goals", async (req: Request, res: Response) => {
    try {
      const goalData = {
        id: String(goalIdCounter++),
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      goals.push(goalData);
      res.status(201).json(goalData);
    } catch (error) {
      console.error('Create savings goal error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create savings goal" });
    }
  });

  // Update savings goal
  app.patch("/api/savings-goals/:id", async (req: Request, res: Response) => {
    try {
      const goalIndex = goals.findIndex(g => g.id === req.params.id);
      if (goalIndex === -1) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      
      const updatedGoal = {
        ...goals[goalIndex],
        ...req.body,
        updatedAt: new Date()
      };
      
      goals[goalIndex] = updatedGoal;
      res.json(updatedGoal);
    } catch (error) {
      console.error('Update savings goal error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update savings goal" });
    }
  });

  // Delete savings goal
  app.delete("/api/savings-goals/:id", async (req: Request, res: Response) => {
    try {
      const goalIndex = goals.findIndex(g => g.id === req.params.id);
      if (goalIndex === -1) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      
      goals.splice(goalIndex, 1);
      res.json({ message: "Savings goal deleted successfully" });
    } catch (error) {
      console.error('Delete goal error:', error);
      res.status(500).json({ message: "Failed to delete savings goal" });
    }
  });

  // Calculate savings scenarios
  app.post("/api/calculate-scenarios", async (req: Request, res: Response) => {
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
      
      const scenario150More = {
        monthlyAmount: monthlyRequired + 150,
        monthsSaved: Math.max(0, monthsRemaining - Math.ceil(amountNeeded / (monthlyRequired + 150)))
      };

      res.json({
        targetAmount: target,
        currentSavings: current,
        amountNeeded,
        monthsRemaining,
        monthlyRequired: Math.round(monthlyRequired * 100) / 100,
        monthlyCapacity: capacity,
        progressPercent: Math.round(progressPercent * 100) / 100,
        canAfford: capacity >= monthlyRequired,
        scenarios: {
          plus50: scenario50More,
          plus100: scenario100More,
          plus150: scenario150More
        }
      });
    } catch (error) {
      console.error('Calculate scenarios error:', error);
      res.status(500).json({ message: "Failed to calculate scenarios" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      goals: goals.length 
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}