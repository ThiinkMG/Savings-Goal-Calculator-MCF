import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, User, Globe, Bell, BarChart3, HelpCircle, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'account' | 'appearance' | 'notifications' | 'data' | 'help';

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [isLoading, setIsLoading] = useState(false);
  
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const data = {
        user: user,
        exportDate: new Date().toISOString(),
        settings: { notificationSettings, languageSettings }
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-college-finance-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Data Exported",
        description: "Your data has been downloaded successfully."
      });
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

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
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
        <Button onClick={logout} variant="outline" className="w-full">
          Log Out
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
        <CardContent>
          <Button onClick={handleDataExport} disabled={isLoading} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            {isLoading ? "Exporting..." : "Download All Goals"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Review our privacy practices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full" onClick={() => window.open('https://mycollegefinance.com/privacy', '_blank')}>
            View Privacy Policy
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.open('https://mycollegefinance.com/terms', '_blank')}>
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
          <Button variant="outline" className="w-full" onClick={() => toast({ title: "Tutorial", description: "Tutorial feature coming soon!" })}>
            Tutorial
          </Button>
          <Button variant="outline" className="w-full" onClick={() => toast({ title: "FAQ", description: "FAQ section coming soon!" })}>
            FAQ
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.open('mailto:support@mycollegefinance.com', '_blank')}>
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
          <Button variant="outline" className="w-full" onClick={() => toast({ title: "Up to Date", description: "You're running the latest version!" })}>
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
      case 'notifications': return renderNotificationSettings();
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
      />
      
      {/* Settings Panel */}
      <div className={`absolute right-0 top-0 h-full w-96 bg-background border-l shadow-2xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
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
        <div className="flex-1 overflow-y-auto p-4">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}