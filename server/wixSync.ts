import { storage } from './storage';
import { InsertUser } from '@shared/schema';
import bcrypt from 'bcryptjs';

// Wix API Configuration
interface WixConfig {
  accountId: string;
  siteId: string;
  apiKey: string;
  baseUrl: string;
}

interface WixUser {
  _id: string;
  loginEmail: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  username?: string;
  lastLoginDate?: string;
  dateCreated: string;
  status: 'PENDING' | 'APPROVED' | 'BLOCKED';
}

interface WixApiResponse {
  members: WixUser[];
  metaData: {
    count: number;
    offset: number;
    total: number;
  };
}

interface SyncResult {
  success: boolean;
  processed: number;
  created: number;
  updated: number;
  errors: string[];
}

class WixSyncService {
  private config: WixConfig;

  constructor() {
    this.config = {
      accountId: process.env.WIX_ACCOUNT_ID || '',
      siteId: process.env.WIX_SITE_ID || '',
      apiKey: process.env.WIX_API_KEY || '',
      baseUrl: 'https://www.wixapis.com'
    };
  }

  private validateConfig(): boolean {
    return !!(this.config.accountId && this.config.siteId && this.config.apiKey);
  }

  private async makeWixRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'wix-account-id': this.config.accountId,
        'wix-site-id': this.config.siteId,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Wix API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  private async fetchWixUsers(limit: number = 100, offset: number = 0): Promise<WixApiResponse> {
    try {
      const endpoint = `/members/v1/members`;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        fieldsets: 'FULL' // Get all available fields
      });

