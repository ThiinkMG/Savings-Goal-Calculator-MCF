import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Globe, BarChart3, HelpCircle, Download, MessageCircle, BookOpen, FileQuestion, Rocket } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TutorialModal } from "./TutorialModal";
import { FAQModal } from "./FAQModal";
import { ContactSupportModal } from "./ContactSupportModal";
import { ReleaseNotesModal } from "./ReleaseNotesModal";
import JSZip from 'jszip';

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

  const handleDataExport = async () => {
    setIsLoading(true);
    try {
      // Fetch all goals data using localStorage service
      const response = await apiRequest('GET', '/api/savings-goals');
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
          'Created Date'
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
            new Date(goal.createdAt).toLocaleDateString()
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
        pdf.text('My College Finance - Savings Goal Calculator', 20, 290);
        
        // Add PDF to ZIP
        const pdfData = pdf.output('arraybuffer');
        zip.file(`${goal.name.replace(/[^a-z0-9]/gi, '_')}_savings_report.pdf`, pdfData);
      }
      
      // Add summary JSON file
      const summaryData = {
        exportDate: new Date().toISOString(),
        totalGoals: goalsData.length,
        totalTargetAmount: goalsData.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0),
        totalCurrentSavings: goalsData.reduce((sum, goal) => sum + (goal.currentSavings || 0), 0)
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
        description: "Could not generate PDF reports. Please try the CSV export instead.",
        variant: "destructive"
      });
    }
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Globe },
    { id: 'data', label: 'Data', icon: BarChart3 },
    { id: 'help', label: 'Help', icon: HelpCircle }
  ];

  const renderAppearanceSettings = () => {
    return (
      <div className="space-y-4">
        <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <Globe className="w-3.5 h-3.5 text-primary" />
              </div>
              <CardTitle className="text-lg">Theme & Display</CardTitle>
            </div>
            <CardDescription className="text-sm leading-relaxed">
              Customize how the app looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="theme-select" className="text-sm font-medium">Color Theme</Label>
              <Select value={theme} onValueChange={(value) => {
                if (value === 'light' || value === 'dark') {
                  toggleTheme();
                }
              }}>
                <SelectTrigger id="theme-select" className="w-full" data-testid="select-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose between light and dark theme for comfortable viewing
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDataSettings = () => {
    return (
      <div className="space-y-4">
        <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
              </div>
              <CardTitle className="text-lg">Data Management</CardTitle>
            </div>
            <CardDescription className="text-sm leading-relaxed">
              Export and manage your savings data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="export-format" className="text-sm font-medium">Export Format</Label>
              <Select value={downloadFormat} onValueChange={(value) => setDownloadFormat(value as 'csv' | 'pdf-zip')}>
                <SelectTrigger id="export-format" data-testid="select-export-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                  <SelectItem value="pdf-zip">PDF Reports (ZIP)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {downloadFormat === 'csv' 
                  ? 'Export all goals as a CSV file for use in Excel or Google Sheets'
                  : 'Export each goal as a separate PDF report in a ZIP file'
                }
              </p>
            </div>
            
            <Button 
              onClick={handleDataExport}
              disabled={isLoading}
              className="w-full"
              data-testid="button-export-goals"
            >
              <Download className="w-4 h-4 mr-2" />
              {isLoading ? 'Exporting...' : 'Export All Goals'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderHelpSettings = () => {
    return (
      <div className="space-y-4">
        <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
              </div>
              <CardTitle className="text-lg">Help & Support</CardTitle>
            </div>
            <CardDescription className="text-sm leading-relaxed">
              Get help and learn about new features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setShowTutorialModal(true)}
              variant="outline"
              className="w-full justify-start"
              data-testid="button-tutorial"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              View Tutorial
            </Button>
            <Button
              onClick={() => setShowFAQModal(true)}
              variant="outline"
              className="w-full justify-start"
              data-testid="button-faq"
            >
              <FileQuestion className="w-4 h-4 mr-2" />
              FAQ
            </Button>
            <Button
              onClick={() => setShowReleaseNotes(true)}
              variant="outline"
              className="w-full justify-start"
              data-testid="button-release-notes"
            >
              <Rocket className="w-4 h-4 mr-2" />
              What's New
            </Button>
            <Separator />
            <Button
              onClick={() => setShowContactSupport(true)}
              variant="outline"
              className="w-full justify-start"
              data-testid="button-contact-support"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-[540px] p-0 overflow-hidden">
          <SheetHeader className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-card/50 to-background/50">
            <SheetTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Settings
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Manage your preferences
            </SheetDescription>
          </SheetHeader>

          <div className="flex h-[calc(100vh-100px)] overflow-hidden">
            <div className="w-40 border-r border-border/50 bg-muted/20 p-3 flex flex-col">
              <div className="space-y-1 flex-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                      data-testid={`tab-${tab.id}`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-auto pt-3 border-t border-border/30">
                <div className="text-center space-y-1">
                  <div className="text-xs font-semibold text-primary flex items-center justify-center gap-1">
                    <Rocket className="w-3 h-3" />
                    v5.0.0 Beta
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    My College Finance
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'appearance' && renderAppearanceSettings()}
              {activeTab === 'data' && renderDataSettings()}
              {activeTab === 'help' && renderHelpSettings()}
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
