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
        {/* Content Area */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="space-y-6 sm:space-y-8">
            {!showCalculator && (
              <>
                {/* Hero Section with Dark Background - Only on Dashboard */}
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12 sm:py-16 lg:py-20 rounded-2xl -mx-3 sm:-mx-6 lg:-mx-8">
                  <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
                    {/* Header Section */}
                    <div className="text-center mb-6 sm:mb-8 lg:mb-12">
                      <div className="relative">
                        {/* Main Title */}
                        <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 sm:mb-6 lg:mb-8">
                          Savings Goal Calculator
                        </h1>

                        {/* Subtitle */}
                        <p className="text-base xs:text-lg sm:text-xl lg:text-2xl text-gray-300 font-medium max-w-4xl mx-auto leading-relaxed mb-6 sm:mb-8">
                          Take control of your financial future with our intelligent savings calculator. Set goals, track progress, and achieve your dreams.
                        </p>

                        {/* See our latest courses link */}
                        <div className="mb-8 sm:mb-12">
                          <a 
                            href="https://www.mycollegefinance.com/online-finance-courses"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium text-lg transition-colors duration-200"
                            data-testid="link-courses"
                          >
                            See our latest courses 
                            <span className="ml-2">→</span>
                          </a>
                        </div>

                        {/* Feature Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-8 sm:mb-12">
                          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 text-center">
                            <div className="w-12 h-12 mx-auto mb-4 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                            <h3 className="font-semibold mb-2">Educational Focused</h3>
                            <p className="text-gray-400 text-sm">Learn while you save with built-in financial education</p>
                          </div>

                          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 text-center">
                            <div className="w-12 h-12 mx-auto mb-4 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </div>
                            <h3 className="font-semibold mb-2">Visual Progress Tracking</h3>
                            <p className="text-gray-400 text-sm">Watch your savings grow with intuitive charts and insights</p>
                          </div>

                          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 text-center">
                            <div className="w-12 h-12 mx-auto mb-4 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <h3 className="font-semibold mb-2">Mobile Optimized</h3>
                            <p className="text-gray-400 text-sm">Access your goals anywhere with our responsive design</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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