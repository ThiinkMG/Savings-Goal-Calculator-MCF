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
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="https://www.mycollegefinance.com/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
            <Logo size={60} className="animate-gentle-bounce sm:w-[70px] sm:h-[70px]" />
            <div>
              <h1 className="text-lg sm:text-xl font-black brand-blue font-sans">
                MY COLLEGE FINANCE
              </h1>
              <p className="text-xs sm:text-xs text-muted-foreground">
                EDUCATE • MOTIVATE • ELEVATE
              </p>
            </div>
          </a>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="hover:bg-accent/50 transition-colors"
              aria-label="Open settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label="Toggle theme"
            >
              <div className="relative w-5 h-5">
                <Sun className={`theme-icon sun-icon h-5 w-5 text-yellow-500 ${theme === 'dark' ? 'scale-0 rotate-180' : 'scale-100 rotate-0'}`} />
                <Moon className={`theme-icon moon-icon h-5 w-5 text-blue-300 ${theme === 'light' ? 'scale-0 -rotate-180' : 'scale-100 rotate-0'}`} />
              </div>
            </Button>
          </div>
        </div>
      </div>
      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onContinueAsGuest={onContinueAsGuest}
        onShowBenefits={() => setShowBenefitsModal(true)}
      />
      
      <BenefitsModal
        isOpen={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
        onCreateAccount={onContinueAsGuest}
      />
    </header>
  );
}
