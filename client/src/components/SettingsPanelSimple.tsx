import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, User, Globe, Bell, BarChart3, HelpCircle, Download, BookOpen, MessageCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { EnhancedAuthModal } from "./EnhancedAuthModal";
import { TutorialModal } from "./TutorialModal";
import { FAQModal } from "./FAQModal";
import { SecuritySettingsModal } from "./SecuritySettingsModal";
import JSZip from 'jszip';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest?: () => void;
}

type SettingsTab = 'account' | 'appearance' | 'data' | 'help';

export function SettingsPanel({ isOpen, onClose, onContinueAsGuest }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityMode, setSecurityMode] = useState<'password' | 'username' | 'phone' | 'email'>('password');
  const [downloadFormat, setDownloadFormat] = useState<'csv' | 'pdf-zip'>('csv');
  
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

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

  const [languageSettings, setLanguageSettings] = useState({
    language: 'en-US',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'US'
  });

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
        pdf.text('My College Finance - Savings Goal Calculator v4.1.0 (Beta)', 20, 290);
        
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
        version: "v4.1.0 (Beta)"
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

  const renderAccountSettings = () => (
    <div className="h-full overflow-y-auto settings-content-scroll pr-2">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your current account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              if (user) {
                logout(); 
                onClose(); 
              } else {
                setShowAuthModal(true);
              }
            }} 
            variant="outline" 
            className="w-full mt-4"
          >
            {user ? 'Log Out' : 'Log In'}
          </Button>

          {/* Additional spacing for better scrolling */}
          <div className="h-8"></div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose your preferred appearance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Current Theme</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm capitalize">{theme} mode</span>
              <Button onClick={toggleTheme} size="sm" variant="outline">
                Switch to {theme === 'light' ? 'Dark' : 'Light'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language & Region</CardTitle>
          <CardDescription>Customize your regional preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={languageSettings.currency} onValueChange={(value) => setLanguageSettings(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date Format</Label>
            <Select value={languageSettings.dateFormat} onValueChange={(value) => setLanguageSettings(prev => ({ ...prev, dateFormat: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (UK)</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
              </SelectContent>
            </Select>
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
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Download your savings goals and progress data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Download Format</Label>
            <Select value={downloadFormat} onValueChange={(value) => setDownloadFormat(value as 'csv' | 'pdf-zip')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV Data Export</SelectItem>
                <SelectItem value="pdf-zip">PDF Reports (ZIP)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleDataExport} disabled={isLoading} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            {isLoading ? "Exporting..." : "Download All Goals"}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            {downloadFormat === 'csv' 
              ? "Downloads all your goals, progress data, and settings as a CSV file" 
              : "Downloads individual PDF reports for each goal in a ZIP file"}
          </p>
        </CardContent>
      </Card>

      <Card>
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
      <div className="h-8"></div>
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
          <Button variant="outline" className="w-full" onClick={() => setShowTutorialModal(true)}>
            <BookOpen className="w-4 h-4 mr-2" />
            Tutorial
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setShowFAQModal(true)}>
            <MessageCircle className="w-4 h-4 mr-2" />
            FAQ
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLScYaEGpSP3GsvLPWMx4yAk-uckDCG32HqoXYgtzh4npLDPjNw/viewform?usp=sharing&ouid=105426481604057488731', '_blank')}>
            Contact Support
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App Information</CardTitle>
          <CardDescription>Version and update information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Version</span>
            <span className="text-sm text-muted-foreground">v4.1.0 (Beta)</span>
          </div>
          <Button variant="outline" className="w-full" onClick={() => window.open('https://www.mycollegefinance.com/knowledge-bank/categories/oliver-s-nest-update', '_blank')}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Check for Updates
          </Button>
        </CardContent>
      </Card>

      <Card>
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
      <div className="h-8"></div>
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
        className={`absolute right-0 top-0 h-screen w-96 bg-background border-l shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background dark:bg-[#1f1f1f]">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="hover:bg-accent/50 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b bg-background dark:bg-[#1f1f1f]">
          <div className="flex flex-col p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "secondary" : "ghost"}
                  className="justify-start h-10"
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div 
          className="h-[calc(100vh-180px)] p-4 bg-background dark:bg-[#1f1f1f]"
        >
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
    </div>
  );
}