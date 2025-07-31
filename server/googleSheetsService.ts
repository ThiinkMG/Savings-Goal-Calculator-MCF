import { google } from 'googleapis';
import { db } from './db';
import { users, savingsGoals } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Google Sheets configuration
const USERS_SHEET_NAME = 'Users';
const GOALS_SHEET_NAME = 'Savings Goals';

class GoogleSheetsService {
  private sheets: any;
  private auth: any;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        console.log('Google Sheets: Missing credentials, skipping initialization');
        return;
      }

      // Parse the private key (handle escaped newlines)
      const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log('Google Sheets: Service initialized successfully');
    } catch (error) {
      console.error('Google Sheets: Failed to initialize:', error);
    }
  }

  async createSpreadsheet(title: string = 'My College Finance - Live Data'): Promise<string | null> {
    try {
      if (!this.sheets) {
        console.log('Google Sheets: Service not initialized');
        return null;
      }

      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: title,
          },
          sheets: [
            {
              properties: {
                title: USERS_SHEET_NAME,
              },
            },
            {
              properties: {
                title: GOALS_SHEET_NAME,
              },
            },
          ],
        },
      });

      const spreadsheetId = response.data.spreadsheetId;
      console.log(`Google Sheets: Created spreadsheet with ID: ${spreadsheetId}`);
      
      // Initialize headers
      await this.initializeHeaders(spreadsheetId);
      
      return spreadsheetId;
    } catch (error) {
      console.error('Google Sheets: Failed to create spreadsheet:', error);
      return null;
    }
  }

  private async initializeHeaders(spreadsheetId: string) {
    try {
      // Users sheet headers
      const usersHeaders = [
        'User ID',
        'Username',
        'Created Date',
        'Total Goals',
        'Total Target Amount',
        'Total Current Savings',
        'Overall Progress %',
        'Last Updated'
      ];

      // Goals sheet headers
      const goalsHeaders = [
        'Goal ID',
        'User ID',
        'Username',
        'Goal Name',
        'Goal Type',
        'Target Amount',
        'Current Savings',
        'Progress %',
        'Target Date',
        'Monthly Required',
        'Is Feasible',
        'Created Date',
        'Last Updated'
      ];

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: [
            {
              range: `${USERS_SHEET_NAME}!A1:H1`,
              values: [usersHeaders],
            },
            {
              range: `${GOALS_SHEET_NAME}!A1:M1`,
              values: [goalsHeaders],
            },
          ],
        },
      });

      console.log('Google Sheets: Headers initialized');
    } catch (error) {
      console.error('Google Sheets: Failed to initialize headers:', error);
    }
  }

  async syncAllData(spreadsheetId: string): Promise<boolean> {
    try {
      if (!spreadsheetId || !this.sheets) {
        console.log('Google Sheets: No spreadsheet ID provided or service not initialized');
        return false;
      }

      // Get all users with aggregated data
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
      }).from(users);

      // Get all goals with user information
      const allGoals = await db.select({
        goalId: savingsGoals.id,
        goalName: savingsGoals.name,
        goalType: savingsGoals.goalType,
        targetAmount: savingsGoals.targetAmount,
        currentSavings: savingsGoals.currentSavings,
        targetDate: savingsGoals.targetDate,
        monthlyCapacity: savingsGoals.monthlyCapacity,
        userId: savingsGoals.userId,
        username: users.username,
        createdAt: savingsGoals.createdAt,
        updatedAt: savingsGoals.updatedAt,
      }).from(savingsGoals)
        .leftJoin(users, eq(savingsGoals.userId, users.id));

      // Prepare users data
      const usersData = allUsers.map(user => {
        const userGoals = allGoals.filter(goal => goal.userId === user.id);
        const totalTargetAmount = userGoals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0);
        const totalCurrentSavings = userGoals.reduce((sum, goal) => sum + (goal.currentSavings || 0), 0);
        const overallProgress = totalTargetAmount > 0 ? (totalCurrentSavings / totalTargetAmount * 100) : 0;

        return [
          user.id,
          user.username,
          new Date().toISOString().split('T')[0], // Created date
          userGoals.length,
          totalTargetAmount.toFixed(2),
          totalCurrentSavings.toFixed(2),
          overallProgress.toFixed(1),
          new Date().toISOString()
        ];
      });

      // Prepare goals data
      const goalsData = allGoals.map(goal => {
        const progress = goal.targetAmount ? ((goal.currentSavings || 0) / goal.targetAmount * 100) : 0;
        const monthsToTarget = goal.targetDate ? 
          Math.max(1, Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0;
        const monthlyRequired = goal.targetAmount && monthsToTarget ? 
          Math.max(0, (goal.targetAmount - (goal.currentSavings || 0)) / monthsToTarget) : 0;
        const isFeasible = monthlyRequired <= (goal.monthlyCapacity || 0);

        return [
          goal.goalId,
          goal.userId,
          goal.username || '',
          goal.goalName || '',
          goal.goalType || '',
          (goal.targetAmount || 0).toFixed(2),
          (goal.currentSavings || 0).toFixed(2),
          progress.toFixed(1),
          goal.targetDate?.toISOString().split('T')[0] || '',
          monthlyRequired.toFixed(2),
          isFeasible ? 'Yes' : 'No',
          goal.createdAt?.toISOString().split('T')[0] || '',
          goal.updatedAt?.toISOString() || ''
        ];
      });

      // Clear existing data (except headers)
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${USERS_SHEET_NAME}!A2:H`,
      });

      await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${GOALS_SHEET_NAME}!A2:M`,
      });

      // Update with new data
      if (usersData.length > 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${USERS_SHEET_NAME}!A2:H${usersData.length + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: usersData,
          },
        });
      }

      if (goalsData.length > 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${GOALS_SHEET_NAME}!A2:M${goalsData.length + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: goalsData,
          },
        });
      }

      console.log(`Google Sheets: Synced ${usersData.length} users and ${goalsData.length} goals`);
      return true;
    } catch (error) {
      console.error('Google Sheets: Failed to sync data:', error);
      return false;
    }
  }

  async syncUser(userId: string, spreadsheetId?: string): Promise<boolean> {
    try {
      if (!this.sheets || !spreadsheetId) {
        console.log('Google Sheets: Service not initialized or no spreadsheet ID provided');
        return false;
      }

      // For now, sync all data since partial updates are complex
      // In production, you might want to implement more granular updates
      return await this.syncAllData(spreadsheetId);
    } catch (error) {
      console.error('Google Sheets: Failed to sync user:', error);
      return false;
    }
  }

  async syncGoal(goalId: string, spreadsheetId?: string): Promise<boolean> {
    try {
      if (!this.sheets || !spreadsheetId) {
        console.log('Google Sheets: Service not initialized or no spreadsheet ID provided');
        return false;
      }

      // For now, sync all data since partial updates are complex
      // In production, you might want to implement more granular updates
      return await this.syncAllData(spreadsheetId);
    } catch (error) {
      console.error('Google Sheets: Failed to sync goal:', error);
      return false;
    }
  }

  // Set the target spreadsheet for automatic syncing
  setTargetSpreadsheet(spreadsheetId: string) {
    process.env.TARGET_SPREADSHEET_ID = spreadsheetId;
    console.log(`Google Sheets: Target spreadsheet set to ${spreadsheetId}`);
  }

  getTargetSpreadsheet(): string | undefined {
    return process.env.TARGET_SPREADSHEET_ID;
  }

  getSpreadsheetUrl(spreadsheetId: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }
}

export const googleSheetsService = new GoogleSheetsService();