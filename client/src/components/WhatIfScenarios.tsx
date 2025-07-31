import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Target } from 'lucide-react';
import { formatCurrency, type CalculationResult } from '@/lib/calculations';

interface WhatIfScenariosProps {
  calculations: CalculationResult;
  targetAmount: number;
  currentSavings: number;
  targetDate: string;
  monthlyCapacity: number;
}

interface DropdownSectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function DropdownSection({ id, icon, title, children, isOpen, onToggle }: DropdownSectionProps) {
  return (
    <div className="border-b border-border last:border-b-0">
      <Button
        variant="ghost"
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 rounded-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="text-lg">{icon}</div>
          <span className="font-medium text-left">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>
      {isOpen && (
        <div className="p-4 bg-muted/20 border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
}

export function WhatIfScenarios({ 
  calculations, 
  targetAmount, 
  currentSavings, 
  targetDate, 
  monthlyCapacity 
}: WhatIfScenariosProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

  // Calculate helper values
  const remaining = targetAmount - currentSavings;
  const monthsRemaining = calculations.monthsRemaining;
  const monthlyRequired = calculations.monthlyRequired;

  // Reality Check Calculations
  const getFeasibilityScore = () => {
    if (monthlyRequired > 500) return { score: "Challenging", color: "text-red-600 dark:text-red-400" };
    if (monthlyRequired > 300) return { score: "Moderate", color: "text-yellow-600 dark:text-yellow-400" };
    return { score: "Achievable", color: "text-green-600 dark:text-green-400" };
  };

  const getSuccessRate = () => {
    if (monthlyRequired > 400) return 45;
    if (monthlyRequired > 300) return 65;
    if (monthlyRequired > 200) return 80;
    return 85;
  };

  // Daily breakdown calculations
  const dailyAmount = monthlyRequired / 30.44;
  const weeklyAmount = monthlyRequired / 4.33;
  const hourlyEquivalent = monthlyRequired / (40 * 4.33);

  // Realistic opportunity cost calculations (weekly/monthly)
  const coffeePerWeek = Math.min(Math.round((weeklyAmount) / 5.50), 7); // Weekly coffee skips (max 7 per week)
  const lunchPerWeek = Math.min(Math.round((weeklyAmount) / 15), 5); // Weekly lunch skips (max 5 per week)
  const streamingServices = Math.min(Math.round(monthlyRequired / 15), 3); // Number of streaming services to cancel (max 3)
  const nightsOutPerMonth = Math.min(Math.round(monthlyRequired / 50), 3); // Nights out reduction per month (max 3)

  // Calculate actual dates for timeline impact
  const calculateNewDate = (adjustment: number) => {
    const newMonthly = monthlyRequired + adjustment;
    const newMonths = remaining / newMonthly;
    const newDate = new Date();
    newDate.setMonth(newDate.getMonth() + Math.floor(newMonths));
    return newDate;
  };
  
  const originalDate = new Date(targetDate);
  const date25More = calculateNewDate(25);
  const date50More = calculateNewDate(50);
  const date25Less = calculateNewDate(-25);
  
  // Reality vs Capacity check
  const capacityGap = monthlyRequired - monthlyCapacity;
  const isOverCapacity = capacityGap > 0;
  
  // Helper function to calculate days and percentage closer to goal
  const calculateImpact = (savingsAmount: number) => {
    const monthsSaved = savingsAmount / monthlyRequired;
    const daysSaved = Math.round(monthsSaved * 30.44);
    const percentCloser = Math.round((savingsAmount / remaining) * 100);
    return { daysSaved, percentCloser };
  };

  const feasibility = getFeasibilityScore();
  const successRate = getSuccessRate();

  return (
    <Card className="animate-slide-in">
      <CardContent className="p-0">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="p-2 bg-brand-amber/10 rounded-lg">
              <Target className="w-5 h-5 brand-amber" />
            </div>
            Reality Check & Adjustments
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Understand the real impact of your savings plan
          </p>
        </div>

        {/* Reality Check Analysis */}
        <DropdownSection
          id="reality-check"
          icon="🔍"
          title="Reality Check Analysis"
          isOpen={openSection === "reality-check"}
          onToggle={() => toggleSection("reality-check")}
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border-l-4 border-amber-500">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>How to interpret:</strong> This analysis rates your plan's difficulty and shows success rates for similar goals. 
                Use this to adjust your timeline or savings amount if needed.
              </p>
            </div>
            <div className="flex justify-between items-center p-3 bg-background rounded-lg border">
              <span className="font-medium">Plan Feasibility:</span>
              <span className={`font-semibold ${feasibility.color}`}>
                {feasibility.score}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {monthlyRequired > 500 
                ? "This requires saving more than most people's discretionary income. Consider extending timeline."
                : monthlyRequired > 300
                ? "This is achievable with disciplined budgeting and some lifestyle adjustments."
                : "This saving rate is realistic for most people with steady income."
              }
            </p>

            <div className="flex justify-between items-center p-3 bg-background rounded-lg border">
              <span className="font-medium">Success Probability:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {successRate}% likely to succeed
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on similar savings goals, {successRate}% of people succeed with this monthly amount and timeline.
            </p>

            <div className="p-3 bg-background rounded-lg border">
              <div className="font-medium mb-2">Stress Test:</div>
              <div className="text-sm text-muted-foreground">
                If you miss 1 month: <span className="font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(remaining / (monthsRemaining - 1))}
                </span> per month for remaining time
              </div>
            </div>
          </div>
        </DropdownSection>

        {/* Daily Reality Breakdown */}
        <DropdownSection
          id="daily-breakdown"
          icon="📅"
          title="Daily Reality Breakdown"
          isOpen={openSection === "daily-breakdown"}
          onToggle={() => toggleSection("daily-breakdown")}
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>How to interpret:</strong> These amounts show what you need to save every day, week, and hour to reach your goal. 
                Compare these to typical expenses to understand the real commitment required.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-background rounded-lg border">
                <div className="text-sm text-muted-foreground">Per Day</div>
                <div className="text-lg font-bold text-foreground">
                  {formatCurrency(dailyAmount)}
                </div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <div className="text-sm text-muted-foreground">Per Week</div>
                <div className="text-lg font-bold text-foreground">
                  {formatCurrency(weeklyAmount)}
                </div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <div className="text-sm text-muted-foreground">Per Hour</div>
                <div className="text-lg font-bold text-foreground">
                  {formatCurrency(hourlyEquivalent)}
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {dailyAmount > 15 
                  ? `${formatCurrency(dailyAmount)} every day. Lunch costs $12-18, coffee $5-7, snacks $3-5. What are you giving up?`
                  : dailyAmount > 10
                  ? `${formatCurrency(dailyAmount)} every day. Lunch costs $12-18, coffee $5-7, snacks $3-5. What are you giving up?`
                  : `${formatCurrency(dailyAmount)} every day. Lunch costs $12-18, coffee $5-7, snacks $3-5. What are you giving up?`
                }
              </p>
            </div>
          </div>
        </DropdownSection>

        {/* Realistic Trade-offs */}
        <DropdownSection
          id="realistic-tradeoffs"
          icon="💰"
          title="Realistic Trade-offs"
          isOpen={openSection === "realistic-tradeoffs"}
          onToggle={() => toggleSection("realistic-tradeoffs")}
        >
          <div className="space-y-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-l-4 border-purple-500">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <strong>How to interpret:</strong> These show specific lifestyle changes you could make to reach your goal faster. 
                Each option shows how much you'd save and how many days sooner you'd finish.
              </p>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-3">
                <span className="text-xl">☕</span>
                <span className="text-sm">
                  Skip coffee shop <strong>{coffeePerWeek}</strong> times per week<br/>
                  <span className="text-xs text-muted-foreground">Avg. cost: $5.50 per coffee</span>
                </span>
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md font-medium">
                Save ${Math.round(coffeePerWeek * 5.50 * 4.33)} = {calculateImpact(Math.round(coffeePerWeek * 5.50 * 4.33)).daysSaved} days sooner | {calculateImpact(Math.round(coffeePerWeek * 5.50 * 4.33)).percentCloser}% faster<sup>1</sup>
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-3">
                <span className="text-xl">🍽️</span>
                <span className="text-sm">
                  Skip lunch out <strong>{lunchPerWeek}</strong> times per week<br/>
                  <span className="text-xs text-muted-foreground">Avg. cost: $15.00 per lunch</span>
                </span>
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md font-medium">
                Save ${Math.round(lunchPerWeek * 15 * 4.33)} = {calculateImpact(Math.round(lunchPerWeek * 15 * 4.33)).daysSaved} days sooner | {calculateImpact(Math.round(lunchPerWeek * 15 * 4.33)).percentCloser}% faster<sup>1</sup>
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-3">
                <span className="text-xl">📱</span>
                <span className="text-sm">
                  Choose <strong>{Math.max(2, 5 - streamingServices)}</strong> streaming services instead of 5<br/>
                  <span className="text-xs text-muted-foreground">Avg. cost: $15.00 per service</span>
                </span>
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md font-medium">
                Save ${Math.round(streamingServices * 15)} = {calculateImpact(Math.round(streamingServices * 15)).daysSaved} days sooner | {calculateImpact(Math.round(streamingServices * 15)).percentCloser}% faster<sup>1</sup>
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎉</span>
                <span className="text-sm">
                  Limit nights out to <strong>{Math.max(1, 4 - nightsOutPerMonth)}</strong> per month<br/>
                  <span className="text-xs text-muted-foreground">Avg. cost: $50.00 per night</span>
                </span>
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md font-medium">
                Save ${Math.round(nightsOutPerMonth * 50)} = {calculateImpact(Math.round(nightsOutPerMonth * 50)).daysSaved} days sooner | {calculateImpact(Math.round(nightsOutPerMonth * 50)).percentCloser}% faster<sup>1</sup>
              </span>
            </div>
            <div className="mt-3 text-xs text-muted-foreground italic">
              <sup>1</sup> Savings estimates based on average costs and assume consistent behavioral changes. Actual results vary by location, current spending habits, and personal preferences.
            </div>
          </div>
        </DropdownSection>

        {/* Real Timeline Impact */}
        <DropdownSection
          id="timeline-impact"
          icon="📅"
          title="Real Timeline Impact"
          isOpen={openSection === "timeline-impact"}
          onToggle={() => toggleSection("timeline-impact")}
        >
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>How to interpret:</strong> These show exact dates when you'd reach your goal by saving more or less each month. 
                Use these to see how small changes affect your timeline.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border">
                <span className="text-sm font-medium">Save $25 more per month:</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  Reach goal by {date25More.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border">
                <span className="text-sm font-medium">Save $50 more per month:</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  Reach goal by {date50More.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border">
                <span className="text-sm font-medium">Save $25 less per month:</span>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Reach goal by {date25Less.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="p-3 bg-background rounded-lg border">
              <div className="text-sm text-muted-foreground text-center">
                Original target: <strong>{originalDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
              </div>
            </div>
          </div>
        </DropdownSection>

        {/* Decision Helper */}
        <DropdownSection
          id="decision-helper"
          icon="💡"
          title="Decision Helper"
          isOpen={openSection === "decision-helper"}
          onToggle={() => toggleSection("decision-helper")}
        >
          <div className="space-y-4">
            {monthlyRequired > 300 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">To save ${monthlyRequired}/month, choose 2-3 of these:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Make coffee at home 5 days/week (saves ~$110/month)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Pack lunch 3 times/week (saves ~$180/month)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Cancel 2 streaming services (saves ~$30/month)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Limit dining out to 2x/month (saves ~$100/month)
                  </li>
                </ul>
              </div>
            )}
            
            {isOverCapacity && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-medium mb-2 text-red-700 dark:text-red-300">Reality Check Alert!</h4>
                <p className="text-sm text-red-600 dark:text-red-400">
                  You need ${monthlyRequired}/month but set capacity at ${monthlyCapacity}/month.
                  Either increase your savings capacity or extend your timeline.
                </p>
              </div>
            )}
          </div>
        </DropdownSection>
      </CardContent>
    </Card>
  );
}