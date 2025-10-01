import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, List, Target, TrendingUp, Download, Share2, Trash2 } from 'lucide-react';
import { type SavingsGoal } from '@shared/schema';
import { generateSavingsPlanPDF } from '@/lib/pdfGenerator';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface MultipleGoalsManagerProps {
  goals: SavingsGoal[];
  onAddGoal: () => void;
  onEditGoal: (goalId: string) => void;
}

export function MultipleGoalsManager({ goals, onAddGoal, onEditGoal }: MultipleGoalsManagerProps) {
  const { theme } = useTheme();
  const { formatCurrency: formatLocaleCurrency } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const shareGoal = async (goal: SavingsGoal) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My Savings Goal: ${goal.name}`,
          text: `Check out my savings goal for ${goal.name}! Target: ${formatLocaleCurrency(goal.targetAmount)}, Current: ${formatLocaleCurrency(goal.currentSavings || 0)}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(`My Savings Goal: ${goal.name} - Target: ${formatLocaleCurrency(goal.targetAmount)}, Current: ${formatLocaleCurrency(goal.currentSavings || 0)}`);
      toast({
        title: "Copied to clipboard",
        description: "Your savings goal has been copied to clipboard"
      });
    }
  };

  // Delete mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      return apiRequest('DELETE', `/api/savings-goals/${goalId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
      queryClient.refetchQueries({ queryKey: ['/api/savings-goals'] });
      toast({
        title: "Success!",
        description: "Goal deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
    },
  });

  const handleDownloadPDF = async (goal: SavingsGoal, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    try {
      await generateSavingsPlanPDF(
        goal,
        { name: 'Student', startDate: new Date() },
        theme === 'dark'
      );

      toast({
        title: "Success!",
        description: "PDF report downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  const handleShareGoal = async (goal: SavingsGoal, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    await shareGoal(goal);
    toast({
      title: "Shared!",
      description: "Goal details copied to clipboard",
    });
  };

  const handleDeleteGoal = (goalId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    deleteGoalMutation.mutate(goalId);
  };

  const getProgressPercent = (goal: SavingsGoal) => {
    if (goal.targetAmount <= 0) return 0;
    const currentSavings = goal.currentSavings || 0;
    return Math.min(100, (currentSavings / goal.targetAmount) * 100);
  };

  const getStatusBadge = (goal: SavingsGoal) => {
    const progress = getProgressPercent(goal);
    const today = new Date();
    const target = new Date(goal.targetDate);
    const monthsRemaining = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));

    if (progress >= 100) {
      return <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-md">✨ Complete</Badge>;
    }

    if (monthsRemaining <= 0) {
      return <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-md">⚠ Overdue</Badge>;
    }

    const currentSavings = goal.currentSavings || 0;
    const remainingAmount = goal.targetAmount - currentSavings;
    const requiredMonthly = remainingAmount / monthsRemaining;
    const capacity = goal.monthlyCapacity || 0;

    if (capacity > 0 && requiredMonthly > capacity * 1.2) {
      return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md">⚡ At Risk</Badge>;
    }

    return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-md">🎯 On Track</Badge>;
  };

  const calculateMonthlyRequired = (goal: SavingsGoal) => {
    const today = new Date();
    const target = new Date(goal.targetDate);
    const monthsRemaining = Math.max(1, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const currentSavings = goal.currentSavings || 0;
    const remainingAmount = Math.max(0, goal.targetAmount - currentSavings);
    return Math.round(remainingAmount / monthsRemaining);
  };

  return (
    <Card className="animate-slide-in bg-gradient-to-br from-background to-background/80 border border-border/50 shadow-xl backdrop-blur-sm">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        {/* Enhanced Header Section - Optimized for all screen sizes */}
        <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Hide icon on mobile, show on sm and up */}
              <div className="relative hidden sm:block">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500/20 to-blue-700/30 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30 shadow-lg">
                  <List className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl sm:rounded-2xl blur-lg opacity-75"></div>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-400 dark:via-blue-300 dark:to-blue-200 bg-clip-text text-transparent leading-tight">
                  Savings Tracker Dashboard
                </h3>
                <p className="text-sm sm:text-sm text-muted-foreground/80 mt-1 font-medium">
                  Manage and track all your financial goals
                </p>
              </div>
            </div>

            {/* Desktop-optimized Add Goal button placement */}
            <div className="w-full sm:w-auto">
              <Button 
                onClick={onAddGoal}
                className="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 w-full sm:w-auto font-semibold shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 overflow-hidden h-10 sm:h-11 lg:h-12"
                size="lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 transition-transform group-hover:rotate-90" />
                <span className="text-sm sm:text-base">Add New Goal</span>
              </Button>
            </div>
          </div>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-12 sm:py-16 lg:py-20 px-4">
            <div className="relative mb-6 sm:mb-8">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/60 rounded-full p-6 sm:p-8 w-24 h-24 sm:w-32 sm:h-32 mx-auto flex items-center justify-center backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50 shadow-xl">
                <Target className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-400/20 to-blue-600/30 rounded-full blur-2xl opacity-60"></div>
            </div>
            <h4 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent mb-3 sm:mb-4">
              Ready to Start Saving?
            </h4>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed">
              Create your first savings goal and begin tracking your financial journey toward success.
            </p>
            <Button 
              onClick={onAddGoal} 
              className="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 w-full sm:w-auto font-semibold shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 py-3 sm:py-4 px-6 sm:px-8 overflow-hidden"
              size="lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 transition-transform group-hover:rotate-90" />
              <span className="text-sm sm:text-base">Create Your First Goal</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
            {goals.map((goal) => {
              const progress = getProgressPercent(goal);
              const monthlyRequired = calculateMonthlyRequired(goal);
              const today = new Date();
              const target = new Date(goal.targetDate);
              const monthsLeft = Math.max(0, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));

              return (
                <div
                  key={goal.id}
                  className="group relative p-6 sm:p-7 lg:p-8 border border-gray-300/60 dark:border-border/50 rounded-xl sm:rounded-2xl hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-400/70 dark:hover:border-blue-600/50 transition-all duration-300 overflow-hidden bg-gradient-to-br from-white/95 to-gray-50/80 dark:from-background dark:to-background/80 backdrop-blur-sm min-h-[400px] sm:min-h-[420px] lg:min-h-[450px] flex flex-col"
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-700/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl sm:rounded-2xl"></div>

                  <div 
                    className="relative cursor-pointer z-10 flex-1 flex flex-col"
                    onClick={() => onEditGoal(goal.id)}
                  >
                    <div className="flex flex-col gap-4 sm:gap-5 mb-6 sm:mb-8 flex-1">
                      <div className="flex justify-between items-start gap-2 sm:gap-3">
                        <h4 className="font-bold text-lg sm:text-xl text-foreground break-words max-w-[70%] leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                          {goal.name}
                        </h4>
                        <div className="flex-shrink-0">
                          {getStatusBadge(goal)}
                        </div>
                      </div>

                      <div className="space-y-4 sm:space-y-5">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                          <span className="text-xs sm:text-sm break-words font-medium text-muted-foreground">
                            {formatLocaleCurrency(goal.currentSavings || 0)} of {formatLocaleCurrency(goal.targetAmount)}
                          </span>
                          <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={progress} className="h-2 sm:h-3 bg-gray-300/80 dark:bg-gray-700" />
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-700/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      </div>

                      <div className="space-y-3 sm:space-y-4 flex-1">
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/30 dark:border-green-700/30">
                          <div className="p-1 sm:p-1.5 bg-green-500/10 rounded-md sm:rounded-lg flex-shrink-0">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-green-800 dark:text-green-300 break-words">
                            {formatLocaleCurrency(monthlyRequired)}/month required
                          </span>
                        </div>

                        <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-100/60 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/60">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">Time remaining</span>
                            <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-300">{monthsLeft} months</span>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 block">
                            Last updated: {goal.updatedAt ? new Date(goal.updatedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Action buttons - Improved mobile layout */}
                  <div className="relative z-10 flex flex-col gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-300/60 dark:border-border/50 mt-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="group relative text-xs sm:text-sm h-10 sm:h-12 border-gray-300/80 dark:border-border/60 hover:border-blue-400/80 dark:hover:border-blue-300/60 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 font-medium transition-all duration-200 overflow-hidden bg-white/80 dark:bg-transparent"
                        onClick={(e) => handleDownloadPDF(goal, e)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 transition-transform group-hover:scale-110" />
                        Download PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="group relative text-xs sm:text-sm h-10 sm:h-12 border-gray-300/80 dark:border-border/60 hover:border-blue-400/80 dark:hover:border-blue-300/60 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 font-medium transition-all duration-200 overflow-hidden bg-white/80 dark:bg-transparent"
                        onClick={(e) => handleShareGoal(goal, e)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                        <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 transition-transform group-hover:scale-110" />
                        Share Goal
                      </Button>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="group relative w-full text-xs sm:text-sm h-10 sm:h-12 border-red-300/80 dark:border-red-800/60 hover:border-red-400/80 dark:hover:border-red-300/60 hover:bg-red-50/80 dark:hover:bg-red-900/20 font-medium transition-all duration-200 overflow-hidden bg-white/80 dark:bg-transparent"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 transition-transform group-hover:scale-110 text-red-600 dark:text-red-400" />
                          <span className="text-red-600 dark:text-red-400">Delete Goal</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border border-border/50 bg-gradient-to-br from-background to-background/80 backdrop-blur-sm max-w-[90vw] sm:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-lg sm:text-xl font-bold">Delete Savings Goal</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm sm:text-base leading-relaxed">
                            Are you sure you want to delete "<span className="font-semibold text-foreground">{goal.name}</span>"? This action cannot be undone and all progress data will be permanently lost.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
                          <AlertDialogCancel className="font-medium w-full sm:w-auto">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => handleDeleteGoal(goal.id, e)}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-600 font-medium shadow-lg w-full sm:w-auto"
                          >
                            Delete Forever
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}