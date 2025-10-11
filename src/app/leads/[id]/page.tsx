
"use client";

import * as React from 'react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
import { type LeadData } from '@/lib/leads-data';
import { LeadFollowUpSheet } from '@/components/leads/lead-follow-up-sheet';
import { callLeadApi } from '@/lib/auth-api';

type Note = {
    id: string;
    content: string;
    date: string;
};

type ChangeSummary = {
  field: string;
  oldValue: any;
  newValue: any;
};

export default function LeadDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [suggestedStatus, setSuggestedStatus] = useState<LeadData['temperature'] | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note>({ id: '', content: '', date: '' });
  
  const communicationHistory = useMemo(() => lead?.communication_history || [], [lead]);

  const fetchLeadDetails = useCallback(async () => {
    try {
      const response = await callLeadApi('get_lead_details', { lead_id: id });
      const currentLeadData = Array.isArray(response) && response.length > 0 ? response[0] : null;

      if (!currentLeadData) {
        throw new Error('Lead not found');
      }
      
      setLead(currentLeadData);
      setOriginalLead(currentLeadData);
      setAvatarPreview(currentLeadData.image_url);
      setNotes(currentLeadData.management.agent_notes ? [{id: 'initial', content: currentLeadData.management.agent_notes, date: currentLeadData.created_at}] : []);
      setCurrentNote({ id: '', content: '', date: '' });

      if (isEditMode) {
        setIsEditing(true);
      }
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not load lead details.' });
       router.push('/leads');
    }
  }, [id, toast, router, isEditMode]);

  useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (lead) {
      const keys = name.split('.');
      setLead(prev => {
        if (!prev) return null;
        const newLead = { ...prev };
        let current: any = newLead;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = name.includes('budget') || name.includes('bedrooms') ? Number(value) : value;
        return newLead;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
     if (lead) {
        const keys = name.split('.');
        setLead(prev => {
            if (!prev) return null;
            const newLead = { ...prev };
            let current: any = newLead;
            for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newLead;
        });
     }
  };

  const handleTemperatureChange = (value: 'Hot' | 'Warm' | 'Cold') => {
    if (lead) {
        setLead(prev => prev ? ({ ...prev, temperature: value }) : null);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        
        callLeadApi('upload_lead_image', { lead_id: id, image: result })
            .then(() => toast({ title: "Avatar updated" }))
            .catch(() => toast({ variant: "destructive", title: "Error", description: "Could not upload avatar." }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getQualificationScore = (leadData: LeadData) => {
    let score = 0;
    if (leadData.property.budget > 900000) score += 2;
    else if (leadData.property.budget > 500000) score += 1;

    if (leadData.property.bedrooms >= 4) score += 2;
    else if (leadData.property.bedrooms >= 2) score += 1;
    
    return score;
  }

  const getStatusFromScore = (score: number): LeadData['temperature'] => {
    if (score >= 3) return 'Hot';
    if (score >= 1) return 'Warm';
    return 'Cold';
  }

  const handleSave = async () => {
    if (!lead || !originalLead) return;

    const changes: ChangeSummary[] = [];
    
    const compareObjects = (obj1: any, obj2: any, prefix = '') => {
        for (const key in obj1) {
            if (typeof obj1[key] === 'object' && obj1[key] !== null && !Array.isArray(obj1[key])) {
                 compareObjects(obj1[key], obj2[key], `${prefix}${key}.`);
            } else if (obj1[key] !== obj2[key]) {
                changes.push({
                    field: (prefix + key).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                    oldValue: obj2[key],
                    newValue: obj1[key]
                });
            }
        }
    }
    compareObjects(lead, originalLead);

    if (changes.length === 0 && avatarPreview === originalLead.image_url) {
      setIsEditing(false);
      return;
    }
    
    setChangeSummary(changes);
    
    const propertyRequirementsChanged = changes.some(c => ['Property.Type', 'Property.Budget', 'Property.Bedrooms'].includes(c.field));

    if (propertyRequirementsChanged) {
        const oldScore = getQualificationScore(originalLead);
        const newScore = getQualificationScore(lead);
        if (newScore !== oldScore) {
            const newStatus = getStatusFromScore(newScore);
            if(newStatus !== lead.temperature) {
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
    
    const finalLead = suggestedStatus ? { ...lead, temperature: suggestedStatus } : lead;

    try {
        await callLeadApi('edit_lead', { lead_id: id, ...finalLead });
        toast({
          title: "Success",
          description: "Lead details saved successfully.",
        });
        setOriginalLead(finalLead);
        setLead(finalLead);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save lead details.' });
    } finally {
        setIsEditing(false);
        setIsSaving(false);
        setIsConfirmSaveOpen(false);
        setChangeSummary([]);
        setSuggestedStatus(null);
    }
  };


  const handleCancel = () => {
    if (originalLead) {
      setLead({ ...originalLead });
      setAvatarPreview(originalLead.image_url);
    }
    setIsEditing(false);
  };

  const toggleActiveStatus = async () => {
    if (!lead) return;
    const newStatus = lead.status === 'Active' ? 'Inactive' : 'Active';
    try {
        await callLeadApi('edit_lead', { lead_id: id, status: newStatus });
        setLead(prev => prev ? ({ ...prev, status: newStatus }) : null);
        toast({
          title: "Status Updated",
          description: `Lead marked as ${newStatus.toLowerCase()}.`,
        });
    } catch(error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update status.' });
    }
  };
  
  const handleDeleteLead = async () => {
    try {
        await callLeadApi('delete_lead', { lead_id: id });
        toast({
          title: "Lead Deleted",
          description: `${lead?.name} has been deleted.`,
        });
        router.push('/leads');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete lead.' });
    } finally {
        setIsDeleteDialogOpen(false);
    }
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
    if (!lead || lead.lead_id !== leadId) return;

    callLeadApi('edit_lead', { lead_id: leadId, temperature: newStatus, note }).then(() => {
        handleTemperatureChange(newStatus);

        const newNote: Note = {
            id: `note-${Date.now()}`,
            content: note,
            date: new Date().toISOString(),
        };
        setNotes(prev => [newNote, ...prev]);
        
        toast({
            title: "Status updated",
            description: `Lead status changed to ${newStatus} and note added.`,
        });
        setIsStatusDialogOpen(false);
    }).catch(() => {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update status.' });
    });
  };
  
  const formatValue = (field: string, value: any) => {
    if (field.toLowerCase().includes('budget')) {
      return `€${Number(value).toLocaleString()}`;
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
                {lead.status === 'Active' ? (
                  <UserX className="mr-2 h-4 w-4" />
                ) : (
                  <UserCheck className="mr-2 h-4 w-4" />
                )}
                <span>Mark as {lead.status === 'Active' ? 'Inactive' : 'Active'}</span>
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
              <AvatarImage src={avatarPreview || undefined} alt={lead.name} />
              <AvatarFallback>{lead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
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
            <h2 className="text-2xl font-bold">{lead.name}</h2>
            {isEditing ? (
              <Select value={lead.temperature} onValueChange={handleTemperatureChange}>
                <SelectTrigger className={cn("text-sm w-28", getStatusBadgeClass(lead.temperature))}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="Warm">Warm</SelectItem>
                  <SelectItem value="Cold">Cold</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className={cn("text-sm", getStatusBadgeClass(lead.temperature))}>{lead.temperature}</Badge>
            )}
          </div>
           {lead.status === 'Inactive' && !isEditing && (
              <Badge variant="secondary" className="mt-2">Inactive</Badge>
           )}
          <div className='flex items-center gap-2 text-sm text-gray-500 mt-1'>
            <span>ID: {lead.lead_id}</span>
            <span>&bull;</span>
            <span>Created: {lead.created_at_formatted}</span>
          </div>
        </section>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <EditableInfoItem label="Name" name="name" value={lead.name} isEditing={isEditing} onChange={handleInputChange} className="col-span-2" />
                <EditableInfoItem label="Email" name="contact.email" value={lead.contact.email} isEditing={isEditing} onChange={handleInputChange} className="col-span-2" />
                <EditableInfoItem label="Phone Number" name="contact.phone" value={lead.contact.phone.toString()} isEditing={isEditing} onChange={handleInputChange} className="col-span-2" />
                <EditableInfoItem label="Language" name="contact.language" value={lead.contact.language} isEditing={isEditing} onSelectChange={handleSelectChange} selectOptions={['English', 'Portuguese', 'French']} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <EditableInfoItem label="Property Type" name="property.type" value={lead.property.type} isEditing={isEditing} onSelectChange={handleSelectChange} selectOptions={['Condo', 'Apartment', 'House', 'Commercial', 'Land']} />
                <EditableInfoItem label="Budget" name="property.budget" value={lead.property.budget_formatted} isEditing={isEditing} onChange={handleInputChange} type="number" displayValue={lead.property.budget.toString()} />
                <EditableInfoItem label="Bedrooms" name="property.bedrooms" value={lead.property.bedrooms} isEditing={isEditing} onChange={handleInputChange} type="number" />
                 <InfoItem label="Locations" value={lead.property.locations.join(', ')} className="col-span-2" />
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
        setNotes={setNotes}
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
        lead={{id: lead.lead_id, name: lead.name, status: lead.temperature}}
        onSave={handleStatusSave}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead
              for {lead.name}.
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
                    {avatarPreview !== originalLead?.image_url && <li>Avatar updated</li>}
                </ul>
            </div>
            {suggestedStatus && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800">Based on the updated property requirements, we suggest changing the lead status from 
                    <Badge variant="outline" className={cn("mx-1.5", getStatusBadgeClass(lead.temperature))}>{lead.temperature}</Badge> 
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
  displayValue,
  selectOptions
}: { 
  label: string; 
  name?: string; 
  value: string | number; 
  isEditing: boolean; 
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  onSelectChange?: (name: string, value: string) => void;
  className?: string; 
  type?: string; 
  displayValue?: string;
  selectOptions?: string[];
}) {
  if (isEditing && name) {
    if (selectOptions && onSelectChange) {
      return (
        <div className={cn("grid gap-1", className)}>
          <p className="text-gray-500">{label}</p>
          <Select value={String(value)} onValueChange={(val) => onSelectChange(name, val)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
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
  lead: LeadData;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
};

function LeadNotesSheet({ open, onOpenChange, lead, notes, setNotes }: LeadNotesSheetProps) {
    const { toast } = useToast();
    const [noteContent, setNoteContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to clipboard",
        });
    }

    const handleSaveNote = async () => {
        const trimmedContent = noteContent.trim();
        if (!trimmedContent) {
            toast({
                variant: 'destructive',
                title: 'Note is empty',
                description: 'Please write a note before saving.',
            });
            return;
        }
        setIsSaving(true);
        try {
            await callLeadApi('edit_lead', { lead_id: lead.lead_id, note: trimmedContent });
            const newNote: Note = {
                id: `note-${Date.now()}`,
                content: trimmedContent,
                date: new Date().toISOString(),
            };
            setNotes(prev => [newNote, ...prev]);
            setNoteContent('');
            toast({ title: "Note saved successfully" });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save note.' });
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [noteContent, open]);

    const getStatusBadgeClass = (status: 'Hot' | 'Warm' | 'Cold') => {
        switch (status) {
            case 'Hot': return 'bg-red-100 text-red-700 border-red-200';
            case 'Warm': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Cold': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

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
                       Manage notes for {lead.name}.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={lead.image_url} />
                            <AvatarFallback>{lead.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold">{lead.name}</h3>
                                <Badge variant="outline" className={cn("text-sm", getStatusBadgeClass(lead.temperature))}>{lead.temperature}</Badge>
                            </div>
                            <p className="text-sm text-gray-500">{lead.contact.phone}</p>
                            <p className="text-sm text-gray-500">{lead.contact.email}</p>
                            <p className="text-xs text-gray-400 mt-1">Source: {lead.management.source} | Created: {lead.created_at_formatted}</p>
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
                                <Button onClick={handleSaveNote} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Note"}
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
  lead: LeadData;
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
                       View the communication history for {lead.name}.
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

    