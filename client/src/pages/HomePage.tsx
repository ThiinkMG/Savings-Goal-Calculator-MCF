import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { BrandHeader } from '@/components/BrandHeader';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { MultipleGoalsManager } from '@/components/MultipleGoalsManager';
import { type SavingsGoal } from '@shared/schema';
import { GraduationCap, TrendingUp, Smartphone, ArrowLeft, Plus } from 'lucide-react';
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
              <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
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

            {/* Create New Goal Button */}
            <div className="text-center mb-8">
              <Button 
                onClick={handleAddGoal}
                size="lg"
                className="bg-brand-blue hover:bg-brand-blue/90 text-[#030711] px-8 py-3 text-lg font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Savings Goal
              </Button>
            </div>

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
            
            {/* Copyright */}
            <div className="border-t border-gray-700 pt-6">
              <p className="text-gray-400 text-sm mb-4">
                © 2025 My College Finance, LLC. All rights reserved.
              </p>
              
              {/* Links */}
              <div className="flex justify-center space-x-8 text-sm text-gray-400 mb-6">
                <a 
                  href="https://www.mycollegefinance.com/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-brand-light-blue transition-colors duration-300 hover:underline"
                >
                  Privacy Policy
                </a>
                <a 
                  href="https://www.mycollegefinance.com/terms-policy" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-brand-light-blue transition-colors duration-300 hover:underline"
                >
                  Terms of Service
                </a>
                <a 
                  href="https://linktr.ee/mycollegefinance" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-brand-light-blue transition-colors duration-300 hover:underline"
                >
                  Follow Us
                </a>
              </div>
              
              {/* Tagline */}
              <p className="text-brand-light-blue font-bold text-lg mb-4 tracking-wide">
                Educate • Motivate • Elevate
              </p>
              
              {/* App Name and Version */}
              <p className="text-gray-500 text-xs font-medium">
                Savings Goal Calculator • v2.0.5 (Beta)
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
