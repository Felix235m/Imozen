"use client";

import { useState, useRef } from 'react';
import { ArrowLeft, MoreVertical, Upload, History, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Mock data - in a real app this would be fetched based on the `id` param
const leadData = {
  id: 'd2c5e5f3-a2f2-4f9c-9b0d-7d5b4a3a3c21',
  firstName: 'Sophia',
  lastName: 'Carter',
  email: 'sophia.carter@example.com',
  phone: '123-456-7890',
  avatar: 'https://i.pravatar.cc/150?u=sophia',
  status: 'Hot' as 'Hot' | 'Warm' | 'Cold',
  createdAt: '2024-01-15',
  propertyType: 'Condo',
  budget: 550000,
  bedrooms: 2,
};

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const [lead, setLead] = useState(leadData);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(lead.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        // In a real app, you would upload this to a server
      };
      reader.readAsDataURL(file);
    }
  };
  
  const getStatusBadgeClass = (status: 'Hot' | 'Warm' | 'Cold') => {
    switch (status) {
      case 'Hot': return 'bg-red-100 text-red-700 border-red-200';
      case 'Warm': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Cold': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center">
          <Link href="/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="ml-4 text-xl font-semibold">Lead Details</h1>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-6 w-6" />
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <section className="flex flex-col items-center py-6 text-center">
          <div className="relative mb-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview || undefined} alt={`${lead.firstName} ${lead.lastName}`} />
              <AvatarFallback>{lead.firstName.charAt(0)}{lead.lastName.charAt(0)}</AvatarFallback>
            </Avatar>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white shadow-md"
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
          </div>
          <div className='flex items-center gap-2'>
            <h2 className="text-2xl font-bold">{`${lead.firstName} ${lead.lastName}`}</h2>
            <Badge variant="outline" className={cn("text-sm", getStatusBadgeClass(lead.status))}>{lead.status}</Badge>
          </div>
          <div className='flex items-center gap-2 text-sm text-gray-500 mt-1'>
            <span>ID: {lead.id}</span>
            <span>&bull;</span>
            <span>Created: {lead.createdAt}</span>
          </div>
        </section>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <InfoItem label="First Name" value={lead.firstName} />
                <InfoItem label="Last Name" value={lead.lastName} />
                <InfoItem label="Email" value={lead.email} className="col-span-2" />
                <InfoItem label="Phone Number" value={lead.phone} className="col-span-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <InfoItem label="Property Type" value={lead.propertyType} />
                <InfoItem label="Budget" value={`$${lead.budget.toLocaleString('en-US')}`} />
                <InfoItem label="Bedrooms" value={lead.bedrooms} />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <div className="fixed bottom-24 right-4 z-20 flex flex-col gap-3">
        <ActionButton icon={History} label="History" />
        <ActionButton icon={FileText} label="Notes" />
        <ActionButton icon={Send} label="Follow-up" />
      </div>
    </div>
  );
}

function InfoItem({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-1", className)}>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, label }: { icon: React.ElementType, label: string }) {
  return (
    <Button
      variant="default"
      size="icon"
      className="h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90"
      aria-label={label}
    >
      <Icon className="h-6 w-6" />
    </Button>
  )
}