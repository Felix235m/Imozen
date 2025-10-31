
"use client";

import * as React from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/hooks/useLanguage';

export default function LoginPage() {
  const [loginType, setLoginType] = React.useState<'admin' | 'agent'>('agent');
  const router = useRouter();
  const { t } = useLanguage();

  const handleLoginSuccess = async () => {
    if (loginType === 'agent') {
      router.push('/tasks');
    } else if (loginType === 'admin') {
      router.push('/agents');
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
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
            <Button variant="link" onClick={() => setLoginType('agent')} suppressHydrationWarning>
              {t.login.switchToAgent}
            </Button>
          ) : (
            <Button variant="link" onClick={() => setLoginType('admin')} suppressHydrationWarning>
              {t.login.switchToAdmin}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
