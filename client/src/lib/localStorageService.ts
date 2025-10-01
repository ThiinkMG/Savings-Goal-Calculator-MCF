import { type SavingsGoal, type InsertSavingsGoal, type UpdateSavingsGoal } from '@shared/schema';

const STORAGE_KEY = 'savings-goals';

// Helper functions for localStorage operations
export const localStorageService = {
  // Get all goals from localStorage
  getGoals(): SavingsGoal[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading goals from localStorage:', error);
      return [];
    }
  },

  // Get a specific goal by ID
  getGoalById(id: string): SavingsGoal | undefined {
    const goals = this.getGoals();
    return goals.find(goal => goal.id === id);
  },

  // Create a new goal
  createGoal(goalData: InsertSavingsGoal): SavingsGoal {
    console.log('createGoal called with:', goalData);
    
    // Validate required fields
    if (!goalData.userId) {
      throw new Error('userId is required');
    }
    if (!goalData.name) {
      throw new Error('name is required');
    }
    if (!goalData.goalType) {
      throw new Error('goalType is required');
    }
    if (!goalData.targetAmount || goalData.targetAmount <= 0) {
      throw new Error('targetAmount must be a positive number');
    }
    if (!goalData.targetDate) {
      throw new Error('targetDate is required');
    }
    
    const goals = this.getGoals();
    console.log('Current goals:', goals);
    const newGoal: SavingsGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...goalData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    console.log('New goal created:', newGoal);
    
    goals.push(newGoal);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    console.log('Goals after save:', this.getGoals());
    return newGoal;
  },

  // Update an existing goal
  updateGoal(id: string, updates: UpdateSavingsGoal): SavingsGoal | undefined {
    const goals = this.getGoals();
    const goalIndex = goals.findIndex(goal => goal.id === id);
    
    if (goalIndex === -1) {
      return undefined;
    }
    
    const updatedGoal = {
      ...goals[goalIndex],
      ...updates,
      updatedAt: new Date(),
    };
    
    goals[goalIndex] = updatedGoal;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    return updatedGoal;
  },

  // Delete a goal
  deleteGoal(id: string): boolean {
    const goals = this.getGoals();
    const goalIndex = goals.findIndex(goal => goal.id === id);
    
    if (goalIndex === -1) {
      return false;
    }
    
    goals.splice(goalIndex, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    return true;
  },

  // Clear all goals (for testing/reset)
  clearAllGoals(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// Mock API functions that work with localStorage
export const mockApiRequest = async (
  method: string,
  url: string,
  data?: unknown
): Promise<Response> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    console.log('mockApiRequest called:', { method, url, data });
    let result: any;
    
    if (url === '/api/savings-goals' && method === 'GET') {
      result = localStorageService.getGoals();
    } else if (url === '/api/savings-goals' && method === 'POST') {
      console.log('Creating goal with data:', data);
      console.log('Data type check:', typeof data, 'Is object:', typeof data === 'object');
      console.log('Required fields check:', {
        hasUserId: !!(data as any)?.userId,
        hasName: !!(data as any)?.name,
        hasGoalType: !!(data as any)?.goalType,
        hasTargetAmount: !!(data as any)?.targetAmount,
        hasTargetDate: !!(data as any)?.targetDate
      });
      
      result = localStorageService.createGoal(data as InsertSavingsGoal);
      console.log('Created goal result:', result);
    } else if (url.startsWith('/api/savings-goals/') && method === 'PATCH') {
      const id = url.split('/').pop();
      if (id) {
        result = localStorageService.updateGoal(id, data as UpdateSavingsGoal);
        if (!result) {
          throw new Error('Goal not found');
        }
      } else {
        throw new Error('Invalid goal ID');
      }
    } else if (url.startsWith('/api/savings-goals/') && method === 'DELETE') {
      const id = url.split('/').pop();
      if (id) {
        const success = localStorageService.deleteGoal(id);
        if (!success) {
          throw new Error('Goal not found');
        }
        result = { message: 'Goal deleted successfully' };
      } else {
        throw new Error('Invalid goal ID');
      }
    } else {
      throw new Error('Unknown endpoint');
    }

    // Create a mock Response object
    return {
      ok: true,
      status: method === 'POST' ? 201 : 200,
      json: async () => result,
    } as Response;
  } catch (error) {
    return {
      ok: false,
      status: 404,
      json: async () => ({ message: (error as Error).message }),
    } as Response;
  }
};


