import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calculator, Target, TrendingUp, Download, Share2, Settings, PieChart, Calendar, DollarSign, BookOpen, MessageCircle } from "lucide-react";
import { ContactSupportModal } from "./ContactSupportModal";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFAQ?: () => void;
}

export function TutorialModal({ isOpen, onClose, onOpenFAQ }: TutorialModalProps) {
  const [showContactSupport, setShowContactSupport] = useState(false);
  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-4xl h-[95vh] sm:h-auto sm:max-h-[85vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5 text-brand-blue" />
            How to Use the Savings Goal Calculator
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="px-4 sm:px-6 py-4 h-[calc(95vh-8rem)] sm:h-auto sm:max-h-[70vh]">
          <div className="space-y-8">
            
            {/* Getting Started Section */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Getting Started
              </h3>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Welcome to the Savings Goal Calculator! This tool helps you plan and track your financial goals with precision and ease.
                </p>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium mb-2">Quick Start Guide:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Choose a savings goal type from the visual cards</li>
                    <li>Enter your target amount and timeline</li>
                    <li>Review your personalized savings plan</li>
                    <li>Save your goal to track progress over time</li>
                  </ol>
                </div>
              </div>
            </section>

            <Separator />

            {/* Goal Selection Section */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                Setting Up Your Goals
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-medium mb-2">Goal Types Available:</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Education</Badge>
                        <span>College tuition & fees</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Emergency</Badge>
                        <span>Emergency fund (3-6 months)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Home</Badge>
                        <span>Down payment & moving</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Vacation</Badge>
                        <span>Travel & experiences</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-medium mb-2">Key Inputs:</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span><strong>Target Amount:</strong> Your savings goal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span><strong>Target Date:</strong> When you need the money</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PieChart className="w-4 h-4" />
                        <span><strong>Current Savings:</strong> Money already saved</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span><strong>Monthly Capacity:</strong> How much you can save</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Understanding Results Section */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Understanding Your Results
              </h3>
              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="font-medium mb-3">Key Metrics Explained:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-purple-700 dark:text-purple-300 mb-2">Progress Indicators:</h5>
                      <ul className="space-y-1 text-muted-foreground">
                        <li><strong>Progress Circle:</strong> Visual completion percentage</li>
                        <li><strong>Amount Needed:</strong> Remaining savings required</li>
                        <li><strong>Time Remaining:</strong> Months until target date</li>
                        <li><strong>Monthly Target:</strong> Required monthly savings</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-purple-700 dark:text-purple-300 mb-2">Status Messages:</h5>
                      <ul className="space-y-1 text-muted-foreground">
                        <li><strong>On Track:</strong> Current pace meets your goal</li>
                        <li><strong>Ahead:</strong> You'll reach your goal early</li>
                        <li><strong>Behind:</strong> Need to increase monthly savings</li>
                        <li><strong>Goal Achieved:</strong> Congratulations!</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h4 className="font-medium mb-2 text-amber-700 dark:text-amber-300">What-If Scenarios</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the scenario sliders to explore different saving amounts and see how they affect your timeline. 
                    This helps you find the right balance between your financial capacity and your goals.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Features & Actions Section */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Available Features
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Download className="w-5 h-5 mt-0.5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Download PDF Reports</h4>
                      <p className="text-xs text-muted-foreground">Generate professional savings plan reports for your records</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Share2 className="w-5 h-5 mt-0.5 text-green-600" />
                    <div>
                      <h4 className="font-medium">Share Your Plan</h4>
                      <p className="text-xs text-muted-foreground">Share your savings strategy with family or financial advisors</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Target className="w-5 h-5 mt-0.5 text-purple-600" />
                    <div>
                      <h4 className="font-medium">Multiple Goals</h4>
                      <p className="text-xs text-muted-foreground">Track multiple savings goals simultaneously in your dashboard</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <TrendingUp className="w-5 h-5 mt-0.5 text-orange-600" />
                    <div>
                      <h4 className="font-medium">Progress Tracking</h4>
                      <p className="text-xs text-muted-foreground">Update your current savings to see real-time progress updates</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Tips Section */}
            <section>
              <h3 className="text-lg font-semibold mb-4">💡 Pro Tips</h3>
              <div className="space-y-3">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">For Best Results:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Set realistic monthly savings amounts you can consistently maintain</li>
                    <li>• Review and update your current savings regularly</li>
                    <li>• Use the What-If scenarios to plan for different financial situations</li>
                    <li>• Create an account to save your goals and track progress over time</li>
                    <li>• Consider the educational tips provided for each goal type</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-gray-50 dark:bg-gray-900/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground hidden sm:inline">Need more help?</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  onClose();
                  onOpenFAQ?.();
                }}
                className="h-8"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                FAQ
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowContactSupport(true)}
                className="h-8"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Contact Support
              </Button>
            </div>
            <Button onClick={onClose} className="w-full sm:w-auto">
              Got it!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    <ContactSupportModal
      isOpen={showContactSupport}
      onClose={() => setShowContactSupport(false)}
    />
    </>
  );
}