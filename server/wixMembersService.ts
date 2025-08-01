import { z } from 'zod';

// Wix Member Types
export const WixMemberSchema = z.object({
  id: z.string(),
  loginEmail: z.string().email(),
  profile: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
  }),
  customFields: z.object({
    savingsGoals: z.array(z.any()).optional(),
    appPreferences: z.object({}).optional(),
    calculationHistory: z.array(z.any()).optional(),
    membershipLevel: z.string().optional(),
    coursesCompleted: z.array(z.any()).optional(),
    lastAppLogin: z.string().optional(),
    lastAppSync: z.string().optional(),
    appUserId: z.string().optional(),
  }).optional(),
});

export type WixMember = z.infer<typeof WixMemberSchema>;

export class WixMembersService {
  private apiKey: string;
  private siteId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.WIX_API_KEY || '';
    this.siteId = process.env.WIX_SITE_ID || '';
    this.baseUrl = 'https://www.wixapis.com/members/v1/members';
    
    if (!this.apiKey || !this.siteId) {
      console.warn('Wix API credentials not configured');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'wix-site-id': this.siteId,
      'Content-Type': 'application/json'
    };
  }

  // Pull member data from Wix
  async getMemberByEmail(email: string): Promise<WixMember | null> {
    try {
      const response = await fetch(`${this.baseUrl}?query.filter={"email": "${email}"}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Wix API error: ${response.status}`);
      }
      
      const data = await response.json();
      const members = data.members || [];
      
      if (members.length === 0) return null;
      
      return WixMemberSchema.parse(members[0]);
    } catch (error) {
      console.error('Error fetching Wix member:', error);
      return null;
    }
  }

  // Get member by ID
  async getMemberById(memberId: string): Promise<WixMember | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${memberId}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Wix API error: ${response.status}`);
      }
      
      const data = await response.json();
      return WixMemberSchema.parse(data.member);
    } catch (error) {
      console.error('Error fetching Wix member by ID:', error);
      return null;
    }
  }

  // Update member data in Wix
  async updateMemberData(memberId: string, userData: Partial<WixMember>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${memberId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({
          member: userData
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error updating Wix member:', error);
      return false;
    }
  }

  // Create new member in Wix
  async createMember(userData: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    savingsGoals?: any[];
    preferences?: any;
  }): Promise<WixMember | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          member: {
            loginEmail: userData.email,
            profile: {
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone
            },
            customFields: {
              savingsGoals: userData.savingsGoals || [],
              appPreferences: userData.preferences || {},
              lastAppSync: new Date().toISOString()
            }
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Wix API error: ${response.status}`);
      }
      
      const data = await response.json();
      return WixMemberSchema.parse(data.member);
    } catch (error) {
      console.error('Error creating Wix member:', error);
      return null;
    }
  }

  // Authenticate member with Wix
  async authenticateMember(email: string, password: string): Promise<{ success: boolean; member?: WixMember; token?: string }> {
    try {
      // Note: This would use Wix's authentication endpoint
      // For now, we'll simulate by checking if member exists
      const member = await this.getMemberByEmail(email);
      
      if (!member) {
        return { success: false };
      }

      // In a real implementation, this would validate the password
      // and return an authentication token
      return {
        success: true,
        member,
        token: `wix_token_${member.id}_${Date.now()}`
      };
    } catch (error) {
      console.error('Error authenticating Wix member:', error);
      return { success: false };
    }
  }

  // Check if service is available
  isAvailable(): boolean {
    return !!(this.apiKey && this.siteId);
  }
}

export const wixMembersService = new WixMembersService();