import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Calculator, User, DollarSign, Calendar, Target, Download, Share2, Save, X, Edit3, Check } from 'lucide-react';
import { type SavingsGoal, type GoalType, type InsertSavingsGoal } from '@shared/schema';
import { calculateSavings, formatCurrency, type CalculationResult } from '@/lib/calculations';
import { generateSavingsPlanPDF } from '@/lib/pdfGenerator';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocale } from '@/contexts/LocaleContext';
import { GoalSelectionCard } from './GoalSelectionCard';
import { ProgressVisualization } from './ProgressVisualization';
import { EducationalTips } from './EducationalTips';
import { WhatIfScenarios } from './WhatIfScenarios';

interface SavingsCalculatorProps {
  editingGoalId?: string | null;
  onGoalSaved?: (goal: SavingsGoal) => void;
}

export function SavingsCalculator({ editingGoalId, onGoalSaved }: SavingsCalculatorProps) {
  const { theme } = useTheme();
  const { formatCurrency: formatLocaleCurrency } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get existing goal if editing
  const { data: existingGoal } = useQuery<SavingsGoal>({
    queryKey: ['/api/savings-goals', editingGoalId],
    enabled: !!editingGoalId,
  });

  // Default goal names for each category
  const defaultGoalNames = {
    education: 'College Tuition Fund',
    emergency: 'Emergency Fund (6 months)',
    home: 'House Down Payment',
    vacation: 'Dream Vacation',
    car: 'New Vehicle Fund',
    retirement: 'Retirement Savings',
    investment: 'Investment Portfolio',
    other: 'Custom Savings Goal'
  };

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
  
  // Input validation state
  const [targetAmountError, setTargetAmountError] = useState('');
  const [currentSavingsError, setCurrentSavingsError] = useState('');
  const [goalNameTouched, setGoalNameTouched] = useState(!!existingGoal?.name);

  // Calculation state
  const [calculations, setCalculations] = useState<CalculationResult | null>(null);
  const [selectedTradeOffs, setSelectedTradeOffs] = useState<string[]>([]);

  // Update form when existingGoal changes
  useEffect(() => {
    if (existingGoal) {
      setGoalType(existingGoal.goalType as GoalType);
      setGoalName(existingGoal.name);
      setTargetAmount(existingGoal.targetAmount);
      setCurrentSavings(existingGoal.currentSavings || 0);
      setTargetDate(new Date(existingGoal.targetDate).toISOString().split('T')[0]);
      setMonthlyCapacity([existingGoal.monthlyCapacity]);
      setStartDate(new Date(existingGoal.createdAt!).toISOString().split('T')[0]);
      setGoalNameTouched(true);
    }
  }, [existingGoal]);

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

  // Save goal mutation
  const saveGoalMutation = useMutation({
    mutationFn: async (goalData: InsertSavingsGoal) => {
      if (editingGoalId) {
        return apiRequest('PATCH', `/api/savings-goals/${editingGoalId}`, goalData);
      } else {
        return apiRequest('POST', '/api/savings-goals', goalData);
      }
    },
    onSuccess: async (response) => {
      const savedGoal = await response.json();
      
      toast({
        title: editingGoalId ? "Goal Updated!" : "Goal Saved!",
        description: editingGoalId ? "Your savings goal has been updated successfully." : "Your savings goal has been saved successfully.",
      });
      
      // Force refresh of goals data
      queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
      queryClient.refetchQueries({ queryKey: ['/api/savings-goals'] });
      
      onGoalSaved?.(savedGoal);
    },
    onError: (error: any) => {
      console.error('Error saving goal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-populate goal name when category changes
  useEffect(() => {
    if (goalType && !goalNameTouched) {
      setGoalName(defaultGoalNames[goalType]);
    }
  }, [goalType, goalNameTouched, defaultGoalNames]);

  // Recalculate when inputs change
  useEffect(() => {
    if (targetAmount > 0 && targetDate && monthlyCapacity[0] > 0) {
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

  // Input validation
  const validateTargetAmount = (amount: number) => {
    if (amount <= 0) {
      setTargetAmountError('Target amount must be greater than $0');
      return false;
    }
    if (amount > 10000000) {
      setTargetAmountError('Target amount must be less than $10,000,000');
      return false;
    }
    setTargetAmountError('');
    return true;
  };

  const validateCurrentSavings = (amount: number) => {
    if (amount < 0) {
      setCurrentSavingsError('Current savings cannot be negative');
      return false;
    }
    if (amount >= targetAmount && targetAmount > 0) {
      setCurrentSavingsError('Current savings must be less than target amount');
      return false;
    }
    setCurrentSavingsError('');
    return true;
  };

  // Handle form submission
  const handleSaveGoal = () => {
    if (!goalType || !goalName.trim() || !validateTargetAmount(targetAmount) || !validateCurrentSavings(currentSavings)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    const goalData: InsertSavingsGoal = {
      name: goalName.trim(),
      goalType,
      targetAmount,
      currentSavings,
      targetDate,
      monthlyCapacity: monthlyCapacity[0],
      status: 'active',
    };

    console.log('Saving goal with data:', goalData);
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
      await generateSavingsPlanPDF({
        userName,
        goalName,
        goalType,
        targetAmount,
        currentSavings,
        targetDate,
        monthlyCapacity: monthlyCapacity[0],
        calculations,
        selectedTradeOffs,
        theme
      });

      toast({
        title: "PDF Downloaded!",
        description: "Your savings plan has been downloaded as a PDF.",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Export Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const shareGoal = async () => {
    if (!goalName || !calculations) return;

    const shareText = `Check out my savings goal: ${goalName}! Target: ${formatLocaleCurrency(targetAmount)}, Monthly savings needed: ${formatLocaleCurrency(calculations.monthlyRequired)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My Savings Goal: ${goalName}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard",
        description: "Your savings goal details have been copied!"
      });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Goal Selection */}
      <GoalSelectionCard
        selectedGoal={goalType}
        onGoalSelect={setGoalType}
      />

      {goalType && (
        <>
          {/* Basic Information */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <h3 className="text-lg sm:text-xl font-semibold">Goal Details</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Goal Name */}
                <div className="space-y-2">
                  <Label htmlFor="goal-name" className="text-sm font-medium">Goal Name</Label>
                  <Input
                    id="goal-name"
                    type="text"
                    placeholder="Enter your goal name"
                    value={goalName}
                    onChange={(e) => {
                      setGoalName(e.target.value);
                      setGoalNameTouched(true);
                    }}
                    className="h-10 sm:h-12"
                    data-testid="input-goal-name"
                  />
                </div>

                {/* User Name */}
                <div className="space-y-2">
                  <Label htmlFor="user-name" className="text-sm font-medium">Your Name (for PDF)</Label>
                  <Input
                    id="user-name"
                    type="text"
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="h-10 sm:h-12"
                    data-testid="input-user-name"
                  />
                </div>

                {/* Target Amount */}
                <div className="space-y-2">
                  <Label htmlFor="target-amount" className="text-sm font-medium">Target Amount</Label>
                  <Input
                    id="target-amount"
                    type="number"
                    placeholder="0"
                    value={targetAmount || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setTargetAmount(value);
                      validateTargetAmount(value);
                    }}
                    className={`h-10 sm:h-12 ${targetAmountError ? 'border-destructive' : ''}`}
                    data-testid="input-target-amount"
                  />
                  {targetAmountError && (
                    <p className="text-sm text-destructive">{targetAmountError}</p>
                  )}
                </div>

                {/* Current Savings */}
                <div className="space-y-2">
                  <Label htmlFor="current-savings" className="text-sm font-medium">Current Savings</Label>
                  <Input
                    id="current-savings"
                    type="number"
                    placeholder="0"
                    value={currentSavings || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setCurrentSavings(value);
                      validateCurrentSavings(value);
                    }}
                    className={`h-10 sm:h-12 ${currentSavingsError ? 'border-destructive' : ''}`}
                    data-testid="input-current-savings"
                  />
                  {currentSavingsError && (
                    <p className="text-sm text-destructive">{currentSavingsError}</p>
                  )}
                </div>

                {/* Target Date */}
                <div className="space-y-2">
                  <Label htmlFor="target-date" className="text-sm font-medium">Target Date</Label>
                  <Input
                    id="target-date"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-10 sm:h-12"
                    data-testid="input-target-date"
                  />
                </div>

                {/* Monthly Capacity */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Monthly Savings Capacity</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleManualEntry}
                      className="text-xs"
                      data-testid="button-manual-entry"
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Slider
                      value={monthlyCapacity}
                      onValueChange={setMonthlyCapacity}
                      max={2000}
                      min={50}
                      step={25}
                      className="w-full"
                      data-testid="slider-monthly-capacity"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$50</span>
                      <span className="font-medium text-primary">{formatLocaleCurrency(monthlyCapacity[0])}/month</span>
                      <span>$2,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual Entry Modal */}
          {isManualEntry && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Set Monthly Amount</h3>
                    <Button variant="ghost" size="icon" onClick={handleCloseManualEntry}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="manual-amount">Monthly Savings Amount</Label>
                      <Input
                        id="manual-amount"
                        type="number"
                        value={manualAmount}
                        onChange={(e) => handleManualAmountChange(e.target.value)}
                        placeholder="Enter amount"
                        className="mt-2"
                        autoFocus
                        data-testid="input-manual-amount"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSubmitManualEntry} className="flex-1" data-testid="button-submit-manual">
                        <Check className="w-4 h-4 mr-2" />
                        Set Amount
                      </Button>
                      <Button variant="outline" onClick={handleCloseManualEntry} data-testid="button-cancel-manual">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results */}
          {calculations && (
            <>
              <ProgressVisualization
                targetAmount={targetAmount}
                currentSavings={currentSavings}
                monthlyRequired={calculations.monthlyRequired}
                monthsRemaining={calculations.monthsRemaining}
                progressPercent={calculations.progressPercent}
                monthlyCapacity={monthlyCapacity[0]}
                selectedTradeOffs={selectedTradeOffs}
              />

              <WhatIfScenarios
                calculations={calculations}
                onTradeOffSelect={(tradeOffs) => setSelectedTradeOffs(tradeOffs)}
              />

              <EducationalTips 
                goalType={goalType}
                calculations={calculations}
              />
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <Button
              onClick={handleSaveGoal}
              disabled={saveGoalMutation.isPending || !goalName.trim() || targetAmount <= 0}
              className="flex-1 h-11 sm:h-12 text-base font-medium"
              data-testid="button-save-goal"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {saveGoalMutation.isPending ? 'Saving...' : (editingGoalId ? 'Update Goal' : 'Save Goal')}
            </Button>

            {calculations && (
              <>
                <Button
                  variant="outline"
                  onClick={handleExportPDF}
                  className="flex-1 h-11 sm:h-12 text-base font-medium"
                  data-testid="button-export-pdf"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Export PDF
                </Button>

                <Button
                  variant="outline"
                  onClick={shareGoal}
                  className="flex-1 h-11 sm:h-12 text-base font-medium"
                  data-testid="button-share-goal"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Share Goal
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}