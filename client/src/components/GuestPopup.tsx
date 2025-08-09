import { Shield, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GuestPopupProps {
  onClose: () => void;
  onCreateAccount: () => void;
}

export function GuestPopup({ onClose, onCreateAccount }: GuestPopupProps) {
  return (
    <div className="fixed top-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white rounded-lg shadow-2xl max-w-md w-full mx-4 sm:mx-0 animate-slide-in-right">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm text-white leading-relaxed">
              <span className="font-medium">You're signed in guest mode.</span>
              <br />
              <span>Your data won't be saved between sessions. </span>
              <button 
                onClick={onCreateAccount}
                className="underline hover:no-underline text-white font-semibold"
              >
                Create an account
              </button>
              <span> to save your progress.</span>
            </div>
            <Button
              onClick={onCreateAccount}
              size="sm"
              variant="secondary"
              className="bg-white/90 hover:bg-white text-blue-700 dark:bg-white/95 dark:hover:bg-white dark:text-blue-800 border-white/50 font-medium shadow-sm hover:shadow-md transition-all duration-200 mt-3"
            >
              <User className="w-4 h-4 mr-2" />
              Login & Save Progress
            </Button>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            data-testid="close-guest-popup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}