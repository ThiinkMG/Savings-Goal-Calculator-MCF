import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { BrandHeader } from '@/components/BrandHeader';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { MultipleGoalsManager } from '@/components/MultipleGoalsManager';
import { type SavingsGoal } from '@shared/schema';
import { GraduationCap, TrendingUp, Smartphone } from 'lucide-react';
import logoPath from '@assets/Updated Final - My College Finace Logo w New Oliver 2 - Thiink Media Graphics (Transparent)_1753980792432.png';

export default function HomePage() {
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);

  // Fetch existing goals
  const { data: goals = [], isLoading } = useQuery<SavingsGoal[]>({
    queryKey: ['/api/savings-goals'],
  });

  const editingGoal = editingGoalId ? goals.find(g => g.id === editingGoalId) : undefined;
  const showCalculator = showNewGoalForm || editingGoal;

  const handleAddGoal = () => {
    setShowNewGoalForm(true);
    setEditingGoalId(null);
  };

  const handleEditGoal = (goalId: string) => {
    setEditingGoalId(goalId);
    setShowNewGoalForm(false);
  };

  const handleGoalSaved = () => {
    setShowNewGoalForm(false);
    setEditingGoalId(null);
    // Force refresh goals data to ensure it shows up
    queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
    queryClient.refetchQueries({ queryKey: ['/api/savings-goals'] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <BrandHeader />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-2/3 mb-8"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-48 bg-muted rounded"></div>
                <div className="h-64 bg-muted rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader />

      <main className="max-w-6xl mx-auto px-4 py-6 lg:py-8 overflow-hidden savings-calculator-container">
        {!showCalculator && (
          <>
            {/* Welcome Section */}
            <section className="text-center mb-12 animate-fade-in">
              <h2 className="text-2xl sm:text-4xl font-black brand-blue mb-4 sm:mb-6 leading-tight">
                Savings Goal Calculator
              </h2>
              <p className="text-base sm:text-xl text-muted-foreground mb-4 sm:mb-6 max-w-3xl mx-auto px-2 leading-relaxed">
                Take control of your financial future with our intelligent savings calculator. 
                Set goals, track progress, and achieve your dreams.
              </p>
              
              <div className="mb-6 text-center">
                <a 
                  href="https://www.mycollegefinance.com/online-finance-courses" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-brand-blue hover:text-brand-amber transition-colors font-medium"
                >
                  See our <span className="hover:underline">latest courses →</span>
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm max-w-3xl mx-auto">
                <div className="flex flex-col items-center text-center gap-3 p-4 bg-gray-50/80 dark:bg-white/5 rounded-xl border border-brand-green/30 dark:border-brand-green/20">
                  <div className="p-3 bg-brand-green/20 rounded-xl flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-brand-green" />
                  </div>
                  <span className="font-semibold text-gray-700 dark:text-muted-foreground">Educational Focused</span>
                </div>
                <div className="flex flex-col items-center text-center gap-3 p-4 bg-gray-50/80 dark:bg-white/5 rounded-xl border border-brand-green/30 dark:border-brand-green/20">
                  <div className="p-3 bg-brand-green/20 rounded-xl flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-brand-green" />
                  </div>
                  <span className="font-semibold text-gray-700 dark:text-muted-foreground">Visual Progress Tracking</span>
                </div>
                <div className="flex flex-col items-center text-center gap-3 p-4 bg-gray-50/80 dark:bg-white/5 rounded-xl border border-brand-green/30 dark:border-brand-green/20">
                  <div className="p-3 bg-brand-green/20 rounded-xl flex-shrink-0">
                    <Smartphone className="w-6 h-6 text-brand-green" />
                  </div>
                  <span className="font-semibold text-gray-700 dark:text-muted-foreground">Mobile Optimized</span>
                </div>
              </div>
            </section>

            {/* Multiple Goals Dashboard */}
            <MultipleGoalsManager
              goals={goals}
              onAddGoal={handleAddGoal}
              onEditGoal={handleEditGoal}
            />

            {/* 50/30/20 Calculator Button */}
            <div className="text-center mt-12 mb-8 relative z-10">
              <a 
                href="https://www.mycollegefinance.com/50-30-20-budget-calculator"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-block"
              >
                <div className="relative overflow-hidden bg-gradient-to-r from-brand-blue to-blue-600 border-2 border-gray-600 dark:bg-transparent dark:border-blue-500 px-10 py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl dark:shadow-blue-900/50 transition-all duration-300 ease-out transform hover:-translate-y-2 hover:scale-105">
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                  
                  {/* Button content */}
                  <div className="relative flex items-center gap-3">
                    <span className="tracking-wide text-black dark:text-white font-semibold drop-shadow-sm">Try 50/30/20 Calculator</span>
                    <div className="transform group-hover:translate-x-1 transition-transform duration-300 ease-out">
                      <svg className="w-5 h-5 text-black dark:text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Animated underline */}
                  <div className="absolute bottom-2 left-6 right-6 h-0.5 bg-white/90 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-400 ease-out origin-center"></div>
                </div>
              </a>
              
              {/* Supporting text */}
              <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
                Master your budget with our comprehensive 50/30/20 rule calculator
              </p>
            </div>
          </>
        )}

        {showCalculator && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                onClick={() => {
                  setShowNewGoalForm(false);
                  setEditingGoalId(null);
                }}
                variant="outline"
                className="hover:bg-muted"
              >
                ← Back to Goals
              </Button>
              <h2 className="text-2xl font-bold text-foreground">
                {editingGoal ? `Edit: ${editingGoal.name}` : 'Create New Goal'}
              </h2>
            </div>
            <SavingsCalculator
              existingGoal={editingGoal}
              onSave={handleGoalSaved}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-black dark:from-black dark:to-gray-900 text-white py-12 mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center items-center mb-6">
              <a 
                href="https://www.mycollegefinance.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-4 hover:opacity-80 transition-opacity duration-300"
              >
                <img 
                  src={logoPath} 
                  alt="My College Finance Logo" 
                  className="h-16 w-auto"
                />
                <span className="font-black text-brand-light-blue text-2xl">MY COLLEGE FINANCE</span>
              </a>
            </div>
            
            {/* Description */}
            <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
              Empowering students with financial education and smart tools for a brighter future.
            </p>
            
            {/* Links and Footer Info */}
            <div className="border-t border-gray-700 pt-6">
              {/* Links */}
              <div className="flex justify-center space-x-8 text-sm text-gray-400 mb-6">
                <a 
                  href="https://www.mycollegefinance.com/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-brand-light-blue transition-colors"
                >
                  Privacy Policy
                </a>
                <a 
                  href="https://www.mycollegefinance.com/contact" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-brand-light-blue transition-colors"
                >
                  Contact Us
                </a>
              </div>
              
              {/* Copyright */}
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} My College Finance. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
