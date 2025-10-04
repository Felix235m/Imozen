"use client";

import { useState, useRef } from 'react';
import { ArrowLeft, ExternalLink, Save, Edit, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const initialAgentData = {
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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [agent, setAgent] = useState(initialAgentData);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(agent.avatar);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAgent(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setAgent(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('https://eurekagathr.app.n8n.cloud/webhook-test/Agent%20Data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agent),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Agent details saved successfully.",
        });
        setIsEditing(false);
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to save agent data.');
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not save agent details.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setAgent(initialAgentData);
    setAvatarPreview(initialAgentData.avatar);
    setIsEditing(false);
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center">
          <Link href="/agents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="ml-4 text-xl font-semibold">Agent Details</h1>
        </div>
        <div>
          {isEditing ? (
             <Button size="sm" className="bg-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Edit className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center py-6 text-center">
          <div className="relative">
            <Avatar className="mb-4 h-24 w-24">
              <AvatarImage src={avatarPreview || undefined} alt={agent.name} />
              <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {isEditing && (
              <>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </div>
          {isEditing ? (
            <Input name="name" value={agent.name} onChange={handleInputChange} className="max-w-xs text-center text-2xl font-bold" />
          ) : (
            <h2 className="text-2xl font-bold">{agent.name}</h2>
          )}
          <p className="text-sm text-gray-500">ID: {agent.id}</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact & Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <EditableDetailRow label="Name" name="name" value={agent.name} isEditing={isEditing} onChange={handleInputChange} />
                <EditableDetailRow label="Phone" name="phone" value={agent.phone} isEditing={isEditing} onChange={handleInputChange} isLink={`tel:${agent.phone}`} />
                <EditableDetailRow label="Email" name="email" value={agent.email} isEditing={isEditing} onChange={handleInputChange} isLink={`mailto:${agent.email}`} />
                <EditableDetailRow label="Language" name="language" value={agent.language} isEditing={isEditing} onChange={handleInputChange} />
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
                <EditableDetailRow label="Username" name="username" value={agent.username} isEditing={isEditing} onChange={handleInputChange} />
                <DetailRow label="Password Hash" value="••••••••" />
                <EditableDetailRow label="Sheet URL" name="sheetUrl" value={agent.sheetUrl} isEditing={isEditing} onChange={handleInputChange} isLink={agent.sheetUrl} />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="grid grid-cols-2 gap-4 border-t bg-white p-4">
        {isEditing ? (
          <>
            <Button variant="outline" size="lg" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
             <Button variant="default" size="lg" className="bg-red-500 hover:bg-red-600">Deactivate</Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="lg" onClick={() => {
              setIsEditing(true);
              window.scrollTo(0, 0);
            }}>Edit</Button>
            <Button variant="default" size="lg" className="bg-primary">Deactivate</Button>
          </>
        )}
      </footer>
    </div>
  );
}

function DetailRow({ label, value, isLink }: { label: string; value: React.ReactNode, isLink?: string }) {
  const content = isLink && typeof value === 'string' ? (
    <a href={isLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:underline">
      {isLink.includes('docs.google.com') ? 'docs.google.com/...' : value}
      {isLink.includes('docs.google.com') && <ExternalLink className="ml-1 h-4 w-4" />}
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

function EditableDetailRow({ label, name, value, isEditing, onChange, isLink }: { label: string; name: string, value: string, isEditing: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, isLink?: string }) {
  if (isEditing) {
    return (
      <div className="flex items-center justify-between border-b pb-4 last:border-b-0">
        <p className="text-gray-500">{label}</p>
        <Input name={name} value={value} onChange={onChange} className="max-w-[200px] text-right" />
      </div>
    )
  }
  return <DetailRow label={label} value={value} isLink={isLink} />
}