      return await this.makeWixRequest(`${endpoint}?${params}`);
    } catch (error) {
      console.error('Error fetching Wix users:', error);
      throw error;
    }
  }

  private generateTempPassword(): string {
    // Generate a secure temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Bidirectional sync: Create user in Wix when they register in Replit
  public async createWixUser(user: User): Promise<{ success: boolean; wixUserId?: string; error?: string }> {
    try {
      if (!this.validateConfig()) {
        return { success: false, error: 'Wix API not configured' };
      }

      // Prepare Wix user data
      const wixUserData = {
        loginEmail: user.email,
        firstName: user.fullName?.split(' ')[0] || '',
        lastName: user.fullName?.split(' ').slice(1).join(' ') || '',
        phone: user.phoneNumber || undefined,
        username: user.username
      };

      console.log(`Creating Wix user for ${user.email}...`);

      const response = await fetch(`https://www.wixapis.com/members/v1/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'wix-account-id': this.config.accountId,
          'wix-site-id': this.config.siteId
        },
        body: JSON.stringify({
          member: wixUserData,
          privacyStatus: 'PUBLIC',
          status: 'ACTIVE'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Wix user creation failed: ${response.status} - ${errorText}`);
        return { success: false, error: `Wix API error: ${response.status} - ${errorText}` };
      }

      const result = await response.json();
      const wixUserId = result.member?._id;

      if (wixUserId) {
        // Update local user with Wix ID
        await storage.updateUserWixId(user.id, wixUserId);
        console.log(`Successfully created Wix user ${wixUserId} for ${user.email}`);
        return { success: true, wixUserId };
      } else {
        return { success: false, error: 'No Wix user ID returned' };
      }

    } catch (error) {
      console.error('Error creating Wix user:', error);
      return { success: false, error: String(error) };
    }
  }

  // Update existing Wix user when Replit user data changes
  public async updateWixUser(user: User): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.validateConfig() || !user.wixUserId) {
        return { success: false, error: 'Wix API not configured or user not linked' };
      }

      // Prepare update data
      const updateData = {
        loginEmail: user.email,
        firstName: user.fullName?.split(' ')[0] || '',
        lastName: user.fullName?.split(' ').slice(1).join(' ') || '',
        phone: user.phoneNumber || undefined,
        username: user.username
      };

      console.log(`Updating Wix user ${user.wixUserId} for ${user.email}...`);

      const response = await fetch(`https://www.wixapis.com/members/v1/members/${user.wixUserId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'wix-account-id': this.config.accountId,
          'wix-site-id': this.config.siteId
        },
        body: JSON.stringify({
          member: updateData
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Wix user update failed: ${response.status} - ${errorText}`);
        return { success: false, error: `Wix API error: ${response.status} - ${errorText}` };
      }

      console.log(`Successfully updated Wix user ${user.wixUserId}`);
      return { success: true };

    } catch (error) {
      console.error('Error updating Wix user:', error);
      return { success: false, error: String(error) };
    }
  }

  private async mapWixUserToInsertUser(wixUser: WixUser): Promise<InsertUser & { wixUserId: string }> {
    // Generate a temporary password - users will need to reset it
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create username from email if not provided
    let username = wixUser.username;
    if (!username && wixUser.loginEmail) {
      username = wixUser.loginEmail.split('@')[0];
      // Ensure username is unique by checking database
      let counter = 1;
      let baseUsername = username;
      while (await storage.getUserByUsername(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
    }

    // Combine first and last name for fullName
    const fullName = [wixUser.firstName, wixUser.lastName].filter(Boolean).join(' ') || null;

    return {
      username: username || `user_${wixUser._id.substring(0, 8)}`,
      email: wixUser.loginEmail,
      phoneNumber: wixUser.phone || null,
      password: hashedPassword,
      fullName: fullName,
      wixUserId: wixUser._id // Store original Wix ID for reference
    };
  }

  async syncAllUsers(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      processed: 0,
      created: 0,
      updated: 0,
      errors: []
    };

    try {
      // Validate configuration
      if (!this.validateConfig()) {
        result.errors.push('Missing Wix API configuration. Please set WIX_ACCOUNT_ID, WIX_SITE_ID, and WIX_API_KEY environment variables.');
        return result;
      }

      console.log('Starting Wix user synchronization...');
      
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        try {
          const wixResponse = await this.fetchWixUsers(limit, offset);
          
          if (!wixResponse.members || wixResponse.members.length === 0) {
            hasMore = false;
            continue;
          }

          // Process each user
          for (const wixUser of wixResponse.members) {
            try {
              result.processed++;

              // Skip users without email
              if (!wixUser.loginEmail) {
                result.errors.push(`Skipping user ${wixUser._id}: No email address`);
                continue;
              }

              // Check if user already exists by email
              const existingUser = await storage.getUserByEmail(wixUser.loginEmail);
              
              if (existingUser) {
                // Update existing user with Wix data if needed
                if (!existingUser.wixUserId) {
                  // Link existing user to Wix account
                  await storage.updateUserWixId(existingUser.id, wixUser._id);
                  result.updated++;
                  console.log(`Linked existing user ${existingUser.email} to Wix ID ${wixUser._id}`);
                } else {
                  console.log(`User ${wixUser.loginEmail} already synced`);
                }
              } else {
                // Create new user
                const insertUser = await this.mapWixUserToInsertUser(wixUser);
                const newUser = await storage.createUser(insertUser);
                result.created++;
                console.log(`Created new user: ${newUser.email} (Wix ID: ${wixUser._id})`);
              }

            } catch (userError) {
              const errorMsg = `Error processing user ${wixUser._id}: ${userError}`;
              result.errors.push(errorMsg);
              console.error(errorMsg);
            }
          }

          // Check if there are more users to process
          offset += limit;
          hasMore = offset < wixResponse.metaData.total;
          
          console.log(`Processed ${offset} of ${wixResponse.metaData.total} users`);

        } catch (batchError) {
          const errorMsg = `Error processing batch at offset ${offset}: ${batchError}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
          break;
        }
      }

      result.success = result.errors.length === 0 || result.created > 0 || result.updated > 0;
      
      console.log(`Sync completed: ${result.created} created, ${result.updated} updated, ${result.processed} processed`);
      if (result.errors.length > 0) {
        console.log(`Errors encountered: ${result.errors.length}`);
      }

    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
      console.error('Wix sync error:', error);
    }

    return result;
  }

  async syncSingleUser(wixUserId: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.validateConfig()) {
        return {
          success: false,
          message: 'Missing Wix API configuration'
        };
      }

      const endpoint = `/members/v1/members/${wixUserId}`;
      const wixUser = await this.makeWixRequest(endpoint);

      if (!wixUser.loginEmail) {
        return {
          success: false,
          message: 'User has no email address'
        };
      }

      const existingUser = await storage.getUserByEmail(wixUser.loginEmail);
      
      if (existingUser) {
        if (!existingUser.wixUserId) {
          await storage.updateUserWixId(existingUser.id, wixUser._id);
          return {
            success: true,
            message: `Linked existing user ${existingUser.email} to Wix account`
          };
        } else {
          return {
            success: true,
            message: `User ${wixUser.loginEmail} already synced`
          };
        }
      } else {
        const insertUser = await this.mapWixUserToInsertUser(wixUser);
        const newUser = await storage.createUser(insertUser);
        return {
          success: true,
          message: `Created new user: ${newUser.email}`
        };
      }

    } catch (error) {
      return {
        success: false,
        message: `Error syncing user: ${error}`
      };
    }
  }

  async getWixUserById(wixUserId: string): Promise<WixUser | null> {
    try {
      if (!this.validateConfig()) {
        throw new Error('Missing Wix API configuration');
      }

      const endpoint = `/members/v1/members/${wixUserId}`;
      return await this.makeWixRequest(endpoint);
    } catch (error) {
      console.error(`Error fetching Wix user ${wixUserId}:`, error);
      return null;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.validateConfig()) {
        return {
          success: false,
          message: 'Missing required environment variables: WIX_ACCOUNT_ID, WIX_SITE_ID, WIX_API_KEY'
        };
      }

      // Test the connection by fetching a small batch of users
      await this.fetchWixUsers(1, 0);
      
      return {
        success: true,
        message: 'Successfully connected to Wix API'
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error}`
      };
    }
  }
}

export const wixSyncService = new WixSyncService();