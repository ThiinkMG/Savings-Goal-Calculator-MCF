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
import { useAuth } from '@/hooks/useAuth';
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
  const { formatCurrency: formatLocaleCurrency } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isGuest } = useAuth();

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
      // Show appropriate success message based on user type
      if (isGuest) {
        toast({
          title: "Goal Saved for Session!",
          description: "Your goal is saved temporarily. Create an account to save permanently.",
          variant: "default",
        });
      } else {
        toast({
          title: "Goal Saved Successfully!",
          description: existingGoal ? "Your goal has been updated" : "Your new goal has been created",
        });
      }
      
      // Force refresh of goals data and auth data (to update guest counters)
      queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
      queryClient.refetchQueries({ queryKey: ['/api/savings-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.refetchQueries({ queryKey: ['/api/auth/me'] });
      
      onSave?.(savedGoal);
    },
    onError: (error: Error) => {
      console.log('Save goal error:', error.message);
      
      // Try to parse JSON error response (remove HTTP status prefix if present)
      try {
        const cleanMessage = error.message.replace(/^\d+:\s*/, ''); // Remove "429: " or "401: " prefix
        const errorData = JSON.parse(cleanMessage);
        console.log('Parsed error data:', errorData);
        
        // Check for daily limit exceeded (429 status)
        if (error.message.startsWith('429:') || errorData.dailyLimit) {
          toast({
            title: "Daily Limit Reached",
            description: "You've reached your daily limit of 3 plans. Create an account for unlimited plans!",
            variant: "destructive",
          });
          onAuthRequired?.();
          return;
        }
        
        // Check if the error is for guest authentication
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
        // JSON parsing failed, check for text-based indicators
        if (error.message.includes("Daily limit reached") || error.message.includes("create an account") || error.message.includes("isGuest")) {
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

  // Auto-populate goal name when goal type changes
  const handleGoalTypeSelect = (newGoalType: GoalType) => {
    setGoalType(newGoalType);
    
    // Auto-update name if field is empty OR user hasn't manually edited it
    if (!goalNameTouched || goalName.trim() === '') {
      setGoalName(defaultGoalNames[newGoalType]);
      setGoalNameTouched(false); // Reset touched state when auto-populating
    }
  };

  const handleQuickAmount = (amount: number) => {
    setTargetAmount(amount);
    setTargetAmountError('');
  };

  // Enhanced input validation
  const validateTargetAmount = (value: string) => {
    const numValue = Number(value);
    if (value === '' || isNaN(numValue)) {
      setTargetAmountError('Please enter a valid amount');
      return false;
    }
    if (numValue <= 0) {
      setTargetAmountError('Target amount must be greater than $0');
      return false;
    }
    if (numValue > 10000000) {
      setTargetAmountError('Target amount seems unrealistic. Please enter a reasonable goal.');
      return false;
    }
    setTargetAmountError('');
    return true;
  };

  const validateCurrentSavings = (value: string) => {
    const numValue = Number(value);
    if (value !== '' && (isNaN(numValue) || numValue < 0)) {
      setCurrentSavingsError('Current savings cannot be negative');
      return false;
    }
    if (numValue > targetAmount && targetAmount > 0) {
      setCurrentSavingsError('Current savings cannot exceed target amount');
      return false;
    }
    setCurrentSavingsError('');
    return true;
  };

  const handleTargetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTargetAmount(Number(value));
    validateTargetAmount(value);
  };

  const handleCurrentSavingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentSavings(Number(value));
    validateCurrentSavings(value);
  };

  const handleGoalNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setGoalName(newValue);
    
    // If user types something, mark as touched. If they clear it completely, allow auto-population again
    if (newValue.trim() !== '') {
      setGoalNameTouched(true);
    } else {
      setGoalNameTouched(false);
      // If there's a selected goal type and field is now empty, auto-populate
      if (goalType) {
        setGoalName(defaultGoalNames[goalType]);
      }
    }
  };

  // Fix Ctrl+A behavior for inputs and enable Enter key submission
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && e.key === 'a') {
      e.stopPropagation();
      // Let the default behavior happen for the input only
      e.currentTarget.select();
      e.preventDefault();
    }
    // Enable Enter key to submit the form
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveGoal();
    }
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

    // Check if user is authenticated - if not signed in and hasn't chosen "Continue as Guest", open login modal
    if (!isAuthenticated && !isGuest) {
      // User is neither signed in nor has activated guest mode - open login modal
      onAuthRequired?.();
      return;
    }

    const goalData: InsertSavingsGoal = {
      userId: user?.id || 'guest', // Handle guest users
      name: goalName,
      goalType,
      targetAmount,
      currentSavings,
      targetDate: new Date(targetDate),
      monthlyCapacity: monthlyCapacity[0],
      status: 'active',
      isActive: true,
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
      // Check PDF download limits for guests
      const trackResponse = await apiRequest('POST', '/api/track-pdf-download');
      
      if (!trackResponse.ok) {
        const errorData = await trackResponse.json();
        
        if (trackResponse.status === 429 && errorData.pdfLimit) {
          toast({
            title: "Daily Download Limit Reached",
            description: "You've reached your daily limit of 1 PDF download. Create an account for unlimited downloads!",
            variant: "destructive",
          });
          onAuthRequired?.();
          return;
        }
        
        // Don't throw error for authenticated users
        console.log('Track PDF response not OK but continuing for auth users:', errorData);
      }

      const goalData: SavingsGoal = {
        id: existingGoal?.id || 'temp-id',
        userId: existingGoal?.userId || user?.id || '',
        name: goalName,
        goalType,
        targetAmount,
        currentSavings,
        targetDate: new Date(targetDate),
        monthlyCapacity: monthlyCapacity[0],
        status: existingGoal?.status || 'active',
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
        title: "PDF Downloaded Successfully!",
        description: "Check your downloads folder for the savings plan report",
      });

      // Refresh auth data to get updated PDF download count
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    } catch (error) {
      console.error('PDF generation full error details:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Not an Error object');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
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

    const shareText = `🎯 My Savings Goal: ${goalName}\n💰 Target: ${formatLocaleCurrency(targetAmount)}\n📅 Deadline: ${new Date(targetDate).toLocaleDateString()}\n💪 Monthly Required: ${formatLocaleCurrency(calculations.monthlyRequired)}\n\nPlanned with My College Finance!`;

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
          description: "Your savings plan details are ready to share",
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
    <div className="grid lg:grid-cols-3 gap-4 lg:gap-8 max-w-full overflow-hidden">
      {/* Main Calculator Form */}
      <div className="lg:col-span-2 space-y-6 lg:space-y-8 max-w-full overflow-hidden">
        {/* Personal Information */}
        <Card className="animate-slide-in">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <div className="p-2 bg-brand-blue/10 rounded-lg">
                <User className="w-5 h-5 brand-blue" />
              </div>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                    className="pl-10 mt-2 w-full max-w-full overflow-hidden"
                    style={{ 
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield'
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goal Selection */}
        <GoalSelectionCard
          selectedGoal={goalType}
          onGoalSelect={handleGoalTypeSelect}
        />

        {/* Goal Details */}
        <Card className="animate-slide-in">
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <div className="p-2 bg-brand-blue/10 rounded-lg">
                  <Calculator className="w-5 h-5 brand-blue" />
                </div>
                Goal Details
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  value={goalName}
                  onChange={handleGoalNameChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder="My Dream Vacation"
                  className="mt-2"
                />
                {goalType && !goalNameTouched && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tip: Goal name auto-updates based on category. Edit to customize.
                  </p>
                )}
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
                    onChange={handleTargetAmountChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder="10000"
                    min="0"
                    step="100"
                    className={`pl-10 mt-2 ${targetAmountError ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                </div>
                {targetAmountError && (
                  <p className="text-red-500 text-xs mt-1">{targetAmountError}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {[1000, 5000, 10000, 25000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(amount)}
                      className="text-xs hover:bg-brand-blue hover:text-white flex-1 min-w-0 sm:flex-none"
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
                    onChange={handleCurrentSavingsChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder="0"
                    min="0"
                    step="50"
                    className={`pl-10 mt-2 ${currentSavingsError ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                </div>
                {currentSavingsError && (
                  <p className="text-red-500 text-xs mt-1">{currentSavingsError}</p>
                )}
              </div>

              <div>
                <Label htmlFor="target-date">Target Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-300 pointer-events-none z-10" />
                  <Input
                    id="target-date"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="pl-10 mt-2 cursor-pointer w-full max-w-full overflow-hidden"
                    min={new Date().toISOString().split('T')[0]}
                    placeholder="Select your target date"
                    style={{ 
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield'
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 break-words">
                  Click the field to open date picker or type directly (YYYY-MM-DD)
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label htmlFor="monthly-capacity">Monthly Savings Capacity</Label>
                  <div className="flex gap-2">
                    {!isManualEntry && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleManualEntry}
                        className="text-xs"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        Precise Amount
                      </Button>
                    )}
                  </div>
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
                          onKeyDown={(e) => {
                            if (e.ctrlKey && e.key === 'a') {
                              e.stopPropagation();
                              e.currentTarget.select();
                              e.preventDefault();
                            }
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSubmitManualEntry();
                            }
                          }}
                          placeholder="Enter precise amount"
                          min="0"
                          step="25"
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
                          {formatLocaleCurrency(monthlyCapacity[0])}
                        </span> per month
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="mb-6 px-2">
                      <Slider
                        id="monthly-capacity"
                        min={50}
                        max={2000}
                        step={25}
                        value={monthlyCapacity}
                        onValueChange={setMonthlyCapacity}
                        className="w-full slider-enhanced"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{formatLocaleCurrency(50)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-lg text-brand-green dark:text-brand-green">
                          {formatLocaleCurrency(0).replace('0', '').replace(',', '').trim()}
                        </span>
                        <input
                          type="number"
                          value={monthlyCapacity[0]}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (value >= 50 && value <= 2000) {
                              setMonthlyCapacity([value]);
                            }
                          }}
                          onKeyDown={handleInputKeyDown}
                          className="w-16 text-center text-lg font-medium bg-background dark:bg-background border border-muted dark:border-muted rounded px-1 py-0.5 text-brand-green dark:text-brand-green focus:border-brand-blue dark:focus:border-brand-blue focus:outline-none"
                          min="50"
                          max="2000"
                        />
                        <span className="font-medium text-lg text-brand-green dark:text-brand-green">
                          per month
                        </span>
                      </div>
                      <span>{formatLocaleCurrency(2000)}+</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Use slider for quick adjustments or edit the number directly for precise values
                    </p>
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
            selectedTradeOffs={selectedTradeOffs}
            onTradeOffChange={setSelectedTradeOffs}
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
            selectedTradeOffs={selectedTradeOffs}
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
                className={`w-full transition-all duration-200 ${
                  !calculations 
                    ? 'bg-gray-100 dark:bg-muted hover:bg-gray-100 dark:hover:bg-muted text-gray-500 dark:text-slate-400 cursor-not-allowed border border-gray-200 dark:border-border' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                disabled={!calculations}
                style={!calculations ? {} : { backgroundColor: 'hsl(218, 99%, 40%)' }}
              >
                <Download className={`w-4 h-4 mr-2 ${
                  !calculations 
                    ? 'text-gray-500 dark:text-slate-400' 
                    : 'text-white'
                }`} />
                Download PDF Report
              </Button>
              
              <Button
                onClick={handleShare}
                className={`w-full transition-all duration-200 ${
                  !calculations 
                    ? 'bg-gray-100 dark:bg-muted hover:bg-gray-100 dark:hover:bg-muted text-gray-500 dark:text-slate-400 cursor-not-allowed border border-gray-200 dark:border-border' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                disabled={!calculations}
                style={!calculations ? {} : { backgroundColor: 'hsl(115, 93%, 47%)' }}
              >
                <Share2 className={`w-4 h-4 mr-2 ${
                  !calculations 
                    ? 'text-gray-500 dark:text-slate-400' 
                    : 'text-white'
                }`} />
                Share Savings Plan
              </Button>
              
              <Button
                onClick={handleSaveGoal}
                className={`w-full transition-all duration-200 ${
                  (!goalType || !goalName || targetAmount <= 0 || !targetDate) 
                    ? 'bg-gray-100 dark:bg-muted hover:bg-gray-100 dark:hover:bg-muted text-gray-500 dark:text-slate-400 cursor-not-allowed border border-gray-200 dark:border-border' 
                    : 'bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black hover:shadow-md'
                }`}
                disabled={saveGoalMutation.isPending || (!goalType || !goalName || targetAmount <= 0 || !targetDate)}
              >
                <Save className={`w-4 h-4 mr-2 ${
                  (!goalType || !goalName || targetAmount <= 0 || !targetDate) 
                    ? 'text-gray-500 dark:text-slate-400' 
                    : 'text-white dark:text-black'
                }`} />
                {saveGoalMutation.isPending ? 'Saving...' : (existingGoal ? 'Update Goal' : 'Save as Goal')}
              </Button>
              {(!goalType || !goalName || targetAmount <= 0 || !targetDate) && (
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 text-center">
                  Complete all fields to enable saving
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
