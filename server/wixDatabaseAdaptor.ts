import { Request, Response } from 'express';
import { storage } from './storage';
import { users, savingsGoals, User, SavingsGoal, InsertSavingsGoal } from '@shared/schema';
import { z } from 'zod';

// Extend Express Request type to include Wix context
declare global {
  namespace Express {
    interface Request {
      wixContext?: any;
    }
  }
}

// Wix Database Adaptor API Key for security
const WIX_ADAPTOR_SECRET = process.env.WIX_ADAPTOR_SECRET || 'your-secure-adaptor-key';

console.log('WIX_ADAPTOR_SECRET configured:', WIX_ADAPTOR_SECRET ? 'Yes (value hidden)' : 'No - using default');

// Middleware to verify Wix adaptor requests
const verifyWixAdaptor = (req: Request, res: Response, next: Function) => {
  // Wix sends the secret key in the request body, not headers
  const requestContext = req.body?.requestContext;
  const secretKey = requestContext?.settings?.secretKey;
  
  console.log('Wix Request Context:', {
    hasRequestContext: !!requestContext,
    hasSettings: !!requestContext?.settings,
    hasSecretKey: !!secretKey,
    endpoint: req.path
  });
  
  // For health check endpoint, skip auth
  if (req.path === '/api/wix-adaptor/health') {
    return next();
  }
  
  if (!secretKey || secretKey !== WIX_ADAPTOR_SECRET) {
    console.log('Authentication failed:', {
      providedKey: secretKey ? 'Key provided but incorrect' : 'No key provided',
      expectedKeyExists: !!WIX_ADAPTOR_SECRET
    });
    
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid adaptor secret key',
      details: 'Secret key must be provided in requestContext.settings.secretKey'
    });
  }
  
  // Store the request context for use in route handlers
  req.wixContext = requestContext;
  
  next();
};

