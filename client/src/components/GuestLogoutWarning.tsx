import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Clock } from 'lucide-react';

interface GuestLogoutWarningProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
  nextResetTime?: Date;
}

export function GuestLogoutWarning({ 
  isOpen, 
  onClose, 
  onConfirmLogout,
  nextResetTime 
}: GuestLogoutWarningProps) {
  const formatTimeUntilReset = () => {
    if (!nextResetTime) return '24 hours';
    
    const now = new Date();
    const reset = new Date(nextResetTime);
    const hoursLeft = Math.ceil((reset.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursLeft <= 0) return 'soon';
    if (hoursLeft === 1) return '1 hour';
    return `${hoursLeft} hours`;
  };

  const formatResetTime = () => {
    if (!nextResetTime) return 'tomorrow';
    
    const reset = new Date(nextResetTime);
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (reset.toDateString() === today.toDateString()) {
      return `today at ${reset.toLocaleTimeString('en-US', options)}`;
    } else if (reset.toDateString() === tomorrow.toDateString()) {
      return `tomorrow at ${reset.toLocaleTimeString('en-US', options)}`;
    } else {
      return reset.toLocaleString('en-US', {
        ...options,
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="w-[95vw] sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <AlertDialogTitle className="text-xl">Guest Daily Limits Warning</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                Important: Your daily limits will NOT reset if you log out!
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Our system tracks guest usage to ensure fair access for all users. 
                Logging out and back in will not reset your daily counters.
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Next Reset Time
                </p>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Your limits will automatically reset {formatResetTime()}.
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Time remaining: {formatTimeUntilReset()}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium">Current Daily Limits:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• 3 savings goals per day</li>
                <li>• 1 PDF download per day</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mt-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold">Tip:</span> Create a free account to enjoy unlimited goals and PDF downloads!
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Stay as Guest
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirmLogout}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Log Out Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}