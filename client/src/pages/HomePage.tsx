import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BrandHeader } from '@/components/BrandHeader';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { MultipleGoalsManager } from '@/components/MultipleGoalsManager';
import { type SavingsGoal } from '@shared/schema';
import { ArrowLeft, Plus } from 'lucide-react';

export default function HomePage() {
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);

  const handleGoalSaved = (goal: SavingsGoal) => {
    setEditingGoalId(null);
    setShowNewGoalForm(false);
  };

  const handleEditGoal = (goalId: string) => {
    setEditingGoalId(goalId);
    setShowNewGoalForm(false);
  };

  const handleDeleteGoal = () => {
    setEditingGoalId(null);
    setShowNewGoalForm(false);
  };

  const showCalculator = showNewGoalForm || editingGoalId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Enhanced Brand Header */}
      <BrandHeader />

      {/* Main Content */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-12">
            <div className="relative">
              {/* Main Title */}
              <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-3 sm:mb-4 lg:mb-6">
                <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-400 dark:via-blue-300 dark:to-blue-200 bg-clip-text text-transparent">
                  SAVINGS TRACKER
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 dark:from-purple-400 dark:via-purple-300 dark:to-purple-200 bg-clip-text text-transparent">
                  DASHBOARD
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base xs:text-lg sm:text-xl lg:text-2xl text-muted-foreground/80 font-medium max-w-3xl mx-auto leading-relaxed">
                Plan, track, and achieve your savings goals with personalized insights and actionable steps.
              </p>

              {/* Decorative elements */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-50"></div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-30"></div>
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-6 sm:space-y-8">
            {!showCalculator && (
              <>
                {/* Enhanced Create New Goal Button */}
                <div className="flex justify-center mb-6 sm:mb-8">
                  <Button
                    data-testid="button-create-new-goal"
                    onClick={() => setShowNewGoalForm(true)}
                    size="lg"
                    className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 rounded-2xl overflow-hidden"
                  >
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    
                    {/* Icon with animation */}
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 transition-transform duration-300 group-hover:rotate-90" />
                    
                    {/* Text */}
                    <span className="relative z-10">Create New Savings Goal</span>
                    
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </Button>
                </div>

                {/* Goals Manager */}
                <MultipleGoalsManager
                  onEditGoal={handleEditGoal}
                  onDeleteGoal={handleDeleteGoal}
                  onAddGoal={() => setShowNewGoalForm(true)}
                />
              </>
            )}

            {/* Calculator Section */}
            {showCalculator && (
              <div className="space-y-4 sm:space-y-6">
                {/* Back Button */}
                <div className="flex items-center justify-start">
                  <Button
                    data-testid="button-back-to-dashboard"
                    variant="ghost"
                    onClick={() => {
                      setShowNewGoalForm(false);
                      setEditingGoalId(null);
                    }}
                    className="group text-muted-foreground hover:text-foreground transition-colors duration-200 p-2 hover:bg-accent/50 rounded-lg"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
                    <span className="text-sm font-medium">Back to Dashboard</span>
                  </Button>
                </div>

                {/* Calculator */}
                <SavingsCalculator
                  editingGoalId={editingGoalId}
                  onGoalSaved={handleGoalSaved}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}