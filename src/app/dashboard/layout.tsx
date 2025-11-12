
"use client"

import {
  LayoutGrid,
  ClipboardList,
  User,
  Bell,
  LogOut,
  CalendarClock,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImoZenLogo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { FailedOperationsBadge } from '@/components/notifications/failed-operations-badge';
import { fetchAgentDatabase } from '@/lib/auth-api';
import { localStorageManager } from '@/lib/local-storage-manager';
import { LoadingModal } from '@/components/ui/loading-modal';
import { useToast } from '@/hooks/use-toast';
import { navigationOptimizer } from '@/lib/navigation-optimizer';
import { performanceLogger } from '@/lib/performance-logger';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [agentAvatar, setAgentAvatar] = useState<string | undefined>(undefined);
  const [agentInitial, setAgentInitial] = useState("A");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStep, setRefreshStep] = useState(0);

  const navItems = [
    { href: '/tasks', icon: CalendarClock, label: t.navigation.tasks },
    { href: '/dashboard', icon: LayoutGrid, label: t.navigation.dashboard },
    { href: '/leads', icon: ClipboardList, label: t.navigation.leads },
  ];

  // Track navigation performance
  const handleNavigation = (href: string) => {
    performanceLogger.startNavigation(pathname, href);
    router.push(href);
    
    // End navigation tracking after a delay to allow for page load
    setTimeout(() => {
      performanceLogger.endNavigation();
    }, 1000);
  };

  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/tasks')) return t.navigation.tasks;
    if (pathname.startsWith('/leads')) return t.navigation.leads;
    if (pathname.startsWith('/profile')) return t.navigation.profile;
    if (pathname.startsWith('/dashboard')) return t.navigation.dashboard;
    if (pathname.startsWith('/notifications')) return t.navigation.notifications;
    return '';
  };

  useEffect(() => {
    try {
      const agentDataString = localStorage.getItem('agent_data');
      if (agentDataString) {
        const agentData = JSON.parse(agentDataString);
        setAgentAvatar(agentData.agent_image_url || undefined);
        setAgentInitial(agentData.agent_name ? agentData.agent_name.charAt(0).toUpperCase() : 'A');
      }
    } catch (error) {
      console.error("Failed to parse agent data from localStorage", error);
    }
  }, []);

  // PERFORMANCE FIX: Smart preloading based on current page
  useEffect(() => {
    navigationOptimizer.smartPreload(pathname);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('agent_data');
    router.push('/');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshStep(0);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Step 1: Fetching data
      setRefreshStep(0);
      const response = await fetchAgentDatabase(token);

      // Validate response
      if (!response || !response.success || !response.data) {
        throw new Error('Invalid response from server');
      }

      // Step 2: Loading the data
      setRefreshStep(1);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Getting details from DB
      setRefreshStep(2);

      // Store data in localStorage
      localStorageManager.initializeFromAgentDatabase(response);

      // Step 4: Preparing app data
      setRefreshStep(3);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Update agent avatar/initial from fresh data
      if (response.data.agent) {
        setAgentAvatar(response.data.agent.agent_image_url || undefined);
        setAgentInitial(response.data.agent.agent_name ? response.data.agent.agent_name.charAt(0).toUpperCase() : 'A');
      }

      toast({
        title: t.common?.refreshSuccess || 'Data Refreshed',
        description: t.common?.refreshSuccessDescription || 'Your data has been updated successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t.common?.refreshError || 'Refresh Failed',
        description: error.message || 'Could not refresh data',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="flex h-screen flex-col bg-gray-50">
       <header className="grid grid-cols-3 items-center border-b bg-white px-4 py-3 sticky top-0 z-10">
        <div className='flex items-center justify-start'>
            <ImoZenLogo size="sm" />
        </div>
        <div className="flex items-center justify-center">
            {pageTitle && <h1 className="text-2xl font-bold">{pageTitle}</h1>}
        </div>
        <div className="flex items-center justify-end gap-4">
          <FailedOperationsBadge />
          <Link
            href="/notifications"
            onMouseEnter={() => {
              // PERFORMANCE FIX: Preload notifications data on hover
              navigationOptimizer.preloadData({ type: 'notifications' });
            }}
          >
            <Button variant="ghost" size="icon">
              <Bell className="h-6 w-6" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={agentAvatar} alt="Agent" />
                <AvatarFallback>{agentInitial}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t.common.myAccount}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>{t.navigation.profile}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                <span>{t.common?.refresh || 'Refresh'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t.common.logOut}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white shadow-t-md">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around">
          {navItems.map((item) => {
             const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
             return (
                <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                    "flex flex-col items-center justify-center text-gray-500 w-20 h-full",
                    isActive && "text-primary"
                )}
                >
                <item.icon className="h-6 w-6" />
                <span className="text-xs">{item.label}</span>
                </button>
             )
          })}
        </div>
      </nav>
      <LoadingModal isOpen={isRefreshing} currentStep={refreshStep} />
    </div>
  );
}
