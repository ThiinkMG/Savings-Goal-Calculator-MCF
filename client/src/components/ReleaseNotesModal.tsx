import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Rocket, Shield, Smartphone, Database, Users, Calculator, ChartBar, FileText, Globe, Settings, Zap } from "lucide-react";

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReleaseNotesModal({ isOpen, onClose }: ReleaseNotesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-4xl h-[95vh] sm:h-auto sm:max-h-[85vh] p-0">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Rocket className="w-5 h-5 text-brand-blue" />
            Release Notes - Version 4.3.0
          </DialogTitle>
          <DialogDescription className="sr-only">
            View the latest updates and features added to the Savings Goal Calculator
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="px-4 sm:px-6 py-4 h-[calc(95vh-8rem)] sm:h-auto sm:max-h-[70vh]">
          <div className="space-y-8">
            
            {/* Latest Release */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Version 4.3.0</h3>
                <Badge variant="default" className="bg-green-600">Latest</Badge>
                <span className="text-sm text-muted-foreground">Released August 2025</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    Mobile Experience Enhancements
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Enter key now navigates between form fields for better mobile keyboard control</li>
                    <li>All modals optimized for mobile with 95% viewport height</li>
                    <li>Solid backgrounds on mobile for better visibility (replaces transparency)</li>
                    <li>Improved touch targets and spacing throughout the app</li>
                    <li>Enhanced authentication modal with larger input fields (h-12)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-purple-600" />
                    User Interface Updates
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>New embedded Contact Support form (no external redirects)</li>
                    <li>Redesigned footer with My College Finance branding</li>
                    <li>Updated settings menu with better organization</li>
                    <li>Improved dropdown menus with solid backgrounds on mobile</li>
                    <li>Enhanced date picker accessibility</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Version 4.2.0 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Version 4.2.0</h3>
                <span className="text-sm text-muted-foreground">Released July 2025</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    Guest User Functionality
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Continue as Guest option for quick access</li>
                    <li>Daily limits: 3 goals and 1 PDF download per day</li>
                    <li>Auto-dismissing welcome popup with 10-second timer</li>
                    <li>Recurring popup system every 10 minutes for non-authenticated users</li>
                    <li>Clear guest status bar showing temporary storage</li>
                    <li>24-hour automatic reset for daily limitations</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <ChartBar className="w-4 h-4 text-green-600" />
                    Reality Check Enhancement
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Always-visible summary cards with real-time updates</li>
                    <li>21-day habit formation plans with progress tracking</li>
                    <li>Dynamic expense categories based on lifestyle patterns</li>
                    <li>Positive reframing options for better motivation</li>
                    <li>Success rate analytics for spending categories</li>
                    <li>Personalized habit tracking with "Day X of 21" indicators</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Version 4.1.0 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Version 4.1.0</h3>
                <span className="text-sm text-muted-foreground">Released June 2025</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    External Integrations
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Wix OAuth authentication with Client ID configuration</li>
                    <li>Google Sheets real-time synchronization</li>
                    <li>SendGrid email notifications for monthly reports</li>
                    <li>Automated user account sync between platforms</li>
                    <li>External database adaptor with payload authentication</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-red-600" />
                    Security Enhancements
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Four-way security updates (password, username, phone, email)</li>
                    <li>6-digit verification codes for password recovery</li>
                    <li>Real-time username availability checking</li>
                    <li>Account lockout protection and rate limiting</li>
                    <li>Remember Login feature with secure localStorage</li>
                    <li>Token-based verification system</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Version 4.0.0 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Version 4.0.0</h3>
                <span className="text-sm text-muted-foreground">Released May 2025</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4 text-teal-600" />
                    Core Features
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Comprehensive savings goal calculator</li>
                    <li>Multi-method authentication (email, phone, username)</li>
                    <li>Progress visualization with circular indicators</li>
                    <li>Milestone tracking for savings goals</li>
                    <li>Auto-populating goal names based on category</li>
                    <li>Enhanced monthly capacity slider with precise controls</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-cyan-600" />
                    Reporting & Export
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>PDF export for savings plan reports</li>
                    <li>CSV data export for Excel compatibility</li>
                    <li>Automated monthly report generation</li>
                    <li>Individual goal management on dashboard</li>
                    <li>Batch export capabilities for all goals</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-gray-600" />
                    Technical Foundation
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>PostgreSQL database with Drizzle ORM</li>
                    <li>Neon Database serverless hosting</li>
                    <li>Session management with PostgreSQL storage</li>
                    <li>React 18 with TypeScript frontend</li>
                    <li>Express.js backend with RESTful API</li>
                    <li>Light/dark theme support with Tailwind CSS</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Coming Soon */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Coming Soon</h3>
                <Badge variant="outline" className="text-blue-600">In Development</Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    Planned Features
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Browser push notifications for goal reminders</li>
                    <li>Advanced analytics dashboard</li>
                    <li>Goal templates and recommendations</li>
                    <li>Social sharing capabilities</li>
                    <li>Multi-currency support</li>
                    <li>Collaborative goal planning</li>
                  </ul>
                </div>
              </div>
            </section>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}