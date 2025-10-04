import { Home, Users, Building, Settings } from 'lucide-react';
import Link from 'next/link';

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <main className="flex-1 overflow-y-auto">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white shadow-t-md">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around">
          <Link
            href="#"
            className="flex flex-col items-center justify-center text-gray-500"
          >
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link
            href="/agents"
            className="flex flex-col items-center justify-center rounded-full bg-blue-100 px-4 py-2 text-primary"
          >
            <Users className="h-6 w-6" />
            <span className="text-xs font-semibold">Agents</span>
          </Link>
          <Link
            href="#"
            className="flex flex-col items-center justify-center text-gray-500"
          >
            <Building className="h-6 w-6" />
            <span className="text-xs">Listings</span>
          </Link>
          <Link
            href="#"
            className="flex flex-col items-center justify-center text-gray-500"
          >
            <Settings className="h-6 w-6" />
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}