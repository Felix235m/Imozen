
"use client";

import * as React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, MoreVertical, Upload, History, FileText, Send, Edit, UserX, UserCheck, Save, X, Mic, Copy, RefreshCw, MessageSquare, Phone, Mail, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { LeadStatusDialog } from '@/components/leads/lead-status-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const allLeadsData = [
  {
    id: 'd2c5e5f3-a2f2-4f9c-9b0d-7d5b4a3a3c21',
    firstName: 'Sophia',
    lastName: 'Carter',
    email: 'sophia.carter@example.com',
    phone: '123-456-7890',
    avatar: 'https://i.pravatar.cc/150?u=sophia',
    status: 'Hot' as 'Hot' | 'Warm' | 'Cold',
    activeStatus: 'Active' as 'Active' | 'Inactive',
    createdAt: '2024-01-15',
    propertyType: 'Condo',
    budget: 550000,
    bedrooms: 2,
    source: 'Website',
  },
  {
    id: 'olivia-bennett-2',
    firstName: 'Olivia',
    lastName: 'Bennett',
    email: 'olivia.bennett@example.com',
    phone: '234-567-8901',
    avatar: 'https://i.pravatar.cc/150?u=olivia',
    status: 'Warm' as 'Hot' | 'Warm' | 'Cold',
    activeStatus: 'Active' as 'Active' | 'Inactive',
    createdAt: '2024-02-10',
    propertyType: 'House',
    budget: 750000,
    bedrooms: 4,
    source: 'Referral',
  },
  {
    id: 'noah-thompson-3',
    firstName: 'Noah',
    lastName: 'Thompson',
    email: 'noah.thompson@example.com',
    phone: '345-678-9012',
    avatar: 'https://i.pravatar.cc/150?u=noah',
    status: 'Cold' as 'Hot' | 'Warm' | 'Cold',
    activeStatus: 'Active' as 'Active' | 'Inactive',
    createdAt: '2024-03-05',
    propertyType: 'Apartment',
    budget: 300000,
    bedrooms: 1,
    source: 'Zillow',
  },
   {
    id: 'ava-rodriguez-4',
    firstName: 'Ava',
    lastName: 'Rodriguez',
    email: 'ava.rodriguez@example.com',
    phone: '456-789-0123',
    avatar: 'https://i.pravatar.cc/150?u=ava',
    status: 'Hot' as 'Hot' | 'Warm' | 'Cold',
    activeStatus: 'Inactive' as 'Active' | 'Inactive',
    createdAt: '2024-03-20',
    propertyType: 'Commercial',
    budget: 1200000,
    bedrooms: 0,
    source: 'Website',
  },
  {
    id: 'liam-harper-5',
    firstName: 'Liam',
    lastName: 'Harper',
    email: 'liam.harper@example.com',
    phone: '567-890-1234',
    avatar: 'https://i.pravatar.cc/150?u=liam',
    status: 'Warm' as 'Hot' | 'Warm' | 'Cold',
    activeStatus: 'Active' as 'Active' | 'Inactive',
    createdAt: '2024-04-01',
    propertyType: 'Land',
    budget: 250000,
    bedrooms: 0,
    source: 'Referral',
  },
   {
    id: 'isabella-hayes-6',
    firstName: 'Isabella',
    lastName: 'Hayes',
    email: 'isabella.hayes@example.com',
    phone: '678-901-2345',
    avatar: 'https://i.pravatar.cc/150?u=isabella',
    status: 'Cold' as 'Hot' | 'Warm' | 'Cold',
    activeStatus: 'Active' as 'Active' | 'Inactive',
    createdAt: '2024-05-15',
    propertyType: 'Condo',
    budget: 450000,
    bedrooms: 2,
    source: 'Zillow',
  },
  {
    id: 'lucas-foster-7',
    firstName: 'Lucas',
    lastName: 'Foster',
    email: 'lucas.foster@example.com',
    phone: '789-012-3456',
    avatar: 'https://i.pravatar.cc/150?u=lucas',
    status: 'Hot' as 'Hot' | 'Warm' | 'Cold',
    activeStatus: 'Active' as 'Active' | 'Inactive',
    createdAt: '2024-06-01',
    propertyType: 'House',
    budget: 950000,
    bedrooms: 5,
    source: 'Website',
  },
  {
    id: 'mia-coleman-8',
    firstName: 'Mia',
    lastName: 'Coleman',
    email: 'mia.coleman@example.com',
    phone: '890-123-4567',
    avatar: 'https://i.pravatar.cc/150?u=mia',
    status: 'Warm' as 'Hot' | 'Warm' | 'Cold',
    activeStatus: 'Inactive' as 'Active' | 'Inactive',
    createdAt: '2024-06-12',
    propertyType: 'Apartment',
    budget: 320000,
    bedrooms: 1,
    source: 'Referral',
  },
];

