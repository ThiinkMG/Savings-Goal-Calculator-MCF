import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, User, Globe, Bell, BarChart3, HelpCircle, Download, Trash2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'account' | 'language' | 'notifications' | 'data' | 'help';

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
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

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully."
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully."
      });
      
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description: "Failed to change password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataExport = async () => {
    setIsLoading(true);
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create and download a sample JSON file
      const data = {
        user: user,
        exportDate: new Date().toISOString(),
        goals: [], // Would be populated with actual goal data
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

  const handleAccountDeletion = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      // Simulate account deletion
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted."
      });
      
      logout();
      onClose();
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data', icon: BarChart3 },
    { id: 'help', label: 'Help', icon: HelpCircle }
  ];

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profileData.fullName}
                onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder={user?.fullName || "Enter your name"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={user?.email || "Enter your email"}
              />
            </div>
          </div>
          <Button onClick={handleProfileUpdate} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change your password and security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                value={profileData.currentPassword}
                onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter current password"
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
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              value={profileData.newPassword}
              onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={profileData.confirmPassword}
              onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
            />
          </div>
          <Button onClick={handlePasswordChange} disabled={isLoading}>
            {isLoading ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login Methods</CardTitle>
          <CardDescription>Your available login options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Email Login</span>
              <span className="text-green-600 text-sm">✓ Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Username Login</span>
              <span className="text-green-600 text-sm">✓ Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Phone Login</span>
              <span className="text-muted-foreground text-sm">Not configured</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLanguageSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Language & Region</CardTitle>
          <CardDescription>Customize your language and regional preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={languageSettings.language} onValueChange={(value) => setLanguageSettings(prev => ({ ...prev, language: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
                <SelectItem value="fr-FR">Français</SelectItem>
                <SelectItem value="de-DE">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={languageSettings.currency} onValueChange={(value) => setLanguageSettings(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
                <SelectItem value="AUD">AUD (A$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
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

          <div className="space-y-2">
            <Label htmlFor="numberFormat">Number Format</Label>
            <Select value={languageSettings.numberFormat} onValueChange={(value) => setLanguageSettings(prev => ({ ...prev, numberFormat: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">1,234.56 (US)</SelectItem>
                <SelectItem value="EU">1.234,56 (EU)</SelectItem>
                <SelectItem value="IN">1,23,456.78 (Indian)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose your preferred appearance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Appearance</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
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

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Browser Notifications</Label>
            <p className="text-sm text-muted-foreground">Goal deadline reminders in browser</p>
          </div>
          <Switch
            checked={notificationSettings.browserNotifications}
            onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, browserNotifications: checked }))}
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
          <Button variant="outline" className="w-full" onClick={() => window.open('/privacy', '_blank')}>
            View Privacy Policy
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.open('/terms', '_blank')}>
            Terms of Service
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions that will permanently delete your data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={handleAccountDeletion} 
            disabled={isLoading}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isLoading ? "Deleting..." : "Delete Account"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            ⚠️ This action cannot be undone. All your goals and data will be permanently deleted.
          </p>
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
          <Button variant="outline" className="w-full" onClick={() => window.open('/tutorial', '_blank')}>
            Tutorial
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.open('/faq', '_blank')}>
            FAQ
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.open('/contact', '_blank')}>
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
          <Button variant="outline" className="w-full">
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
          <Button variant="outline" className="w-full" onClick={() => window.open('https://discord.gg/mycollegefinance', '_blank')}>
            Join Discord
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
      case 'language': return renderLanguageSettings();
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