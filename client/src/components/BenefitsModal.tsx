import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Sparkles, Shield, Clock, Target, TrendingUp, Users } from 'lucide-react';

interface BenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount?: () => void;
}

export function BenefitsModal({ isOpen, onClose, onCreateAccount }: BenefitsModalProps) {
  const appBenefits = [
    {
      icon: <Target className="w-5 h-5 text-blue-500" />,
      title: "Smart Goal Planning",
      description: "AI-powered calculations help you create realistic savings plans with personalized monthly targets"
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      title: "Progress Tracking",
      description: "Visual progress indicators and milestone tracking keep you motivated on your savings journey"
    },
    {
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      title: "What-If Scenarios",
      description: "Explore different saving strategies with interactive scenario planning and trade-off analysis"
    },
    {
      icon: <Users className="w-5 h-5 text-orange-500" />,
      title: "Educational Content",
      description: "Learn financial literacy through contextual tips and behavioral psychology insights"
    }
  ];

  const featureComparison = [
    {
      feature: "Create Savings Goals",
      guest: { available: true, limit: "3 per day" },
      account: { available: true, limit: "Unlimited" }
    },
    {
      feature: "PDF Export Reports",
      guest: { available: true, limit: "1 per day" },
      account: { available: true, limit: "Unlimited" }
    },
    {
      feature: "Goal Data Storage",
      guest: { available: true, limit: "24 hours only" },
      account: { available: true, limit: "Permanent" }
    },
    {
      feature: "Progress History",
      guest: { available: false, limit: "Not available" },
      account: { available: true, limit: "Full history" }
    },
    {
      feature: "Email Reports",
      guest: { available: false, limit: "Not available" },
      account: { available: true, limit: "Monthly reports" }
    },
    {
      feature: "Account Security",
      guest: { available: false, limit: "Session only" },
      account: { available: true, limit: "Full protection" }
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center mb-2">
            Welcome to the Savings Goal Calculator! 🎯
          </DialogTitle>
          <p className="text-center text-muted-foreground mb-6">
            Your intelligent companion for achieving financial goals and building healthy money habits
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* App Benefits */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Why Use This Savings Calculator?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appBenefits.map((benefit, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {benefit.icon}
                      <div>
                        <h4 className="font-medium mb-1">{benefit.title}</h4>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Feature Comparison */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              Guest vs Account Benefits
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Feature</th>
                    <th className="text-center p-3 font-medium">
                      <div className="flex flex-col items-center">
                        <Badge variant="outline" className="mb-1">Guest Mode</Badge>
                        <span className="text-xs text-muted-foreground">Try it out</span>
                      </div>
                    </th>
                    <th className="text-center p-3 font-medium">
                      <div className="flex flex-col items-center">
                        <Badge className="mb-1 bg-green-500">Full Account</Badge>
                        <span className="text-xs text-muted-foreground">Maximum value</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((item, index) => (
                    <tr key={index} className="border-b border-muted/20">
                      <td className="p-3 font-medium">{item.feature}</td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {item.guest.available ? (
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-xs text-muted-foreground">{item.guest.limit}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {item.account.available ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-xs text-muted-foreground">{item.account.limit}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg p-6 text-center">
            <h4 className="font-semibold text-lg mb-2">Ready to Unlock Your Financial Potential?</h4>
            <p className="text-muted-foreground mb-4">
              Create a free account to access unlimited features and permanent goal storage
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {onCreateAccount && (
                <Button onClick={onCreateAccount} className="bg-green-600 hover:bg-green-700">
                  <Shield className="w-4 h-4 mr-2" />
                  Create Free Account
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                <Clock className="w-4 h-4 mr-2" />
                Continue as Guest
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}