import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, List, Target, TrendingUp, Download, Share2, Trash2 } from 'lucide-react';
import { type SavingsGoal } from '@shared/schema';
import { generateSavingsPlanPDF } from '@/lib/pdfGenerator';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface MultipleGoalsManagerProps {
  goals: SavingsGoal[];
  onAddGoal: () => void;
  onEditGoal: (goalId: string) => void;
}

const shareGoal = async (goal: SavingsGoal) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `My Savings Goal: ${goal.name}`,
        text: `Check out my savings goal for ${goal.name}! Target: $${goal.targetAmount.toLocaleString()}, Current: $${(goal.currentSavings || 0).toLocaleString()}`,
        url: window.location.href,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  } else {
    // Fallback for browsers that don't support Web Share API
    navigator.clipboard.writeText(`My Savings Goal: ${goal.name} - Target: $${goal.targetAmount.toLocaleString()}, Current: $${(goal.currentSavings || 0).toLocaleString()}`);
  }
};

export function MultipleGoalsManager({ goals, onAddGoal, onEditGoal }: MultipleGoalsManagerProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      return apiRequest('DELETE', `/api/savings-goals/${goalId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
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
      return <Badge className="bg-brand-green text-white">Complete</Badge>;
    }
    
    if (monthsRemaining <= 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    const currentSavings = goal.currentSavings || 0;
    const remainingAmount = goal.targetAmount - currentSavings;
    const requiredMonthly = remainingAmount / monthsRemaining;
    const capacity = goal.monthlyCapacity || 0;
    
    if (capacity > 0 && requiredMonthly > capacity * 1.2) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">At Risk</Badge>;
    }
    
    return <Badge className="bg-brand-blue text-white">On Track</Badge>;
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
    <Card className="animate-slide-in">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <List className="w-5 h-5 brand-blue" />
            </div>
            Savings Tracker Dashboard
          </h3>
          
          <Button 
            onClick={onAddGoal}
            className="bg-brand-blue hover:bg-brand-blue/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>
        
        {goals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No Goals Yet</h4>
            <p className="text-muted-foreground mb-4">
              Start by creating your first savings goal to track your progress.
            </p>
            <Button onClick={onAddGoal} className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const progress = getProgressPercent(goal);
              const monthlyRequired = calculateMonthlyRequired(goal);
              const today = new Date();
              const target = new Date(goal.targetDate);
              const monthsLeft = Math.max(0, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));
              
              return (
                <div
                  key={goal.id}
                  className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => onEditGoal(goal.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-foreground truncate">
                        {goal.name}
                      </h4>
                      {getStatusBadge(goal)}
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>${(goal.currentSavings || 0).toLocaleString()} of ${goal.targetAmount.toLocaleString()}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3" />
                        ${monthlyRequired}/month
                      </div>
                      <div className="flex justify-between items-center">
                        <span>{monthsLeft} months left</span>
                        <span className="text-xs">
                          Edited: {goal.updatedAt ? new Date(goal.updatedAt).toLocaleDateString() : 'N/A'} {goal.updatedAt ? new Date(goal.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2 pt-3 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={(e) => handleDownloadPDF(goal, e)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={(e) => handleShareGoal(goal, e)}
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Savings Goal</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{goal.name}"? This action cannot be undone and all progress data will be permanently lost.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => handleDeleteGoal(goal.id, e)}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                          >
                            Confirm
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
