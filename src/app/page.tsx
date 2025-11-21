
"use client";

import * as React from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/hooks/useLanguage';
import { fetchAgentDatabase } from '@/lib/auth-api';
import { localStorageManager } from '@/lib/local-storage-manager';
import { LoadingModal } from '@/components/ui/loading-modal';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [loginType, setLoginType] = React.useState<'admin' | 'agent'>('agent');
  const [isLoadingData, setIsLoadingData] = React.useState(false);
  const [loadingStep, setLoadingStep] = React.useState(0);
  const [showRetryDialog, setShowRetryDialog] = React.useState(false);
  const [retryError, setRetryError] = React.useState('');
  const [isRetrying, setIsRetrying] = React.useState(false);
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  React.useEffect(() => {
    console.log('🔍 HYDRATION DEBUG: LoginPage mounted');
    console.log('🔍 HYDRATION DEBUG: Current language translations available:', !!t.login);
  }, [t]);

  const handleLoginSuccess = async () => {
    if (loginType === 'agent') {
      // Show loading modal
      setIsLoadingData(true);
      setLoadingStep(0);

      try {
        // Get token from localStorage
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Step 1: Fetching data
        setLoadingStep(0);
        const response = await fetchAgentDatabase(token);

        console.log('🟠 Login - Received response:', response);

        // Validate response
        if (!response || !response.success || !response.data) {
          throw new Error('Invalid response from server. Please try again.');
        }

        // Step 2: Loading the data
        setLoadingStep(1);
        await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause for UX

        // Step 3: Getting details from DB
        setLoadingStep(2);

        // Store data in localStorage
        localStorageManager.initializeFromAgentDatabase(response);

        console.log('✅ Login - Data initialized successfully');

        // Step 4: Preparing app data
        setLoadingStep(3);
        await new Promise(resolve => setTimeout(resolve, 200)); // Brief pause for UX

        // Navigate to tasks page
        console.log('🔍 DEBUG: About to call router.push("/tasks")');
        try {
          router.push('/tasks');
          console.log('🔍 DEBUG: router.push("/tasks") completed successfully');
        } catch (navError) {
          console.error('❌ DEBUG: Navigation failed:', navError);
          throw new Error('Navigation failed. Please try refreshing the page.');
        }
      } catch (error: any) {
        console.error('Failed to load agent database:', error);

        // Hide loading modal
        setIsLoadingData(false);

        // Show retry dialog instead of immediate logout
        setRetryError(error.message || 'Could not load your data');
        setShowRetryDialog(true);
      }
    } else if (loginType === 'admin') {
      router.push('/agents');
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    console.log('🔍 DEBUG: Retry attempt started');
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('🔍 DEBUG: Retry failed - no auth token');
        throw new Error('Authentication token not found');
      }

      console.log('🔍 DEBUG: Retry - fetching agent database');
      const response = await fetchAgentDatabase(token);

      console.log('🔍 DEBUG: Retry - response received:', {
        hasResponse: !!response,
        success: response?.success,
        hasData: !!response?.data
      });

      if (!response || !response.success || !response.data) {
        console.log('🔍 DEBUG: Retry failed - invalid response');
        throw new Error('Invalid response from server');
      }

      console.log('🔍 DEBUG: Retry - calling localStorageManager.initializeFromAgentDatabase');
      localStorageManager.initializeFromAgentDatabase(response);
      console.log('🔍 DEBUG: Retry - localStorageManager.initializeFromAgentDatabase completed');
      
      setShowRetryDialog(false);
      setIsRetrying(false);
      console.log('🔍 DEBUG: Retry - navigating to /tasks');
      router.push('/tasks');
      console.log('🔍 DEBUG: Retry - navigation completed');
    } catch (error: any) {
      console.error('❌ DEBUG: Retry failed with error:', error);
      
      // Second failure - logout
      setIsRetrying(false);
      setShowRetryDialog(false);

      toast({
        variant: 'destructive',
        title: 'Unable to Load Data',
        description: `Could not load data after retry: ${error.message}. Try again later or contact admin.`,
      });

      localStorage.removeItem('auth_token');
      localStorage.removeItem('agent_data');
      console.log('🔍 DEBUG: Retry failed - logged out user');
    }
  };

  const handleLogoutAfterError = () => {
    setShowRetryDialog(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('agent_data');
    toast({
      title: 'Logged Out',
      description: 'Please try logging in again',
    });
  };

  return (
    <>
      <main className="relative flex min-h-screen w-full items-center justify-center bg-gray-50 p-4" suppressHydrationWarning>
        {/* Language Selector - Top Right Corner */}
        <div className="absolute top-4 right-4 z-10">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-sm">
          <LoginForm
            key={loginType}
            loginType={loginType}
            onLoginSuccess={handleLoginSuccess}
          />
          <div className="mt-4 text-center">
            {loginType === 'admin' ? (
              <Button variant="link" onClick={() => setLoginType('agent')}>
                {t.login.switchToAgent}
              </Button>
            ) : (
              <Button variant="link" onClick={() => setLoginType('admin')}>
                {t.login.switchToAdmin}
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Loading Modal */}
      <LoadingModal isOpen={isLoadingData} currentStep={loadingStep} />

      {/* Retry Dialog */}
      <AlertDialog open={showRetryDialog} onOpenChange={setShowRetryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Failed to Load Data</AlertDialogTitle>
            <AlertDialogDescription>
              {retryError}. Would you like to try again?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleLogoutAfterError} disabled={isRetrying}>
              Logout & Exit
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRetry} disabled={isRetrying}>
              {isRetrying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Retry'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