// Wix Database Adaptor Schema for Users
const WixUserSchema = z.object({
  _id: z.string().optional(),
  username: z.string(),
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  phoneNumber: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// Wix Database Adaptor Schema for Savings Goals
const WixSavingsGoalSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  name: z.string(),
  targetAmount: z.number(),
  currentSavings: z.number(),
  targetDate: z.string(),
  goalType: z.string(),
  monthlyCapacity: z.number().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// Convert internal User to Wix format
const formatUserForWix = (user: User) => ({
  _id: user.id,
  username: user.username,
  email: user.email || '',
  fullName: user.fullName || '',
  phoneNumber: user.phoneNumber || '',
  createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
  updatedAt: user.updatedAt?.toISOString() || new Date().toISOString()
});

// Convert internal SavingsGoal to Wix format
const formatGoalForWix = (goal: SavingsGoal) => ({
  _id: goal.id,
  userId: goal.userId,
  name: goal.name,
  targetAmount: goal.targetAmount,
  currentSavings: goal.currentSavings,
  targetDate: goal.targetDate,
  goalType: goal.goalType,
  monthlyCapacity: goal.monthlyCapacity || 0,
  status: goal.status || 'active',
  createdAt: goal.createdAt?.toISOString() || new Date().toISOString(),
  updatedAt: goal.updatedAt?.toISOString() || new Date().toISOString()
});

// Wix Database Adaptor Routes
export const wixDatabaseRoutes = {
  
  // Health check endpoint
  health: async (req: Request, res: Response) => {
    res.json({ 
      status: 'healthy',
      service: 'My College Finance Database Adaptor',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  },

  // Provision endpoint - Required by Wix for initial setup
  provision: [verifyWixAdaptor, async (req: Request, res: Response) => {
    try {
      const requestContext = req.body?.requestContext;
      const externalDatabaseId = requestContext?.installationId || 'my-college-finance-db';
      
      // Get current user count
      const allUsers = await storage.getAllUsers?.() || [];
      const userCount = allUsers.length;
      
      // Wix expects a specific response format
      res.json({
        schemas: [
          {
            displayName: 'Users',
            id: 'users',
            allowedOperations: ['get', 'list', 'count', 'create', 'update', 'remove'],
            fields: {
              _id: { displayName: 'ID', type: 'text', queryOperators: ['eq', 'ne', 'hasSome'] },
              username: { displayName: 'Username', type: 'text', queryOperators: ['eq', 'ne', 'contains', 'startsWith'] },
              email: { displayName: 'Email', type: 'text', queryOperators: ['eq', 'ne', 'contains'] },
              fullName: { displayName: 'Full Name', type: 'text', queryOperators: ['eq', 'ne', 'contains'] },
              phoneNumber: { displayName: 'Phone Number', type: 'text', queryOperators: ['eq', 'ne', 'contains'] },
              _createdDate: { displayName: 'Created Date', type: 'datetime', queryOperators: ['eq', 'ne', 'lt', 'gt'] },
              _updatedDate: { displayName: 'Updated Date', type: 'datetime', queryOperators: ['eq', 'ne', 'lt', 'gt'] }
            }
          },
          {
            displayName: 'Savings Goals',
            id: 'savingsGoals',
            allowedOperations: ['get', 'list', 'count', 'create', 'update', 'remove'],
            fields: {
              _id: { displayName: 'ID', type: 'text', queryOperators: ['eq', 'ne'] },
              _owner: { displayName: 'Owner', type: 'text', queryOperators: ['eq', 'ne'] },
              name: { displayName: 'Goal Name', type: 'text', queryOperators: ['eq', 'ne', 'contains'] },
              targetAmount: { displayName: 'Target Amount', type: 'number', queryOperators: ['eq', 'ne', 'lt', 'gt'] },
              currentSavings: { displayName: 'Current Savings', type: 'number', queryOperators: ['eq', 'ne', 'lt', 'gt'] },
              goalType: { displayName: 'Goal Type', type: 'text', queryOperators: ['eq', 'ne'] },
              _createdDate: { displayName: 'Created Date', type: 'datetime', queryOperators: ['eq', 'ne', 'lt', 'gt'] },
              _updatedDate: { displayName: 'Updated Date', type: 'datetime', queryOperators: ['eq', 'ne', 'lt', 'gt'] }
            }
          }
        ]
      });
    } catch (error) {
      console.error('Provision error:', error);
      res.status(500).json({ 
        error: 'Provision failed',
        message: String(error)
      });
    }
  }],

  // Get all users (with pagination)
  getUsers: [verifyWixAdaptor, async (req: Request, res: Response) => {
    try {
      const { limit = 50, skip = 0 } = req.query;
      
      // Get users from database (simplified - you may need to implement pagination in storage)
      const allUsers = await storage.getAllUsers?.() || [];
      const startIndex = Number(skip);
      const endIndex = startIndex + Number(limit);
      const users = allUsers.slice(startIndex, endIndex);
      
      const wixUsers = users.map(formatUserForWix);
      
      res.json({
        items: wixUsers,
        totalCount: allUsers.length,
        hasNext: endIndex < allUsers.length
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }],

  // Get user by ID
  getUserById: [verifyWixAdaptor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await storage.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(formatUserForWix(user));
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }],

  // Create user
  createUser: [verifyWixAdaptor, async (req: Request, res: Response) => {
    try {
      const userData = WixUserSchema.omit({ _id: true, createdAt: true, updatedAt: true }).parse(req.body);
      
      // Hash a temporary password for Wix-created users
      const bcrypt = require('bcryptjs');
      const tempPassword = Math.random().toString(36).slice(-12);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      res.status(201).json({
        ...formatUserForWix(user),
        tempPassword // Send back temporary password for Wix to store securely
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }],

  // Update user
  updateUser: [verifyWixAdaptor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userData = WixUserSchema.partial().parse(req.body);
      
      // Update user fields
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Update specific fields
      if (userData.username) await storage.updateUsername(id, userData.username);
      if (userData.email) await storage.updateEmail(id, userData.email);
      if (userData.phoneNumber) await storage.updatePhoneNumber(id, userData.phoneNumber);
      
      const updatedUser = await storage.getUserById(id);
      res.json(formatUserForWix(updatedUser!));
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }],

  // Get all savings goals for a user
  getUserGoals: [verifyWixAdaptor, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { limit = 50, skip = 0 } = req.query;
      
      // Get goals from database (you'll need to implement this method)
      const goals = await storage.getSavingsGoalsByUserId?.(userId) || [];
      const startIndex = Number(skip);
      const endIndex = startIndex + Number(limit);
      const paginatedGoals = goals.slice(startIndex, endIndex);
      
      const wixGoals = paginatedGoals.map(formatGoalForWix);
      
      res.json({
        items: wixGoals,
        totalCount: goals.length,
        hasNext: endIndex < goals.length
      });
    } catch (error) {
      console.error('Get user goals error:', error);
      res.status(500).json({ error: 'Failed to fetch user goals' });
    }
  }],

  // Get savings goal by ID
  getGoalById: [verifyWixAdaptor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const goal = await storage.getSavingsGoalById?.(id);
      
      if (!goal) {
        return res.status(404).json({ error: 'Goal not found' });
      }
      
      res.json(formatGoalForWix(goal));
    } catch (error) {
      console.error('Get goal by ID error:', error);
      res.status(500).json({ error: 'Failed to fetch goal' });
    }
  }],

  // Create savings goal
  createGoal: [verifyWixAdaptor, async (req: Request, res: Response) => {
    try {
      const goalData = WixSavingsGoalSchema.omit({ _id: true, createdAt: true, updatedAt: true }).parse(req.body);
      
      const goal = await storage.createSavingsGoal?.({
        ...goalData,
        id: '', // Will be auto-generated
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      if (!goal) {
        throw new Error('Failed to create goal');
      }
      
      res.status(201).json(formatGoalForWix(goal));
    } catch (error) {
      console.error('Create goal error:', error);
      res.status(500).json({ error: 'Failed to create goal' });
    }
  }],

  // Update savings goal
  updateGoal: [verifyWixAdaptor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const goalData = WixSavingsGoalSchema.partial().parse(req.body);
      
      const updatedGoal = await storage.updateSavingsGoal?.(id, {
        ...goalData,
        updatedAt: new Date()
      });
      
      if (!updatedGoal) {
        return res.status(404).json({ error: 'Goal not found' });
      }
      
      res.json(formatGoalForWix(updatedGoal));
    } catch (error) {
      console.error('Update goal error:', error);
      res.status(500).json({ error: 'Failed to update goal' });
    }
  }],

  // Delete savings goal
  deleteGoal: [verifyWixAdaptor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteSavingsGoal?.(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Goal not found' });
      }
      
      res.json({ success: true, message: 'Goal deleted successfully' });
    } catch (error) {
      console.error('Delete goal error:', error);
      res.status(500).json({ error: 'Failed to delete goal' });
    }
  }],

  // Schema list endpoint - Required by Wix
  schemasList: async (req: Request, res: Response) => {
    // Return the same schema format as provision
    res.json({
      schemas: [
        {
          displayName: 'Users',
          id: 'users',
          allowedOperations: ['get', 'list', 'count', 'create', 'update', 'remove'],
          fields: {
            _id: { displayName: 'ID', type: 'text', queryOperators: ['eq', 'ne', 'hasSome'] },
            username: { displayName: 'Username', type: 'text', queryOperators: ['eq', 'ne', 'contains', 'startsWith'] },
            email: { displayName: 'Email', type: 'text', queryOperators: ['eq', 'ne', 'contains'] },
            fullName: { displayName: 'Full Name', type: 'text', queryOperators: ['eq', 'ne', 'contains'] },
            phoneNumber: { displayName: 'Phone Number', type: 'text', queryOperators: ['eq', 'ne', 'contains'] },
            _createdDate: { displayName: 'Created Date', type: 'datetime', queryOperators: ['eq', 'ne', 'lt', 'gt'] },
            _updatedDate: { displayName: 'Updated Date', type: 'datetime', queryOperators: ['eq', 'ne', 'lt', 'gt'] }
          }
        },
        {
          displayName: 'Savings Goals',
          id: 'savingsGoals',
          allowedOperations: ['get', 'list', 'count', 'create', 'update', 'remove'],
          fields: {
            _id: { displayName: 'ID', type: 'text', queryOperators: ['eq', 'ne'] },
            _owner: { displayName: 'Owner', type: 'text', queryOperators: ['eq', 'ne'] },
            name: { displayName: 'Goal Name', type: 'text', queryOperators: ['eq', 'ne', 'contains'] },
            targetAmount: { displayName: 'Target Amount', type: 'number', queryOperators: ['eq', 'ne', 'lt', 'gt'] },
            currentSavings: { displayName: 'Current Savings', type: 'number', queryOperators: ['eq', 'ne', 'lt', 'gt'] },
            goalType: { displayName: 'Goal Type', type: 'text', queryOperators: ['eq', 'ne'] },
            _createdDate: { displayName: 'Created Date', type: 'datetime', queryOperators: ['eq', 'ne', 'lt', 'gt'] },
            _updatedDate: { displayName: 'Updated Date', type: 'datetime', queryOperators: ['eq', 'ne', 'lt', 'gt'] }
          }
        }
      ]
    });
  }
};