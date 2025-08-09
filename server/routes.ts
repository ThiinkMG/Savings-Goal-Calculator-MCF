import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSavingsGoalSchema, updateSavingsGoalSchema } from "@shared/schema";
import { z } from "zod";
import { requireAuth, register, login, logout, getCurrentUser, type AuthenticatedRequest } from "./auth";
import { reportScheduler } from './scheduler';
import { googleSheetsService } from './googleSheetsService';
import { wixSyncService } from './wixSync';
import { wixSyncScheduler } from './wixScheduler';
import { wixDatabaseRoutes } from './wixDatabaseAdaptor';
import { dataSyncService } from './dataSyncService';
import { loginSchema, forgotPasswordSchema, verifyCodeSchema, resetPasswordSchema, insertUserSchema } from "@shared/schema";
import { authenticateUser, sendPasswordResetCode, sendUsernameRecovery, verifyResetCode, resetPassword, detectIdentifierType } from './authService';
import bcrypt from 'bcryptjs';
import { sendNewSignupAlert } from './emailService';

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", getCurrentUser);
  
  // Create guest session endpoint with tracking
  app.post("/api/auth/continue-as-guest", async (req, res) => {
    const now = Date.now();
    const today = new Date(now).toDateString();
    
    // Get IP address and browser fingerprint
    const ipAddress = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
    const fingerprint = req.body.fingerprint || 'unknown';
    
    // Check existing tracking for this IP/fingerprint
    let tracking = await storage.getGuestTracking(ipAddress, fingerprint);
    console.log(`[GUEST_TRACKING] IP: ${ipAddress}, Fingerprint: ${fingerprint}, Existing tracking:`, tracking ? `dailyPdfCount: ${tracking.dailyPdfCount}` : 'none');
    
    if (!tracking) {
      // Create new tracking entry
      tracking = await storage.createGuestTracking(ipAddress, fingerprint);
      console.log(`[GUEST_TRACKING] Created new tracking for fingerprint: ${fingerprint}`);
    } else {
      // Check if 24 hours have passed and reset if needed
      const resetTime = new Date(tracking.nextResetTime);
      if (new Date() >= resetTime) {
        // Reset the counters
        await storage.updateGuestTracking(tracking.id, {
          dailyGoalCount: 0,
          dailyPdfCount: 0,
          lastResetDate: new Date(),
          nextResetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        tracking.dailyGoalCount = 0;
        tracking.dailyPdfCount = 0;
        tracking.nextResetTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
    }
    
    // Set up session with current tracking values
    req.session.isGuest = true;
    req.session.userId = `guest_${now}_${Math.random().toString(36).substr(2, 9)}`;
    req.session.guestSessionStart = now;
    req.session.guestDailyCount = tracking.dailyGoalCount;
    req.session.guestPdfDownloads = tracking.dailyPdfCount;
    req.session.guestLastResetDate = today;
    req.session.guestGoals = [];
    req.session.guestIpAddress = ipAddress;
    req.session.guestFingerprint = fingerprint;
    
    // Explicitly save the session to ensure persistence
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.json({ 
      success: true, 
      message: "Guest session created",
      guestInfo: {
        dailyCount: tracking.dailyGoalCount,
        dailyLimit: 3,
        pdfDownloads: tracking.dailyPdfCount,
        pdfLimit: 1,
        sessionStart: now,
        lastResetDate: today,
        nextResetTime: tracking.nextResetTime
      }
    });
  });

  // Enhanced authentication routes
  app.post("/api/auth/enhanced-register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Check if email already exists (if provided)
      if (userData.email) {
        const existingEmail = await storage.getUserByIdentifier(userData.email);
        if (existingEmail) {
          return res.status(400).json({ message: 'Email already exists' });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user with all fields
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      // Set session
      req.session.userId = user.id;
      req.session.isGuest = false;

      // Send email notification to admins
      try {
        await sendNewSignupAlert(userData.username);
        console.log(`New enhanced signup email sent for user: ${userData.username}`);
      } catch (emailError) {
        console.error('Failed to send signup email:', emailError);
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Enhanced registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to register user' });
    }
  });

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
      req.session.isGuest = false;
      
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

  // Wix authentication route
  app.post("/api/auth/wix-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const result = await dataSyncService.authenticateAndSync(email, password);
      
      if (!result.success) {
        return res.status(401).json({ 
          message: result.error || "Authentication failed"
        });
      }

      // Set session
      req.session.userId = result.user!.id;
      req.session.isGuest = false;
      
      res.json({ 
        user: result.user,
        wixMember: result.wixMember,
        importedGoals: result.importedGoals || 0,
        message: "Wix login successful"
      });
    } catch (error) {
      console.error('Wix login error:', error);
      res.status(500).json({ message: "Wix authentication failed" });
    }
  });
  // Get all savings goals (with auth)
  app.get("/api/savings-goals", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.session.userId;
      console.log('[DEBUG] Get goals - userId:', userId, 'isGuest:', req.isGuest, 'session:', {
        guestGoals: req.session.guestGoals?.length || 0,
        sessionId: req.sessionID
      });
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Return guest goals from session for guest users
      if (req.isGuest || userId.startsWith('guest_')) {
        const guestGoals = req.session.guestGoals || [];
        console.log('[DEBUG] Returning guest goals:', guestGoals.length, 'goals');
        return res.json(guestGoals);
      }
      
      const goals = await storage.getSavingsGoalsByUser(userId);
      res.json(goals);
    } catch (error) {
      console.error('Fetch savings goals error:', error);
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
      console.log('[DEBUG] Create goal - userId:', userId, 'isGuest:', req.isGuest, 'session:', {
        guestGoals: req.session.guestGoals?.length || 0,
        guestDailyCount: req.session.guestDailyCount,
        sessionId: req.sessionID
      });
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // For guest users, store goals in session temporarily with 3-plan daily limit
      if (req.isGuest || userId.startsWith('guest_')) {
        if (!req.session.guestGoals) {
          req.session.guestGoals = [];
        }
        
        // Check database tracking for daily limit
        if (req.session.guestIpAddress && req.session.guestFingerprint) {
          const result = await storage.incrementGuestGoalCount(
            req.session.guestIpAddress,
            req.session.guestFingerprint
          );
          
          if (!result.allowed) {
            return res.status(429).json({ 
              message: "Daily limit reached. Guest users can create up to 3 plans per day. Create an account for unlimited plans.",
              isGuest: true,
              dailyLimit: 3,
              currentCount: 3,
              remaining: 0
            });
          }
          
          // Update session counter to match database
          req.session.guestDailyCount = 3 - result.remaining;
        } else {
          // Fallback to session-only tracking if no fingerprint
          const currentCount = req.session.guestDailyCount || 0;
          console.log('[DEBUG] Guest goal creation - current count:', currentCount, 'goals in session:', req.session.guestGoals.length);
          
          if (currentCount >= 3) {
            return res.status(429).json({ 
              message: "Daily limit reached. Guest users can create up to 3 plans per day. Create an account for unlimited plans.",
              isGuest: true,
              dailyLimit: 3,
              currentCount: currentCount
            });
          }
          req.session.guestDailyCount = currentCount + 1;
        }
        
        const guestGoal = {
          id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...req.body,
          userId: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        req.session.guestGoals.push(guestGoal);
        console.log('[DEBUG] After adding goal - goals in session:', req.session.guestGoals.length, 'daily count:', req.session.guestDailyCount);
        
        // Explicitly save the session to ensure persistence
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        return res.status(201).json(guestGoal);
      }
      
      const validatedData = insertSavingsGoalSchema.parse({
        ...req.body,
        userId: userId // Ensure goal is tied to current user
      });
      const goal = await storage.createSavingsGoal(validatedData);
      res.status(201).json(goal);
    } catch (error) {
      console.error('Create savings goal error:', error);
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
      // Handle guest user deletion
      if (req.isGuest) {
        const goalId = req.params.id;
        const guestGoals = req.session.guestGoals || [];
        const goalIndex = guestGoals.findIndex((g: any) => g.id === goalId);
        
        if (goalIndex === -1) {
          return res.status(404).json({ message: "Savings goal not found" });
        }
        
        // Remove the goal from the session
        guestGoals.splice(goalIndex, 1);
        req.session.guestGoals = guestGoals;
        
        // Update the daily count
        if (req.session.guestDailyCount && req.session.guestDailyCount > 0) {
          req.session.guestDailyCount--;
        }
        
        // Save the session
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        console.log(`[DEBUG] Guest goal deleted - remaining goals: ${guestGoals.length}, daily count: ${req.session.guestDailyCount}`);
        
        return res.json({ message: "Savings goal deleted successfully" });
      }
      
      // For authenticated users
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
      console.error('Delete goal error:', error);
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

  // PDF download tracking endpoint
  app.post("/api/track-pdf-download", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Check if user is a guest and has reached PDF download limit
      if (req.isGuest) {
        // Check database tracking for daily limit
        if (req.session.guestIpAddress && req.session.guestFingerprint) {
          console.log(`[PDF_TRACKING] Guest PDF download attempt - IP: ${req.session.guestIpAddress}, Fingerprint: ${req.session.guestFingerprint}`);
          
          const result = await storage.incrementGuestPdfCount(
            req.session.guestIpAddress,
            req.session.guestFingerprint
          );
          
          console.log(`[PDF_TRACKING] PDF tracking result:`, result);
          
          if (!result.allowed) {
            console.log(`[PDF_TRACKING] PDF download BLOCKED - limit reached`);
            return res.status(429).json({
              message: "Daily PDF download limit reached. Guest users can download 1 PDF per day. Create an account for unlimited downloads.",
              isGuest: true,
              pdfLimit: 1,
              currentCount: 1,
              remaining: 0
            });
          }
          
          console.log(`[PDF_TRACKING] PDF download ALLOWED - remaining: ${result.remaining}`);
          
          // Update session counter to match database
          req.session.guestPdfDownloads = 1 - result.remaining;
          
          return res.json({
            success: true,
            downloadsRemaining: result.remaining,
            message: "PDF download tracked successfully"
          });
        } else {
          // Fallback to session-only tracking if no fingerprint
          const currentCount = req.session.guestPdfDownloads || 0;
          
          if (currentCount >= 1) {
            return res.status(429).json({
              message: "Daily PDF download limit reached. Guest users can download 1 PDF per day. Create an account for unlimited downloads.",
              isGuest: true,
              pdfLimit: 1,
              currentCount: currentCount
            });
          }
          
          // Increment PDF download counter
          req.session.guestPdfDownloads = currentCount + 1;
          
          return res.json({
            success: true,
            downloadsRemaining: 0,
            message: "PDF download tracked successfully"
          });
        }
      }
      
      // For authenticated users, no limits
      res.json({
        success: true,
        unlimited: true,
        message: "PDF download allowed"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to track PDF download" });
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

  // Generate Wix OAuth authorization URL
  app.post('/api/auth/wix-auth-url', async (req, res) => {
    try {
      const { state, redirectUri } = req.body;
      
      if (!state || !redirectUri) {
        return res.status(400).json({
          success: false,
          message: 'State and redirectUri are required'
        });
      }
      
      const { generateWixAuthUrl } = await import('./wixAuth.js');
      const authUrl = generateWixAuthUrl(state, redirectUri);
      
      res.json({
        success: true,
        authUrl
      });
      
    } catch (error) {
      console.error('Auth URL generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate auth URL',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Test endpoint for manual OAuth token exchange
  app.post('/api/auth/wix-exchange-token', async (req, res) => {
    try {
      const { code, client_secret } = req.body;
      
      if (!code || !client_secret) {
        return res.status(400).json({
          success: false,
          message: 'Authorization code and client secret are required'
        });
      }
      
      const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID || '2583909e-4c0c-429e-b4d3-8d58e7096828';
      const tokenUrl = 'https://www.wixapis.com/oauth/access';
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: WIX_CLIENT_ID,
          client_secret: client_secret,
          code: code,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Token exchange failed:', data);
        return res.status(response.status).json({
          success: false,
          message: 'Token exchange failed',
          error: data
        });
      }
      
      res.json({
        success: true,
        tokens: data
      });
      
    } catch (error) {
      console.error('Token exchange error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to exchange token',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // OAuth callback endpoint for Wix authentication
  app.post('/api/auth/wix-callback', async (req, res) => {
    try {
      const { code, state, redirectUri } = req.body;
      
      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Authorization code is required'
        });
      }
      
      const { exchangeCodeForTokens, getMemberInfo } = await import('./wixAuth.js');
      
      // Exchange code for tokens
      const tokenData = await exchangeCodeForTokens(code, redirectUri);
      
      if (!tokenData.access_token) {
        throw new Error('No access token received from Wix');
      }
      
      // Get member information
      const memberInfo = await getMemberInfo(tokenData.access_token);
      
      if (!memberInfo.member) {
        throw new Error('No member information available');
      }
      
      const member = memberInfo.member;
      const email = member.loginEmail || member.contactDetails?.emails?.[0]?.email;
      
      if (!email) {
        throw new Error('No email address found for member');
      }
      
      // Check if user already exists with this email
      let user = await storage.getUserByEmail?.(email);
      
      if (!user) {
        // Create new user with Wix member data
        const fullName = member.profile?.nickname || 
                         (member.contactDetails?.firstName && member.contactDetails?.lastName 
                           ? `${member.contactDetails.firstName} ${member.contactDetails.lastName}` 
                           : email.split('@')[0]);
        
        user = await storage.createUser({
          email,
          username: member.profile?.nickname || email.split('@')[0],
          fullName,
          password: 'wix-oauth-user', // OAuth users don't have traditional passwords
          wixUserId: member._id
        });
      } else if (!user.wixUserId) {
        // Link existing user to Wix account
        user.wixUserId = member._id;
      }
      
      // Store tokens securely (in production, encrypt these)
      req.session.wixAccessToken = tokenData.access_token;
      if (tokenData.refresh_token) {
        req.session.wixRefreshToken = tokenData.refresh_token;
      }
      
      // Set session
      req.session.userId = user.id;
      req.session.isGuest = false;
      req.session.authMethod = 'wix-oauth';
      
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          wixUserId: user.wixUserId
        },
        member: {
          id: member._id,
          email: email,
          profile: member.profile,
          contactDetails: member.contactDetails
        }
      });
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // User security endpoints
  app.post("/api/user/verify-password", requireAuth, async (req, res) => {
    try {
      const { password } = req.body;
      const userId = (req as AuthenticatedRequest).session.userId!;
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      // Generate verification token (valid for 15 minutes)
      const token = Buffer.from(JSON.stringify({
        userId,
        expires: Date.now() + 15 * 60 * 1000
      })).toString('base64');

      res.json({ token, message: "Password verified" });
    } catch (error) {
      console.error('Password verification error:', error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  app.patch("/api/user/password", requireAuth, async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const userId = (req as AuthenticatedRequest).session.userId!;

      // Verify token
      try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        if (Date.now() > payload.expires || payload.userId !== userId) {
          return res.status(401).json({ message: "Invalid or expired token" });
        }
      } catch {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const success = await storage.updateUserPassword(userId, hashedPassword);
      if (!success) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error('Password update error:', error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Remove phone number endpoint
  app.delete("/api/user/remove-phone", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).session.userId!;
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.phoneNumber) {
        return res.status(400).json({ message: "No phone number to remove" });
      }

      // Remove phone number by setting it to null
      const success = await storage.updatePhoneNumber(userId, null);
      if (!success) {
        return res.status(500).json({ message: "Failed to remove phone number" });
      }

      res.json({ message: "Phone number removed successfully" });
    } catch (error) {
      console.error('Remove phone error:', error);
      res.status(500).json({ message: "Failed to remove phone number" });
    }
  });

  app.patch("/api/user/username", requireAuth, async (req, res) => {
    try {
      const { token, newUsername } = req.body;
      const userId = (req as AuthenticatedRequest).session.userId!;

      // Verify token
      try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        if (Date.now() > payload.expires || payload.userId !== userId) {
          return res.status(401).json({ message: "Invalid or expired token" });
        }
      } catch {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Check if username is available
      const existingUser = await storage.getUserByUsername(newUsername);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Update username
      const success = await storage.updateUsername(userId, newUsername);
      if (!success) {
        return res.status(500).json({ message: "Failed to update username" });
      }

      res.json({ message: "Username updated successfully" });
    } catch (error) {
      console.error('Username update error:', error);
      res.status(500).json({ message: "Failed to update username" });
    }
  });

  app.patch("/api/user/phone", requireAuth, async (req, res) => {
    try {
      const { token, newPhoneNumber } = req.body;
      const userId = (req as AuthenticatedRequest).session.userId!;

      // Verify token
      try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        if (Date.now() > payload.expires || payload.userId !== userId) {
          return res.status(401).json({ message: "Invalid or expired token" });
        }
      } catch {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Check if phone number is available
      const existingUser = await storage.getUserByPhone(newPhoneNumber);
      if (existingUser) {
        return res.status(400).json({ message: "Phone number already exists" });
      }

      // Update phone number
      const success = await storage.updatePhoneNumber(userId, newPhoneNumber);
      if (!success) {
        return res.status(500).json({ message: "Failed to update phone number" });
      }

      res.json({ message: "Phone number updated successfully" });
    } catch (error) {
      console.error('Phone update error:', error);
      res.status(500).json({ message: "Failed to update phone number" });
    }
  });

  app.get("/api/auth/check-phone/:phone", async (req, res) => {
    try {
      const phone = decodeURIComponent(req.params.phone);
      
      if (!phone || phone.length < 10) {
        return res.status(400).json({ 
          available: false, 
          message: "Phone number too short" 
        });
      }

      // Basic phone validation
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        return res.status(400).json({ 
          available: false, 
          message: "Invalid phone number format" 
        });
      }

      const existingUser = await storage.getUserByPhone(phone);
      const available = !existingUser;
      
      res.json({
        available,
        message: available ? "Phone number is available" : "Phone number already in use"
      });
    } catch (error) {
      console.error('Phone check error:', error);
      res.status(500).json({ message: "Failed to check phone availability" });
    }
  });

  app.patch("/api/user/email", requireAuth, async (req, res) => {
    try {
      const { token, newEmail } = req.body;
      const userId = (req as AuthenticatedRequest).session.userId!;

      // Verify token
      try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        if (Date.now() > payload.expires || payload.userId !== userId) {
          return res.status(401).json({ message: "Invalid or expired token" });
        }
      } catch {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Check if email is available
      const existingUser = await storage.getUserByEmail(newEmail);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Update email
      const success = await storage.updateEmail(userId, newEmail);
      if (!success) {
        return res.status(500).json({ message: "Failed to update email" });
      }

      res.json({ message: "Email updated successfully" });
    } catch (error) {
      console.error('Email update error:', error);
      res.status(500).json({ message: "Failed to update email" });
    }
  });

  app.get("/api/auth/check-email/:email", async (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email);
      
      if (!email || email.length < 5) {
        return res.status(400).json({ 
          available: false, 
          message: "Email too short" 
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          available: false, 
          message: "Invalid email format" 
        });
      }

      const existingUser = await storage.getUserByEmail(email);
      const available = !existingUser;
      
      res.json({
        available,
        message: available ? "Email is available" : "Email already in use"
      });
    } catch (error) {
      console.error('Email check error:', error);
      res.status(500).json({ message: "Failed to check email availability" });
    }
  });

  // Wix Sync API Routes
  app.post("/api/admin/wix/sync", async (req, res) => {
    try {
      console.log('Starting Wix user synchronization...');
      const result = await wixSyncService.syncAllUsers();
      
      res.json({
        success: result.success,
        message: `Sync completed: ${result.created} created, ${result.updated} updated, ${result.processed} processed`,
        details: result
      });
    } catch (error) {
      console.error('Wix sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Sync failed',
        error: String(error)
      });
    }
  });

  app.post("/api/admin/wix/sync/:wixUserId", async (req, res) => {
    try {
      const { wixUserId } = req.params;
      const result = await wixSyncService.syncSingleUser(wixUserId);
      
      res.json(result);
    } catch (error) {
      console.error('Single user sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync user',
        error: String(error)
      });
    }
  });

  app.get("/api/admin/wix/test", async (req, res) => {
    try {
      const result = await wixSyncService.testConnection();
      res.json(result);
    } catch (error) {
      console.error('Wix connection test error:', error);
      res.status(500).json({
        success: false,
        message: 'Test failed',
        error: String(error)
      });
    }
  });

  app.get("/api/admin/wix/user/:wixUserId", async (req, res) => {
    try {
      const { wixUserId } = req.params;
      const wixUser = await wixSyncService.getWixUserById(wixUserId);
      
      if (!wixUser) {
        return res.status(404).json({
          success: false,
          message: 'Wix user not found'
        });
      }
      
      res.json({
        success: true,
        user: wixUser
      });
    } catch (error) {
      console.error('Get Wix user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Wix user',
        error: String(error)
      });
    }
  });

  // Wix Sync Scheduler Management Routes
  app.get("/api/admin/wix/scheduler/status", async (req, res) => {
    try {
      const status = wixSyncScheduler.getStatus();
      res.json(status);
    } catch (error) {
      console.error('Get scheduler status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get scheduler status',
        error: String(error)
      });
    }
  });

  app.post("/api/admin/wix/scheduler/run", async (req, res) => {
    try {
      // Trigger manual sync
      wixSyncScheduler.runSync();
      res.json({
        success: true,
        message: 'Manual sync triggered successfully'
      });
    } catch (error) {
      console.error('Manual sync trigger error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger manual sync',
        error: String(error)
      });
    }
  });

  app.post("/api/admin/wix/scheduler/enable", async (req, res) => {
    try {
      wixSyncScheduler.enable();
      res.json({
        success: true,
        message: 'Wix sync scheduler enabled'
      });
    } catch (error) {
      console.error('Enable scheduler error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enable scheduler',
        error: String(error)
      });
    }
  });

  app.post("/api/admin/wix/scheduler/disable", async (req, res) => {
    try {
      wixSyncScheduler.disable();
      res.json({
        success: true,
        message: 'Wix sync scheduler disabled'
      });
    } catch (error) {
      console.error('Disable scheduler error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disable scheduler',
        error: String(error)
      });
    }
  });

  app.post("/api/admin/wix/scheduler/update", async (req, res) => {
    try {
      const { schedule, timezone } = req.body;
      
      if (!schedule) {
        return res.status(400).json({
          success: false,
          message: 'Schedule is required'
        });
      }

      const success = wixSyncScheduler.updateSchedule(schedule, timezone);
      
      if (success) {
        res.json({
          success: true,
          message: 'Sync schedule updated successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to update sync schedule'
        });
      }
    } catch (error) {
      console.error('Update scheduler error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update scheduler',
        error: String(error)
      });
    }
  });

  // Wix Database Adaptor Routes
  app.get("/api/wix-adaptor/health", wixDatabaseRoutes.health);
  app.post("/api/wix-adaptor/provision", wixDatabaseRoutes.provision);
  app.post("/api/wix-adaptor/schemas/list", wixDatabaseRoutes.schemasList);
  app.get("/api/wix-adaptor/users", wixDatabaseRoutes.getUsers);
  app.get("/api/wix-adaptor/users/:id", wixDatabaseRoutes.getUserById);
  app.post("/api/wix-adaptor/users", wixDatabaseRoutes.createUser);
  app.put("/api/wix-adaptor/users/:id", wixDatabaseRoutes.updateUser);
  app.get("/api/wix-adaptor/users/:userId/goals", wixDatabaseRoutes.getUserGoals);
  app.get("/api/wix-adaptor/goals/:id", wixDatabaseRoutes.getGoalById);
  app.post("/api/wix-adaptor/goals", wixDatabaseRoutes.createGoal);
  app.put("/api/wix-adaptor/goals/:id", wixDatabaseRoutes.updateGoal);
  app.delete("/api/wix-adaptor/goals/:id", wixDatabaseRoutes.deleteGoal);

  const httpServer = createServer(app);
  return httpServer;
}
