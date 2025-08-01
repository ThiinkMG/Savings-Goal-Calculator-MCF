import { db } from './db';
import { users, savingsGoals, type User, type SavingsGoal } from '../shared/schema';
import { wixMembersService, type WixMember } from './wixMembersService';
import { eq } from 'drizzle-orm';

// Data sync mapping configuration
export const SyncMapping = {
  // App to Wix
  appToWix: {
    savingsGoals: 'customFields.savingsGoals',
    preferences: 'customFields.appPreferences',
    lastLogin: 'customFields.lastAppLogin',
    calculationHistory: 'customFields.calculationHistory'
  },
  
  // Wix to App
  wixToApp: {
    'profile.firstName': 'firstName',
    'profile.lastName': 'lastName',
    'profile.phone': 'phone',
    'loginEmail': 'email',
    'customFields.membershipLevel': 'membershipTier',
    'customFields.coursesCompleted': 'learningProgress',
    'customFields.savingsGoals': 'importedGoals'
  }
};

export class DataSyncService {
  // Sync app data to Wix
  async syncAppToWix(appUserId: string, wixMemberId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!wixMembersService.isAvailable()) {
        return { success: false, error: 'Wix service not available' };
      }

      // Get app user data
      const [appUser] = await db.select().from(users).where(eq(users.id, appUserId));
      if (!appUser) {
        return { success: false, error: 'App user not found' };
      }

      // Get user's savings goals
      const userGoals = await db.select().from(savingsGoals).where(eq(savingsGoals.userId, appUserId));
      
      // Transform app data for Wix
      const wixData: Partial<WixMember> = {
        customFields: {
          savingsGoals: userGoals.map(goal => ({
            id: goal.id,
            name: goal.name,
            goalType: goal.goalType,
            targetAmount: goal.targetAmount,
            currentSavings: goal.currentSavings,
            targetDate: goal.targetDate.toISOString(),
            monthlyCapacity: goal.monthlyCapacity,
            status: goal.status || 'active',
            createdAt: goal.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: goal.updatedAt?.toISOString() || new Date().toISOString()
          })),
          appPreferences: {
            theme: (appUser.preferences as any)?.theme || 'light',
            notifications: (appUser.preferences as any)?.notifications || true,
            language: (appUser.preferences as any)?.language || 'en'
          },
          lastAppSync: new Date().toISOString(),
          appUserId: appUserId
        }
      };
      
      const success = await wixMembersService.updateMemberData(wixMemberId, wixData);
      
      if (success) {
        // Update user's last sync time
        await db.update(users)
          .set({ 
            lastWixSync: new Date(),
            updatedAt: new Date()
          })
          .where(eq(users.id, appUserId));
      }
      
