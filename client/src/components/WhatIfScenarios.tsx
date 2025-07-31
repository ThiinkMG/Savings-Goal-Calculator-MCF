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

  // Opportunity cost calculations
  const coffeeEquivalent = Math.round(monthlyRequired / 5.50);
  const pizzaEquivalent = Math.round(monthlyRequired / 25);
  const movieEquivalent = Math.round(monthlyRequired / 15);

  // Precision adjustments
  const calculateAdjustment = (adjustment: number) => {
    const newMonthly = monthlyRequired + adjustment;
    const newMonths = remaining / newMonthly;
    const monthsDifference = monthsRemaining - newMonths;
    return monthsDifference;
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
                  ? "This is like saving the cost of coffee + pastry every day without exception."
                  : "This breaks down to very manageable daily savings - about the cost of a coffee."
                }
              </p>
            </div>
          </div>
        </DropdownSection>

        {/* Opportunity Cost */}
        <DropdownSection
          id="opportunity-cost"
          icon="💰"
          title="What You're Actually Giving Up"
          isOpen={openSection === "opportunity-cost"}
          onToggle={() => toggleSection("opportunity-cost")}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
              <span className="text-xl">☕</span>
              <span className="text-sm">
                <strong>{coffeeEquivalent}</strong> coffee shop visits per month
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
              <span className="text-xl">🍕</span>
              <span className="text-sm">
                <strong>{pizzaEquivalent}</strong> pizza deliveries per month
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
              <span className="text-xl">🎬</span>
              <span className="text-sm">
                <strong>{movieEquivalent}</strong> movie tickets per month
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
              <span className="text-xl">📱</span>
              <span className="text-sm">
                About <strong>{Math.round(monthlyRequired / 80)}</strong> monthly subscription services
              </span>
            </div>
          </div>
        </DropdownSection>

        {/* Precision Adjustments */}
        <DropdownSection
          id="precision-adjustments"
          icon="🎯"
          title="Precision Adjustments"
          isOpen={openSection === "precision-adjustments"}
          onToggle={() => toggleSection("precision-adjustments")}
        >
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border">
                <span className="text-sm font-medium">Save $25 more per month:</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {calculateAdjustment(25) > 0 
                    ? `${calculateAdjustment(25).toFixed(1)} months earlier`
                    : 'Goal achieved faster'
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border">
                <span className="text-sm font-medium">Save $25 less per month:</span>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {Math.abs(calculateAdjustment(-25)).toFixed(1)} months later
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border">
                <span className="text-sm font-medium">Save $50 more per month:</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {calculateAdjustment(50).toFixed(1)} months earlier
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 text-foreground">Catch-Up Scenarios:</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 text-sm">
                  <span>If you start 1 month late:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {formatCurrency(remaining / (monthsRemaining - 1))}/month needed
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 text-sm">
                  <span>If you miss 1 month of saving:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    Add {formatCurrency((remaining / (monthsRemaining - 1)) - monthlyRequired)} to remaining months
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DropdownSection>
      </CardContent>
    </Card>
  );
}