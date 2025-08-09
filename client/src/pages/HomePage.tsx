import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { BrandHeader } from '@/components/BrandHeader';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { MultipleGoalsManager } from '@/components/MultipleGoalsManager';
import { EnhancedAuthModal } from '@/components/EnhancedAuthModal';
import { GuestBanner } from '@/components/GuestBanner';
import { GuestPopup } from '@/components/GuestPopup';
import { BenefitsModal } from '@/components/BenefitsModal';
import { type SavingsGoal } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';
import { GraduationCap, TrendingUp, Smartphone, ArrowLeft, Plus, User, LogOut, Shield, X } from 'lucide-react';
import logoPath from '@assets/Updated Final - My College Finace Logo w New Oliver 2 - Thiink Media Graphics (Transparent)_1753980792432.png';

export default function HomePage() {
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [showEnhancedAuthModal, setShowEnhancedAuthModal] = useState(false);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [showGuestBanner, setShowGuestBanner] = useState(false);
  const [recurringPopupTimer, setRecurringPopupTimer] = useState<NodeJS.Timeout | null>(null);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  
  const { user, isGuest, isAuthenticated, guestInfo, logout, isLoggingOut } = useAuth();

  // Daily benefits modal logic - show once per day
  useEffect(() => {
    const lastShownDate = localStorage.getItem('benefitsModalLastShown');
    const today = new Date().toDateString();
    
    if (lastShownDate !== today) {
      // Show after a 3 second delay for better user experience
      const timer = setTimeout(() => {
        setShowBenefitsModal(true);
        localStorage.setItem('benefitsModalLastShown', today);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Show guest popup when user becomes a guest and auto-hide after 10 seconds
  useEffect(() => {
    if (isGuest && !isAuthenticated && showGuestBanner) {
      setShowGuestPopup(true);
      const timer = setTimeout(() => {
        setShowGuestPopup(false);
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isGuest, isAuthenticated, showGuestBanner]);

  // Recurring popup system for non-authenticated users
  useEffect(() => {
    // Clear any existing timer
    if (recurringPopupTimer) {
      clearInterval(recurringPopupTimer);
      setRecurringPopupTimer(null);
    }

    // Only set up recurring popup for non-authenticated users
    if (!isAuthenticated && isGuest) {
      const timer = setInterval(() => {
        // Only show if user is still not authenticated and is a guest
        if (!isAuthenticated && isGuest) {
          setShowGuestPopup(true);
          // Auto-hide after 10 seconds
          setTimeout(() => {
            setShowGuestPopup(false);
          }, 10000);
        }
      }, 600000); // 10 minutes = 600,000 milliseconds

      setRecurringPopupTimer(timer);
    }

    // Cleanup on unmount or auth change
    return () => {
      if (recurringPopupTimer) {
        clearInterval(recurringPopupTimer);
      }
    };
  }, [isAuthenticated, isGuest]);

  // Reset guest banner when user logs in or logs out
  useEffect(() => {
    if (isAuthenticated || (!isGuest && !isAuthenticated)) {
      setShowGuestBanner(false);
      setShowGuestPopup(false);
      // Clear the recurring timer when user logs in
      if (recurringPopupTimer) {
        clearInterval(recurringPopupTimer);
        setRecurringPopupTimer(null);
      }
    }
    
    // Reset form states when user logs out
    if (!isAuthenticated && !isGuest) {
      setEditingGoalId(null);
      setShowNewGoalForm(false);
      setShowEnhancedAuthModal(false);
    }
  }, [isAuthenticated, isGuest, recurringPopupTimer]);

  // Handle when user explicitly chooses to continue as guest
  const handleContinueAsGuest = async () => {
    try {
      // Create guest session on the server
      const { generateFingerprint } = await import('@/lib/browserFingerprint');
      const fingerprint = await generateFingerprint();
      
      const response = await fetch('/api/auth/continue-as-guest', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Guest session created successfully:', data);
        
        // Invalidate auth query to get fresh guest status
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
        
        setShowGuestBanner(true);
        setShowGuestPopup(true);
        setShowEnhancedAuthModal(false);
        
        // Auto-hide popup after 10 seconds
        setTimeout(() => {
          setShowGuestPopup(false);
        }, 10000);

        // Start the recurring popup timer
        if (!recurringPopupTimer) {
          const timer = setInterval(() => {
            if (!isAuthenticated && isGuest) {
              setShowGuestPopup(true);
              setTimeout(() => {
                setShowGuestPopup(false);
              }, 10000);
            }
          }, 600000); // 10 minutes
          
          setRecurringPopupTimer(timer);
        }
        
        // Now show the calculator form after successful guest login
        setShowNewGoalForm(true);
        setEditingGoalId(null);
      } else {
        const errorData = await response.json();
        console.error('Guest session creation failed:', response.status, errorData);
        // Still show the modal but with error state
        setShowEnhancedAuthModal(false);
      }
    } catch (error) {
      console.error('Failed to create guest session:', error);
      setShowEnhancedAuthModal(false);
    }
  };

  // Fetch existing goals
  const { data: goals = [], isLoading } = useQuery<SavingsGoal[]>({
    queryKey: ['/api/savings-goals'],
  });

  const editingGoal = editingGoalId ? goals.find(g => g.id === editingGoalId) : undefined;
  const showCalculator = showNewGoalForm || editingGoal;

  const handleAddGoal = () => {
    // Check if user is authenticated (either regular user or guest)
    if (!isAuthenticated && !isGuest) {
      // Not authenticated - show auth modal first
      setShowEnhancedAuthModal(true);
      // Don't open the calculator yet
      return;
    }
    
    // User is authenticated (or guest), proceed with showing the calculator
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
      <BrandHeader onContinueAsGuest={handleContinueAsGuest} />
      
      {/* Guest User Welcome Popup */}
      {isGuest && showGuestPopup && (
        <GuestPopup 
          onClose={() => setShowGuestPopup(false)}
          onCreateAccount={() => {
            setShowGuestPopup(false);
            setShowEnhancedAuthModal(true);
          }}
        />
      )}

      {/* User Authentication Status */}
      {isAuthenticated && (
        <div className="bg-green-50 dark:bg-green-950/30 border-b border-green-200 dark:border-green-800 py-4 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <User className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Welcome back, <strong>{user?.username}</strong>! Your progress is being saved.
                </span>
              </div>
              <Button
                onClick={logout}
                size="sm"
                variant="outline"
                disabled={isLoggingOut}
                className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950/50 w-full sm:w-auto flex-shrink-0"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Guest User Status */}
      {!isAuthenticated && isGuest && showGuestBanner && (
        <GuestBanner 
          guestInfo={guestInfo}
          onCreateAccount={() => setShowEnhancedAuthModal(true)}
          onLogout={logout}
          isLoggingOut={isLoggingOut}
        />
      )}

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
              
              {/* Plan Counter */}
              <div className="mb-6 sm:mb-8 flex flex-col gap-3 items-center justify-center">
                {isAuthenticated ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Plans Unlimited
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        PDF Downloads Unlimited
                      </span>
                    </div>
                  </>
                ) : isGuest ? (
                  <>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                      <div className="inline-flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          Plans: {guestInfo?.dailyCount || 0}/{guestInfo?.dailyLimit || 3} today
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          PDF Downloads: {guestInfo?.pdfDownloads || 0}/{guestInfo?.pdfLimit || 1} today
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 rounded-lg">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Sign in to create plans
                    </span>
                  </div>
                )}
              </div>
              
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
                <div className="flex flex-col items-center text-center gap-3 p-4 bg-white/5 dark:bg-white/5 rounded-xl border border-brand-green/20">
                  <div className="p-3 bg-brand-green/20 rounded-xl flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-brand-green" />
                  </div>
                  <span className="font-semibold text-muted-foreground">Educational Focused</span>
                </div>
                <div className="flex flex-col items-center text-center gap-3 p-4 bg-white/5 dark:bg-white/5 rounded-xl border border-brand-green/20">
                  <div className="p-3 bg-brand-green/20 rounded-xl flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-brand-green" />
                  </div>
                  <span className="font-semibold text-muted-foreground">Visual Progress Tracking</span>
                </div>
                <div className="flex flex-col items-center text-center gap-3 p-4 bg-white/5 dark:bg-white/5 rounded-xl border border-brand-green/20">
                  <div className="p-3 bg-brand-green/20 rounded-xl flex-shrink-0">
                    <Smartphone className="w-6 h-6 text-brand-green" />
                  </div>
                  <span className="font-semibold text-muted-foreground">Mobile Optimized</span>
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
                onClick={() => {
                  // Add a brief delay to show user feedback
                  setTimeout(() => {
                    console.log('Opening 50/30/20 calculator in new tab');
                  }, 100);
                }}
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
              onAuthRequired={() => setShowEnhancedAuthModal(true)}
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
              
              {/* Copyright and App Version */}
              <p className="text-gray-500 text-xs font-medium">
                © 2025 My College Finance, LLC. All rights reserved | Savings Goal Calculator • v3.0.0 (Beta)
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <EnhancedAuthModal
        isOpen={showEnhancedAuthModal}
        onClose={() => setShowEnhancedAuthModal(false)}
        onContinueAsGuest={handleContinueAsGuest}
        onAuthSuccess={() => {
          // After successful login/registration, show the calculator
          setShowNewGoalForm(true);
          setEditingGoalId(null);
        }}
      />

      <BenefitsModal
        isOpen={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
        onCreateAccount={() => {
          setShowBenefitsModal(false);
          setShowEnhancedAuthModal(true);
        }}
      />
    </div>
  );
}
