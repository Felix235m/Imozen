"use client";

import * as React from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [loginType, setLoginType] = React.useState<'admin' | 'agent'>('agent');
  const router = useRouter();

  const handleLoginSuccess = () => {
    if (loginType === 'agent') {
      router.push('/dashboard');
    } else if (loginType === 'admin') {
      router.push('/agents');
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <LoginForm
          key={loginType}
          loginType={loginType}
          onLoginSuccess={handleLoginSuccess}
        />
        <div className="mt-4 text-center">
          {loginType === 'admin' ? (
            <Button variant="link" onClick={() => setLoginType('agent')}>
              Switch to Agent Login
            </Button>
          ) : (
            <Button variant="link" onClick={() => setLoginType('admin')}>
              Switch to Admin Login
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
