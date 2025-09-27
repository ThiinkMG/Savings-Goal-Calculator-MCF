// Simplified useAuth hook - no authentication functionality
// This is a placeholder to prevent import errors

export interface User {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
}

export interface GuestInfo {
  dailyCount: number;
  dailyLimit: number;
  pdfDownloads: number;
  pdfLimit: number;
  sessionStart?: number;
  lastResetDate?: string;
  nextResetTime?: Date | string;
}

export interface AuthResponse {
  user: User | null;
  isGuest: boolean;
  guestInfo?: GuestInfo;
}

export function useAuth() {
  // Return empty/default values since we removed authentication
  return {
    user: null,
    isGuest: false,
    isAuthenticated: false,
    guestInfo: undefined,
    isLoading: false,
    login: () => {},
    logout: () => {},
    isLoggingOut: false,
  };
}