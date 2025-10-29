
"use client"

import {
  LayoutGrid,
  ClipboardList,
  User,
  Bell,
  LogOut,
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


const navItems = [
    { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { href: '/leads', icon: ClipboardList, label: 'Leads' },
    { href: '/profile', icon: User, label: 'Profile' },
];

function getPageTitle(pathname: string) {
    if (pathname.startsWith('/leads')) return 'Leads';
    if (pathname.startsWith('/profile')) return 'Profile';
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/notifications')) return 'Notifications';
    return '';
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [agentAvatar, setAgentAvatar] = useState<string | undefined>(undefined);
  const [agentInitial, setAgentInitial] = useState("A");

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

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('agent_data');
    router.push('/');
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
          <Link href="/notifications">
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
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
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
                <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "flex flex-col items-center justify-center text-gray-500 w-20 h-full",
                    isActive && "text-primary"
                )}
                >
                <item.icon className="h-6 w-6" />
                <span className="text-xs">{item.label}</span>
                </Link>
             )
          })}
        </div>
      </nav>
    </div>
  );
}
