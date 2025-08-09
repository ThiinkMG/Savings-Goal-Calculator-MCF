import { Sun, Moon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Logo } from './Logo';
import { SettingsPanel } from './SettingsPanelSimple';
import { BenefitsModal } from './BenefitsModal';
import { useState } from 'react';

interface BrandHeaderProps {
  onContinueAsGuest?: () => void;
}

export function BrandHeader({ onContinueAsGuest }: BrandHeaderProps = {}) {
  const { theme, toggleTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-gradient-to-r from-background/95 via-background/90 to-background/95 border-b border-border/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Enhanced Logo Section */}
          <a 
            href="https://www.mycollegefinance.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="group flex items-center space-x-2 sm:space-x-3 hover:opacity-90 transition-all duration-300 min-w-0 flex-1 relative overflow-visible"
          >
            {/* Logo with enhanced animations */}
            <div className="relative">
              <Logo 
                size={50} 
                className="animate-gentle-bounce sm:w-[65px] sm:h-[65px] flex-shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:rotate-1" 
              />
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </div>

            {/* Enhanced Brand Text */}
            <div className="flex-1 relative overflow-visible">
              <h1 className="text-sm xs:text-base sm:text-lg font-black bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-400 dark:via-blue-300 dark:to-blue-200 bg-clip-text text-transparent font-sans leading-tight transition-all duration-300 group-hover:from-blue-500 group-hover:to-purple-600 whitespace-nowrap">
                MY COLLEGE FINANCE
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground/80 leading-tight hidden xs:block transition-colors duration-300 group-hover:text-muted-foreground font-medium tracking-wide">
                EDUCATE • MOTIVATE • ELEVATE
              </p>
            </div>
          </a>

          {/* Enhanced Controls Section */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {/* Settings Button with enhanced styling */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="group relative h-9 w-9 sm:h-11 sm:w-11 border-border/60 hover:border-primary/30 hover:bg-gradient-to-br hover:from-accent/50 hover:to-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 overflow-hidden"
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 group-hover:rotate-90 group-hover:scale-110 text-muted-foreground group-hover:text-primary" />
              {/* Ripple effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </Button>

            {/* Enhanced Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="group relative h-9 w-9 sm:h-11 sm:w-11 border-border/60 hover:border-primary/30 hover:bg-gradient-to-br hover:from-accent/50 hover:to-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 overflow-hidden"
              aria-label="Toggle theme"
            >
              <div className="relative w-4 h-4 sm:w-5 sm:h-5">
                {/* Enhanced Sun Icon */}
                <Sun className={`absolute inset-0 h-4 w-4 sm:h-5 sm:w-5 text-amber-500 transition-all duration-500 ${
                  theme === 'dark' 
                    ? 'scale-0 rotate-180 opacity-0' 
                    : 'scale-100 rotate-0 opacity-100 group-hover:rotate-45 group-hover:scale-110'
                }`} />

                {/* Enhanced Moon Icon */}
                <Moon className={`absolute inset-0 h-4 w-4 sm:h-5 sm:w-5 text-blue-400 transition-all duration-500 ${
                  theme === 'light' 
                    ? 'scale-0 -rotate-180 opacity-0' 
                    : 'scale-100 rotate-0 opacity-100 group-hover:-rotate-12 group-hover:scale-110'
                }`} />
              </div>

              {/* Glow effect for theme button */}
              <div className={`absolute inset-0 rounded-md transition-all duration-300 ${
                theme === 'dark' 
                  ? 'bg-blue-400/0 group-hover:bg-blue-400/10' 
                  : 'bg-amber-400/0 group-hover:bg-amber-400/10'
              }`} />

              {/* Ripple effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Settings Panel */}
      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onContinueAsGuest={onContinueAsGuest}
        onShowBenefits={() => setShowBenefitsModal(true)}
      />

      {/* Enhanced Benefits Modal */}
      <BenefitsModal
        isOpen={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
        onCreateAccount={onContinueAsGuest}
      />
    </header>
  );
}