type Note = {
    id: string;
    content: string;
    date: string;
};

const initialNotes = [
    {
        id: 'note2',
        content: 'Initial contact. Expressed interest in 2-bedroom condos downtown. Budget around $650k. Wants to see properties with good natural light.',
        date: '2024-05-28T11:15:00Z'
    },
    {
        id: 'note1',
        content: 'Lead created from website inquiry form.',
        date: '2024-01-15T09:00:00Z'
    }
];

const initialCurrentNote = {
    id: 'note3',
    content: 'Client is very interested in properties with a backyard for their dog. Prefers modern architecture and has a flexible budget for the right place. They mentioned a strong preference for a quiet neighborhood. Called on June 8th to reschedule a viewing due to a personal commitment, seemed a bit hesitant about the price point of the downtown condo.',
    date: '2024-06-10T14:30:00Z'
};

const communicationHistory = [
    {
      id: 'hist3',
      type: 'SMS',
      title: 'SMS Follow-up',
      date: '2024-01-18T11:00:00Z',
      description: 'Sent a text to schedule viewings for the favorited properties. Awaiting response.',
      icon: MessageSquare,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      id: 'hist2',
      type: 'Email',
      title: 'Sent Property Listings',
      date: '2024-01-16T14:00:00Z',
      description: 'Emailed a list of 5 condos that match her criteria. She favorited two of them.',
      icon: Mail,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      id: 'hist1',
      type: 'Call',
      title: 'Initial Call',
      date: '2024-01-15T10:30:00Z',
      description: 'Discussed property requirements and budget. Client is looking for a 2-bedroom condo downtown.',
      icon: Phone,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
];

type LeadData = (typeof allLeadsData)[0];
type ChangeSummary = {
  field: string;
  oldValue: any;
  newValue: any;
};

export default function LeadDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isEditMode = searchParams.get('edit') === 'true';
  const [isEditing, setIsEditing] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  const [lead, setLead] = useState<LeadData | null>(null);
  const [originalLead, setOriginalLead] = useState<LeadData | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [changeSummary, setChangeSummary] = useState<ChangeSummary[]>([]);
  const [suggestedStatus, setSuggestedStatus] = useState<LeadData['status'] | null>(null);

  const [notes, setNotes] = useState(initialNotes);
  const [currentNote, setCurrentNote] = useState(initialCurrentNote);

  useEffect(() => {
    const currentLeadData = allLeadsData.find(l => l.id === id);
    if (currentLeadData) {
      const leadCopy = { ...currentLeadData };
      setLead(leadCopy);
      setOriginalLead({ ...currentLeadData });
      setAvatarPreview(leadCopy.avatar);
    }
    if (isEditMode) {
        setIsEditing(true);
    }
  }, [id, isEditMode]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (lead) {
      setLead(prev => prev ? ({ ...prev, [name]: name === 'budget' || name === 'bedrooms' ? Number(value) : value }) : null);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
     if (lead) {
        setLead(prev => prev ? ({ ...prev, [name]: value }) : null);
     }
  };

  const handleStatusChange = (value: 'Hot' | 'Warm' | 'Cold') => {
    if (lead) {
        setLead(prev => prev ? ({ ...prev, status: value }) : null);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getQualificationScore = (leadData: LeadData) => {
    let score = 0;
    if (leadData.budget > 900000) score += 2;
    else if (leadData.budget > 500000) score += 1;

    if (leadData.bedrooms >= 4) score += 2;
    else if (leadData.bedrooms >= 2) score += 1;
    
    return score;
  }

  const getStatusFromScore = (score: number): LeadData['status'] => {
    if (score >= 3) return 'Hot';
    if (score >= 1) return 'Warm';
    return 'Cold';
  }

  const handleSave = async () => {
    if (!lead || !originalLead) return;

    const changes: ChangeSummary[] = [];
    (Object.keys(lead) as Array<keyof LeadData>).forEach(key => {
      if (lead[key] !== originalLead[key]) {
        changes.push({
          field: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          oldValue: originalLead[key],
          newValue: lead[key]
        });
      }
    });

    if (changes.length === 0 && avatarPreview === originalLead.avatar) {
      setIsEditing(false);
      return;
    }
    
    setChangeSummary(changes);
    
    const propertyRequirementsChanged = changes.some(c => ['Property Type', 'Budget', 'Bedrooms'].includes(c.field));

    if (propertyRequirementsChanged) {
        const oldScore = getQualificationScore(originalLead);
        const newScore = getQualificationScore(lead);
        if (newScore !== oldScore) {
            const newStatus = getStatusFromScore(newScore);
            if(newStatus !== lead.status) {
                setSuggestedStatus(newStatus);
            } else {
                setSuggestedStatus(null);
            }
        } else {
          setSuggestedStatus(null);
        }
    } else {
      setSuggestedStatus(null);
    }
    
    setIsConfirmSaveOpen(true);
  };

  const confirmSave = async () => {
    if (!lead) return;
    setIsSaving(true);
    
    const finalLead = suggestedStatus ? { ...lead, status: suggestedStatus } : lead;

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Success",
      description: "Lead details saved successfully.",
    });

    const leadIndex = allLeadsData.findIndex(l => l.id === finalLead.id);
    if(leadIndex !== -1) {
        allLeadsData[leadIndex] = { ...finalLead, avatar: avatarPreview || finalLead.avatar };
    }
    
    setLead({ ...allLeadsData[leadIndex] });
    setOriginalLead({ ...allLeadsData[leadIndex] });

    setIsEditing(false);
    setIsSaving(false);
    setIsConfirmSaveOpen(false);
    setChangeSummary([]);
    setSuggestedStatus(null);
  };


  const handleCancel = () => {
    if (originalLead) {
      setLead({ ...originalLead });
      setAvatarPreview(originalLead.avatar);
    }
    setIsEditing(false);
  };

  const toggleActiveStatus = () => {
    if (!lead) return;
    const newStatus = lead.activeStatus === 'Active' ? 'Inactive' : 'Active';
    setLead(prev => prev ? ({ ...prev, activeStatus: newStatus }) : null);
    toast({
      title: "Status Updated",
      description: `Lead marked as ${newStatus.toLowerCase()}.`,
    });
  };
  
  const handleDeleteLead = () => {
    // In a real app, you'd make an API call to delete the lead
    toast({
      title: "Lead Deleted",
      description: `${lead?.firstName} ${lead?.lastName} has been deleted.`,
    });
    // For now, just navigate back to leads page
    // In a real app, you might want to redirect to a different page or handle state update
    window.location.href = '/leads';
  }

  const getStatusBadgeClass = (status: 'Hot' | 'Warm' | 'Cold' | null | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    switch (status) {
      case 'Hot': return 'bg-red-100 text-red-700 border-red-200';
      case 'Warm': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Cold': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!lead) {
      return (
          <div className="flex items-center justify-center h-screen">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  const handleStatusSave = (leadId: string, newStatus: 'Hot' | 'Warm' | 'Cold', note: string) => {
    if (!lead || lead.id !== leadId) return;

    handleStatusChange(newStatus);

    if (currentNote.content.trim()) {
        setNotes(prev => [currentNote, ...prev]);
    }
    const newCurrentNote: Note = {
        id: `note-${Date.now()}`,
        content: note,
        date: new Date().toISOString(),
    };
    setCurrentNote(newCurrentNote);
    
    toast({
        title: "Status updated",
        description: `Lead status changed to ${newStatus} and note added.`,
    });
    setIsStatusDialogOpen(false);
  };
  
  const formatValue = (field: string, value: any) => {
    if (field === 'Budget') {
      return `$${Number(value).toLocaleString()}`;
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    return String(value);
  }

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
        {isEditing ? (
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsStatusDialogOpen(true)}>
                <Zap className="mr-2 h-4 w-4" />
                <span>Change Status</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={toggleActiveStatus}>
                {lead.activeStatus === 'Active' ? (
                  <UserX className="mr-2 h-4 w-4" />
                ) : (
                  <UserCheck className="mr-2 h-4 w-4" />
                )}
                <span>Mark as {lead.activeStatus === 'Active' ? 'Inactive' : 'Active'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Lead</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-40">
        <section className="flex flex-col items-center py-6 text-center">
          <div className="relative mb-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview || undefined} alt={`${lead.firstName} ${lead.lastName}`} />
              <AvatarFallback>{lead.firstName.charAt(0)}{lead.lastName.charAt(0)}</AvatarFallback>
            </Avatar>
            {isEditing && (
                <>
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
              </>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <h2 className="text-2xl font-bold">{`${lead.firstName} ${lead.lastName}`}</h2>
            {isEditing ? (
              <Select value={lead.status} onValueChange={handleStatusChange}>
                <SelectTrigger className={cn("text-sm w-28", getStatusBadgeClass(lead.status))}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="Warm">Warm</SelectItem>
                  <SelectItem value="Cold">Cold</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className={cn("text-sm", getStatusBadgeClass(lead.status))}>{lead.status}</Badge>
            )}
          </div>
           {lead.activeStatus === 'Inactive' && !isEditing && (
              <Badge variant="secondary" className="mt-2">Inactive</Badge>
           )}
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
                <EditableInfoItem label="First Name" name="firstName" value={lead.firstName} isEditing={isEditing} onChange={handleInputChange} />
                <EditableInfoItem label="Last Name" name="lastName" value={lead.lastName} isEditing={isEditing} onChange={handleInputChange} />
                <EditableInfoItem label="Email" name="email" value={lead.email} isEditing={isEditing} onChange={handleInputChange} className="col-span-2" />
                <EditableInfoItem label="Phone Number" name="phone" value={lead.phone} isEditing={isEditing} onChange={handleInputChange} className="col-span-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <EditableInfoItem label="Property Type" name="propertyType" value={lead.propertyType} isEditing={isEditing} onSelectChange={handleSelectChange} />
                <EditableInfoItem label="Budget" name="budget" value={`$${lead.budget.toLocaleString('en-US')}`} isEditing={isEditing} onChange={handleInputChange} type="number" displayValue={lead.budget.toString()} />
                <EditableInfoItem label="Bedrooms" name="bedrooms" value={lead.bedrooms} isEditing={isEditing} onChange={handleInputChange} type="number" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {!isEditing && (
        <div className="fixed bottom-20 right-4 z-20 flex flex-col items-end gap-4">
            <ActionButton icon={FileText} label="Notes" onClick={() => setIsNotesOpen(true)} />
            <ActionButton icon={Send} label="Follow-up" onClick={() => setIsFollowUpOpen(true)} />
            <ActionButton icon={History} label="History" onClick={() => setIsHistoryOpen(true)} />
        </div>
      )}

      {isEditing && (
         <footer className="fixed bottom-0 left-0 right-0 grid grid-cols-2 gap-4 border-t bg-white p-4">
            <Button variant="outline" size="lg" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
            <Button variant="default" size="lg" className="bg-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
            </Button>
        </footer>
      )}
      <LeadNotesSheet 
        open={isNotesOpen}
        onOpenChange={setIsNotesOpen}
        lead={lead}
        notes={notes}
        currentNote={currentNote}
        setNotes={setNotes}
        setCurrentNote={setCurrentNote}
      />
      <LeadFollowUpSheet
        open={isFollowUpOpen}
        onOpenChange={setIsFollowUpOpen}
        lead={lead}
      />
      <LeadHistorySheet
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        lead={lead}
        history={communicationHistory}
      />
      <LeadStatusDialog 
        open={isStatusDialogOpen} 
        onOpenChange={setIsStatusDialogOpen}
        lead={{id: lead.id, name: `${lead.firstName} ${lead.lastName}`, status: lead.status}}
        onSave={handleStatusSave}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead
              for {lead.firstName} {lead.lastName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isConfirmSaveOpen} onOpenChange={setIsConfirmSaveOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the changes before saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 text-sm">
            <div>
                <h4 className="font-semibold mb-2">Changes:</h4>
                <ul className="list-disc list-inside space-y-1">
                    {changeSummary.map(change => (
                        <li key={change.field}>
                            <span className="font-medium">{change.field}:</span> {formatValue(change.field, change.oldValue)} &rarr; {formatValue(change.field, change.newValue)}
                        </li>
                    ))}
                    {avatarPreview !== originalLead?.avatar && <li>Avatar updated</li>}
                </ul>
            </div>
            {suggestedStatus && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800">Based on the updated property requirements, we suggest changing the lead status from 
                    <Badge variant="outline" className={cn("mx-1.5", getStatusBadgeClass(lead.status))}>{lead.status}</Badge> 
                    to 
                    <Badge variant="outline" className={cn("mx-1.5", getStatusBadgeClass(suggestedStatus))}>{suggestedStatus}</Badge>.</p>
                </div>
            )}
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setIsConfirmSaveOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function EditableInfoItem({ 
  label, 
  name, 
  value, 
  isEditing, 
  onChange, 
  onSelectChange, 
  className, 
  type = 'text', 
  displayValue 
}: { 
  label: string; 
  name?: string; 
  value: string | number; 
  isEditing: boolean; _
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  onSelectChange?: (name: string, value: string) => void;
  className?: string, 
  type?: string, 
  displayValue?: string 
}) {
  if (isEditing && name) {
    if (name === 'propertyType' && onSelectChange) {
      return (
        <div className={cn("grid gap-1", className)}>
          <p className="text-gray-500">{label}</p>
          <Select value={String(value)} onValueChange={(val) => onSelectChange(name, val)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Condo">Condo</SelectItem>
              <SelectItem value="Apartment">Apartment</SelectItem>
              <SelectItem value="House">House</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Land">Land</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }
    
    if (onChange) {
      return (
        <div className={cn("grid gap-1", className)}>
          <p className="text-gray-500">{label}</p>
          <Input 
            name={name} 
            type={type}
            value={displayValue ?? value} 
            onChange={onChange} 
            className="h-8 text-sm" 
            placeholder={label}
          />
        </div>
      )
    }
  }
  return <InfoItem label={label} value={value} className={className} />
}


function ActionButton({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string, onClick?: () => void }) {
  return (
    <div className="flex items-center gap-3">
        <div className="bg-card shadow-md rounded-lg px-3 py-2">
            <span className="font-semibold text-card-foreground text-sm">{label}</span>
        </div>
        <Button
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full bg-primary shadow-lg hover:bg-primary/90"
            aria-label={label}
            onClick={onClick}
        >
            <Icon className="h-6 w-6" />
        </Button>
    </div>
  );
}

type LeadNotesSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: typeof allLeadsData[0];
  notes: Note[];
  currentNote: Note;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
};

function LeadNotesSheet({ open, onOpenChange, lead, notes, currentNote, setNotes, setCurrentNote }: LeadNotesSheetProps) {
    const { toast } = useToast();
    const [noteContent, setNoteContent] = useState(currentNote.content);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    
    const isModified = noteContent !== currentNote.content;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to clipboard",
        });
    }

    const handleSaveNote = () => {
        const trimmedContent = noteContent.trim();
        if (!trimmedContent) {
            toast({
                variant: 'destructive',
                title: 'Note is empty',
                description: 'Please write a note before saving.',
            });
            return;
        }

        if (isCreatingNew) {
            // Saving a brand new note
            const newCurrentNote: Note = {
                id: `note-${Date.now()}`,
                content: trimmedContent,
                date: new Date().toISOString(),
            };
            setCurrentNote(newCurrentNote);
            setNoteContent(newCurrentNote.content);
            setIsCreatingNew(false);
            toast({
                title: 'Note saved',
                description: 'The new note has been saved.',
            });
        } else {
            // Updating the existing current note
            const updatedNote = {
                ...currentNote,
                content: trimmedContent,
                date: new Date().toISOString(), // Update timestamp on edit
            };
            setCurrentNote(updatedNote);
            setNoteContent(updatedNote.content);
            toast({
                title: 'Note updated',
                description: 'Your changes have been saved.',
            });
        }
    };

    const handleNewNoteClick = () => {
        if (currentNote.content.trim()) {
            setNotes(prevNotes => [currentNote, ...prevNotes]);
        }
        setCurrentNote({ id: '', content: '', date: '' });
        setNoteContent("");
        setIsCreatingNew(true);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }

    const getStatusBadgeClass = (status: 'Hot' | 'Warm' | 'Cold') => {
        switch (status) {
            case 'Hot': return 'bg-red-100 text-red-700 border-red-200';
            case 'Warm': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Cold': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [noteContent, open]);

     useEffect(() => {
        if (open) {
            setNoteContent(currentNote.content);
            setIsCreatingNew(false);
        }
    }, [open, currentNote]);

    const showSaveButton = isCreatingNew || (isModified && !isCreatingNew);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
                <SheetHeader className="flex flex-row items-center justify-between border-b px-4 py-3 shrink-0">
                     <div className='flex items-center'>
                         <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="mr-2">
                           <X className="h-6 w-6" />
                         </Button>
                        <SheetTitle>Lead Notes</SheetTitle>
                     </div>
                     <SheetDescription className="sr-only">
                       Manage notes for {lead.firstName} {lead.lastName}. You can add a new note, view the history of notes, and copy existing notes.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={lead.avatar} />
                            <AvatarFallback>{lead.firstName.charAt(0)}{lead.lastName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold">{lead.firstName} {lead.lastName}</h3>
                                <Badge variant="outline" className={cn("text-sm", getStatusBadgeClass(lead.status))}>{lead.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-500">{lead.phone}</p>
                            <p className="text-sm text-gray-500">{lead.email}</p>
                            <p className="text-xs text-gray-400 mt-1">Source: {lead.source} | Created: {lead.createdAt}</p>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-4">
                            <Textarea
                                ref={textareaRef}
                                placeholder="Start typing your note..."
                                className="border-0 focus-visible:ring-0 min-h-[100px] p-0 resize-none overflow-hidden"
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                            />
                             <div className="flex gap-2 justify-end mt-2">
                                <Button variant="ghost" size="icon">
                                    <Mic className="h-5 w-5 text-gray-500" />
                                </Button>
                                {showSaveButton ? (
                                    <Button onClick={handleSaveNote}>Save Note</Button>
                                ) : (
                                    <Button onClick={handleNewNoteClick}>New Note</Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div>
                        <h4 className="text-lg font-semibold mb-4">Note History</h4>
                        <div className="space-y-4">
                            {notes.map(note => (
                                <Card key={note.id} className="bg-gray-50">
                                    <CardContent className="p-4 relative">
                                        <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{note.content}</p>
                                        <p className="text-xs text-gray-400">{format(new Date(note.date), "MMMM d, yyyy - h:mm a")}</p>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="absolute bottom-2 right-2 h-8 w-8"
                                            onClick={() => handleCopy(note.content)}
                                        >
                                            <Copy className="h-4 w-4 text-gray-500" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

type LeadFollowUpSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: typeof allLeadsData[0];
};

function LeadFollowUpSheet({ open, onOpenChange, lead }: LeadFollowUpSheetProps) {
    
    const getStatusBadgeClass = (status: 'Hot' | 'Warm' | 'Cold') => {
        switch (status) {
            case 'Hot': return 'bg-red-100 text-red-700 border-red-200';
            case 'Warm': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Cold': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };
    
    const aiMessage = `Hi ${lead.firstName}, thanks for your interest in the downtown condo. I'd love to schedule a quick call to discuss your requirements and see how I can help you find your perfect home. Are you available for a brief chat sometime this week?`;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
                <SheetHeader className="flex flex-row items-center justify-between border-b px-4 py-3 shrink-0">
                     <div className='flex items-center'>
                         <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="mr-2">
                           <ArrowLeft className="h-6 w-6" />
                         </Button>
                        <SheetTitle>Send to WhatsApp</SheetTitle>
                     </div>
                     <SheetDescription className="sr-only">
                       Send an AI-generated follow-up message to {lead.firstName} {lead.lastName}.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={lead.avatar} />
                            <AvatarFallback>{lead.firstName.charAt(0)}{lead.lastName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold">{lead.firstName} {lead.lastName}</h3>
                                <Badge variant="outline" className={cn("text-sm", getStatusBadgeClass(lead.status))}>{lead.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-500">{lead.phone}</p>
                            <p className="text-sm text-gray-500">{lead.email}</p>
                            <p className="text-xs text-gray-400 mt-1">Source: {lead.source} | Created: {lead.createdAt}</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-2">AI-Generated Follow-up Message</h4>
                         <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-4">
                                <p className="text-blue-900">{aiMessage}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-3">
                         <Button variant="outline" className="w-full h-12">
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Regenerate Message
                        </Button>
                         <Button className="w-full h-12 bg-green-500 hover:bg-green-600 text-white">
                            <MessageSquare className="mr-2 h-5 w-5" />
                            Send to WhatsApp
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

type HistoryItem = {
    id: string;
    type: string;
    title: string;
    date: string;
    description: string;
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
};

type LeadHistorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: typeof allLeadsData[0];
  history: HistoryItem[];
};

function LeadHistorySheet({ open, onOpenChange, lead, history }: LeadHistorySheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
                <SheetHeader className="flex flex-row items-center justify-between border-b px-4 py-3 shrink-0">
                     <div className='flex items-center'>
                         <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="mr-2">
                           <X className="h-6 w-6" />
                         </Button>
                        <SheetTitle>Communication History</SheetTitle>
                     </div>
                     <SheetDescription className="sr-only">
                       View the communication history for {lead.firstName} {lead.lastName}.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                     <Card>
                        <CardContent className="p-6">
                            <div className="relative">
                                {history.map((item, index) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={cn("rounded-full h-10 w-10 flex items-center justify-center", item.bgColor)}>
                                                <item.icon className={cn("h-5 w-5", item.iconColor)} />
                                            </div>
                                            {index < history.length - 1 && (
                                                <div className="w-px flex-1 bg-gray-200 my-2"></div>
                                            )}
                                        </div>
                                        <div className="pb-8">
                                            <p className="font-semibold">{item.title}</p>
                                            <p className="text-sm text-gray-500 mb-1">{format(new Date(item.date), "MMM d, yyyy - h:mm a")}</p>
                                            <p className="text-sm text-gray-600">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SheetContent>
        </Sheet>
    );
}

    
    

    

    