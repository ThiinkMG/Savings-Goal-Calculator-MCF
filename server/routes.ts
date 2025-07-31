import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSavingsGoalSchema, updateSavingsGoalSchema } from "@shared/schema";
import { z } from "zod";
import { requireAuth, register, login, logout, getCurrentUser, type AuthenticatedRequest } from "./auth";
import { reportScheduler } from './scheduler';
import { googleSheetsService } from './googleSheetsService';
import { loginSchema, forgotPasswordSchema, verifyCodeSchema, resetPasswordSchema } from "@shared/schema";
import { authenticateUser, sendPasswordResetCode, sendUsernameRecovery, verifyResetCode, resetPassword, detectIdentifierType } from './authService';

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", requireAuth, getCurrentUser);

  // Enhanced authentication routes
  app.post("/api/auth/enhanced-login", async (req, res) => {
    try {
      const { identifier, password } = loginSchema.parse(req.body);
      const result = await authenticateUser(identifier, password);
      
      if (!result.success) {
        return res.status(401).json({ 
          message: result.error,
          locked: result.locked,
          lockoutUntil: result.lockoutUntil
        });
      }
      
      // Set session
      req.session.userId = result.user!.id;
      req.session.user = result.user;
      
      res.json({ 
        user: result.user,
        message: "Login successful"
      });
    } catch (error) {
      console.error('Enhanced login error:', error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { identifier } = forgotPasswordSchema.parse(req.body);
      const result = await sendPasswordResetCode(identifier);
      
      res.json({
        success: result.success,
        method: result.method,
        maskedContact: result.maskedContact,
        message: result.success 
          ? `Reset code sent to your ${result.method}` 
          : result.error
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/forgot-username", async (req, res) => {
    try {
      const { identifier } = forgotPasswordSchema.parse(req.body);
      const result = await sendUsernameRecovery(identifier);
      
      res.json({
        success: result.success,
        method: result.method,
        message: result.success 
          ? `Username sent to your ${result.method}` 
          : result.error
      });
    } catch (error) {
      console.error('Forgot username error:', error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/verify-reset-code", async (req, res) => {
    try {
      const { code, identifier } = verifyCodeSchema.parse(req.body);
      const result = await verifyResetCode(code, identifier);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }
      
      res.json({
        success: true,
        resetToken: result.resetToken,
        message: "Code verified successfully"
      });
    } catch (error) {
      console.error('Verify reset code error:', error);
      res.status(400).json({ message: "Invalid verification data" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      const result = await resetPassword(token, newPassword);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }
      
      res.json({
        success: true,
        message: "Password reset successfully"
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(400).json({ message: "Invalid reset data" });
    }
  });

  app.get("/api/auth/check-username/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      res.json({
        available: !user,
        message: user ? "Username is already taken" : "Username is available"
      });
    } catch (error) {
      console.error('Check username error:', error);
      res.status(500).json({ message: "Failed to check username availability" });
    }
  });
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

  // Admin route for testing monthly report (development only)
  app.post("/api/admin/test-monthly-report", async (req, res) => {
    try {
      const success = await reportScheduler.triggerMonthlyReport();
      if (success) {
        res.json({ message: "Monthly report sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send monthly report" });
      }
    } catch (error) {
      console.error('Test monthly report error:', error);
      res.status(500).json({ message: "Failed to send monthly report" });
    }
  });

  // Admin route to create a new Google Sheets spreadsheet
  app.post("/api/admin/create-google-sheet", async (req, res) => {
    try {
      const { title } = req.body;
      const spreadsheetId = await googleSheetsService.createSpreadsheet(title || 'My College Finance - Live Data');
      
      if (spreadsheetId) {
        const spreadsheetUrl = googleSheetsService.getSpreadsheetUrl(spreadsheetId);
        res.json({ 
          success: true,
          spreadsheetId,
          spreadsheetUrl,
          message: "Google Sheets spreadsheet created successfully" 
        });
      } else {
        res.status(500).json({ message: "Failed to create Google Sheets spreadsheet" });
      }
    } catch (error) {
      console.error('Create Google Sheet error:', error);
      res.status(500).json({ message: "Failed to create Google Sheets spreadsheet" });
    }
  });

  // Admin route to sync all data to Google Sheets
  app.post("/api/admin/sync-google-sheets", async (req, res) => {
    try {
      const { spreadsheetId } = req.body;
      
      if (!spreadsheetId) {
        return res.status(400).json({ message: "Spreadsheet ID is required" });
      }
      
      const success = await googleSheetsService.syncAllData(spreadsheetId);
      
      if (success) {
        res.json({ 
          success: true,
          message: "Data synced to Google Sheets successfully",
          spreadsheetUrl: googleSheetsService.getSpreadsheetUrl(spreadsheetId)
        });
      } else {
        res.status(500).json({ message: "Failed to sync data to Google Sheets" });
      }
    } catch (error) {
      console.error('Sync Google Sheets error:', error);
      res.status(500).json({ message: "Failed to sync data to Google Sheets" });
    }
  });

  // Admin route to set target spreadsheet for automatic syncing
  app.post("/api/admin/set-target-spreadsheet", async (req, res) => {
    try {
      const { spreadsheetId } = req.body;
      
      if (!spreadsheetId) {
        return res.status(400).json({ message: "Spreadsheet ID is required" });
      }
      
      googleSheetsService.setTargetSpreadsheet(spreadsheetId);
      
      // Initialize the spreadsheet with headers and current data
      const success = await googleSheetsService.syncAllData(spreadsheetId);
      
      if (success) {
        res.json({ 
          success: true,
          message: "Target spreadsheet set and initialized successfully",
          spreadsheetId,
          spreadsheetUrl: googleSheetsService.getSpreadsheetUrl(spreadsheetId)
        });
      } else {
        res.status(500).json({ message: "Failed to initialize target spreadsheet" });
      }
    } catch (error) {
      console.error('Set target spreadsheet error:', error);
      res.status(500).json({ message: "Failed to set target spreadsheet" });
    }
  });

  // Admin route to get current target spreadsheet
  app.get("/api/admin/target-spreadsheet", async (req, res) => {
    try {
      const targetSpreadsheetId = googleSheetsService.getTargetSpreadsheet();
      
      if (targetSpreadsheetId) {
        res.json({ 
          spreadsheetId: targetSpreadsheetId,
          spreadsheetUrl: googleSheetsService.getSpreadsheetUrl(targetSpreadsheetId)
        });
      } else {
        res.json({ 
          spreadsheetId: null,
          message: "No target spreadsheet set"
        });
      }
    } catch (error) {
      console.error('Get target spreadsheet error:', error);
      res.status(500).json({ message: "Failed to get target spreadsheet info" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
