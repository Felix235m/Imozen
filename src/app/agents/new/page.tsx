"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function NewAgentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [agentData, setAgentData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    language: 'English',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAgentData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // A new agent ID can be generated on the client or server. 
    // Here's a simple client-side generation.
    const newAgent = {
      ...agentData,
      id: `agent-${Date.now()}`,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
      avatar: `https://i.pravatar.cc/150?u=${agentData.email}`,
      sheetUrl: 'https://docs.google.com/spreadsheets/d/12345',
    }

    try {
      const response = await fetch('https://eurekagathr.app.n8n.cloud/webhook-test/Agent%20Data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAgent),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "New agent created successfully.",
        });
        // You might want to add the new agent to the list on the previous page
        // or simply navigate back.
        router.push('/agents');
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to create new agent.');
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not create new agent.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center">
          <Link href="/agents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="ml-4 text-xl font-semibold">Add New Agent</h1>
        </div>
        <div>
          <Button size="sm" className="bg-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Agent Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" value={agentData.name} onChange={handleInputChange} placeholder="e.g., John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" value={agentData.email} onChange={handleInputChange} placeholder="e.g., john.doe@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" value={agentData.phone} onChange={handleInputChange} placeholder="e.g., +1 (555) 000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" value={agentData.username} onChange={handleInputChange} placeholder="e.g., johndoe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input id="language" name="language" value={agentData.language} onChange={handleInputChange} />
            </div>
          </CardContent>
        </Card>
      </main>

       <footer className="grid grid-cols-2 gap-4 border-t bg-white p-4">
            <Button variant="outline" size="lg" onClick={() => router.push('/agents')} disabled={isSaving}>Cancel</Button>
             <Button variant="default" size="lg" className="bg-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Agent
            </Button>
      </footer>
    </div>
  );
}
