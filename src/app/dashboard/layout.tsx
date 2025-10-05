"use client"

import {
  LayoutGrid,
  ClipboardList,
  User,
  Bell,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ImoZenLogo } from '@/components/logo';
import { cn } from '@/lib/utils';


const navItems = [
    { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { href: '/leads', icon: ClipboardList, label: 'Leads' },
    { href: '/profile', icon: User, label: 'Profile' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen flex-col bg-gray-50">
       <header className="flex items-center justify-between border-b bg-white px-4 py-3 sticky top-0 z-10">
        <ImoZenLogo size="sm" />
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-6 w-6" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://i.pravatar.cc/150?u=ethan" alt="Agent" />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white shadow-t-md">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around">
          {navItems.map((item) => {
             const isActive = pathname.startsWith(item.href);
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
