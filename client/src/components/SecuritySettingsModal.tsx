import { useState } from "react";
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
  initialMode: 'password' | 'username';
}

type SecurityStep = 
  | 'verify-password' 
  | 'change-password' 
  | 'change-username' 
  | 'password-reset' 
  | 'username-recovery' 
  | 'success';

export function SecuritySettingsModal({ isOpen, onClose, initialMode }: SecuritySettingsModalProps) {
  const [step, setStep] = useState<SecurityStep>('verify-password');
  const [mode, setMode] = useState<'password' | 'username'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newUsername: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | null>(null);
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
      newUsername: ''
    });
    setPasswordStrength(0);
    setUsernameStatus(null);
    setAttempts(0);
    setVerificationToken('');
    setStep('verify-password');
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    if (field === 'newUsername' && step === 'change-username') {
      checkUsernameAvailability(value);
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
      setStep(mode === 'password' ? 'change-password' : 'change-username');
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
      case 'verify-password': return mode === 'password' ? 'Change Password' : 'Update Username';
      case 'change-password': return 'Create New Password';
      case 'change-username': return 'Choose New Username';
      case 'password-reset': return 'Reset Password';
      case 'username-recovery': return 'Recover Username';
      case 'success': return mode === 'password' ? 'Password Updated' : 'Username Updated';
      default: return 'Security Settings';
    }
  };

  const renderVerifyPasswordStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">🔒</div>
        <h3 className="text-lg font-semibold">Verify Your Identity</h3>
        <p className="text-sm text-muted-foreground">
          Enter your current password to {mode === 'password' ? 'make changes to your account' : 'change your username'}
        </p>
      </div>

      {mode === 'username' && (
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm">
            <span className="font-medium">Current Username:</span> {user?.username}
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
        {mode === 'password' ? 'Password Updated Successfully' : 'Username Updated Successfully'}
      </h3>
      <div className="text-sm text-muted-foreground space-y-2">
        {mode === 'password' ? (
          <>
            <p>Your password has been changed.</p>
            <p>You'll remain logged in on this device, but will need to sign in again on other devices.</p>
          </>
        ) : (
          <>
            <p>Your username is now: <span className="font-medium">{formData.newUsername}</span></p>
            <p>Note: You can't change your username again for 30 days.</p>
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
      case 'password-reset': return renderPasswordResetStep();
      case 'username-recovery': return renderUsernameRecoveryStep();
      case 'success': return renderSuccessStep();
      default: return renderVerifyPasswordStep();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="security-modal-description">
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