import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Target, Info, Coffee, Utensils, DollarSign, Car, ShoppingBag, TrendingUp, Calendar, Clock, Award } from 'lucide-react';
import { formatCurrency, type CalculationResult } from '@/lib/calculations';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WhatIfScenariosProps {
  calculations: CalculationResult;
  targetAmount: number;
  currentSavings: number;
  targetDate: string;
  monthlyCapacity: number;
  selectedTradeOffs?: string[];
  onTradeOffChange?: (tradeOffs: string[]) => void;
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
  const handleClick = () => {
    onToggle();
  };

  return (
    <div className="border-b border-border last:border-b-0">
      <Button
        variant="ghost"
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 rounded-none"
        onClick={handleClick}
        data-testid={`dropdown-${id}`}
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
  monthlyCapacity,
  selectedTradeOffs: propSelectedTradeOffs = [],
  onTradeOffChange
}: WhatIfScenariosProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [selectedTradeOffs, setSelectedTradeOffs] = useState<string[]>(propSelectedTradeOffs);
  
  // Auto-expand decision helper if there's an over-capacity issue (only on first render)
  useEffect(() => {
    const isOverCapacity = calculations.monthlyRequired > monthlyCapacity;
    if (isOverCapacity && openSection === null) {
      setOpenSection("decision-helper");
    }
  }, [calculations.monthlyRequired, monthlyCapacity]);

  const toggleSection = (sectionId: string) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

  const toggleTradeOff = (tradeOffId: string) => {
    const newTradeOffs = selectedTradeOffs.includes(tradeOffId) 
      ? selectedTradeOffs.filter(id => id !== tradeOffId)
      : [...selectedTradeOffs, tradeOffId];
    
    setSelectedTradeOffs(newTradeOffs);
    onTradeOffChange?.(newTradeOffs);
  };

  // Ensure all calculations are reactive to prop changes
  const memoizedCalculations = useMemo(() => {
    console.log('WhatIfScenarios: Recalculating with new props', {
      targetAmount,
      currentSavings,
      monthlyRequired: calculations.monthlyRequired,
      monthsRemaining: calculations.monthsRemaining,
      monthlyCapacity
    });

    // Calculate helper values
    const remaining = targetAmount - currentSavings;
    const monthsRemaining = calculations.monthsRemaining;
    const monthlyRequired = calculations.monthlyRequired;

    // Reality Check Calculations
    const getFeasibilityScore = () => {
      if (monthlyRequired > 500) return { 
        score: "Very Challenging", 
        color: "text-red-600 dark:text-red-400",
        description: "This amount is higher than most people can save"
      };
      if (monthlyRequired > 300) return { 
        score: "Moderately Hard", 
        color: "text-yellow-600 dark:text-yellow-400",
        description: "Doable with some lifestyle changes"
      };
      return { 
        score: "Realistic", 
        color: "text-green-600 dark:text-green-400",
        description: "Most people can manage this amount"
      };
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

    return {
      remaining,
      monthsRemaining,
      monthlyRequired,
      dailyAmount,
      weeklyAmount,
      hourlyEquivalent,
      coffeePerWeek,
      lunchPerWeek,
      streamingServices,
      nightsOutPerMonth,
      originalDate,
      date25More,
      date50More,
      date25Less,
      capacityGap,
      isOverCapacity,
      calculateImpact,
      feasibility,
      successRate
    };
  }, [calculations, targetAmount, currentSavings, targetDate, monthlyCapacity]);

  // Extract values from memoized calculations
  const {
    remaining,
    monthsRemaining,
    monthlyRequired,
    dailyAmount,
    weeklyAmount,
    hourlyEquivalent,
    coffeePerWeek,
    lunchPerWeek,
    streamingServices,
    nightsOutPerMonth,
    originalDate,
    date25More,
    date50More,
    date25Less,
    capacityGap,
    isOverCapacity,
    calculateImpact,
    feasibility,
    successRate
  } = memoizedCalculations;

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
          
          {/* Saver Picks - Show if any selections made */}
          {selectedTradeOffs.length > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h4 className="font-medium text-green-800 dark:text-green-200">Your Saver Picks</h4>
              </div>
              <div className="space-y-2">
                {selectedTradeOffs.includes('coffee') && (
                  <div className="flex justify-between items-center p-2 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                    <span className="text-sm">☕ Make coffee at home</span>
                    <span className="text-xs font-medium text-green-600">+$167/month</span>
                  </div>
                )}
                {selectedTradeOffs.includes('lunch') && (
                  <div className="flex justify-between items-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                    <span className="text-sm">🍽️ Pack lunch</span>
                    <span className="text-xs font-medium text-green-600">+$325/month</span>
                  </div>
                )}
                {selectedTradeOffs.includes('streaming') && (
                  <div className="flex justify-between items-center p-2 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                    <span className="text-sm">📱 Reduce streaming services</span>
                    <span className="text-xs font-medium text-green-600">+$45/month</span>
                  </div>
                )}
                {selectedTradeOffs.includes('nightsout') && (
                  <div className="flex justify-between items-center p-2 bg-pink-100 dark:bg-pink-900/30 rounded-md">
                    <span className="text-sm">🎉 Fewer nights out</span>
                    <span className="text-xs font-medium text-green-600">+$150/month</span>
                  </div>
                )}
                {selectedTradeOffs.includes('transport') && (
                  <div className="flex justify-between items-center p-2 bg-teal-100 dark:bg-teal-900/30 rounded-md">
                    <span className="text-sm">🚗 Walk/bike more</span>
                    <span className="text-xs font-medium text-green-600">+$69/month</span>
                  </div>
                )}
                {selectedTradeOffs.includes('shopping') && (
                  <div className="flex justify-between items-center p-2 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                    <span className="text-sm">🛍️ 24-hour rule</span>
                    <span className="text-xs font-medium text-green-600">+$45/month</span>
                  </div>
                )}
                {selectedTradeOffs.includes('selling') && (
                  <div className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                    <span className="text-sm">📈 Sell unused items</span>
                    <span className="text-xs font-medium text-blue-600">+$150/month</span>
                  </div>
                )}
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800 dark:text-green-200">Total Extra Savings:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      +${selectedTradeOffs.reduce((total, id) => {
                        const amounts = { coffee: 167, lunch: 325, streaming: 45, nightsout: 150, transport: 69, shopping: 45, selling: 150 };
                        return total + (amounts[id as keyof typeof amounts] || 0);
                      }, 0)}/month
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    This could finish your goal {Math.round(selectedTradeOffs.reduce((total, id) => {
                      const amounts = { coffee: 167, lunch: 325, streaming: 45, nightsout: 150, transport: 69, shopping: 45, selling: 150 };
                      return total + (amounts[id as keyof typeof amounts] || 0);
                    }, 0) / monthlyRequired * 30)} days sooner!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Summary - Always Visible */}
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-3 bg-background rounded-lg border cursor-help">
                    <div className="text-xs text-muted-foreground">How Realistic</div>
                    <div className={`text-sm font-semibold ${feasibility.color}`}>
                      {feasibility.score}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{feasibility.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-3 bg-background rounded-lg border cursor-help">
                    <div className="text-xs text-muted-foreground mb-1">Chance of Success</div>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {successRate}%
                      </div>
                      <Progress value={successRate} className="h-1.5" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Based on similar goals, this percentage of people succeed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-3 bg-background rounded-lg border cursor-help">
                    <div className="text-xs text-muted-foreground">Every Day</div>
                    <div className="text-sm font-semibold text-foreground">
                      {formatCurrency(dailyAmount)}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Amount you need to save every single day</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-3 bg-background rounded-lg border cursor-help">
                    <div className="text-xs text-muted-foreground">Every Week</div>
                    <div className="text-sm font-semibold text-foreground">
                      {formatCurrency(weeklyAmount)}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Amount you need to save each week</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Capacity Alert - Always Visible if Over Capacity */}
          {isOverCapacity && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <span className="text-red-600 dark:text-red-400 font-semibold">⚠️ Budget Problem</span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Your goal needs {formatCurrency(monthlyRequired)}/month but you can only afford {formatCurrency(monthlyCapacity)}/month.
                You're short: {formatCurrency(capacityGap)}
              </p>
            </div>
          )}
        </div>

        {/* Reality Check Analysis */}
        <DropdownSection
          id="reality-check"
          icon="🔍"
          title="How Realistic Is This Plan?"
          isOpen={openSection === "reality-check"}
          onToggle={() => toggleSection("reality-check")}
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border-l-4 border-amber-500">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>What this means:</strong> We rate how hard your plan is and show success rates from people with similar goals. 
                If it looks tough, consider saving for longer or adjusting your target amount.
              </p>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-2">
                <span className="font-medium">How Realistic:</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm max-w-xs">Based on typical spending patterns and income levels after paying for necessities</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className={`font-semibold ${feasibility.color}`}>
                {feasibility.score}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {monthlyRequired > 500 
                ? "This amount is more than most people have left over after bills and necessities. You might want a longer timeline."
                : monthlyRequired > 300
                ? "This is doable if you're willing to cut back on some spending and stick to a budget."
                : "This amount should be manageable for most people with steady income."
              }
            </p>

            <div className="p-3 bg-background rounded-lg border">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Chance of Success:</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm max-w-xs">Based on data from people with similar savings goals and monthly amounts</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {successRate}%
                </span>
              </div>
              <Progress value={successRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {successRate >= 70 ? "High chance of success" : successRate >= 50 ? "Moderate chance" : "Challenging but possible"}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Out of 100 people trying to save {formatCurrency(monthlyRequired)} per month, about {successRate} of them reach their goal on time.
            </p>

            <div className="p-3 bg-background rounded-lg border">
              <div className="font-medium mb-2">What if you miss a month?</div>
              <div className="text-sm text-muted-foreground">
                Life happens! If you skip saving for one month, you'd need <span className="font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(remaining / (monthsRemaining - 1))}
                </span> per month for the rest of your timeline
              </div>
            </div>
          </div>
        </DropdownSection>

        {/* Daily Reality Breakdown */}
        <DropdownSection
          id="daily-breakdown"
          icon="📅"
          title="What This Means Every Day"
          isOpen={openSection === "daily-breakdown"}
          onToggle={() => toggleSection("daily-breakdown")}
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>What this means:</strong> Your monthly goal broken down into smaller chunks. 
                Compare these to what you spend on coffee, lunch, or snacks to see what you're committing to.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center p-3 bg-background rounded-lg border cursor-help">
                      <div className="text-sm text-muted-foreground">Every Day</div>
                      <div className="text-lg font-bold text-foreground">
                        {formatCurrency(dailyAmount)}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">Amount to save every single day</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center p-3 bg-background rounded-lg border cursor-help">
                      <div className="text-sm text-muted-foreground">Every Week</div>
                      <div className="text-lg font-bold text-foreground">
                        {formatCurrency(weeklyAmount)}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">Amount to save every week</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center p-3 bg-background rounded-lg border cursor-help">
                      <div className="text-sm text-muted-foreground">Per Work Hour</div>
                      <div className="text-lg font-bold text-foreground">
                        {formatCurrency(hourlyEquivalent)}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm max-w-xs">If you worked 40 hours/week, this is how much per hour of work</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                <strong>Put it in perspective:</strong> {formatCurrency(dailyAmount)} every day equals:
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-md border">
                  <Coffee className="w-4 h-4" />
                  <span className="text-xs font-medium">{Math.round(dailyAmount / 5.5)} coffees</span>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-md border">
                  <Utensils className="w-4 h-4" />
                  <span className="text-xs font-medium">{(dailyAmount / 15).toFixed(1)} lunches</span>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-md border">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-medium">{Math.round(dailyAmount / 3)} snacks</span>
                </div>
              </div>
            </div>
          </div>
        </DropdownSection>

        {/* Realistic Trade-offs */}
        <DropdownSection
          id="realistic-tradeoffs"
          icon="💰"
          title="Choose Savings Boost"
          isOpen={openSection === "realistic-tradeoffs"}
          onToggle={() => toggleSection("realistic-tradeoffs")}
        >
          <div className="space-y-3">
            {/* Personalized Habit Formation Tips */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300">21</span>
                </div>
                <h4 className="font-semibold text-purple-800 dark:text-purple-200">21-Day Habit Formation Plan</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800/50 rounded-md">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm"><strong>Days 1-7:</strong> Focus on one change only (easiest first)</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800/50 rounded-md">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm"><strong>Days 8-14:</strong> Track your wins, expect some slip-ups</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800/50 rounded-md">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm"><strong>Days 15-21:</strong> Habit becomes automatic, add second change</span>
                </div>
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-3 italic">
                🧠 Psychology Tip: Start your day with the new habit for 80% higher success rates
              </p>
            </div>
            <div 
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedTradeOffs.includes('coffee') 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700' 
                  : 'bg-background hover:bg-muted/50'
              }`}
              onClick={() => toggleTradeOff('coffee')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-xl">☕</div>
                <div className="flex-1">
                  <span className="text-sm font-medium">Make coffee at home <strong>7</strong> times per week</span><br/>
                  <span className="text-xs text-muted-foreground">Coffee shop costs about $5.50 each time</span><br/>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md">Moderate</span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">💡 Morning routine change</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md font-medium">
                  Save $167/month
                </span>
                <span className="text-xs text-muted-foreground block">
                  7 days sooner
                </span>
                {selectedTradeOffs.includes('coffee') && (
                  <div className="text-xs font-medium text-green-600 dark:text-green-400">✓ Selected</div>
                )}
              </div>
            </div>
            <div 
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedTradeOffs.includes('lunch') 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700' 
                  : 'bg-background hover:bg-muted/50'
              }`}
              onClick={() => toggleTradeOff('lunch')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xl">🍽️</div>
                <div className="flex-1">
                  <span className="text-sm font-medium">Pack lunch <strong>5</strong> times per week</span><br/>
                  <span className="text-xs text-muted-foreground">Restaurant lunch costs about $15.00 each</span><br/>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md">Moderate</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">🥘 Sunday prep works best</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md font-medium">
                  Save $325/month
                </span>
                <span className="text-xs text-muted-foreground block">
                  14 days sooner
                </span>
                {selectedTradeOffs.includes('lunch') && (
                  <div className="text-xs font-medium text-green-600 dark:text-green-400">✓ Selected</div>
                )}
              </div>
            </div>
            <div 
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedTradeOffs.includes('streaming') 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700' 
                  : 'bg-background hover:bg-muted/50'
              }`}
              onClick={() => toggleTradeOff('streaming')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-xl">📱</div>
                <div className="flex-1">
                  <span className="text-sm font-medium">Keep only <strong>2</strong> streaming services instead of 5</span><br/>
                  <span className="text-xs text-muted-foreground">Most services cost about $15.00 per month</span><br/>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">Easy</span>
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">💻 Check usage first</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md font-medium">
                  Save $45/month
                </span>
                <span className="text-xs text-muted-foreground block">
                  2 days sooner
                </span>
                {selectedTradeOffs.includes('streaming') && (
                  <div className="text-xs font-medium text-green-600 dark:text-green-400">✓ Selected</div>
                )}
              </div>
            </div>
            <div 
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedTradeOffs.includes('nightsout') 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700' 
                  : 'bg-background hover:bg-muted/50'
              }`}
              onClick={() => toggleTradeOff('nightsout')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-xl">🎉</div>
                <span className="text-sm flex-1">
                  Go out <strong>1</strong> times per month instead of 4<br/>
                  <span className="text-xs text-muted-foreground">Nights out typically cost about $50.00 each</span>
                  <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md mt-1 inline-block">
                    Hard
                  </span>
                </span>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md font-medium">
                  Save $150/month
                </span>
                <span className="text-xs text-muted-foreground block">
                  7 days sooner
                </span>
                {selectedTradeOffs.includes('nightsout') && (
                  <div className="text-xs font-medium text-green-600 dark:text-green-400">✓ Selected</div>
                )}
              </div>
            </div>
            {/* Additional Categories */}
            <div 
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedTradeOffs.includes('transport') 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700' 
                  : 'bg-background hover:bg-muted/50'
              }`}
              onClick={() => toggleTradeOff('transport')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <span className="text-sm flex-1">
                  Walk or bike <strong>2</strong> days per week instead of driving<br/>
                  <span className="text-xs text-muted-foreground">Gas + parking costs about $8.00 per trip</span>
                  <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md mt-1 inline-block">
                    Moderate
                  </span>
                </span>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md font-medium">
                  Save $69/month
                </span>
                <span className="text-xs text-muted-foreground block">
                  3 days sooner
                </span>
                {selectedTradeOffs.includes('transport') && (
                  <div className="text-xs font-medium text-green-600 dark:text-green-400">✓ Selected</div>
                )}
              </div>
            </div>

            <div 
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedTradeOffs.includes('shopping') 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700' 
                  : 'bg-background hover:bg-muted/50'
              }`}
              onClick={() => toggleTradeOff('shopping')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-sm flex-1">
                  Wait 24 hours before non-essential purchases over $25<br/>
                  <span className="text-xs text-muted-foreground">Reduces impulse buying by about 60%</span>
                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md mt-1 inline-block">
                    Easy
                  </span>
                </span>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md font-medium">
                  Save $45/month
                </span>
                <span className="text-xs text-muted-foreground block">
                  2 days sooner
                </span>
                {selectedTradeOffs.includes('shopping') && (
                  <div className="text-xs font-medium text-green-600 dark:text-green-400">✓ Selected</div>
                )}
              </div>
            </div>

            <div 
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedTradeOffs.includes('selling') 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700' 
                  : 'bg-background hover:bg-muted/50'
              }`}
              onClick={() => toggleTradeOff('selling')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-sm flex-1">
                  Sell unused items (clothes, electronics, books)<br/>
                  <span className="text-xs text-muted-foreground">One-time boost, average $150 per month for 3 months</span>
                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md mt-1 inline-block">
                    Easy
                  </span>
                </span>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md font-medium">
                  Earn $150/month
                </span>
                <span className="text-xs text-muted-foreground block">
                  7 days sooner
                </span>
                {selectedTradeOffs.includes('selling') && (
                  <div className="text-xs font-medium text-green-600 dark:text-green-400">✓ Selected</div>
                )}
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
              <div className="text-sm font-medium mb-2">Success Strategy:</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>• <strong>Week 1-2:</strong> Start with "Easy" changes (subscriptions, 24-hour rule)</div>
                <div>• <strong>Week 3-4:</strong> Add one "Moderate" habit (coffee or lunch)</div>
                <div>• <strong>Month 2+:</strong> Consider "Hard" changes only if needed</div>
              </div>
            </div>
          </div>
        </DropdownSection>

        {/* Real Timeline Impact */}
        <DropdownSection
          id="timeline-impact"
          icon="📊"
          title="How Small Changes Add Up"
          isOpen={openSection === "timeline-impact"}
          onToggle={() => toggleSection("timeline-impact")}
        >
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">Alternative Strategies</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-white dark:bg-gray-800/50 rounded-md border">
                  <h5 className="font-medium text-sm text-blue-700 dark:text-blue-300 mb-1">Reduce Goal</h5>
                  <p className="text-xs text-muted-foreground">Lower target by 20% = ${Math.round(targetAmount * 0.2).toLocaleString()} less needed</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800/50 rounded-md border">
                  <h5 className="font-medium text-sm text-purple-700 dark:text-purple-300 mb-1">Extend Timeline</h5>
                  <p className="text-xs text-muted-foreground">Add 6 months = ${Math.round((targetAmount - currentSavings) / (monthsRemaining + 6)).toLocaleString()}/month needed</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800/50 rounded-md border">
                  <h5 className="font-medium text-sm text-green-700 dark:text-green-300 mb-1">Hybrid Approach</h5>
                  <p className="text-xs text-muted-foreground">Combine both strategies for balanced progress</p>
                </div>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Smart Strategy:</strong> Start with easy changes, then tackle daily habits. Most successful savers implement 2-3 changes consistently.
              </p>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium">Save $25 more per month</span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
                    {Math.abs(Math.round((date25More.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24)))} days sooner
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Finish by {date25More.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Progress Timeline</span>
                  <span>75% faster</span>
                </div>
                <Progress value={75} className="h-2" />
                <div className="mt-2 text-xs text-muted-foreground">
                  💡 This equals skipping coffee 1x/week or packing lunch 1x/week
                </div>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Award className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium">Save $50 more per month</span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
                    {Math.abs(Math.round((date50More.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24)))} days sooner
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Finish by {date50More.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Progress Timeline</span>
                  <span>90% faster</span>
                </div>
                <Progress value={90} className="h-2" />
                <div className="mt-2 text-xs text-muted-foreground">
                  💡 This equals canceling 3 subscriptions or reducing nights out by 1
                </div>
              </div>
              
              <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-sm font-medium">Save $25 less per month</span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                    {Math.abs(Math.round((date25Less.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24)))} days later
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Delayed to {date25Less.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Progress Timeline</span>
                  <span>40% slower</span>
                </div>
                <Progress value={40} className="h-2" />
                <div className="mt-2 text-xs text-muted-foreground">
                  ⚠️ Small decreases have big timeline impacts - stay consistent!
                </div>
              </div>
            </div>
            
            {/* Implementation Roadmap */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">Step-by-Step Implementation</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300 flex-shrink-0">1</div>
                  <div>
                    <h5 className="font-medium text-sm text-blue-700 dark:text-blue-300">Week 1-2: Quick Wins</h5>
                    <p className="text-xs text-muted-foreground">Cancel unused subscriptions, implement 24-hour rule</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300 flex-shrink-0">2</div>
                  <div>
                    <h5 className="font-medium text-sm text-blue-700 dark:text-blue-300">Week 3-4: Daily Habits</h5>
                    <p className="text-xs text-muted-foreground">Choose one: home coffee OR packed lunches</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300 flex-shrink-0">3</div>
                  <div>
                    <h5 className="font-medium text-sm text-blue-700 dark:text-blue-300">Month 2+: Advanced Changes</h5>
                    <p className="text-xs text-muted-foreground">Add transportation or social spending adjustments only if needed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Positive Reframing & Dynamic Analytics */}
            <div className="mt-4 space-y-3">
              {/* Positive Reframing Options */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🧠</span>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">Mindset Shifts That Work</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">Instead of:</span>
                    <span className="text-gray-600 dark:text-gray-400">"I can't afford coffee out"</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">Think:</span>
                    <span className="text-green-700 dark:text-green-300">"I'm investing in my future dreams"</span>
                  </div>
                  <div className="flex items-start gap-2 mt-3">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">Instead of:</span>
                    <span className="text-gray-600 dark:text-gray-400">"I'm missing out on fun"</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">Think:</span>
                    <span className="text-green-700 dark:text-green-300">"I'm creating financial freedom"</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Expense Categories Based on Lifestyle */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📊</span>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">Your Spending Style</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">🎯</span>
                      <span className="text-sm font-medium">Most Likely to Cut</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entertainment</span>
                        <span className="text-green-600 font-medium">85% success</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subscriptions</span>
                        <span className="text-green-600 font-medium">92% success</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">⚠️</span>
                      <span className="text-sm font-medium">Hardest to Change</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Food & Dining</span>
                        <span className="text-orange-600 font-medium">45% success</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transportation</span>
                        <span className="text-orange-600 font-medium">38% success</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 italic">
                  💡 Based on college student spending patterns and success rates
                </p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
              <div className="text-center mb-4">
                <div className="text-sm text-muted-foreground">Your Current Goal Date</div>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {originalDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              
              {/* Visual Timeline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-green-600 dark:text-green-400">Sooner with more savings</span>
                  <span className="text-red-600 dark:text-red-400">Later with less savings</span>
                </div>
                <div className="relative">
                  <Progress value={60} className="w-full h-3" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  </div>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  Current Plan Position
                </div>
              </div>
              
              {/* Milestone Markers */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <div className="font-medium text-green-700 dark:text-green-300">25% Mark</div>
                  <div className="text-green-600 dark:text-green-400">
                    {new Date(new Date(targetDate).getTime() - (new Date(targetDate).getTime() - new Date().getTime()) * 0.75).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="text-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                  <div className="font-medium text-blue-700 dark:text-blue-300">Halfway</div>
                  <div className="text-blue-600 dark:text-blue-400">
                    {new Date(new Date(targetDate).getTime() - (new Date(targetDate).getTime() - new Date().getTime()) * 0.5).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="text-center p-2 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                  <div className="font-medium text-purple-700 dark:text-purple-300">75% Mark</div>
                  <div className="text-purple-600 dark:text-purple-400">
                    {new Date(new Date(targetDate).getTime() - (new Date(targetDate).getTime() - new Date().getTime()) * 0.25).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DropdownSection>

        {/* Decision Helper */}
        <DropdownSection
          id="decision-helper"
          icon="💡"
          title="Savings Plan Alerts"
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

            {!isOverCapacity && monthlyRequired <= 300 && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium mb-2 text-green-700 dark:text-green-300">Congratulations, you're good to go!</h4>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Your savings plan looks realistic and achievable. Alerts are only displayed when there's an issue or problem with your savings goal.
                </p>
              </div>
            )}
          </div>
        </DropdownSection>
      </CardContent>
    </Card>
  );
}