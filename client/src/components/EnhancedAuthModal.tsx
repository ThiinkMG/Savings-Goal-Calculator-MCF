import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, Check, X, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface EnhancedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWixLogin?: () => void;
}

type AuthStep = 'entry' | 'register' | 'login' | 'forgot-password' | 'forgot-username' | 'verify-code' | 'reset-password';

export function EnhancedAuthModal({ isOpen, onClose, onWixLogin }: EnhancedAuthModalProps) {
  const [step, setStep] = useState<AuthStep>('entry');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    username: '',
    password: '',
    confirmPassword: '',
    identifier: '',
    code: '',
    resetToken: '',
    newPassword: ''
  });
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const { login } = useAuth();

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phoneNumber: '',
      username: '',
      password: '',
      confirmPassword: '',
      identifier: '',
      code: '',
      resetToken: '',
      newPassword: ''
    });
    setUsernameStatus(null);
    setPasswordStrength(0);
    setStep('entry');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Auto-detect identifier type and format
  const detectIdentifierType = (value: string) => {
    if (value.includes('@')) return 'email';
    if (/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) return 'phone';
    return 'username';
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
    }
    return value;
  };

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameStatus(null);
      return;
    }

    setUsernameStatus('checking');
    try {
      const response = await fetch(`/api/auth/check-username/${username}`);
      const data = await response.json();
      setUsernameStatus(data.available ? 'available' : 'taken');
    } catch (error) {
      setUsernameStatus(null);
    }
  };

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[^a-zA-Z\d]/.test(password)) strength += 25;
    return Math.min(strength, 100);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'phoneNumber') {
      value = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'username' && step === 'register') {
      checkUsernameAvailability(value);
    }

    if (field === 'password' && step === 'register') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleEnhancedLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/enhanced-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.locked) {
          toast({
            title: "Account Locked",
            description: data.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Login Failed",
            description: data.message,
            variant: "destructive"
          });
        }
        return;
      }

      toast({
        title: "Login Successful",
        description: "Welcome back!"
      });

      login(data.user);
      handleClose();
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

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
      const response = await fetch('/api/auth/enhanced-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName || undefined,
          email: formData.email || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Registration Failed",
          description: data.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Registration Successful",
        description: "Welcome to My College Finance!"
      });

      login(data.user);
      handleClose();
    } catch (error) {
      toast({
        title: "Registration Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: formData.identifier })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Reset Code Sent",
          description: data.message
        });
        setStep('verify-code');
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset code",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotUsername = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: formData.identifier })
      });

      const data = await response.json();

      toast({
        title: data.success ? "Username Sent" : "Error",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });

      if (data.success) {
        setStep('login');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send username",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          identifier: formData.identifier
        })
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, resetToken: data.resetToken }));
        setStep('reset-password');
        toast({
          title: "Code Verified",
          description: "Please set your new password"
        });
      } else {
        toast({
          title: "Invalid Code",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: formData.resetToken,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Password Reset",
          description: "Your password has been updated successfully"
        });
        setStep('login');
      } else {
        toast({
          title: "Reset Failed",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password",
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

  const renderEntryStep = () => (
    <div className="space-y-6">
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login" onClick={() => setStep('login')}>Sign In</TabsTrigger>
          <TabsTrigger value="register" onClick={() => setStep('register')}>Create Account</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {onWixLogin && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          
          <Button
            onClick={onWixLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Log In with My College Finance
          </Button>
        </>
      )}
    </div>
  );

  const renderLoginStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="identifier">Email, Phone, or Username</Label>
        <Input
          id="identifier"
          placeholder="Enter your email, phone, or username"
          value={formData.identifier}
          onChange={(e) => handleInputChange('identifier', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Type: {detectIdentifierType(formData.identifier)}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
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

      <Button 
        onClick={handleEnhancedLogin} 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </Button>

      <div className="text-center space-y-2">
        <Button
          variant="link"
          onClick={() => setStep('forgot-password')}
          className="text-sm"
        >
          Forgot Password?
        </Button>
        <Button
          variant="link"
          onClick={() => setStep('forgot-username')}
          className="text-sm"
        >
          Forgot Username?
        </Button>
      </div>
    </div>
  );

  const renderRegisterStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={(e) => handleInputChange('fullName', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
        <Input
          id="phoneNumber"
          placeholder="+1 (555) 123-4567"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username *</Label>
        <div className="relative">
          <Input
            id="username"
            placeholder="Choose a username"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            required
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

      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
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
        {formData.password && (
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
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            required
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
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-xs text-red-600">Passwords do not match</p>
        )}
      </div>

      <Button 
        onClick={handleRegister} 
        className="w-full" 
        disabled={isLoading || usernameStatus !== 'available'}
      >
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>
    </div>
  );

  const renderForgotPasswordStep = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => setStep('login')}
        className="mb-4 p-0"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Login
      </Button>

      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Reset Your Password</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email or phone number to receive a reset code
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="identifier">Email or Phone</Label>
        <Input
          id="identifier"
          placeholder="Enter your email or phone number"
          value={formData.identifier}
          onChange={(e) => handleInputChange('identifier', e.target.value)}
        />
      </div>

      <Button 
        onClick={handleForgotPassword} 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Send Reset Code"}
      </Button>
    </div>
  );

  const renderForgotUsernameStep = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => setStep('login')}
        className="mb-4 p-0"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Login
      </Button>

      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Recover Your Username</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email or phone number to receive your username
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="identifier">Email or Phone</Label>
        <Input
          id="identifier"
          placeholder="Enter your email or phone number"
          value={formData.identifier}
          onChange={(e) => handleInputChange('identifier', e.target.value)}
        />
      </div>

      <Button 
        onClick={handleForgotUsername} 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Send Username"}
      </Button>
    </div>
  );

  const renderVerifyCodeStep = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => setStep('forgot-password')}
        className="mb-4 p-0"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Enter Verification Code</h3>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to your contact method
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Verification Code</Label>
        <Input
          id="code"
          placeholder="123456"
          maxLength={6}
          value={formData.code}
          onChange={(e) => handleInputChange('code', e.target.value.replace(/\D/g, ''))}
        />
        <p className="text-xs text-muted-foreground">
          Code expires in 15 minutes
        </p>
      </div>

      <Button 
        onClick={handleVerifyCode} 
        className="w-full" 
        disabled={isLoading || formData.code.length !== 6}
      >
        {isLoading ? "Verifying..." : "Verify Code"}
      </Button>
    </div>
  );

  const renderResetPasswordStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Create New Password</h3>
        <p className="text-sm text-muted-foreground">
          Your new password must be strong and secure
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your new password"
            value={formData.newPassword}
            onChange={(e) => handleInputChange('newPassword', e.target.value)}
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

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Password Requirements:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>8+ characters</li>
          <li>Mix of letters & numbers</li>
          <li>At least 1 special character</li>
        </ul>
      </div>

      <Button 
        onClick={handleResetPassword} 
        className="w-full" 
        disabled={isLoading || formData.newPassword.length < 8}
      >
        {isLoading ? "Updating..." : "Update Password"}
      </Button>
    </div>
  );

  const getStepTitle = () => {
    switch (step) {
      case 'entry': return 'Welcome';
      case 'login': return 'Sign In to Your Account';
      case 'register': return 'Create Your Account';
      case 'forgot-password': return 'Reset Password';
      case 'forgot-username': return 'Recover Username';
      case 'verify-code': return 'Verify Code';
      case 'reset-password': return 'New Password';
      default: return 'Authentication';
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'entry': return renderEntryStep();
      case 'login': return renderLoginStep();
      case 'register': return renderRegisterStep();
      case 'forgot-password': return renderForgotPasswordStep();
      case 'forgot-username': return renderForgotUsernameStep();
      case 'verify-code': return renderVerifyCodeStep();
      case 'reset-password': return renderResetPasswordStep();
      default: return renderEntryStep();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="auth-modal-description">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <div id="auth-modal-description" className="sr-only">
            Authentication modal for creating an account or logging in
          </div>
        </DialogHeader>
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}