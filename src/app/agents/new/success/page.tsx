
"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function AgentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const agent = {
    name: searchParams.get('name') || 'N/A',
    phone: searchParams.get('phone') || 'N/A',
    email: searchParams.get('email') || 'N/A',
    username: searchParams.get('username') || 'N/A',
    password: searchParams.get('password') || 'N/A',
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Credentials copied to clipboard.",
    });
  };

  const handleCopyAll = () => {
    const allCredentials = `Username: ${agent.username}\nPassword: ${agent.password}`;
    handleCopy(allCredentials);
  };
  
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="items-center text-center space-y-3">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <CardTitle>Agent Created Successfully!</CardTitle>
          <CardDescription>The agent account has been created. Please share these credentials securely.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 rounded-md border bg-gray-50 p-4">
             <CredentialRow label="Name" value={agent.name} />
             <CredentialRow label="Phone" value={agent.phone} />
             <CredentialRow label="Email" value={agent.email} />
             <CredentialRow label="Username" value={agent.username} />
             <CredentialRow label="Password" value={agent.password} isSensitive />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full" onClick={handleCopyAll}>
              <Copy className="mr-2 h-4 w-4" /> Copy Credentials
            </Button>
            <Button className="w-full bg-primary" onClick={() => router.push('/agents')}>
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function CredentialRow({ label, value, isSensitive = false }: { label: string; value: string; isSensitive?: boolean }) {
  const { toast } = useToast();
  
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-gray-600">{label}:</span>
      <div className="flex items-center gap-2">
        <span className={`font-mono ${isSensitive ? 'blur-sm hover:blur-none transition-all' : ''}`}>{value}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
          <Copy className="h-4 w-4 text-gray-500" />
        </Button>
      </div>
    </div>
  );
}

export default function AgentCreationSuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AgentSuccessContent />
        </Suspense>
    )
}
