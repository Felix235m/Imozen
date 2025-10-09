"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { callAuthApi } from '@/lib/auth-api';

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
    sheetUrl: '',
    password: ''
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAgentData(prev => ({ ...prev, [name]: value }));
  };

  const handleLanguageChange = (value: string) => {
    setAgentData(prev => ({ ...prev, language: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // In a real app, you would handle the file upload to a storage service
    // and get a URL. For now, we'll continue using pravatar for simplicity.
    const newAgentPayload = {
      ...agentData,
      avatar: avatarPreview || `https://i.pravatar.cc/150?u=${agentData.email}`,
    }

    try {
      await callAuthApi('onboard_agent', newAgentPayload);

      toast({
        title: "Success",
        description: "New agent created successfully.",
      });
      router.push('/agents');

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
            <div className="flex flex-col items-center gap-4">
               <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback>
                  <Upload className="h-8 w-8 text-gray-400" />
                </AvatarFallback>
              </Avatar>
               <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </Button>
              <Input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarChange}
              />
            </div>
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
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" value={agentData.password} onChange={handleInputChange} placeholder="Create a strong password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
               <Select name="language" value={agentData.language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Portuguese">Portuguese</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="sheetUrl">Sheet URL</Label>
              <Input id="sheetUrl" name="sheetUrl" value={agentData.sheetUrl} onChange={handleInputChange} placeholder="e.g., https://docs.google.com/spreadsheets/d/..." />
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
