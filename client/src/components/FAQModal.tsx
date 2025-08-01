import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, DollarSign, Shield, Calendar, Download, Settings } from "lucide-react";

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FAQModal({ isOpen, onClose }: FAQModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="w-5 h-5 text-brand-blue" />
            Frequently Asked Questions
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="px-6 py-4 max-h-[70vh]">
          <div className="space-y-6">
            
            {/* Getting Started FAQs */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Getting Started</h3>
              </div>
              
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="account-creation" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Do I need to create an account to use the calculator?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    <p>No, you can use the savings calculator as a guest. However, creating an account allows you to:</p>
                    <ul className="mt-2 ml-4 space-y-1">
                      <li>• Save multiple goals and track progress over time</li>
                      <li>• Access your data across different devices</li>
                      <li>• Generate and download detailed PDF reports</li>
                      <li>• Receive updates on new features and educational content</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="goal-types" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    What types of savings goals can I create?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    <p>You can create goals for various purposes:</p>
                    <div className="mt-2 space-y-2">
                      <div><Badge variant="outline">Education</Badge> College tuition, textbooks, and educational expenses</div>
                      <div><Badge variant="outline">Emergency Fund</Badge> 3-6 months of living expenses for financial security</div>
                      <div><Badge variant="outline">Home</Badge> Down payment, closing costs, and moving expenses</div>
                      <div><Badge variant="outline">Vacation</Badge> Travel, accommodation, and experience costs</div>
                      <div><Badge variant="outline">Car</Badge> Down payment and vehicle-related expenses</div>
                      <div><Badge variant="outline">Retirement</Badge> Long-term retirement savings goals</div>
                      <div><Badge variant="outline">Investment</Badge> Investment opportunities and portfolio building</div>
                      <div><Badge variant="outline">Other</Badge> Custom goals for any savings purpose</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="accuracy" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How accurate are the savings calculations?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    <p>Our calculations are based on simple interest and assume consistent monthly contributions. The results are estimates designed to help with planning. For complex financial planning involving compound interest, investment returns, or tax implications, we recommend consulting with a financial advisor.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>

            {/* Using the Calculator */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">Using the Calculator</h3>
              </div>
              
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="monthly-capacity" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I determine my monthly savings capacity?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    <p>Calculate your monthly savings capacity by:</p>
                    <ol className="mt-2 ml-4 space-y-1 list-decimal">
                      <li>Adding up your monthly income (after taxes)</li>
                      <li>Subtracting all essential expenses (rent, utilities, food, insurance, etc.)</li>
                      <li>Setting aside some money for entertainment and unexpected costs</li>
                      <li>The remaining amount is your potential savings capacity</li>
                    </ol>
                    <p className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                      <strong>Tip:</strong> Start with 80% of your calculated capacity to account for unexpected expenses and maintain sustainability.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="what-if-scenarios" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I use the What-If scenarios feature?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    <p>The What-If scenarios allow you to experiment with different saving amounts:</p>
                    <ul className="mt-2 ml-4 space-y-1">
                      <li>• Use the slider to adjust your monthly savings amount</li>
                      <li>• See how different amounts affect your timeline</li>
                      <li>• Find the optimal balance between savings and timeline</li>
                      <li>• Plan for potential income changes or financial adjustments</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="updating-progress" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How often should I update my current savings?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    <p>We recommend updating your current savings:</p>
                    <ul className="mt-2 ml-4 space-y-1">
                      <li>• Monthly: After making your regular savings contribution</li>
                      <li>• After windfalls: Tax refunds, bonuses, or unexpected income</li>
                      <li>• Quarterly: For a comprehensive review of your progress</li>
                      <li>• When circumstances change: Income changes, expense adjustments</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>

            {/* Features & Reports */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Download className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Features & Reports</h3>
              </div>
              
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="pdf-reports" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    What's included in the PDF reports?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    <p>PDF reports include:</p>
                    <ul className="mt-2 ml-4 space-y-1">
                      <li>• Goal summary with target amount and timeline</li>
                      <li>• Current progress and completion percentage</li>
                      <li>• Monthly savings requirements and recommendations</li>
                      <li>• Visual progress charts and timeline</li>
                      <li>• Educational tips specific to your goal type</li>
                      <li>• Contact information for further assistance</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="multiple-goals" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Can I work on multiple savings goals at the same time?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    <p>Yes! You can create and track multiple goals simultaneously. This allows you to:</p>
                    <ul className="mt-2 ml-4 space-y-1">
                      <li>• Prioritize goals by importance and timeline</li>
                      <li>• Allocate your monthly savings capacity across different goals</li>
                      <li>• Track progress on short-term and long-term objectives</li>
                      <li>• Generate individual reports for each goal</li>
                    </ul>
                    <p className="mt-2 p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                      <strong>Strategy Tip:</strong> Consider prioritizing emergency fund goals before other savings objectives for financial security.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="data-export" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Can I export all my goals data?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    <p>Yes, you can download all your goals and progress data from the Settings panel. The export includes:</p>
                    <ul className="mt-2 ml-4 space-y-1">
                      <li>• All your saved goals with complete details</li>
                      <li>• Progress history and updates</li>
                      <li>• Account settings and preferences</li>
                      <li>• Data in JSON format for easy import to other tools</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>

            {/* Privacy & Security */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold">Privacy & Security</h3>
              </div>
              
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="data-privacy" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How is my financial data protected?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    <p>We take your privacy seriously:</p>
                    <ul className="mt-2 ml-4 space-y-1">
                      <li>• All data is encrypted in transit and at rest</li>
                      <li>• We only store the information you provide</li>
                      <li>• No banking details or sensitive financial information is collected</li>
                      <li>• You can delete your account and data at any time</li>
                      <li>• We never share personal data with third parties</li>
                    </ul>
                    <p className="mt-2">
                      <a href="https://www.mycollegefinance.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Read our full Privacy Policy →
                      </a>
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="guest-mode" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    What happens to my data when using guest mode?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    <p>In guest mode:</p>
                    <ul className="mt-2 ml-4 space-y-1">
                      <li>• Your data is only stored locally in your browser</li>
                      <li>• Information is not saved to our servers</li>
                      <li>• Data will be lost when you clear browser data or cookies</li>
                      <li>• You can create an account at any time to save your progress</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="account-deletion" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How can I delete my account and data?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    <p>To delete your account:</p>
                    <ol className="mt-2 ml-4 space-y-1 list-decimal">
                      <li>Contact our support team using the form in the Help section</li>
                      <li>Request account deletion in your message</li>
                      <li>We'll confirm your identity and process the deletion within 7 business days</li>
                      <li>All your data will be permanently removed from our systems</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>

            {/* Troubleshooting */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Troubleshooting</h3>
              </div>
              
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="browser-issues" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    The calculator isn't working properly. What should I do?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    <p>Try these troubleshooting steps:</p>
                    <ol className="mt-2 ml-4 space-y-1 list-decimal">
                      <li>Refresh the page and try again</li>
                      <li>Clear your browser cache and cookies</li>
                      <li>Try using a different browser (Chrome, Firefox, Safari)</li>
                      <li>Disable browser extensions temporarily</li>
                      <li>Check if you're using a supported browser version</li>
                    </ol>
                    <p className="mt-2">If issues persist, contact our support team with details about your browser and device.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mobile-experience" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Can I use this on my phone or tablet?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    <p>Yes! The calculator is fully responsive and works on:</p>
                    <ul className="mt-2 ml-4 space-y-1">
                      <li>• Smartphones (iPhone, Android)</li>
                      <li>• Tablets (iPad, Android tablets)</li>
                      <li>• Desktop computers and laptops</li>
                      <li>• All modern web browsers</li>
                    </ul>
                    <p className="mt-2">The interface automatically adapts to your screen size for the best experience.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-900/50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Still have questions? Feel free to{' '}
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLScYaEGpSP3GsvLPWMx4yAk-uckDCG32HqoXYgtzh4npLDPjNw/viewform?usp=sharing&ouid=105426481604057488731" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
              >
                contact
              </a>{' '}
              our support team.
            </p>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}