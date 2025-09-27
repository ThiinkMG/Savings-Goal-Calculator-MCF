import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, Globe, Bell, Download, BookOpen, MessageCircle, Send, HelpCircle as InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { TutorialModal } from "./TutorialModal";
import { FAQModal } from "./FAQModal";
import { ContactSupportModal } from "./ContactSupportModal";
import { ReleaseNotesModal } from "./ReleaseNotesModal";
import { useQuery } from "@tanstack/react-query";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'appearance' | 'data' | 'help';

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [isLoading, setIsLoading] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'csv' | 'pdf-zip'>('csv');
  
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

  // Get all savings goals for export
  const { data: goals = [], isLoading: goalsLoading } = useQuery<any[]>({
    queryKey: ['/api/savings-goals'],
  });

  const downloadGoalsAsCSV = () => {
    if (!goals.length) {
      toast({
        title: "No data to export",
        description: "You don't have any savings goals to export yet.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Goal Type', 'Target Amount', 'Current Savings', 'Target Date', 'Monthly Capacity', 'Status', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...goals.map((goal: any) => [
        `"${goal.goalType || ''}"`,
        goal.targetAmount || 0,
        goal.currentSavings || 0,
        `"${goal.targetDate || ''}"`,
        goal.monthlyCapacity || 0,
        `"${goal.status || ''}"`,
        `"${goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : ''}"`
      ].join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `savings-goals-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Downloaded ${goals.length} savings goals as CSV.`,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300" onClick={onClose} />
      
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-2xl z-50 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-purple-500/5">
            <div>
              <h2 className="text-lg font-semibold">Settings</h2>
              <p className="text-xs text-muted-foreground">Customize your experience</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-destructive/10">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b bg-muted/30">
            {[
              { id: 'appearance', label: 'Appearance', icon: Globe },
              { id: 'data', label: 'Data', icon: Download },
              { id: 'help', label: 'Help', icon: InfoIcon }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as SettingsTab)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'text-primary border-b-2 border-primary bg-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Theme</CardTitle>
                    <CardDescription>Choose your preferred theme</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="theme-mode"
                        checked={theme === 'dark'}
                        onCheckedChange={toggleTheme}
                      />
                      <Label htmlFor="theme-mode">
                        {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notifications</CardTitle>
                    <CardDescription>Manage your notification preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="goal-reminders" className="text-sm">Goal reminders</Label>
                      <Switch
                        id="goal-reminders"
                        checked={notificationSettings.goalReminders}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, goalReminders: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="achievement-alerts" className="text-sm">Achievement alerts</Label>
                      <Switch
                        id="achievement-alerts"
                        checked={notificationSettings.achievementAlerts}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, achievementAlerts: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="browser-notifications" className="text-sm">Browser notifications</Label>
                      <Switch
                        id="browser-notifications"
                        checked={notificationSettings.browserNotifications}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, browserNotifications: checked }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Export Data</CardTitle>
                    <CardDescription>Download your savings goals data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="download-format">Export format</Label>
                      <Select value={downloadFormat} onValueChange={(value: 'csv' | 'pdf-zip') => setDownloadFormat(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                          <SelectItem value="pdf-zip">PDF Reports (ZIP)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={downloadGoalsAsCSV}
                      disabled={isLoading || goalsLoading}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloadFormat === 'csv' ? 'Download CSV' : 'Download PDF ZIP'}
                    </Button>
                    
                    <p className="text-xs text-muted-foreground">
                      {goals.length > 0 
                        ? `Ready to export ${goals.length} savings goal${goals.length === 1 ? '' : 's'}`
                        : 'No savings goals to export yet'
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'help' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Support & Resources</CardTitle>
                    <CardDescription>Get help and learn more</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => setShowTutorialModal(true)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Tutorial & Guide
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => setShowFAQModal(true)}
                    >
                      <InfoIcon className="h-4 w-4 mr-2" />
                      Frequently Asked Questions
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => setShowContactSupport(true)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => setShowReleaseNotes(true)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Release Notes
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
      />

      <FAQModal
        isOpen={showFAQModal}
        onClose={() => setShowFAQModal(false)}
      />

      <ContactSupportModal
        isOpen={showContactSupport}
        onClose={() => setShowContactSupport(false)}
      />

      <ReleaseNotesModal
        isOpen={showReleaseNotes}
        onClose={() => setShowReleaseNotes(false)}
      />
    </>
  );
}