"use client";

import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// In a real app, you would fetch this data based on the page params
const agentData = {
  name: 'Sophia Carter',
  id: '123e4567-e89b-12d3-a456-426614174000',
  avatar: 'https://i.pravatar.cc/150?u=sophia',
  phone: '+1 (555) 123-4567',
  email: 'sophia.carter@email.com',
  language: 'English',
  status: 'Active',
  createdAt: '2023-01-15',
  username: 'sophia_c',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/12345',
};

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  // You can use params.id to fetch the correct agent data
  const agent = agentData;

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex items-center border-b bg-white px-4 py-3">
        <Link href="/agents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="ml-4 text-xl font-semibold">Agent Details</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center py-6 text-center">
          <Avatar className="mb-4 h-24 w-24">
            <AvatarImage src={agent.avatar} alt={agent.name} />
            <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold">{agent.name}</h2>
          <p className="text-sm text-gray-500">ID: {agent.id}</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact & Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <DetailRow label="Name" value={agent.name} />
                <DetailRow label="Phone" value={agent.phone} isLink={`tel:${agent.phone}`} />
                <DetailRow label="Email" value={agent.email} isLink={`mailto:${agent.email}`} />
                <DetailRow label="Language" value={agent.language} />
                <DetailRow
                  label="Status"
                  value={
                    <Badge variant={agent.status === 'Active' ? 'default' : 'destructive'} 
                           className={agent.status === 'Active' ? 'bg-blue-100 text-primary' : ''}>
                      {agent.status}
                    </Badge>
                  }
                />
                <DetailRow label="Created At" value={agent.createdAt} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Login & Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <DetailRow label="Username" value={agent.username} />
                <DetailRow label="Password Hash" value="••••••••" />
                <DetailRow
                  label="Sheet URL"
                  value={
                    <a href={agent.sheetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:underline">
                      docs.google.com/... <ExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="grid grid-cols-2 gap-4 border-t bg-white p-4">
        <Button variant="outline" size="lg">Edit</Button>
        <Button variant="default" size="lg" className="bg-primary">Deactivate</Button>
      </footer>
    </div>
  );
}

function DetailRow({ label, value, isLink }: { label: string; value: React.ReactNode, isLink?: string }) {
  const content = isLink ? (
    <a href={isLink} className="text-primary hover:underline">
      {value}
    </a>
  ) : (
    value
  );

  return (
    <div className="flex items-center justify-between border-b pb-4 last:border-b-0">
      <p className="text-gray-500">{label}</p>
      <div className="font-medium text-right">{content}</div>
    </div>
  );
}
