import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, User, Globe, Bell, BarChart3, HelpCircle, Download, BookOpen, MessageCircle, RefreshCw, AlertTriangle, Sparkles, Rocket, HelpCircle as InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";

import { useToast } from "@/hooks/use-toast";
import { EnhancedAuthModal } from "./EnhancedAuthModal";
import { TutorialModal } from "./TutorialModal";
import { FAQModal } from "./FAQModal";
import { SecuritySettingsModal } from "./SecuritySettingsModal";
import { GuestLogoutWarning } from "./GuestLogoutWarning";
import { ContactSupportModal } from "./ContactSupportModal";
import { ReleaseNotesModal } from "./ReleaseNotesModal";
import { useQuery } from "@tanstack/react-query";
import JSZip from 'jszip';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest?: () => void;
  onShowBenefits?: () => void;
}

type SettingsTab = 'account' | 'appearance' | 'data' | 'help';

export function SettingsPanel({ isOpen, onClose, onContinueAsGuest, onShowBenefits }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showGuestLogoutWarning, setShowGuestLogoutWarning] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [securityMode, setSecurityMode] = useState<'password' | 'username' | 'phone' | 'email'>('password');
  const [downloadFormat, setDownloadFormat] = useState<'csv' | 'pdf-zip'>('csv');
  
  const { user, logout, isGuest } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const { toast } = useToast();
  
  // Get guest info for next reset time
  const { data: authData } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Handle Escape key to close panel
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const [notificationSettings, setNotificationSettings] = useState({
    goalReminders: true,
    achievementAlerts: true,
    emailUpdates: false,
    browserNotifications: true
  });

  const [rememberLoginEnabled, setRememberLoginEnabled] = useState(() => {
    return localStorage.getItem('rememberLoginEnabled') !== 'false';
  });

  // Remove local state - will use context instead
  // const [languageSettings, setLanguageSettings] = useState({
  //   language: 'en-US',
  //   currency: 'USD',
  //   dateFormat: 'MM/DD/YYYY',
  //   numberFormat: 'US'
  // });

  const handleSecurityAction = (mode: 'password' | 'username' | 'phone' | 'email' | 'removePhone') => {
    if (!user) {
      // Guest user - show auth modal and close settings panel
      setShowAuthModal(true);
      onClose();
      return;
    }
    
    if (mode === 'removePhone') {
      // Handle phone removal directly with confirmation
      if (window.confirm('Are you sure you want to remove your phone number? This will disable phone-based login.')) {
        removePhoneNumber();
      }
      return;
    }
    
    // Authenticated user - show security modal
    setSecurityMode(mode as 'password' | 'username' | 'phone' | 'email');
    setShowSecurityModal(true);
  };

  const handleRememberLoginToggle = (enabled: boolean) => {
    setRememberLoginEnabled(enabled);
    localStorage.setItem('rememberLoginEnabled', enabled.toString());
    
    // If disabled, remove any stored credentials
    if (!enabled) {
      localStorage.removeItem('rememberedLoginIdentifier');
    }
    
    toast({
      title: "Settings Updated",
      description: enabled 
        ? "Login information will be remembered for faster sign-in" 
        : "Login information will no longer be stored"
    });
  };

  const removePhoneNumber = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/remove-phone', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "Phone Number Removed",
          description: "Your phone number has been removed from your account. Phone-based login is now disabled.",
        });
        // The user data will be refreshed automatically by the auth hook
      } else {
        const data = await response.json();
        toast({
          title: "Failed to Remove Phone",
          description: data.message || "Unable to remove phone number. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Remove phone error:', error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to server. Please check your internet connection.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataExport = async () => {
    // Prevent guest users from accessing data export
    if (isGuest) {
      toast({
        title: "Feature Not Available",
        description: "Data export is not available for guest accounts. Create a free account to access this feature.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch all goals data
      const response = await fetch('/api/savings-goals');
      let goalsData = [];
      
      if (response.ok) {
        goalsData = await response.json();
      }
      
      // Check if there are no goals to export
      if (!goalsData || goalsData.length === 0) {
        toast({
          title: "Nothing to Download",
          description: "You don't have any saved goals yet. Create some goals first, then download your data.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (downloadFormat === 'csv') {
        // CSV Export with all data
        const csvHeader = [
          'Goal Name',
          'Goal Type', 
          'Target Amount',
          'Current Savings',
          'Target Date',
          'Monthly Capacity',
          'Progress (%)',
          'Status',
          'Created Date',
          'Last Updated',
          'User'
        ].join(',');
        
        const csvRows = goalsData.map((goal: any) => {
          const progress = Math.round((goal.currentSavings / goal.targetAmount) * 100);
          const today = new Date();
          const targetDate = new Date(goal.targetDate);
          const isOverdue = targetDate < today && progress < 100;
          const status = progress >= 100 ? 'Complete' : isOverdue ? 'Overdue' : 'Active';
          
          return [
            `"${goal.name}"`,
            goal.goalType,
            goal.targetAmount,
            goal.currentSavings || 0,
            new Date(goal.targetDate).toLocaleDateString(),
            goal.monthlyCapacity || 0,
            progress,
            status,
            new Date(goal.createdAt).toLocaleDateString(),
            goal.updatedAt ? new Date(goal.updatedAt).toLocaleDateString() : '',
            user?.username || 'Guest'
          ].join(',');
        });
        
        const csvContent = [csvHeader, ...csvRows].join('\n');
        
        const csvBlob = new Blob([csvContent], { 
          type: 'text/csv' 
        });
        
        const url = URL.createObjectURL(csvBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-college-finance-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "All Goals Exported Successfully",
          description: `Downloaded ${goalsData.length} goals with complete data as CSV.`
        });
      } else {
        // PDF + ZIP Export
        await generatePDFZipExport(goalsData);
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDFZipExport = async (goalsData: any[]) => {
    try {
      const { jsPDF } = await import('jspdf');
      const zip = new JSZip();
      
      // Generate individual PDF for each goal
      for (let i = 0; i < goalsData.length; i++) {
        const goal = goalsData[i];
        const pdf = new jsPDF();
        
        // PDF styling and content
        pdf.setFontSize(20);
        pdf.setTextColor(25, 118, 210); // Brand blue
        pdf.text('My College Finance', 20, 25);
        
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Savings Goal Report', 20, 40);
        
        // Goal details
        pdf.setFontSize(12);
        pdf.text(`Goal: ${goal.name}`, 20, 60);
        pdf.text(`Type: ${goal.goalType}`, 20, 75);
        pdf.text(`Target Amount: $${goal.targetAmount?.toLocaleString() || '0'}`, 20, 90);
        pdf.text(`Current Savings: $${goal.currentSavings?.toLocaleString() || '0'}`, 20, 105);
        pdf.text(`Target Date: ${new Date(goal.targetDate).toLocaleDateString()}`, 20, 120);
        
        // Progress calculation
        const progressPercent = ((goal.currentSavings || 0) / (goal.targetAmount || 1)) * 100;
        pdf.text(`Progress: ${progressPercent.toFixed(1)}%`, 20, 135);
        
        // Remaining amount
        const remaining = (goal.targetAmount || 0) - (goal.currentSavings || 0);
        pdf.text(`Amount Remaining: $${remaining.toLocaleString()}`, 20, 150);
        
        // Monthly savings needed
        const monthsRemaining = new Date(goal.targetDate).getTime() > new Date().getTime() ? 
          Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;
        const monthlyNeeded = monthsRemaining > 0 ? remaining / monthsRemaining : 0;
        pdf.text(`Monthly Savings Needed: $${monthlyNeeded.toFixed(2)}`, 20, 165);
        
        // Footer
        pdf.setFontSize(10);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 280);
        pdf.text('My College Finance - Savings Goal Calculator v4.2.0 (Beta)', 20, 290);
        
        // Add PDF to ZIP
        const pdfData = pdf.output('arraybuffer');
        zip.file(`${goal.name.replace(/[^a-z0-9]/gi, '_')}_savings_report.pdf`, pdfData);
      }
      
      // Add summary JSON file
      const summaryData = {
        exportDate: new Date().toISOString(),
        totalGoals: goalsData.length,
        totalTargetAmount: goalsData.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0),
        totalCurrentSavings: goalsData.reduce((sum, goal) => sum + (goal.currentSavings || 0), 0),
        user: user?.username || 'Guest',
        version: "v4.2.0 (Beta)"
      };
      zip.file('export_summary.json', JSON.stringify(summaryData, null, 2));
      
      // Generate and download ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-college-finance-pdf-reports-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Reports Generated",
        description: `Downloaded ${goalsData.length} PDF reports in a ZIP file with summary data.`
      });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Could not generate PDF reports. Please try the JSON export instead.",
        variant: "destructive"
      });
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Globe },
    // { id: 'notifications', label: 'Notifications', icon: Bell }, // Hidden until notification system is ready
    { id: 'data', label: 'Data', icon: BarChart3 },
    { id: 'help', label: 'Help', icon: HelpCircle }
  ];

  const renderAccountSettings = () => {
    return (
    <div className="h-full overflow-y-auto settings-content-scroll pr-2">
      <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <CardTitle className="text-lg">
              {user ? 'Account Information' : 'Guest Session'}
            </CardTitle>
          </div>
          <CardDescription className="text-sm leading-relaxed">
            {user 
              ? 'Your current account details and security settings' 
              : 'You\'re using My College Finance as a guest'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {user ? (
            // Authenticated user - show account details and preferences
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Username</span>
                  <span className="text-sm text-muted-foreground">{user?.username || 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Email</span>
                  <span className="text-sm text-muted-foreground">{user?.email || 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Phone</span>
                  <span className="text-sm text-muted-foreground">{user?.phoneNumber || 'Not set'}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Login Preferences</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="remember-login-setting" className="text-sm">Remember my login</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoIcon className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-48">Stores your username/email for faster login. Password is never stored.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xs text-muted-foreground">Automatically fill your username/email at login</p>
                  </div>
                  <Switch
                    id="remember-login-setting"
                    checked={rememberLoginEnabled}
                    onCheckedChange={handleRememberLoginToggle}
                    data-testid="switch-remember-login"
                  />
                </div>
              </div>
            </>
          ) : (
            // Not authenticated - show blue button with correct text based on guest state
            <div className="space-y-4">
              <div className="p-5 border border-blue-200/50 rounded-xl bg-gradient-to-br from-blue-50/80 via-blue-50/40 to-transparent dark:from-blue-950/40 dark:via-blue-950/20 dark:to-transparent backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                    {isGuest ? 'Guest Session Active' : 'Quick Access'}
                  </h4>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4 leading-relaxed">
                  {isGuest 
                    ? 'Your savings goals are stored temporarily for this session only. Create an account to save your progress permanently.'
                    : 'Start using the savings calculator right away! You can save multiple goals for this session.'
                  }
                </p>
                <Button
                  onClick={() => {
                    if (isGuest) {
                      // Guest wants to create account - show auth modal
                      setShowAuthModal(true);
                      onClose();
                    } else {
                      // Not guest, not signed in - continue as guest
                      if (onContinueAsGuest) {
                        onContinueAsGuest();
                      }
                      onClose();
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200"
                >
                  <User className="w-4 h-4 mr-2" />
                  {isGuest ? 'Create Free Account' : 'Continue as Guest'}
                </Button>
              </div>
            </div>
          )}
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Login Methods</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Username Login</span>
                <span className="text-green-600">✓ Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Email Login</span>
                <span className={user?.email ? "text-green-600" : "text-gray-400"}>
                  {user?.email ? "✓ Active" : "○ Inactive"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Phone Login</span>
                <span className={user?.phoneNumber ? "text-green-600" : "text-gray-400"}>
                  {user?.phoneNumber ? "✓ Active" : "○ Inactive"}
                </span>
              </div>
            </div>
          </div>
          {user && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <h4 className="font-medium text-sm mb-3">Security & Access</h4>
                <div className="space-y-2">
                  <Button 
                    onClick={() => handleSecurityAction('password')}
                    variant="outline" 
                    size="sm"
                    className="w-full justify-start"
                  >
                    Change Password
                  </Button>
                  <Button 
                    onClick={() => handleSecurityAction('username')}
                    variant="outline" 
                    size="sm"
                    className="w-full justify-start"
                  >
                    Update Username
                  </Button>
                  <div className="space-y-1">
                    <Button 
                      onClick={() => handleSecurityAction('phone')}
                      variant="outline" 
                      size="sm"
                      className="w-full justify-start"
                    >
                      Update Phone Number
                    </Button>
                    {user.phoneNumber && (
                      <Button 
                        onClick={() => handleSecurityAction('removePhone')}
                        variant="outline" 
                        size="sm"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        Remove Phone Number
                      </Button>
                    )}
                  </div>
                  <Button 
                    onClick={() => handleSecurityAction('email')}
                    variant="outline" 
                    size="sm"
                    className="w-full justify-start"
                  >
                    Update Email Address
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-3">Active Login Methods</h4>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">✓ Username</span>
                  {user.email && <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">✓ Email</span>}
                  {user.phoneNumber && <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">✓ Phone</span>}
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={() => { 
              if (isGuest) {
                // Show warning for guest users
                setShowGuestLogoutWarning(true);
              } else if (user) {
                // For authenticated users, logout directly
                onClose(); // Close modal first
                logout(); // Then logout (which will reload the page)
              } else {
                // For non-authenticated, non-guest users, show login modal
                setShowAuthModal(true);
                onClose();
              }
            }} 
            variant="outline" 
            className="w-full mt-4 border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 font-medium"
          >
            {(user || isGuest) ? 'Log Out' : 'Log In'}
          </Button>

          {/* Additional spacing for better scrolling */}
          <div className="h-20"></div>
        </CardContent>
      </Card>
      
      {/* Extra bottom padding for account section */}
      <div className="h-16 pb-8"></div>
    </div>
  );
  };

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-primary" />
            </div>
            <CardTitle className="text-lg">Theme</CardTitle>
          </div>
          <CardDescription className="text-sm leading-relaxed">Choose your preferred appearance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-gradient-to-r from-muted/30 to-transparent">
              <div className="space-y-0.5">
                <Label className="font-medium">Current Theme</Label>
                <p className="text-sm text-muted-foreground capitalize">{theme} mode</p>
              </div>
              <Button 
                onClick={toggleTheme} 
                variant="outline" 
                className="border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 font-medium"
              >
                Switch to {theme === 'light' ? 'Dark' : 'Light'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );

  const renderNotificationSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Control when and how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Goal Reminders</Label>
            <p className="text-sm text-muted-foreground">Monthly progress check notifications</p>
          </div>
          <Switch
            checked={notificationSettings.goalReminders}
            onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, goalReminders: checked }))}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Achievement Alerts</Label>
            <p className="text-sm text-muted-foreground">Celebrate milestone achievements</p>
          </div>
          <Switch
            checked={notificationSettings.achievementAlerts}
            onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, achievementAlerts: checked }))}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Updates</Label>
            <p className="text-sm text-muted-foreground">Weekly summary emails</p>
          </div>
          <Switch
            checked={notificationSettings.emailUpdates}
            onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailUpdates: checked }))}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderDataSettings = () => (
    <div className="space-y-6 h-full overflow-y-auto settings-content-scroll pr-2">
      <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
            </div>
            <CardTitle className="text-lg">Data Export</CardTitle>
          </div>
          <CardDescription className="text-sm leading-relaxed">Download your savings goals and progress data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isGuest ? (
            // Guest user limitation message
            <div className="p-4 border border-amber-200/50 rounded-xl bg-gradient-to-br from-amber-50/80 via-amber-50/40 to-transparent dark:from-amber-950/40 dark:via-amber-950/20 dark:to-transparent backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                  Guest Account Limitation
                </h4>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-4 leading-relaxed">
                Data export is not available for guest accounts. Your goals are stored temporarily for this session only. 
                Create a free account to access data export features and save your progress permanently.
              </p>
              <Button
                onClick={() => {
                  setShowAuthModal(true);
                  onClose();
                }}
                variant="outline"
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/50"
              >
                <User className="w-4 h-4 mr-2" />
                Create Free Account
              </Button>
            </div>
          ) : (
            // Regular user data export
            <>
              <div className="space-y-3">
                <Label className="font-medium">Download Format</Label>
                <Select value={downloadFormat} onValueChange={(value) => setDownloadFormat(value as 'csv' | 'pdf-zip')}>
                  <SelectTrigger className="border-border/40 hover:border-primary/30 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV Data Export</SelectItem>
                    <SelectItem value="pdf-zip">PDF Reports (ZIP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleDataExport} 
                disabled={isLoading} 
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 font-medium relative overflow-hidden"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download All Goals
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                {downloadFormat === 'csv' 
                  ? "Downloads all your goals, progress data, and settings as a CSV file" 
                  : "Downloads individual PDF reports for each goal in a ZIP file"}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Review our privacy practices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full" onClick={() => window.open('https://www.mycollegefinance.com/privacy-policy', '_blank')}>
            View Privacy Policy
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.open('https://www.mycollegefinance.com/terms-policy', '_blank')}>
            Terms of Service
          </Button>
        </CardContent>
      </Card>

      {/* Additional spacing for better scrolling */}
      <div className="h-32 pb-12"></div>
    </div>
  );

  const renderHelpSettings = () => (
    <div className="space-y-6 h-full overflow-y-auto settings-content-scroll pr-2">
      <Card>
        <CardHeader>
          <CardTitle>Getting Help</CardTitle>
          <CardDescription>Find answers and get support</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full" onClick={onShowBenefits}>
            <Sparkles className="w-4 h-4 mr-2" />
            Benefits
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setShowTutorialModal(true)}>
            <BookOpen className="w-4 h-4 mr-2" />
            Tutorial
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setShowFAQModal(true)}>
            <MessageCircle className="w-4 h-4 mr-2" />
            FAQ
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setShowContactSupport(true)}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setShowReleaseNotes(true)}>
            <Rocket className="w-4 h-4 mr-2" />
            Release Notes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App Information</CardTitle>
          <CardDescription>Version and My College Finance resources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Version</span>
            <span className="text-sm text-muted-foreground">v4.3.0 (Beta)</span>
          </div>
          <Button variant="outline" className="w-full" onClick={() => window.open('https://www.mycollegefinance.com/knowledge-bank/categories/oliver-s-nest-update', '_blank')}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Announcements
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Community</CardTitle>
          <CardDescription>Connect with other users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full" onClick={() => window.open('https://linktr.ee/mycollegefinance', '_blank')}>
            Join Community
          </Button>
        </CardContent>
      </Card>

      {/* Additional spacing for better scrolling */}
      <div className="h-32 pb-8"></div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account': return renderAccountSettings();
      case 'appearance': return renderAppearanceSettings();
      // case 'notifications': return renderNotificationSettings(); // Hidden until notification system is ready
      case 'data': return renderDataSettings();
      case 'help': return renderHelpSettings();
      default: return renderAccountSettings();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-label="Close settings panel"
      />
      {/* Settings Panel */}
      <div 
        className={`absolute right-0 top-0 h-screen w-full sm:w-[420px] lg:w-[460px] bg-background sm:bg-gradient-to-b sm:from-background sm:to-background/95 border-l border-border/50 shadow-2xl sm:backdrop-blur-md transform transition-all duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/30 bg-primary/5 sm:bg-gradient-to-r sm:from-primary/5 sm:to-transparent sm:backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="w-8 h-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border/30 bg-muted/40 sm:bg-muted/20">
          <div className="flex flex-col p-3 space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant="ghost"
                  className={`justify-start h-11 px-4 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "hover:bg-accent/60 hover:translate-x-1"
                  }`}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                >
                  <div className={`w-5 h-5 mr-3 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                    <Icon className="w-full h-full" />
                  </div>
                  <span className="font-medium">{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-160px)] overflow-y-auto overscroll-contain px-4 py-2 space-y-4 custom-scrollbar">
          {renderTabContent()}
        </div>
      </div>
      
      {/* Enhanced Auth Modal */}
      <EnhancedAuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onContinueAsGuest={onContinueAsGuest}
      />
      
      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        onOpenFAQ={() => {
          setShowTutorialModal(false);
          setShowFAQModal(true);
        }}
      />
      
      {/* FAQ Modal */}
      <FAQModal
        isOpen={showFAQModal}
        onClose={() => setShowFAQModal(false)}
      />
      
      {/* Security Settings Modal */}
      <SecuritySettingsModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        initialMode={securityMode}
      />
      
      {/* Guest Logout Warning */}
      <GuestLogoutWarning
        isOpen={showGuestLogoutWarning}
        onClose={() => setShowGuestLogoutWarning(false)}
        onConfirmLogout={() => {
          setShowGuestLogoutWarning(false);
          onClose();
          logout();
        }}
        nextResetTime={(authData as any)?.guestInfo?.nextResetTime ? new Date((authData as any).guestInfo.nextResetTime) : undefined}
      />
      
      {/* Contact Support Modal */}
      <ContactSupportModal
        isOpen={showContactSupport}
        onClose={() => setShowContactSupport(false)}
      />
      
      {/* Release Notes Modal */}
      <ReleaseNotesModal
        isOpen={showReleaseNotes}
        onClose={() => setShowReleaseNotes(false)}
      />
    </div>
  );
}