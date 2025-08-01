import { storage } from './storage';
import bcrypt from 'bcryptjs';
import { sendEmail } from './emailService';

// Helper function to generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to detect identifier type
export function detectIdentifierType(identifier: string): 'email' | 'phone' | 'username' {
  if (identifier.includes('@')) return 'email';
  if (/^[\+]?[1-9][\d]{0,15}$/.test(identifier.replace(/[\s\-\(\)]/g, ''))) return 'phone';
  return 'username';
}

// Enhanced login with rate limiting and account lockout
export async function authenticateUser(identifier: string, password: string): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  locked?: boolean;
  lockoutUntil?: Date;
}> {
  try {
    // First try the enhanced method with getUserByIdentifier
    let user = await storage.getUserByIdentifier(identifier);
    
    // If no user found and it looks like a username (not email/phone), try fallback
    if (!user && !identifier.includes('@') && !/^[\+]?[1-9][\d]{0,15}$/.test(identifier.replace(/[\s\-\(\)]/g, ''))) {
      user = await storage.getUserByUsername(identifier);
    }
    
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Check if account is locked
    if (user.isLocked && user.lockoutUntil && new Date() < user.lockoutUntil) {
      return { 
        success: false, 
        error: 'Account temporarily locked due to too many failed attempts',
        locked: true,
        lockoutUntil: user.lockoutUntil
      };
    }

    // If lockout period has expired, unlock the account
    if (user.isLocked && user.lockoutUntil && new Date() >= user.lockoutUntil) {
      await storage.unlockUser(user.id);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      // Increment failed attempts
      await storage.incrementFailedAttempts(user.id);
      
      const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (newFailedAttempts >= 5) {
        await storage.lockUser(user.id, 30); // Lock for 30 minutes
        return { 
          success: false, 
          error: 'Account locked due to too many failed attempts. Try again in 30 minutes.',
          locked: true
        };
      }
      
      return { 
        success: false, 
        error: `Invalid credentials. ${5 - newFailedAttempts} attempts remaining.`
      };
    }

    // Successful login - update last login time
    await storage.updateLastLogin(user.id);
    
    // Remove sensitive information before returning
    const { password: _, ...userWithoutPassword } = user;
    
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

// Send password reset code
export async function sendPasswordResetCode(identifier: string): Promise<{
  success: boolean;
  method?: 'email' | 'sms';
  maskedContact?: string;
  error?: string;
}> {
  try {
    const user = await storage.getUserByIdentifier(identifier);
    
    if (!user) {
      // Don't reveal if user exists
      return { success: true, method: 'email', maskedContact: 'your email' };
    }

    const code = generateVerificationCode();
    const identifierType = detectIdentifierType(identifier);
    
    let method: 'email' | 'sms' = 'email';
    let maskedContact = '';
    
    if (identifierType === 'email' || user.email) {
      // Send via email
      method = 'email';
      maskedContact = maskEmail(user.email || '');
      
      await sendEmail({
        to: user.email || '',
        from: 'noreply@mycollegefinance.com',
        subject: 'Password Reset Code - My College Finance',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${user.fullName || user.username},</p>
            <p>You requested a password reset for your My College Finance account.</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h3 style="margin: 0; font-size: 24px; letter-spacing: 3px;">${code}</h3>
              <p style="margin: 10px 0 0 0; color: #666;">This code expires in 15 minutes</p>
            </div>
            <p>If you didn't request this reset, please ignore this email.</p>
            <p>Best regards,<br>My College Finance Team</p>
          </div>
        `
      });
    } else if (user.phoneNumber) {
      // For now, just log SMS (would integrate with Twilio in production)
      method = 'sms';
      maskedContact = maskPhone(user.phoneNumber);
      console.log(`SMS would be sent to ${user.phoneNumber}: Your password reset code is ${code}`);
    }

    // Store verification code
    await storage.createVerificationCode(user.id, code, 'password_reset', method);
    
    return { success: true, method, maskedContact };
  } catch (error) {
    console.error('Send password reset error:', error);
    return { success: false, error: 'Failed to send reset code' };
  }
}

// Send username recovery
export async function sendUsernameRecovery(identifier: string): Promise<{
  success: boolean;
  method?: 'email' | 'sms';
  error?: string;
}> {
  try {
    const user = await storage.getUserByIdentifier(identifier);
    
    if (!user) {
      // Don't reveal if user exists
      return { success: true, method: 'email' };
    }

    if (user.email) {
      await sendEmail({
        to: user.email,
        from: 'noreply@mycollegefinance.com',
        subject: 'Username Recovery - My College Finance',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Username Recovery</h2>
            <p>Hello ${user.fullName || 'there'},</p>
            <p>Your username for My College Finance is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h3 style="margin: 0; font-size: 20px;">${user.username}</h3>
            </div>
            <p>You can use this username to log in to your account.</p>
            <p>Best regards,<br>My College Finance Team</p>
          </div>
        `
      });
      
      return { success: true, method: 'email' };
    }
    
    return { success: false, error: 'No recovery method available' };
  } catch (error) {
    console.error('Username recovery error:', error);
    return { success: false, error: 'Failed to send username' };
  }
}

// Verify reset code and generate temporary token
export async function verifyResetCode(code: string, identifier: string): Promise<{
  success: boolean;
  resetToken?: string;
  error?: string;
}> {
  try {
    const result = await storage.verifyCode(code, identifier, 'password_reset');
    
    if (!result.valid || !result.userId) {
      return { success: false, error: 'Invalid or expired code' };
    }

    // Generate temporary reset token (valid for 15 minutes)
    const resetToken = generateResetToken(result.userId);
    
    return { success: true, resetToken };
  } catch (error) {
    console.error('Verify reset code error:', error);
    return { success: false, error: 'Code verification failed' };
  }
}

// Reset password with token
export async function resetPassword(resetToken: string, newPassword: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userId = verifyResetToken(resetToken);
    
    if (!userId) {
      return { success: false, error: 'Invalid or expired reset token' };
    }

    const success = await storage.updateUserPassword(userId, newPassword);
    
    if (!success) {
      return { success: false, error: 'Failed to update password' };
    }

    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: 'Password reset failed' };
  }
}

// Helper functions
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local}@${domain}`;
  const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    return `+1 (***) ***-${cleaned.slice(-4)}`;
  }
  return `***-${cleaned.slice(-4)}`;
}

// Simple JWT-like token generation (in production, use proper JWT library)
function generateResetToken(userId: string): string {
  const payload = {
    userId,
    expires: Date.now() + 15 * 60 * 1000 // 15 minutes
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyResetToken(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    if (Date.now() > payload.expires) {
      return null; // Token expired
    }
    
    return payload.userId;
  } catch {
    return null;
  }
}