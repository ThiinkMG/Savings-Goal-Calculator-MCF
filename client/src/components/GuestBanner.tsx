import { Shield, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GuestBannerProps {
  guestInfo?: {
    dailyCount: number;
    dailyLimit: number;
    pdfDownloads: number;
    pdfLimit: number;
  };
  onCreateAccount: () => void;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export function GuestBanner({ 
  guestInfo, 
  onCreateAccount, 
  onLogout,
  isLoggingOut = false
}: GuestBannerProps) {
  const goalsRemaining = guestInfo ? guestInfo.dailyLimit - guestInfo.dailyCount : 3;
  const pdfsRemaining = guestInfo ? guestInfo.pdfLimit - guestInfo.pdfDownloads : 1;

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800 py-4 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Guest Session Active</span> - Your data is temporary
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                  <span className="text-xs text-blue-700 dark:text-blue-300">
                    Goals Today: <strong>{guestInfo?.dailyCount || 0}/{guestInfo?.dailyLimit || 3}</strong>
                    {goalsRemaining > 0 ? ` (${goalsRemaining} remaining)` : ' (Daily limit reached)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-blue-700 dark:text-blue-300">
                    PDF Downloads: <strong>{guestInfo?.pdfDownloads || 0}/{guestInfo?.pdfLimit || 1}</strong>
                    {pdfsRemaining > 0 ? ` (${pdfsRemaining} remaining)` : ' (Daily limit reached)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <Button
              onClick={onCreateAccount}
              size="sm"
              className="flex-1 lg:flex-initial bg-blue-600 hover:bg-blue-700 text-white"
            >
              <User className="w-4 h-4 mr-2" />
              Create Free Account
            </Button>
            <Button
              onClick={onLogout}
              size="sm"
              variant="outline"
              disabled={isLoggingOut}
              className="flex-1 lg:flex-initial border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/50"
            >
              {isLoggingOut ? 'Ending Session...' : 'End Session'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}