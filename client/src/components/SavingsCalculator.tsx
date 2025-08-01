import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Calculator, User, DollarSign, Calendar, Target, Download, Share2, Save, X, Edit3, Check, RefreshCw } from 'lucide-react';
import { type SavingsGoal, type GoalType, type InsertSavingsGoal } from '@shared/schema';
import { calculateSavings, formatCurrency, type CalculationResult } from '@/lib/calculations';
import { generateSavingsPlanPDF } from '@/lib/pdfGenerator';
import { useTheme } from '@/contexts/ThemeContext';
import { GoalSelectionCard } from './GoalSelectionCard';
import { ProgressVisualization } from './ProgressVisualization';
import { EducationalTips } from './EducationalTips';
import { WhatIfScenarios } from './WhatIfScenarios';

interface SavingsCalculatorProps {
  existingGoal?: SavingsGoal;
  onSave?: (goal: SavingsGoal) => void;
  onAuthRequired?: () => void;
}

export function SavingsCalculator({ existingGoal, onSave, onAuthRequired }: SavingsCalculatorProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [userName, setUserName] = useState('Student'); // Default user name for PDF
  const [startDate, setStartDate] = useState(
    existingGoal ? new Date(existingGoal.createdAt!).toISOString().split('T')[0] : 
    new Date().toISOString().split('T')[0]
  );
  const [goalType, setGoalType] = useState<GoalType | null>(existingGoal?.goalType as GoalType || null);
  const [goalName, setGoalName] = useState(existingGoal?.name || '');
  const [targetAmount, setTargetAmount] = useState(existingGoal?.targetAmount || 0);
  const [currentSavings, setCurrentSavings] = useState(existingGoal?.currentSavings || 0);
  const [targetDate, setTargetDate] = useState(
    existingGoal ? new Date(existingGoal.targetDate).toISOString().split('T')[0] :
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [monthlyCapacity, setMonthlyCapacity] = useState([existingGoal?.monthlyCapacity || 300]);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualAmount, setManualAmount] = useState('');

  // Calculation state
  const [calculations, setCalculations] = useState<CalculationResult | null>(null);

  // Manual entry functions
  const handleManualEntry = () => {
    setIsManualEntry(true);
    setManualAmount(monthlyCapacity[0].toString());
  };

  const handleManualAmountChange = (value: string) => {
    setManualAmount(value);
  };

  const handleSubmitManualEntry = () => {
    const numValue = parseInt(manualAmount) || 0;
    if (numValue >= 0) {
      setMonthlyCapacity([numValue]);
      setIsManualEntry(false);
    }
  };

  const handleCloseManualEntry = () => {
    setIsManualEntry(false);
    setManualAmount('');
  };

  const handleRecalculate = () => {
    if (targetAmount > 0 && targetDate) {
      const result = calculateSavings(
        targetAmount,
        currentSavings,
        new Date(targetDate),
        monthlyCapacity[0]
      );
      setCalculations(result);
      
      // Force refresh of scenarios data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/calculate-scenarios', targetAmount, currentSavings, targetDate, monthlyCapacity[0]] 
      });
      
      toast({
        title: "Recalculated!",
        description: "Your progress has been updated with the latest values",
      });
    }
  };

  // Calculate scenarios
  const { data: scenarioData } = useQuery({
    queryKey: ['/api/calculate-scenarios', targetAmount, currentSavings, targetDate, monthlyCapacity[0]],
    enabled: targetAmount > 0 && targetDate !== '',
  });

  // Save goal mutation
  const saveGoalMutation = useMutation({
    mutationFn: async (goalData: InsertSavingsGoal) => {
      const url = existingGoal ? `/api/savings-goals/${existingGoal.id}` : '/api/savings-goals';
      const method = existingGoal ? 'PATCH' : 'POST';
      const response = await apiRequest(method, url, goalData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      
      return response.json();
    },
    onSuccess: (savedGoal: SavingsGoal) => {
      toast({
        title: "Success!",
        description: existingGoal ? "Goal updated successfully" : "Goal created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
      onSave?.(savedGoal);
    },
    onError: (error: Error) => {
      console.log('Save goal error:', error.message);
      try {
        const errorData = JSON.parse(error.message);
        console.log('Parsed error data:', errorData);
        
        // Check if this is a guest authentication error
        if (errorData.isGuest || (errorData.message && errorData.message.includes("create an account"))) {
          toast({
            title: "Create Account to Save",
            description: "Sign up to save your goals permanently",
            variant: "default",
          });
          onAuthRequired?.();
          return;
        }
      } catch (e) {
        // Error parsing failed, check if the error message contains guest indicators
        console.log('Error parsing failed, checking raw message:', error.message);
        if (error.message.includes("create an account") || error.message.includes("isGuest")) {
          toast({
            title: "Create Account to Save", 
            description: "Sign up to save your goals permanently",
            variant: "default",
          });
          onAuthRequired?.();
          return;
        }
      }
      
      toast({
        title: "Error",
        description: "Failed to save goal. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update calculations when inputs change
  useEffect(() => {
    if (targetAmount > 0 && targetDate) {
      const result = calculateSavings(
        targetAmount,
        currentSavings,
        new Date(targetDate),
        monthlyCapacity[0]
      );
      setCalculations(result);
    } else {
      setCalculations(null);
    }
  }, [targetAmount, currentSavings, targetDate, monthlyCapacity]);

  const handleQuickAmount = (amount: number) => {
    setTargetAmount(amount);
  };

  const handleSaveGoal = () => {
    if (!goalType || !goalName || targetAmount <= 0 || !targetDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const goalData: InsertSavingsGoal = {
      userId: null, // For now, no user authentication
      name: goalName,
      goalType,
      targetAmount,
      currentSavings,
      targetDate: new Date(targetDate),
      monthlyCapacity: monthlyCapacity[0],
    };

    saveGoalMutation.mutate(goalData);
  };

  const handleExportPDF = async () => {
    if (!goalType || !goalName || !calculations) {
      toast({
        title: "Unable to Export",
        description: "Please complete your goal setup first",
        variant: "destructive",
      });
      return;
    }

    try {
      const goalData: SavingsGoal = {
        id: existingGoal?.id || 'temp-id',
        userId: existingGoal?.userId || null,
        name: goalName,
        goalType,
        targetAmount,
        currentSavings,
        targetDate: new Date(targetDate),
        monthlyCapacity: monthlyCapacity[0],
        isActive: true,
        createdAt: existingGoal?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await generateSavingsPlanPDF(
        goalData,
        { name: userName || 'Student', startDate: new Date(startDate) },
        theme === 'dark'
      );

      toast({
        title: "PDF Generated!",
        description: "Your savings plan has been downloaded",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Export Failed",
        description: `Unable to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!calculations) {
      toast({
        title: "Unable to Share",
        description: "Please complete your goal setup first",
        variant: "destructive",
      });
      return;
    }

    const shareText = `🎯 My Savings Goal: ${goalName}\n💰 Target: ${formatCurrency(targetAmount)}\n📅 Deadline: ${new Date(targetDate).toLocaleDateString()}\n💪 Monthly Required: ${formatCurrency(calculations.monthlyRequired)}\n\nPlanned with My College Finance!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Savings Goal Plan',
          text: shareText,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to Clipboard!",
          description: "Share text has been copied to your clipboard",
        });
      } catch (error) {
        toast({
          title: "Share Failed",
          description: "Unable to share. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main Calculator Form */}
      <div className="lg:col-span-2 space-y-8">
        {/* Personal Information */}
        <Card className="animate-slide-in">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <div className="p-2 bg-brand-blue/10 rounded-lg">
                <User className="w-5 h-5 brand-blue" />
              </div>
              Personal Information
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-300" />
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 mt-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goal Selection */}
        <GoalSelectionCard
          selectedGoal={goalType}
          onGoalSelect={setGoalType}
        />

        {/* Goal Details */}
        <Card className="animate-slide-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <div className="p-2 bg-brand-blue/10 rounded-lg">
                  <Calculator className="w-5 h-5 brand-blue" />
                </div>
                Goal Details
              </h3>
              <Button
                onClick={handleRecalculate}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 hover:bg-brand-blue hover:text-white"
                disabled={!targetAmount || !targetDate}
              >
                <RefreshCw className="w-4 h-4" />
                Recalculate
              </Button>
            </div>
            <div className="space-y-6">
              <div>
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="My Dream Vacation"
                  className="mt-2"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="target-amount">Target Amount</Label>
                  <span className="text-xs text-muted-foreground">Total amount you want to save</span>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-300" />
                  <Input
                    id="target-amount"
                    type="number"
                    value={targetAmount || ''}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    placeholder="10000"
                    min="0"
                    step="100"
                    className="pl-10 mt-2"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  {[1000, 5000, 10000, 25000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(amount)}
                      className="text-xs hover:bg-brand-blue hover:text-white"
                    >
                      ${(amount / 1000).toFixed(0)}K
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="current-savings">Current Savings</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-300" />
                  <Input
                    id="current-savings"
                    type="number"
                    value={currentSavings || ''}
                    onChange={(e) => setCurrentSavings(Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    step="50"
                    className="pl-10 mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="target-date">Target Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-300" />
                  <Input
                    id="target-date"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="pl-10 mt-2"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label htmlFor="monthly-capacity">Monthly Savings Capacity</Label>
                  {!isManualEntry && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleManualEntry}
                      className="text-xs"
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Manual Entry
                    </Button>
                  )}
                </div>
                
                {isManualEntry ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-300" />
                        <Input
                          type="number"
                          value={manualAmount}
                          onChange={(e) => handleManualAmountChange(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSubmitManualEntry();
                            }
                          }}
                          placeholder="Enter amount"
                          min="0"
                          step="50"
                          className="pl-10"
                          autoFocus
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleSubmitManualEntry}
                        size="sm"
                        className="bg-brand-green hover:bg-brand-green/90 text-white px-3"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCloseManualEntry}
                        className="px-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground">
                        Current: <span className="font-medium brand-blue text-lg text-[#3bd927]">
                          ${monthlyCapacity[0]}
                        </span> per month
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <Slider
                      id="monthly-capacity"
                      min={50}
                      max={2000}
                      step={50}
                      value={monthlyCapacity}
                      onValueChange={setMonthlyCapacity}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>$50</span>
                      <span className="font-medium brand-blue text-lg text-[#3bd927]">
                        ${monthlyCapacity[0]}
                      </span>
                      <span>$2000+</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What-If Scenarios */}
        {calculations && (
          <WhatIfScenarios
            calculations={calculations}
            targetAmount={targetAmount}
            currentSavings={currentSavings}
            targetDate={targetDate}
            monthlyCapacity={monthlyCapacity[0]}
          />
        )}
      </div>
      {/* Sidebar - Results & Tips */}
      <div className="space-y-6">
        {/* Progress Visualization */}
        {calculations && (
          <ProgressVisualization
            targetAmount={targetAmount}
            currentSavings={currentSavings}
            monthlyRequired={calculations.monthlyRequired}
            monthsRemaining={calculations.monthsRemaining}
            progressPercent={calculations.progressPercent}
            monthlyCapacity={monthlyCapacity[0]}
          />
        )}

        {/* Educational Tips */}
        {goalType && (
          <EducationalTips selectedGoal={goalType} />
        )}

        {/* Export Options */}
        <Card className="animate-slide-in">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Export Your Plan
            </h3>
            <div className="space-y-3">
              <Button
                onClick={handleExportPDF}
                className="w-full bg-brand-blue hover:bg-brand-blue/90 text-[#030711] dark:text-white"
                disabled={!calculations}
              >
                <Download className="w-4 h-4 mr-2 text-[#030711] dark:text-white" />
                Download PDF Report
              </Button>
              
              <Button
                onClick={handleShare}
                className="w-full bg-brand-green hover:bg-brand-green/90 text-[#030711] dark:text-white"
                disabled={!calculations}
              >
                <Share2 className="w-4 h-4 mr-2 text-[#030711] dark:text-white" />
                Share Savings Plan
              </Button>
              
              <Button
                onClick={handleSaveGoal}
                variant="outline"
                className="w-full hover:bg-muted"
                disabled={saveGoalMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {saveGoalMutation.isPending ? 'Saving...' : (existingGoal ? 'Update Goal' : 'Save as Goal')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
