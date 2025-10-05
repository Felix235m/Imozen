
"use client";

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Upload, History, FileText, Send, Edit, UserX, UserCheck, Save, X, Mic, Copy, RefreshCw, MessageSquare } from 'lucide-react';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

// Mock data - in a real app this would be fetched based on the `id` param
const initialLeadData = {
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


export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lead, setLead] = useState(initialLeadData);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(lead.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLead(prev => ({ ...prev, [name]: name === 'budget' || name === 'bedrooms' ? Number(value) : value }));
  };

  const handleStatusChange = (value: 'Hot' | 'Warm' | 'Cold') => {
    setLead(prev => ({ ...prev, status: value }));
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

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Success",
      description: "Lead details saved successfully.",
    });
    // This is just to update the mock data. In a real app, you'd refetch.
    Object.assign(initialLeadData, lead, { avatar: avatarPreview || initialLeadData.avatar });

    setIsEditing(false);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setLead(initialLeadData);
    setAvatarPreview(initialLeadData.avatar);
    setIsEditing(false);
  };

  const toggleActiveStatus = () => {
    const newStatus = lead.activeStatus === 'Active' ? 'Inactive' : 'Active';
    setLead(prev => ({ ...prev, activeStatus: newStatus }));
    toast({
      title: "Status Updated",
      description: `Lead marked as ${newStatus.toLowerCase()}.`,
    });
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
        {isEditing ? (
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
            <Edit className="h-5 w-5" />
          </Button>
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
            {isEditing ? (
              <div className='flex gap-2'>
                <Input name="firstName" value={lead.firstName} onChange={handleInputChange} placeholder="First Name" className="text-center" />
                <Input name="lastName" value={lead.lastName} onChange={handleInputChange} placeholder="Last Name" className="text-center"/>
              </div>
            ) : (
              <h2 className="text-2xl font-bold">{`${lead.firstName} ${lead.lastName}`}</h2>
            )}
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
                <EditableInfoItem label="Property Type" name="propertyType" value={lead.propertyType} isEditing={isEditing} onChange={handleInputChange} />
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
            <ActionButton icon={History} label="History" />
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
        notes={initialNotes}
        currentNote={initialCurrentNote}
      />
      <LeadFollowUpSheet
        open={isFollowUpOpen}
        onOpenChange={setIsFollowUpOpen}
        lead={lead}
      />
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

function EditableInfoItem({ label, name, value, isEditing, onChange, className, type = 'text', displayValue }: { label: string; name?: string; value: string | number; isEditing: boolean; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; className?: string, type?: string, displayValue?: string }) {
  if (isEditing && name && onChange) {
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

type Note = {
    id: string;
    content: string;
    date: string;
};

type LeadNotesSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: typeof initialLeadData;
  notes: Note[];
  currentNote: Note;
};

function LeadNotesSheet({ open, onOpenChange, lead, notes: initialNotesProp, currentNote: initialCurrentNote }: LeadNotesSheetProps) {
    const { toast } = useToast();
    const [notes, setNotes] = useState(initialNotesProp);
    const [currentNote, setCurrentNote] = useState(initialCurrentNote);
    const [newNoteContent, setNewNoteContent] = useState(initialCurrentNote.content);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to clipboard",
        });
    }

    const handleUpdateNote = () => {
        const trimmedContent = newNoteContent.trim();
        if (!trimmedContent) {
            toast({
                variant: 'destructive',
                title: 'Note is empty',
                description: 'Please write a note before updating.',
            });
            return;
        }

        // If content is unchanged, do nothing.
        if(trimmedContent === currentNote.content) {
            toast({
                title: 'No changes detected',
                description: 'The note content is the same.',
            });
            return;
        }

        // The old "current" note is added to history
        setNotes(prevNotes => [currentNote, ...prevNotes]);

        // The new content becomes the new "current" note
        const newCurrentNote: Note = {
            id: `note-${Date.now()}`,
            content: newNoteContent,
            date: new Date().toISOString(),
        };
        setCurrentNote(newCurrentNote);
        
        toast({
            title: 'Note updated',
            description: 'The previous note has been moved to history.',
        });
    };

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
    }, [newNoteContent, open]);

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
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                            />
                             <div className="flex gap-2 justify-end mt-2">
                                <Button variant="ghost" size="icon">
                                    <Mic className="h-5 w-5 text-gray-500" />
                                </Button>
                                <Button onClick={handleUpdateNote}>
                                    Update Note
                                </Button>
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
  lead: typeof initialLeadData;
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-6 w-6" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            Something
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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

    

    
