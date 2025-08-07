import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { insertUserSchema, type User } from '@shared/schema';
import { sendNewSignupAlert } from './emailService';
import type { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user session
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    isGuest?: boolean;
    guestGoals?: any[];
    guestSessionStart?: number; // Timestamp when guest session began
    guestDailyCount?: number; // Number of goals created today
    guestPdfDownloads?: number; // Number of PDF downloads today
    guestLastResetDate?: string; // Date string to track daily resets
    wixAccessToken?: string;
    wixRefreshToken?: string;
    authMethod?: 'wix' | 'app';
  }
}

export interface AuthenticatedRequest extends Request {
  user?: User | null;
  isGuest?: boolean;
}

// Middleware to check if user is authenticated or create guest session
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Check if user has a session
    if (req.session.userId) {
      // Get user from database
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.user = user;
        return next();
      }
    }

    // If no valid user session, create a guest session
    if (!req.session.isGuest) {
      const now = Date.now();
      const today = new Date(now).toDateString();
      
      req.session.isGuest = true;
      req.session.userId = `guest_${now}_${Math.random().toString(36).substr(2, 9)}`;
      req.session.guestSessionStart = now;
      req.session.guestDailyCount = 0;
      req.session.guestPdfDownloads = 0;
      req.session.guestLastResetDate = today;
      req.session.guestGoals = [];
    } else {
      // Check if guest session needs to be reset (24 hours passed OR new day)
      const now = Date.now();
      const today = new Date(now).toDateString();
      const sessionStart = req.session.guestSessionStart || now;
      const lastResetDate = req.session.guestLastResetDate || today;
      const hoursPassed = (now - sessionStart) / (1000 * 60 * 60);
      
      // Reset if 24 hours have passed OR if it's a new day
      if (hoursPassed >= 24 || lastResetDate !== today) {
        req.session.guestGoals = [];
        req.session.guestDailyCount = 0;
        req.session.guestPdfDownloads = 0;
        req.session.guestSessionStart = now;
        req.session.guestLastResetDate = today;
      }
    }

    req.isGuest = true;
    req.user = null;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
}

// Register new user
export async function register(req: Request, res: Response) {
  try {
    const { username, password } = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await storage.createUser({
      username,
      password: hashedPassword
    });

    // Set session
    req.session.userId = user.id;
    req.session.isGuest = false;

    // Send email notification to admins
    try {
      await sendNewSignupAlert(username);
      console.log(`New signup email sent for user: ${username}`);
    } catch (emailError) {
      console.error('Failed to send signup email:', emailError);
      // Don't fail registration if email fails
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
}

// Login user
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = insertUserSchema.parse(req.body);
    
    // Get user by username
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set session
    req.session.userId = user.id;
    req.session.isGuest = false;

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to login' });
  }
}

// Logout user
export async function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
}

// Get current user
export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  if (req.isGuest) {
    // Include guest session info for guest users
    const guestInfo = {
      dailyCount: req.session.guestDailyCount || 0,
      dailyLimit: 3,
      pdfDownloads: req.session.guestPdfDownloads || 0,
      pdfLimit: 1,
      sessionStart: req.session.guestSessionStart,
      lastResetDate: req.session.guestLastResetDate
    };
    
    return res.json({ user: null, isGuest: true, guestInfo });
  }
  
  if (req.user) {
    const { password: _, ...userWithoutPassword } = req.user;
    return res.json({ user: userWithoutPassword, isGuest: false });
  }
  
  res.json({ user: null, isGuest: false });
}