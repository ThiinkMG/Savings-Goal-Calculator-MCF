import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { BrandHeader } from '@/components/BrandHeader';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { MultipleGoalsManager } from '@/components/MultipleGoalsManager';
import { type SavingsGoal } from '@shared/schema';
import { GraduationCap, TrendingUp, Smartphone, ArrowLeft } from 'lucide-react';

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
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {!showCalculator && (
          <>
            {/* Welcome Section */}
            <section className="text-center mb-12 animate-fade-in">
              <h2 className="text-4xl font-black brand-blue mb-4">
                Savings Goal Calculator
              </h2>
              <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
                Take control of your financial future with our intelligent savings calculator. 
                Set goals, track progress, and achieve your dreams.
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <div className="p-2 bg-brand-green/10 rounded-lg">
                    <GraduationCap className="w-4 h-4 brand-green" />
                  </div>
                  Educational Focused
                </span>
                <span className="flex items-center gap-2">
                  <div className="p-2 bg-brand-green/10 rounded-lg">
                    <TrendingUp className="w-4 h-4 brand-green" />
                  </div>
                  Visual Progress Tracking
                </span>
                <span className="flex items-center gap-2">
                  <div className="p-2 bg-brand-green/10 rounded-lg">
                    <Smartphone className="w-4 h-4 brand-green" />
                  </div>
                  Mobile Optimized
                </span>
              </div>
            </section>

            {/* Multiple Goals Dashboard */}
            <MultipleGoalsManager
              goals={goals}
              onAddGoal={handleAddGoal}
              onEditGoal={handleEditGoal}
            />
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
      <footer className="bg-gray-900 dark:bg-black text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-brand-light-blue rounded-full flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-black brand-light-blue">MY COLLEGE FINANCE</span>
          </div>
          <p className="text-gray-300 mb-4">
            Empowering students with financial education and smart tools for a brighter future.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-brand-light-blue transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-brand-light-blue transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-brand-light-blue transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
