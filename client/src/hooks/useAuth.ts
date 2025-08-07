import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
}

export interface AuthResponse {
  user: User | null;
  isGuest: boolean;
  guestInfo?: GuestInfo;
}

export function useAuth() {
  const { toast } = useToast();

  const { data: authData, isLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/logout');
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
      
      // Reset to home page
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to log out',
        variant: 'destructive',
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (user: User) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
      return user;
    },
  });

  return {
    user: authData?.user || null,
    isGuest: authData?.isGuest || false,
    isAuthenticated: !!authData?.user,
    guestInfo: authData?.guestInfo,
    isLoading,
    login: (user: User) => loginMutation.mutate(user),
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
}