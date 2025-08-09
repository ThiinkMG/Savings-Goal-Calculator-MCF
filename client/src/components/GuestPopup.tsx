import { Shield, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GuestPopupProps {
  onClose: () => void;
  onCreateAccount: () => void;
}

export function GuestPopup({ onClose, onCreateAccount }: GuestPopupProps) {
  return (
    <div className="fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto z-50 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white rounded-xl sm:rounded-lg shadow-2xl max-w-sm sm:max-w-md w-full sm:w-auto animate-slide-in-right">
      <div className="p-4 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-3">
          <Shield className="w-5 h-5 text-white mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm sm:text-sm text-white leading-relaxed space-y-2">
              <div>
                <span className="font-semibold block">You're signed in guest mode.</span>
                <span className="text-white/90">Your data won't be saved between sessions.</span>
              </div>
              <div className="text-white/90">
                <button 
                  onClick={onCreateAccount}
                  className="underline hover:no-underline text-white font-semibold decoration-2 underline-offset-2"
                >
                  Create an account
                </button>
                <span> to save your progress.</span>
              </div>
            </div>
            <Button
              onClick={onCreateAccount}
              size="sm"
              variant="secondary"
              className="bg-white/95 hover:bg-white text-blue-700 dark:bg-white/95 dark:hover:bg-white dark:text-blue-800 border-white/50 font-semibold shadow-sm hover:shadow-md transition-all duration-200 mt-4 w-full sm:w-auto"
            >
              <User className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Login & Save Progress</span>
            </Button>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/15 flex-shrink-0"
            data-testid="close-guest-popup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}