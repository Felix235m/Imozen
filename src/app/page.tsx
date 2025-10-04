import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="flex flex-col gap-4">
        <LoginForm />
        <Button asChild>
          <Link href="/agents">Go to Agents Page</Link>
        </Button>
      </div>
    </main>
  );
}