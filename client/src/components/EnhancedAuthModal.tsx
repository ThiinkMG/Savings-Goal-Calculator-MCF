import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, Check, X, BookOpen, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface EnhancedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWixLogin?: () => void;
  onContinueAsGuest?: () => void;
  onAuthSuccess?: () => void;
}

type AuthStep = 'entry' | 'register' | 'login' | 'forgot-password' | 'forgot-username' | 'verify-code' | 'reset-password';

export function EnhancedAuthModal({ isOpen, onClose, onWixLogin, onContinueAsGuest, onAuthSuccess }: EnhancedAuthModalProps) {
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
  const [oauthState, setOauthState] = useState<string | null>(null);
  const [rememberLogin, setRememberLogin] = useState(true);
  
  const { toast } = useToast();
  const { login } = useAuth();

  // Handle continue as guest
  const handleContinueAsGuestClick = async () => {
    setIsLoading(true);
    try {
      // Call the parent's handler if provided and wait for it to complete
      if (onContinueAsGuest) {
        await onContinueAsGuest();
      }
      
      // Only close the modal after the guest session is successfully created
      // The parent handler will close the modal when ready
    } catch (error) {
      console.error('Error creating guest session:', error);
      toast({
        title: "Error",
        description: "Failed to continue as guest. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load remembered credentials on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('wix_auth_code');
    const authState = urlParams.get('wix_auth_state');
    const authError = urlParams.get('wix_auth_error');
    
    if (authCode && authState) {
      // Handle OAuth callback
      handleOAuthSuccess({ code: authCode, state: authState });
      
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else if (authError) {
      // Handle OAuth error
      toast({
        title: "Authentication Failed",
        description: authError,
        variant: "destructive"
      });
      
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else if (urlParams.get('auth') === 'success') {
      // Legacy auth success
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      window.location.reload();
    }
    
    // Load remembered credentials if enabled - with iframe safety
    let rememberedEnabled = false;
    let rememberedIdentifier = null;
    
    try {
      rememberedEnabled = localStorage.getItem('rememberLoginEnabled') !== 'false';
      rememberedIdentifier = localStorage.getItem('rememberedLoginIdentifier');
    } catch (error) {
      // localStorage blocked in iframe - skip remembered login
      console.log('localStorage access blocked (iframe environment)');
    }
    
    if (rememberedEnabled && rememberedIdentifier && isOpen) {
      setFormData(prev => ({ ...prev, identifier: rememberedIdentifier }));
    }
    
    // Only reset form if we don't have URL parameters to prevent modal reset during guest login
    if (!authCode && !authState && !authError && urlParams.get('auth') !== 'success') {
      // This is a fresh modal opening, ensure clean state
      setStep('entry');
    }
  }, [isOpen]);

  const resetForm = () => {
    // Check if we should preserve the remembered identifier - with iframe safety
    let rememberedEnabled = false;
    let rememberedIdentifier = null;
    
    try {
      rememberedEnabled = localStorage.getItem('rememberLoginEnabled') !== 'false';
      rememberedIdentifier = localStorage.getItem('rememberedLoginIdentifier');
    } catch (error) {
      // localStorage blocked in iframe
      console.log('localStorage access blocked during form reset');
    }
    
    setFormData({
      fullName: '',
      email: '',
      phoneNumber: '',
      username: '',
      password: '',
      confirmPassword: '',
      identifier: (rememberedEnabled && rememberedIdentifier) ? rememberedIdentifier : '',
      code: '',
      resetToken: '',
      newPassword: ''
    });
    setUsernameStatus(null);
    setPasswordStrength(0);
    setStep('entry');
  };

  const handleClose = () => {
    // Don't reset the identifier if remember login is enabled - with iframe safety
    let rememberedEnabled = false;
    let rememberedIdentifier = null;
    
    try {
      rememberedEnabled = localStorage.getItem('rememberLoginEnabled') !== 'false';
      rememberedIdentifier = localStorage.getItem('rememberedLoginIdentifier');
    } catch (error) {
      // localStorage blocked in iframe
      console.log('localStorage access blocked during modal close');
    }
    
    if (rememberedEnabled && rememberedIdentifier) {
      // Reset form but preserve the remembered identifier
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        username: '',
        password: '',
        confirmPassword: '',
        identifier: rememberedIdentifier,
        code: '',
        resetToken: '',
        newPassword: ''
      });
    } else {
      resetForm();
    }
    
    setUsernameStatus(null);
    setPasswordStrength(0);
    setStep('entry');
    setOauthState(null);
    onClose();
  };

  // Generate secure state parameter for OAuth
  const generateSecureState = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // OAuth redirect login handler
  const handleOAuthLogin = async () => {
    setIsLoading(true);
    
    try {
      // Generate secure state parameter and store it
      const state = generateSecureState();
      localStorage.setItem('oauth_state', state);
      localStorage.setItem('oauth_return_url', window.location.href);
      
      // Build OAuth redirect URI
      const redirectUri = `${window.location.origin}/wix-callback.html`;
      
      // Request OAuth URL from our backend
      const authUrlResponse = await fetch('/api/auth/wix-auth-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          state,
          redirectUri
        })
      });
      
      const { authUrl } = await authUrlResponse.json();
      
      // Redirect to Wix OAuth
      toast({
        title: "Redirecting to Wix",
        description: "Taking you to My College Finance login...",
        variant: "default"
      });
      
      // Small delay to show the message, then redirect
      setTimeout(() => {
        window.location.href = authUrl;
      }, 1000);
      
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Login Error",
        description: error instanceof Error ? error.message : "Failed to start authentication",
        variant: "destructive"
      });
    }
  };

  // Handle successful OAuth authentication
  const handleOAuthSuccess = async (authData: any) => {
    try {
      // Verify state parameter
      const storedState = localStorage.getItem('oauth_state');
      if (!storedState || authData.state !== storedState) {
        throw new Error('Invalid state parameter. Possible CSRF attack.');
      }
      
      // Clear the stored state
      localStorage.removeItem('oauth_state');
      
      // Exchange auth code for app token
      const response = await fetch('/api/auth/wix-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({
          code: authData.code,
          state: authData.state,
          redirectUri: `${window.location.origin}/wix-callback.html`
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Store app token
        localStorage.setItem('auth_token', result.token);
        
        // Update app state through login hook
        login(result.user);
        
        // Sync with Google Sheets if available
        try {
          await fetch('/api/sync-google-sheets', { method: 'POST' });
        } catch (error) {
          console.log('Google Sheets sync skipped:', error);
        }
        
        toast({
          title: "Connected Successfully!",
          description: "Your My College Finance account is now connected.",
        });
        
        // Call the success callback if provided
        if (onAuthSuccess) {
          onAuthSuccess();
        }
        handleClose();
      } else {
        throw new Error(result.message || 'Authentication failed');
      }
    } catch (error) {
      handleOAuthError({ message: error instanceof Error ? error.message : 'Authentication failed' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth errors
  const handleOAuthError = (error: any) => {
    setIsLoading(false);
    toast({
      title: "Authentication Failed",
      description: error.message || "Failed to connect with My College Finance",
      variant: "destructive"
    });
  };

  // Handle OAuth cancellation
  const handleOAuthCancelled = () => {
    setIsLoading(false);
    toast({
      title: "Login Cancelled",
      description: "Authentication was cancelled by user.",
      variant: "destructive"
    });
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

      // Save remembered login if enabled
      if (rememberLogin && formData.identifier) {
        localStorage.setItem('rememberedLoginIdentifier', formData.identifier);
      }

      login(data.user);
      // Call the success callback if provided
      if (onAuthSuccess) {
        onAuthSuccess();
      }
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
      // Call the success callback if provided
      if (onAuthSuccess) {
        onAuthSuccess();
      }
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
      {/* Main Website OAuth Login */}
      <div className="space-y-4">
        <Button
          onClick={handleOAuthLogin}
          className="w-full h-12 bg-gray-400 hover:bg-gray-400 text-gray-600 dark:bg-gray-600 dark:text-gray-400 dark:hover:bg-gray-600 font-medium text-base shadow-md cursor-not-allowed transition-all duration-200"
          disabled={true}
          data-testid="button-oauth-login"
        >
          Sign In with My College Finance
        </Button>
        <p className="text-xs text-center text-orange-600 dark:text-orange-400 font-medium px-2">
          Feature coming soon
        </p>
        <p className="text-xs text-center text-muted-foreground px-2">
          Connect with your MyCollegeFinance.com account for full access to courses and premium features
        </p>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground">Or create app account</span>
        </div>
      </div>
      
      {/* App-Only Account Options */}
      <div className="space-y-4">
        <div className="p-4 border border-border rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⚡</span>
            <h4 className="font-medium text-sm">Quick Calculator Account</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Access the savings calculator without a website account
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setStep('login')}
              variant="outline"
              className="h-10 text-sm"
              data-testid="button-app-login"
            >
              Sign In
            </Button>
            <Button
              onClick={() => setStep('register')}
              variant="outline"
              className="h-10 text-sm"
              data-testid="button-app-register"
            >
              Create Account
            </Button>
          </div>
        </div>
        
        {/* Continue as Guest Option */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground">Or</span>
          </div>
        </div>
        
        <div className="p-4 border border-border rounded-lg bg-green-50/50 dark:bg-green-950/20">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
            <h4 className="font-medium text-sm text-green-800 dark:text-green-200">Continue as Guest</h4>
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mb-4 leading-relaxed">
            Start using the savings calculator right away! You can save multiple goals for this session, 
            but your data won't be permanently saved between visits.
          </p>
          <Button
            onClick={handleContinueAsGuestClick}
            variant="outline"
            className="w-full h-10 text-sm border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950/50"
            data-testid="button-continue-guest"
            disabled={isLoading}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            {isLoading ? "Setting up guest session..." : "Continue as Guest"}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderLoginStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="identifier" className="text-sm font-medium">Email, Username, or Phone</Label>
        <Input
          id="identifier"
          type="text"
          placeholder="Enter your email, username, or phone number"
          value={formData.identifier}
          onChange={(e) => handleInputChange('identifier', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              // Move to password field
              const passwordField = document.getElementById('password') as HTMLInputElement;
              if (passwordField) {
                passwordField.focus();
              }
            }
          }}
          className="h-12 text-base"
          autoComplete="username"
          data-testid="input-identifier"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your website password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                // Focus the remember checkbox, then sign in button
                const rememberCheckbox = document.getElementById('remember-login') as HTMLElement;
                if (rememberCheckbox) {
                  rememberCheckbox.focus();
                }
              }
            }}
            className="h-12 text-base pr-12"
            autoComplete="current-password"
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

      <div className="flex items-center space-x-2 mb-4">
        <Checkbox 
          id="remember-login"
          checked={rememberLogin}
          onCheckedChange={(checked) => setRememberLogin(checked === true)}
          data-testid="checkbox-remember-login"
        />
        <Label 
          htmlFor="remember-login" 
          className="text-sm cursor-pointer"
        >
          Remember my login
        </Label>
      </div>

      <Button 
        onClick={handleEnhancedLogin} 
        className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white font-medium" 
        disabled={isLoading}
        data-testid="button-sign-in"
      >
        {isLoading ? "Signing In..." : "Sign In & Sync Account"}
      </Button>

      <div className="flex flex-col sm:flex-row gap-2 justify-center text-center">
        <Button
          variant="link"
          onClick={() => setStep('forgot-password')}
          className="text-sm h-auto p-2"
        >
          Forgot Password
        </Button>
        <Button
          variant="link"
          onClick={() => setStep('forgot-username')}
          className="text-sm h-auto p-2"
        >
          Forgot Username
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              // Move to next field
              const emailField = document.getElementById('email') as HTMLInputElement;
              if (emailField) {
                emailField.focus();
              }
            }
          }}
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              // Move to phone field
              const phoneField = document.getElementById('phoneNumber') as HTMLInputElement;
              if (phoneField) {
                phoneField.focus();
              }
            }
          }}
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              // Move to username field
              const usernameField = document.getElementById('username') as HTMLInputElement;
              if (usernameField) {
                usernameField.focus();
              }
            }
          }}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                // Move to password field in register form
                const registerPasswordField = e.currentTarget.closest('.space-y-4')?.querySelector('#password') as HTMLInputElement;
                if (registerPasswordField) {
                  registerPasswordField.focus();
                }
              }
            }}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                // Move to confirm password field
                const confirmField = document.getElementById('confirmPassword') as HTMLInputElement;
                if (confirmField) {
                  confirmField.focus();
                }
              }
            }}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                // Focus the register button
                const registerButton = e.currentTarget.closest('.space-y-4')?.querySelector('button[type="button"]') as HTMLElement;
                if (registerButton && registerButton.textContent?.includes('Register')) {
                  registerButton.focus();
                }
              }
            }}
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
          onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
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
          onKeyDown={(e) => e.key === 'Enter' && handleForgotUsername()}
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
          onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
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
            onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
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
      <DialogContent className="w-[95vw] max-w-lg mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto" aria-describedby="auth-modal-description">
        <DialogHeader className="text-center space-y-3 pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-blue-600">
            My College Finance
          </DialogTitle>
          <div id="auth-modal-description" className="sr-only">
            Authentication modal for creating an account or logging in
          </div>
          <p className="text-sm text-muted-foreground">
            Connect your account for full access
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {renderStepContent()}
          
          {/* Security badges */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Secure Connection</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Auto Data Sync</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}