      return { success };
    } catch (error) {
      console.error('Error syncing app to Wix:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // Sync Wix data to app
  async syncWixToApp(wixMemberId: string, appUserId: string): Promise<{ success: boolean; error?: string; importedGoals?: number }> {
    try {
      if (!wixMembersService.isAvailable()) {
        return { success: false, error: 'Wix service not available' };
      }

      // Get Wix member data
      const wixMember = await wixMembersService.getMemberById(wixMemberId);
      if (!wixMember) {
        return { success: false, error: 'Wix member not found' };
      }
      
      // Transform and update app user
      const appUpdates = {
        fullName: `${wixMember.profile?.firstName || ''} ${wixMember.profile?.lastName || ''}`.trim() || undefined,
        phoneNumber: wixMember.profile?.phone || undefined,
        membershipTier: wixMember.customFields?.membershipLevel || 'free',
        learningProgress: wixMember.customFields?.coursesCompleted || [],
        lastWixSync: new Date(),
        updatedAt: new Date()
      };
      
      await db.update(users)
        .set(appUpdates)
        .where(eq(users.id, appUserId));

      // Import savings goals from Wix if they exist
      let importedGoalsCount = 0;
      if (wixMember.customFields?.savingsGoals?.length) {
        for (const wixGoal of wixMember.customFields.savingsGoals) {
          if (wixGoal.id && wixGoal.name) {
            try {
              await db.insert(savingsGoals).values({
                userId: appUserId,
                name: `${wixGoal.name} (from website)`,
                goalType: wixGoal.goalType || 'emergency',
                targetAmount: wixGoal.targetAmount || 0,
                currentSavings: wixGoal.currentSavings || 0,
                targetDate: new Date(wixGoal.targetDate || Date.now()),
                monthlyCapacity: wixGoal.monthlyCapacity || 0,
                status: wixGoal.status || 'active'
              }).onConflictDoNothing();
              
              importedGoalsCount++;
            } catch (error) {
              console.error('Error importing goal from Wix:', error);
            }
          }
        }
      }
      
      return { success: true, importedGoals: importedGoalsCount };
    } catch (error) {
      console.error('Error syncing Wix to app:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Authenticate user with Wix and sync data
  async authenticateAndSync(email: string, password: string): Promise<{
    success: boolean;
    user?: User;
    wixMember?: WixMember;
    importedGoals?: number;
    error?: string;
  }> {
    try {
      if (!wixMembersService.isAvailable()) {
        return { success: false, error: 'Wix authentication service not available' };
      }

      // Authenticate with Wix
      const authResult = await wixMembersService.authenticateMember(email, password);
      if (!authResult.success || !authResult.member) {
        return { success: false, error: 'Invalid Wix credentials' };
      }

      const wixMember = authResult.member;

      // Check if user already exists in app
      let [appUser] = await db.select().from(users).where(eq(users.email, email));
      
      if (!appUser) {
        // Create new app user
        const [newUser] = await db.insert(users).values({
          email: wixMember.loginEmail,
          username: wixMember.loginEmail.split('@')[0],
          password: 'wix_auth', // Placeholder for Wix-authenticated users
          fullName: `${wixMember.profile?.firstName || ''} ${wixMember.profile?.lastName || ''}`.trim() || undefined,
          phoneNumber: wixMember.profile?.phone,
          wixUserId: wixMember.id,
          membershipTier: wixMember.customFields?.membershipLevel || 'free',
          learningProgress: wixMember.customFields?.coursesCompleted || [],
          lastWixSync: new Date()
        }).returning();
        
        appUser = newUser;
      } else {
        // Update existing user with Wix data
        await db.update(users)
          .set({
            wixUserId: wixMember.id,
            fullName: `${wixMember.profile?.firstName || ''} ${wixMember.profile?.lastName || ''}`.trim() || appUser.fullName,
            phoneNumber: wixMember.profile?.phone || appUser.phoneNumber,
            membershipTier: wixMember.customFields?.membershipLevel || 'free',
            learningProgress: wixMember.customFields?.coursesCompleted || [],
            lastWixSync: new Date(),
            updatedAt: new Date()
          })
          .where(eq(users.id, appUser.id));
      }

      // Sync Wix data to app
      const syncResult = await this.syncWixToApp(wixMember.id, appUser.id);
      
      return {
        success: true,
        user: appUser,
        wixMember,
        importedGoals: syncResult.importedGoals || 0
      };
    } catch (error) {
      console.error('Error in authenticateAndSync:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Authentication failed' };
    }
  }

  // Schedule bidirectional sync for a user
  async scheduleBidirectionalSync(appUserId: string): Promise<void> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, appUserId));
      if (!user?.wixUserId) return;

      // Sync app data to Wix
      await this.syncAppToWix(appUserId, user.wixUserId);
      
      // Sync Wix data to app
      await this.syncWixToApp(user.wixUserId, appUserId);
    } catch (error) {
      console.error('Error in bidirectional sync:', error);
    }
  }
}

export const dataSyncService = new DataSyncService();