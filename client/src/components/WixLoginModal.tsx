import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { BookOpen, Lock, RefreshCw, X, Eye, EyeOff } from 'lucide-react';

interface WixLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function WixLoginModal({ isOpen, onClose, onSuccess }: WixLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const wixLoginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/wix-login', credentials);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Wix login failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Account Connected!",
        description: `Welcome back, ${data.user.fullName || data.user.username}! ${data.importedGoals > 0 ? `Imported ${data.importedGoals} goals from your website.` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
      onSuccess(data.user);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Unable to connect to your My College Finance account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    wixLoginMutation.mutate({ email, password });
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            My College Finance Login
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>📚 Sign in with your website account</p>
            <p>Use the same credentials from MyCollegeFinance.com</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="wix-email">Email Address</Label>
              <Input
                id="wix-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your website email"
                className="mt-1"
                disabled={wixLoginMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="wix-password">Password</Label>
              <div className="relative">
                <Input
                  id="wix-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your website password"
                  className="mt-1 pr-10"
                  disabled={wixLoginMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={wixLoginMutation.isPending}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={wixLoginMutation.isPending}
            >
              {wixLoginMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Sign In & Sync Account'
              )}
            </Button>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
                onClick={() => handleExternalLink('https://www.mycollegefinance.com/forgot-password')}
              >
                Forgot Password
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
                onClick={() => handleExternalLink('https://www.mycollegefinance.com/forgot-username')}
              >
                Forgot Username
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Don't have a website account?
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExternalLink('https://www.mycollegefinance.com/signup')}
                className="w-full"
              >
                Create Website Account
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Secure connection to MyCollegeFinance</span>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                <span>Auto-sync your data across platforms</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}