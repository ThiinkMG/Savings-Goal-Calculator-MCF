import { useState } from "react";
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
import JSZip from 'jszip';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'account' | 'appearance' | 'data' | 'help';

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'json' | 'pdf-zip'>('json');
  
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

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
      
      if (downloadFormat === 'json') {
        // JSON Export with all data
        const exportData = {
          user: user,
          goalsCount: goalsData.length,
          goals: goalsData,
          exportDate: new Date().toISOString(),
          settings: { notificationSettings, languageSettings },
          version: "v4.1.0 (Beta)",
          exportFormat: "JSON",
          notes: "This file contains all your savings goals, progress data, and settings. You can import this data into other financial planning tools or keep it as a backup."
        };
        
        const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
        
        const url = URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-college-finance-complete-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "All Goals Exported Successfully",
          description: `Downloaded ${goalsData.length} goals with complete data and settings as JSON.`
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
              <span className="text-green-600">✓ Active</span>
            </div>
          </div>
        </div>
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
          className="w-full"
        >
          {user ? 'Log Out' : 'Log In'}
        </Button>
      </CardContent>
    </Card>
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Download your savings goals and progress data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Download Format</Label>
            <Select value={downloadFormat} onValueChange={(value) => setDownloadFormat(value as 'json' | 'pdf-zip')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON Data Export</SelectItem>
                <SelectItem value="pdf-zip">PDF Reports (ZIP)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleDataExport} disabled={isLoading} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            {isLoading ? "Exporting..." : "Download All Goals"}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            {downloadFormat === 'json' 
              ? "Downloads all your goals, progress data, and settings as a JSON file" 
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
    </div>
  );

  const renderHelpSettings = () => (
    <div className="space-y-6">
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
          <Button variant="outline" className="w-full" onClick={() => window.open('https://mycollegefinance.com/community', '_blank')}>
            Join Community
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.open('https://twitter.com/mycollegefinance', '_blank')}>
            Follow on Twitter
          </Button>
        </CardContent>
      </Card>
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
        className={`absolute inset-0 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      {/* Settings Panel */}
      <div className={`absolute right-0 top-0 h-full w-96 bg-background border-l shadow-2xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background dark:bg-[#1f1f1f]">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
          <div className="flex flex-col p-2 space-y-1 bg-background dark:bg-[#1f1f1f]">
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
        <div className="flex-1 overflow-y-auto p-4 bg-background dark:bg-[#1f1f1f]">
          {renderTabContent()}
        </div>
      </div>
      
      {/* Enhanced Auth Modal */}
      <EnhancedAuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
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
    </div>
  );
}