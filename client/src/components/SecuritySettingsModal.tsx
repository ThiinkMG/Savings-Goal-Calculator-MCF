import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'password' | 'username' | 'phone' | 'email';
}

type SecurityStep = 
  | 'verify-password' 
  | 'change-password' 
  | 'change-username'
  | 'change-phone'
  | 'change-email'
  | 'password-reset' 
  | 'username-recovery' 
  | 'success';

export function SecuritySettingsModal({ isOpen, onClose, initialMode }: SecuritySettingsModalProps) {
  const [step, setStep] = useState<SecurityStep>('verify-password');
  const [mode, setMode] = useState<'password' | 'username' | 'phone' | 'email'>(initialMode);
  
  // Reset mode when modal opens with new initial mode
  useEffect(() => {
    setMode(initialMode);
    setStep('verify-password');
  }, [initialMode, isOpen]);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newUsername: '',
    newPhoneNumber: '',
    newEmail: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | null>(null);
  const [phoneStatus, setPhoneStatus] = useState<'checking' | 'available' | 'taken' | 'invalid' | null>(null);
  const [emailStatus, setEmailStatus] = useState<'checking' | 'available' | 'taken' | 'invalid' | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  
  const { toast } = useToast();
  const { user } = useAuth();

  const resetForm = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      newUsername: '',
      newPhoneNumber: '',
      newEmail: ''
    });
    setPasswordStrength(0);
    setUsernameStatus(null);
    setPhoneStatus(null);
    setEmailStatus(null);
    setAttempts(0);
    setVerificationToken('');
    setStep('verify-password');
    setMode(initialMode); // Reset to initial mode
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus(null);
      return;
    }

    setUsernameStatus('checking');
    try {
      const response = await fetch(`/api/auth/check-username/${encodeURIComponent(username)}`);
      const data = await response.json();
      setUsernameStatus(data.available ? 'available' : 'taken');
    } catch (error) {
      setUsernameStatus(null);
    }
  };

  const checkPhoneAvailability = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setPhoneStatus(null);
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      setPhoneStatus('invalid');
      return;
    }

    setPhoneStatus('checking');
    try {
      const response = await fetch(`/api/auth/check-phone/${encodeURIComponent(phoneNumber)}`);
      const data = await response.json();
      setPhoneStatus(data.available ? 'available' : 'taken');
    } catch (error) {
      setPhoneStatus(null);
    }
  };

  const checkEmailAvailability = async (email: string) => {
    if (!email || email.length < 5) {
      setEmailStatus(null);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailStatus('invalid');
      return;
    }

    setEmailStatus('checking');
    try {
      const response = await fetch(`/api/auth/check-email/${encodeURIComponent(email)}`);
      const data = await response.json();
      setEmailStatus(data.available ? 'available' : 'taken');
    } catch (error) {
      setEmailStatus(null);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    if (field === 'newUsername' && step === 'change-username') {
      checkUsernameAvailability(value);
    }

    if (field === 'newPhoneNumber' && step === 'change-phone') {
      checkPhoneAvailability(value);
    }

    if (field === 'newEmail' && step === 'change-email') {
      checkEmailAvailability(value);
    }
  };

  const handleVerifyPassword = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: formData.currentPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Too Many Attempts",
            description: "Please wait before trying again",
            variant: "destructive"
          });
        } else {
          setAttempts(prev => prev + 1);
          toast({
            title: "Incorrect Password",
            description: `${data.message}. Attempts remaining: ${3 - attempts - 1} of 3`,
            variant: "destructive"
          });
        }
        return;
      }

      setVerificationToken(data.token);
      if (mode === 'password') {
        setStep('change-password');
      } else if (mode === 'username') {
        setStep('change-username');
      } else if (mode === 'phone') {
        setStep('change-phone');
      } else if (mode === 'email') {
        setStep('change-email');
      }
      toast({
        title: "Identity Verified",
        description: "You can now make changes to your account"
      });
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Unable to verify password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordStrength < 75) {
      toast({
        title: "Weak Password",
        description: "Please choose a stronger password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verificationToken,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Update Failed",
          description: data.message,
          variant: "destructive"
        });
        return;
      }

      setStep('success');
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully"
      });
    } catch (error) {
      toast({
        title: "Update Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeUsername = async () => {
    if (usernameStatus !== 'available') {
      toast({
        title: "Username Unavailable",
        description: "Please choose a different username",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verificationToken,
          newUsername: formData.newUsername
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Update Failed",
          description: data.message,
          variant: "destructive"
        });
        return;
      }

      setStep('success');
      toast({
        title: "Username Updated",
        description: `Your username is now: ${formData.newUsername}`
      });
    } catch (error) {
      toast({
        title: "Update Error",
        description: "Failed to update username. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePhone = async () => {
    if (phoneStatus !== 'available') {
      toast({
        title: "Phone Number Unavailable",
        description: "Please choose a different phone number",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/phone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verificationToken,
          newPhoneNumber: formData.newPhoneNumber
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Update Failed",
          description: data.message,
          variant: "destructive"
        });
        return;
      }

      setStep('success');
      toast({
        title: "Phone Number Updated",
        description: `Your phone number has been updated successfully`
      });
    } catch (error) {
      toast({
        title: "Update Error",
        description: "Failed to update phone number. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (emailStatus !== 'available') {
      toast({
        title: "Email Unavailable",
        description: "Please choose a different email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verificationToken,
          newEmail: formData.newEmail
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Update Failed",
          description: data.message,
          variant: "destructive"
        });
        return;
      }

      setStep('success');
      toast({
        title: "Email Updated",
        description: `Your email has been updated successfully`
      });
    } catch (error) {
      toast({
        title: "Update Error",
        description: "Failed to update email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: user?.email || user?.username })
      });

      const data = await response.json();

      toast({
        title: data.success ? "Reset Link Sent" : "Reset Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });

      if (data.success) {
        handleClose();
      }
    } catch (error) {
      toast({
        title: "Reset Error",
        description: "Failed to send reset link",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameRecovery = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: user?.email || user?.phoneNumber })
      });

      const data = await response.json();

      toast({
        title: data.success ? "Username Sent" : "Recovery Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });

      if (data.success) {
        handleClose();
      }
    } catch (error) {
      toast({
        title: "Recovery Error",
        description: "Failed to send username info",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 25) return 'bg-red-500';
    if (strength < 50) return 'bg-orange-500';
    if (strength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 25) return 'Weak';
    if (strength < 50) return 'Fair';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  const getStepTitle = () => {
    switch (step) {
      case 'verify-password': 
        if (mode === 'password') return 'Change Password';
        if (mode === 'username') return 'Update Username';
        if (mode === 'phone') return 'Update Phone Number';
        if (mode === 'email') return 'Update Email Address';
        return 'Security Settings';
      case 'change-password': return 'Create New Password';
      case 'change-username': return 'Choose New Username';
      case 'change-phone': return 'Update Phone Number';
      case 'change-email': return 'Update Email Address';
      case 'password-reset': return 'Reset Password';
      case 'username-recovery': return 'Recover Username';
      case 'success': 
        if (mode === 'password') return 'Password Updated';
        if (mode === 'username') return 'Username Updated';
        if (mode === 'phone') return 'Phone Number Updated';
        if (mode === 'email') return 'Email Address Updated';
        return 'Update Complete';
      default: return 'Security Settings';
    }
  };

  const renderVerifyPasswordStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">🔒</div>
        <h3 className="text-lg font-semibold">Verify Your Identity</h3>
        <p className="text-sm text-muted-foreground">
          Enter your current password to {
            mode === 'password' ? 'make changes to your account' : 
            mode === 'username' ? 'change your username' :
            mode === 'phone' ? 'update your phone number' :
            mode === 'email' ? 'update your email address' : 'make changes'
          }
        </p>
      </div>

      {mode === 'username' && (
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm">
            <span className="font-medium">Current Username:</span> {user?.username}
          </p>
        </div>
      )}

      {mode === 'phone' && (
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm">
            <span className="font-medium">Current Phone:</span> {user?.phoneNumber || 'Not set'}
          </p>
        </div>
      )}

      {mode === 'email' && (
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm">
            <span className="font-medium">Current Email:</span> {user?.email || 'Not set'}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your current password"
            value={formData.currentPassword}
            onChange={(e) => handleInputChange('currentPassword', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {attempts > 0 && (
        <div className="text-sm text-red-600">
          Attempts remaining: {3 - attempts} of 3
        </div>
      )}

      <Button 
        onClick={handleVerifyPassword} 
        className="w-full" 
        disabled={isLoading || !formData.currentPassword}
      >
        {isLoading ? "Verifying..." : "Verify & Continue"}
      </Button>

      <div className="pt-4 border-t space-y-2">
        <div className="text-center text-sm text-muted-foreground mb-2">Need Help?</div>
        
        <Button
          variant="link"
          onClick={() => setStep('password-reset')}
          className="w-full text-sm"
        >
          Forgot your password?
        </Button>
        
        <Button
          variant="link"
          onClick={() => setStep('username-recovery')}
          className="w-full text-sm"
        >
          Can't remember your username?
        </Button>
      </div>
    </div>
  );

  const renderChangePasswordStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="text-2xl mb-2">✅</div>
        <h3 className="text-lg font-semibold">Identity Verified</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            placeholder="Create a new password"
            value={formData.newPassword}
            onChange={(e) => handleInputChange('newPassword', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && passwordStrength >= 75 && formData.newPassword === formData.confirmPassword) {
                e.preventDefault();
                handleChangePassword();
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {formData.newPassword && (
          <div className="space-y-1">
            <div className="flex space-x-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded ${
                    i < passwordStrength / 25 ? getPasswordStrengthColor(passwordStrength) : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Strength: {getPasswordStrengthText(passwordStrength)}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your new password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && passwordStrength >= 75 && formData.newPassword === formData.confirmPassword) {
                e.preventDefault();
                handleChangePassword();
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
          <p className="text-xs text-red-600">Passwords do not match</p>
        )}
      </div>

      <div className="bg-muted p-3 rounded-md text-sm">
        <div className="font-medium mb-1">Password Requirements:</div>
        <div className="space-y-1 text-xs">
          <div className={formData.newPassword.length >= 8 ? "text-green-600" : "text-muted-foreground"}>
            ✓ At least 8 characters
          </div>
          <div className={/[a-zA-Z]/.test(formData.newPassword) && /\d/.test(formData.newPassword) ? "text-green-600" : "text-muted-foreground"}>
            ✓ Mix of letters and numbers
          </div>
          <div className={/[^a-zA-Z0-9]/.test(formData.newPassword) ? "text-green-600" : "text-muted-foreground"}>
            ✓ At least 1 special character
          </div>
        </div>
      </div>

      <Button 
        onClick={handleChangePassword} 
        className="w-full" 
        disabled={isLoading || passwordStrength < 75 || formData.newPassword !== formData.confirmPassword}
      >
        {isLoading ? "Updating Password..." : "Update Password"}
      </Button>
    </div>
  );

  const renderChangeUsernameStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="text-2xl mb-2">✅</div>
        <h3 className="text-lg font-semibold">Identity Verified</h3>
      </div>

      <div className="bg-muted p-3 rounded-md">
        <p className="text-sm">
          <span className="font-medium">Current Username:</span> {user?.username}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newUsername">New Username</Label>
        <div className="relative">
          <Input
            id="newUsername"
            placeholder="Choose a new username"
            value={formData.newUsername}
            onChange={(e) => handleInputChange('newUsername', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && usernameStatus === 'available') {
                e.preventDefault();
                handleChangeUsername();
              }
            }}
          />
          {usernameStatus && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {usernameStatus === 'checking' && <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />}
              {usernameStatus === 'available' && <Check className="w-4 h-4 text-green-600" />}
              {usernameStatus === 'taken' && <X className="w-4 h-4 text-red-600" />}
            </div>
          )}
        </div>
        {usernameStatus === 'taken' && (
          <p className="text-xs text-red-600">Username is already taken</p>
        )}
        {usernameStatus === 'available' && (
          <p className="text-xs text-green-600">Username is available</p>
        )}
      </div>

      <div className="bg-muted p-3 rounded-md text-sm">
        <div className="font-medium mb-1">Username Requirements:</div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>• 3-20 characters</div>
          <div>• Letters, numbers, underscore only</div>
          <div>• Must start with letter</div>
          <div>• Cannot be changed for 30 days</div>
        </div>
      </div>

      <Button 
        onClick={handleChangeUsername} 
        className="w-full" 
        disabled={isLoading || usernameStatus !== 'available'}
      >
        {isLoading ? "Updating Username..." : "Update Username"}
      </Button>
    </div>
  );

  const renderChangePhoneStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="text-2xl mb-2">✅</div>
        <h3 className="text-lg font-semibold">Identity Verified</h3>
      </div>

      <div className="bg-muted p-3 rounded-md">
        <p className="text-sm">
          <span className="font-medium">Current Phone:</span> {user?.phoneNumber || 'Not set'}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPhoneNumber">New Phone Number</Label>
        <div className="relative">
          <Input
            id="newPhoneNumber"
            placeholder="+1 234-567-8900"
            value={formData.newPhoneNumber}
            onChange={(e) => handleInputChange('newPhoneNumber', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && phoneStatus === 'available') {
                e.preventDefault();
                handleChangePhone();
              }
            }}
          />
          {phoneStatus && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {phoneStatus === 'checking' && <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />}
              {phoneStatus === 'available' && <Check className="w-4 h-4 text-green-600" />}
              {phoneStatus === 'taken' && <X className="w-4 h-4 text-red-600" />}
              {phoneStatus === 'invalid' && <X className="w-4 h-4 text-red-600" />}
            </div>
          )}
        </div>
        {phoneStatus === 'taken' && (
          <p className="text-xs text-red-600">Phone number is already in use</p>
        )}
        {phoneStatus === 'invalid' && (
          <p className="text-xs text-red-600">Invalid phone number format</p>
        )}
        {phoneStatus === 'available' && (
          <p className="text-xs text-green-600">Phone number is available</p>
        )}
      </div>

      <div className="bg-muted p-3 rounded-md text-sm">
        <div className="font-medium mb-1">Phone Number Format:</div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>• Include country code (e.g., +1 for US)</div>
          <div>• 10-15 digits total</div>
          <div>• Can include spaces, dashes, or parentheses</div>
          <div>• Must be a valid, active phone number</div>
        </div>
      </div>

      <Button 
        onClick={handleChangePhone} 
        className="w-full" 
        disabled={isLoading || phoneStatus !== 'available'}
      >
        {isLoading ? "Updating Phone..." : "Update Phone Number"}
      </Button>
    </div>
  );

  const renderChangeEmailStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="text-2xl mb-2">✅</div>
        <h3 className="text-lg font-semibold">Identity Verified</h3>
      </div>

      <div className="bg-muted p-3 rounded-md">
        <p className="text-sm">
          <span className="font-medium">Current Email:</span> {user?.email || 'Not set'}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newEmail">New Email Address</Label>
        <div className="relative">
          <Input
            id="newEmail"
            type="email"
            placeholder="your.email@example.com"
            value={formData.newEmail}
            onChange={(e) => handleInputChange('newEmail', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && emailStatus === 'available') {
                e.preventDefault();
                handleChangeEmail();
              }
            }}
          />
          {emailStatus && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {emailStatus === 'checking' && <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />}
              {emailStatus === 'available' && <Check className="w-4 h-4 text-green-600" />}
              {emailStatus === 'taken' && <X className="w-4 h-4 text-red-600" />}
              {emailStatus === 'invalid' && <X className="w-4 h-4 text-red-600" />}
            </div>
          )}
        </div>
        {emailStatus === 'taken' && (
          <p className="text-xs text-red-600">Email address is already in use</p>
        )}
        {emailStatus === 'invalid' && (
          <p className="text-xs text-red-600">Invalid email address format</p>
        )}
        {emailStatus === 'available' && (
          <p className="text-xs text-green-600">Email address is available</p>
        )}
      </div>

      <div className="bg-muted p-3 rounded-md text-sm">
        <div className="font-medium mb-1">Email Requirements:</div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>• Must be a valid email format</div>
          <div>• Cannot be already registered</div>
          <div>• Will be used for login and notifications</div>
          <div>• Verification email will be sent</div>
        </div>
      </div>

      <Button 
        onClick={handleChangeEmail} 
        className="w-full" 
        disabled={isLoading || emailStatus !== 'available'}
      >
        {isLoading ? "Updating Email..." : "Update Email Address"}
      </Button>
    </div>
  );

  const renderPasswordResetStep = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => setStep('verify-password')}
        className="mb-4 p-0"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="text-center mb-4">
        <div className="text-4xl mb-2">📧</div>
        <h3 className="text-lg font-semibold">Password Reset</h3>
        <p className="text-sm text-muted-foreground">
          We'll send a reset link to your registered email address
        </p>
      </div>

      <div className="bg-muted p-3 rounded-md">
        <p className="text-sm">
          <span className="font-medium">Email:</span> {user?.email ? `${user.email.charAt(0)}***@${user.email.split('@')[1]}` : 'No email on file'}
        </p>
      </div>

      <Button 
        onClick={handlePasswordReset} 
        className="w-full" 
        disabled={isLoading || !user?.email}
      >
        {isLoading ? "Sending..." : "Send Reset Link"}
      </Button>
    </div>
  );

  const renderUsernameRecoveryStep = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => setStep('verify-password')}
        className="mb-4 p-0"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="text-center mb-4">
        <div className="text-4xl mb-2">📧</div>
        <h3 className="text-lg font-semibold">Username Recovery</h3>
        <p className="text-sm text-muted-foreground">
          We'll send your username to your registered contact methods
        </p>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Send to:</div>
        {user?.email && (
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm">Email: {user.email.charAt(0)}***@{user.email.split('@')[1]}</span>
          </div>
        )}
        {user?.phoneNumber && (
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm">Phone: ***-***-{user.phoneNumber.slice(-4)}</span>
          </div>
        )}
      </div>

      <Button 
        onClick={handleUsernameRecovery} 
        className="w-full" 
        disabled={isLoading || (!user?.email && !user?.phoneNumber)}
      >
        {isLoading ? "Sending..." : "Send Username Info"}
      </Button>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-4 text-center">
      <div className="text-6xl mb-4">✅</div>
      <h3 className="text-lg font-semibold">
        {mode === 'password' ? 'Password Updated Successfully' : 
         mode === 'username' ? 'Username Updated Successfully' : 
         mode === 'phone' ? 'Phone Number Updated Successfully' :
         'Email Address Updated Successfully'}
      </h3>
      <div className="text-sm text-muted-foreground space-y-2">
        {mode === 'password' ? (
          <>
            <p>Your password has been changed.</p>
            <p>You'll remain logged in on this device, but will need to sign in again on other devices.</p>
          </>
        ) : mode === 'username' ? (
          <>
            <p>Your username is now: <span className="font-medium">{formData.newUsername}</span></p>
            <p>Note: You can't change your username again for 30 days.</p>
          </>
        ) : mode === 'phone' ? (
          <>
            <p>Your phone number has been updated successfully.</p>
            <p>You can now use this number to log in and receive notifications.</p>
          </>
        ) : (
          <>
            <p>Your email address has been updated successfully.</p>
            <p>You can now use this email to log in and receive notifications.</p>
          </>
        )}
      </div>
      <Button onClick={handleClose} className="w-full">
        Got It
      </Button>
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'verify-password': return renderVerifyPasswordStep();
      case 'change-password': return renderChangePasswordStep();
      case 'change-username': return renderChangeUsernameStep();
      case 'change-phone': return renderChangePhoneStep();
      case 'change-email': return renderChangeEmailStep();
      case 'password-reset': return renderPasswordResetStep();
      case 'username-recovery': return renderUsernameRecoveryStep();
      case 'success': return renderSuccessStep();
      default: return renderVerifyPasswordStep();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6" aria-describedby="security-modal-description">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <div id="security-modal-description" className="sr-only">
            Security settings modal for changing password or username
          </div>
        </DialogHeader>
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}