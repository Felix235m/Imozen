
"use client";

import * as React from 'react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MoreVertical, Upload, History, FileText, Send, Edit, Save, X, Mic, Copy, RefreshCw, MessageSquare, Phone, Mail, Trash2, Zap, ChevronsUpDown, TrendingUp, Search, Handshake, Eye, Briefcase, DollarSign, FileSignature, CheckCircle2, XCircle, Ban, Target, BadgeHelp, ArrowRight, UserPlus, PhoneCall, UserCheck, Calendar, Home, Tag, MessageCircle as MessageCircleIcon, FileText as Contract, PartyPopper, ThumbsDown, UserX, Building, Warehouse, Mountain, Minus, Plus } from 'lucide-react';
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
  DropdownMenuCheckboxItem,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { type LeadData } from '@/lib/leads-data';
import { LeadFollowUpSheet } from '@/components/leads/lead-follow-up-sheet';
import { callLeadApi, callLeadStatusApi } from '@/lib/auth-api';
import { transformWebhookResponseToLeadData } from '@/lib/lead-transformer';
import { Label } from '@/components/ui/label';

type Note = {
    id?: string;
    note_id?: string;
    content?: string;
    date: string;
    created_at_formatted?: string;
    note?: string;
    created_by?: string;
};

type CurrentNote = {
    note_id: string;
    note: string;
    created_at_formatted: string;
    created_by: string;
} | null;


type ChangeSummary = {
  field: string;
  oldValue: any;
  newValue: any;
};

type LeadStage =
  | 'New Lead'
  | 'Contacted'
  | 'Qualified'
  | 'Property Viewing Scheduled'
  | 'Property Viewed'
  | 'Offer Made'
  | 'Negotiation'
  | 'Under Contract'
  | 'Converted'
  | 'Lost'
  | 'Not Interested';

const LEAD_STAGES: { value: LeadStage; label: string; color: string; description: string, icon: React.ElementType }[] = [
  { value: 'New Lead', label: 'New Lead', color: 'bg-blue-100 text-blue-700', description: 'Just received, not yet contacted', icon: UserPlus },
  { value: 'Contacted', label: 'Contacted', color: 'bg-purple-100 text-purple-700', description: 'Initial contact made', icon: PhoneCall },
  { value: 'Qualified', label: 'Qualified', color: 'bg-indigo-100 text-indigo-700', description: 'Lead is qualified and interested', icon: UserCheck },
  { value: 'Property Viewing Scheduled', label: 'Viewing Scheduled', color: 'bg-cyan-100 text-cyan-700', description: 'Property viewing appointment set', icon: Calendar },
  { value: 'Property Viewed', label: 'Property Viewed', color: 'bg-teal-100 text-teal-700', description: 'Lead has viewed property', icon: Home },
  { value: 'Offer Made', label: 'Offer Made', color: 'bg-orange-100 text-orange-700', description: 'Lead made an offer', icon: Tag },
  { value: 'Negotiation', label: 'Negotiation', color: 'bg-yellow-100 text-yellow-700', description: 'In negotiation phase', icon: MessageCircleIcon },
  { value: 'Under Contract', label: 'Under Contract', color: 'bg-lime-100 text-lime-700', description: 'Contract signed, pending closing', icon: FileSignature },
  { value: 'Converted', label: 'Converted', color: 'bg-green-100 text-green-700', description: 'Deal successfully closed', icon: PartyPopper },
  { value: 'Lost', label: 'Lost', color: 'bg-red-100 text-red-700', description: 'Deal lost', icon: ThumbsDown },
  { value: 'Not Interested', label: 'Not Interested', color: 'bg-gray-100 text-gray-700', description: 'Lead no longer interested', icon: UserX },
];

const allLocations = [
    { value: "lisbon", label: "Lisbon" },
    { value: "porto", label: "Porto" },
    { value: "faro", label: "Faro" },
    { value: "coimbra", label: "Coimbra" },
    { value: "braga", label: "Braga" },
    { value: "aveiro", label: "Aveiro" },
    { value: "sintra", label: "Sintra" },
    { value: "cascais", label: "Cascais" },
    { value: "funchal", label: "Funchal" },
    { value: "guimaraes", label: "Guimarães" }
];

const propertyTypes = [
  { name: "Apartment", icon: Building },
  { name: "House", icon: Home },
  { name: "Commercial", icon: Warehouse },
  { name: "Land", icon: Mountain },
];


export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [isEditing, setIsEditing] = useState(false);

  const [lead, setLead] = useState<LeadData | null>(null);
  const [originalLead, setOriginalLead] = useState<LeadData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [isLeadStageDialogOpen, setIsLeadStageDialogOpen] = useState(false);
  const [isStageConfirmDialogOpen, setIsStageConfirmDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<LeadStage | null>(null);

  const [changeSummary, setChangeSummary] = useState<ChangeSummary[]>([]);
  const [suggestedStatus, setSuggestedStatus] = useState<LeadData['temperature'] | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<CurrentNote>(null);
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFetchingNotes, setIsFetchingNotes] = useState(false);
  const [stageChangeNote, setStageChangeNote] = useState('');
  
  const communicationHistory = useMemo(() => lead?.communication_history || [], [lead]);
  
  const leadToDeleteName = useMemo(() => {
    if (!lead) return '';
    return lead.name;
  }, [lead]);

  const parsePhoneNumber = useCallback((fullPhoneNumber: string | number | null | undefined) => {
    const phoneStr = String(fullPhoneNumber || '');
    const match = phoneStr.match(/\((.*?)\)\s*(.*)/);
    if (match) {
        return { code: match[1], number: match[2] };
    }
    const codeMatch = phoneStr.match(/^\+(\d{1,3})/);
    if (codeMatch) {
        return { code: codeMatch[0], number: phoneStr.substring(codeMatch[0].length).trim() };
    }
    return { code: '+351', number: phoneStr };
  }, []);

  // Normalize location names to match dropdown values
  const normalizeLocations = useCallback((locations: string[]) => {
    return locations.map(loc => {
      const normalized = loc.toLowerCase();
      // Find matching location in allLocations array
      const match = allLocations.find(
        l => l.label.toLowerCase() === normalized || l.value.toLowerCase() === normalized
      );
      return match ? match.value : normalized;
    });
  }, []);

  const fetchLeadDetails = useCallback(async () => {
    try {
      const response = await callLeadApi('get_lead_details', { lead_id: id });
      const currentLeadData = Array.isArray(response) && response.length > 0 ? response[0] : null;

      if (!currentLeadData) {
        throw new Error('Lead not found');
      }

      // Normalize locations to match dropdown values
      if (currentLeadData.property?.locations) {
        currentLeadData.property.locations = normalizeLocations(currentLeadData.property.locations);
      }

      setLead(currentLeadData);
      setOriginalLead(JSON.parse(JSON.stringify(currentLeadData)));
      setAvatarPreview(currentLeadData.image_url);

      const { code, number } = parsePhoneNumber(currentLeadData.contact.phone);
      setPhoneCountryCode(code);
      setPhoneNumber(number);

      const history = (currentLeadData.notes || [])
        .filter((item: any) => item.type === 'note' && item.description !== currentLeadData.management.agent_notes)
        .map((item: any) => ({
            id: item.id,
            content: item.description,
            date: item.date,
        }));
      setNotes(history);

    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not load lead details.' });
       router.push('/leads');
    }
  }, [id, toast, router, parsePhoneNumber, normalizeLocations]);
  
  const prepareSaveChanges = useCallback(() => {
    if (!lead || !originalLead) return;
  
    const findChanges = (
      original: Record<string, any>,
      current: Record<string, any>,
      prefix = ''
    ): ChangeSummary[] => {
      let changes: ChangeSummary[] = [];
  
      for (const key in original) {
        if (['row_number', 'lead_id', 'created_at', 'created_at_formatted', 'next_follow_up', 'image_url', 'communication_history', 'management', 'purchase', 'status'].includes(key)) continue;
  
        const originalValue = original[key];
        let currentValue = current[key];
        const fieldName = prefix ? `${prefix}.${key}` : key;
  
        if (fieldName === 'contact.phone') {
          currentValue = `(${phoneCountryCode}) ${phoneNumber}`;
        }
        
        if (typeof originalValue === 'object' && originalValue !== null && !Array.isArray(originalValue)) {
            changes = changes.concat(findChanges(originalValue, currentValue, fieldName));
        } else if (JSON.stringify(originalValue) !== JSON.stringify(currentValue)) {
            changes.push({
                field: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                oldValue: Array.isArray(originalValue) ? originalValue.join(', ') : originalValue,
                newValue: Array.isArray(currentValue) ? currentValue.join(', ') : currentValue,
            });
        }
      }
      return changes;
    };
  
    const changes = findChanges(originalLead, { ...lead, contact: { ...lead.contact, phone: `(${phoneCountryCode}) ${phoneNumber}` }});
  
    setChangeSummary(changes);
  
    if (changes.length > 0) {
      setIsConfirmSaveOpen(true);
    } else {
      toast({ title: 'No Changes', description: 'No changes to save.' });
      setIsEditing(false);
    }
  }, [lead, originalLead, phoneCountryCode, phoneNumber, toast]);

  useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);

  useEffect(() => {
    const editMode = searchParams.get('edit') === 'true';
    if (editMode) {
      setIsEditing(true);
      // Remove the query parameter from URL without triggering a page reload
      router.replace(`/leads/${id}`, { scroll: false });
    }
  }, [searchParams, id, router]);

  useEffect(() => {
    if (isEditing && lead) {
        const isBedroomsDisabled = lead.property.type === 'Commercial' || lead.property.type === 'Land';
        if (isBedroomsDisabled && lead.property.bedrooms !== 0) {
            setLead(prev => prev ? {...prev, property: {...prev.property, bedrooms: 0}} : null);
        }
    }
  }, [isEditing, lead?.property.type]);


  if (!lead || !originalLead) {
      return (
          <div className="flex items-center justify-center h-screen">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  function getCroppedImg(image: HTMLImageElement, crop: Crop): Promise<string> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return Promise.reject(new Error('Failed to get canvas context'));
    }

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );
    return new Promise((resolve) => {
        resolve(canvas.toDataURL('image/jpeg'));
    });
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined) 
      const reader = new FileReader()
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''))
      reader.readAsDataURL(e.target.files[0]);
      setIsCropModalOpen(true);
      e.target.value = '';
    }
  };
  
  const handleSaveCrop = async () => {
    if (!completedCrop || !imgRef.current) {
        return;
    }
    const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop);
    setAvatarPreview(croppedImageUrl);
    setIsCropModalOpen(false);
    setImgSrc('');

    try {
        await callLeadApi('upload_lead_image', { lead_id: id, image: croppedImageUrl });
        toast({ title: "Avatar updated successfully" });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not upload avatar." });
        setAvatarPreview(originalLead?.image_url || null);
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
    setCompletedCrop(crop);
  }

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

  const handleStatusSave = (leadId: string, newStatus: 'Hot' | 'Warm' | 'Cold', note: string) => {
    if (!lead || lead.lead_id !== leadId) return;

    const reconstructedPhone = `(${phoneCountryCode}) ${phoneNumber}`;

    const fullPayload = {
        ...lead,
        temperature: newStatus,
        note: note,
        contact: {
            ...lead.contact,
            phone: reconstructedPhone as any,
        },
    };

    callLeadStatusApi(leadId, "change_priority", fullPayload).then((response) => {
        // Transform webhook response to frontend LeadData format
        const transformedLead = transformWebhookResponseToLeadData(response);

        if (transformedLead) {
            // Update lead with all server data
            setLead(transformedLead);
            setOriginalLead(JSON.parse(JSON.stringify(transformedLead)));
        } else {
            // Fallback: update only temperature if transformation fails
            setLead(prev => prev ? ({ ...prev, temperature: newStatus }) : null);
            setOriginalLead(prev => prev ? JSON.parse(JSON.stringify({ ...prev, temperature: newStatus })) : null);
        }

        const newNote: Note = {
            id: `note-${Date.now()}`,
            content: note,
            date: new Date().toISOString(),
        };
        setNotes(prev => [newNote, ...prev]);

        toast({
            title: "Priority updated",
            description: `Lead priority changed to ${newStatus} and note added.`,
        });
        setIsStatusDialogOpen(false);
    }).catch((error) => {
        console.error('Priority update error:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update priority.' });
    });
  };
  
  const handleStageSelect = (newStage: LeadStage) => {
    const currentStage = getLeadStage(lead);
    if (newStage !== currentStage) {
      setSelectedStage(newStage);
      setIsStageConfirmDialogOpen(true);
      setIsLeadStageDialogOpen(false);
      setStageChangeNote(''); // Reset note on new selection
    }
  };

  const confirmLeadStageChange = async () => {
    if (!lead || !selectedStage) return;

    try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('sessionToken');
        if (!token) throw new Error('No authentication token found');

        const webhookUrl = 'https://eurekagathr.app.n8n.cloud/webhook/domain/lead-status';
        const webhookPayload = {
            lead_id: lead.lead_id,
            operation: 'status_change',
            status: selectedStage,
            note: stageChangeNote
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(webhookPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to update lead status');
        }
        
        setLead(prev => prev ? ({ ...prev, status: selectedStage, lead_stage: selectedStage } as any) : null);
        setOriginalLead(prev => prev ? JSON.parse(JSON.stringify({ ...prev, status: selectedStage, lead_stage: selectedStage })) : null);

        toast({ title: "Status Updated", description: `Lead status changed to "${selectedStage}".` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not update lead status.' });
    } finally {
        setIsStageConfirmDialogOpen(false);
        setSelectedStage(null);
    }
  };

  const handleSaveLeadChanges = async () => {
    if (!lead) return;

    setIsSaving(true);
    setIsConfirmSaveOpen(false);

    try {
      const reconstructedPhone = `(${phoneCountryCode}) ${phoneNumber}`;

      const updatedLeadData = {
        ...lead,
        contact: {
          ...lead.contact,
          phone: reconstructedPhone,
        },
      };

      await callLeadApi('edit_lead', updatedLeadData);

      setOriginalLead(JSON.parse(JSON.stringify(updatedLeadData)));

      toast({ title: 'Success', description: 'Lead updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update lead.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenNotes = async () => {
    setIsFetchingNotes(true);
    try {
      const response = await callLeadApi('get_notes', { lead_id: id });
      const notesData = Array.isArray(response) && response.length > 0 ? response[0] : null;

      if (notesData && notesData.success) {
        if (notesData.current_note) {
            setCurrentNote(notesData.current_note);
        }
        setNotes(notesData.notes || []);
        setIsNotesOpen(true);
      } else {
        throw new Error('Could not fetch notes.');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load notes.' });
    } finally {
      setIsFetchingNotes(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  const isBedroomsDisabled = lead.property.type === 'Commercial' || lead.property.type === 'Land';

  // Map the 'status' field from API to lead_stage for display
  const getLeadStage = (leadData: LeadData | null): LeadStage | undefined => {
    const stage = (leadData as any)?.status || (leadData as any)?.lead_stage;
    return stage;
  };
  
  const currentLeadStage = getLeadStage(lead);
  const currentStageInfo = currentLeadStage ? LEAD_STAGES.find(s => s.value === currentLeadStage) : undefined;
  const selectedStageInfo = selectedStage ? LEAD_STAGES.find(s => s.value === selectedStage) : undefined;

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center">
          <Link href="/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="ml-4 text-xl font-semibold">{isEditing ? 'Edit Lead' : 'Lead Details'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => {
                setLead(originalLead ? JSON.parse(JSON.stringify(originalLead)) : null);
                if (originalLead) {
                  const { code, number } = parsePhoneNumber(originalLead.contact.phone);
                  setPhoneCountryCode(code);
                  setPhoneNumber(number);
                }
                setIsEditing(false);
              }}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={prepareSaveChanges} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={handleEditClick}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Lead</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsStatusDialogOpen(true)}>
                  <Zap className="mr-2 h-4 w-4" />
                  <span>Priority (hot/warm/cold)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsLeadStageDialogOpen(true)}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>Change Status</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Lead</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-40">
        <section className="flex flex-col items-center py-6 text-center">
          <div className="relative mb-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview || undefined} alt={lead.name} />
              <AvatarFallback>{lead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
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
          <div className='flex flex-col items-center gap-1'>
            <div className='relative flex justify-center'>
              <h2 className="text-2xl font-bold">{lead.name}</h2>
              {currentStageInfo && (
                <div className={cn("absolute left-full ml-2 flex h-8 w-8 items-center justify-center rounded-full shadow-md", currentStageInfo.color)}>
                  <currentStageInfo.icon className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant="outline" className={cn("text-xs", getStatusBadgeClass(lead.temperature))}>{lead.temperature}</Badge>
              {currentStageInfo && (
                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">{currentStageInfo.label}</Badge>
              )}
            </div>
          </div>
          <div className='w-full flex items-center justify-between text-sm text-gray-500 mt-1 px-4'>
            <span>ID: {lead.lead_id}</span>
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
                 {isEditing ? (
                   <>
                     <EditableField
                       label="Name"
                       value={lead.name}
                       onChange={(value) => setLead(prev => prev ? {...prev, name: value} : null)}
                       className="col-span-2"
                     />
                     <EditableField
                       label="Email"
                       value={lead.contact.email}
                       onChange={(value) => setLead(prev => prev ? {...prev, contact: {...prev.contact, email: value}} : null)}
                       className="col-span-2"
                     />
                     <div className="col-span-2 grid gap-1">
                       <p className="text-gray-500">Phone Number</p>
                       <div className="flex gap-2">
                         <Input
                           value={phoneCountryCode}
                           onChange={(e) => setPhoneCountryCode(e.target.value)}
                           className="w-24"
                           placeholder="+351"
                         />
                         <Input
                           value={phoneNumber}
                           onChange={(e) => setPhoneNumber(e.target.value)}
                           className="flex-1"
                           placeholder="Phone number"
                         />
                       </div>
                     </div>
                     <EditableField
                       label="Language"
                       value={lead.contact.language}
                       onChange={(value) => setLead(prev => prev ? {...prev, contact: {...prev.contact, language: value}} : null)}
                     />
                   </>
                 ) : (
                   <>
                     <InfoItem label="Name" value={lead.name} className="col-span-2" />
                     <InfoItem label="Email" value={lead.contact.email} className="col-span-2" />
                     <InfoItem label="Phone Number" value={String(lead.contact.phone || '')} className="col-span-2" />
                     <InfoItem label="Language" value={lead.contact.language} />
                   </>
                 )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Property Requirements</CardTitle>
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <div className="space-y-6">
                        <div>
                            <p className="text-gray-500 text-sm mb-2">Property Type</p>
                            <div className="grid grid-cols-2 gap-4">
                                {propertyTypes.map((type) => (
                                    <Button
                                        key={type.name}
                                        variant={lead.property.type === type.name ? "default" : "outline"}
                                        onClick={() => setLead(prev => prev ? {...prev, property: {...prev.property, type: type.name}} : null)}
                                        className={cn("h-auto py-3 flex flex-col gap-2 transition-all", lead.property.type === type.name ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent hover:text-accent-foreground")}
                                    >
                                        <type.icon className="h-6 w-6" />
                                        <span>{type.name}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-gray-500 text-sm mb-2">Budget</p>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                                <Input
                                    type="number"
                                    value={lead.property.budget || ''}
                                    onChange={(e) => {
                                        const value = e.target.value === '' ? null : Number(e.target.value);
                                        setLead(prev => prev ? {...prev, property: {...prev.property, budget: value}} : null);
                                    }}
                                    className="pl-8"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div>
                            <p className="text-gray-500 text-sm mb-2">Bedrooms</p>
                            <div className={cn("flex items-center justify-center gap-4 p-2 border rounded-lg", isBedroomsDisabled && "opacity-50")}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setLead(prev => prev ? {...prev, property: {...prev.property, bedrooms: Math.max(0, prev.property.bedrooms - 1)}} : null)}
                                    disabled={isBedroomsDisabled}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-2xl font-bold w-12 text-center">{lead.property.bedrooms}</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setLead(prev => prev ? {...prev, property: {...prev.property, bedrooms: prev.property.bedrooms + 1}} : null)}
                                    disabled={isBedroomsDisabled}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div>
                            <p className="text-gray-500 text-sm mb-2">Locations</p>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        <span className="text-muted-foreground">
                                            {lead.property.locations.length > 0
                                                ? `${lead.property.locations.length} location${lead.property.locations.length > 1 ? 's' : ''} selected`
                                                : 'Select locations...'}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                    {allLocations.map((location) => {
                                        const currentLocations = lead.property.locations || [];
                                        const isSelected = currentLocations.includes(location.value);

                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={location.value}
                                                checked={isSelected}
                                                onSelect={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    if (!lead) return;

                                                    let newLocations;
                                                    if (isSelected) {
                                                        // Remove this location
                                                        newLocations = currentLocations.filter(loc => loc !== location.value);
                                                    } else {
                                                        // Add this location
                                                        newLocations = [...currentLocations, location.value];
                                                    }

                                                    setLead(prev => prev ? {...prev, property: {...prev.property, locations: newLocations}} : null);
                                                }}
                                            >
                                                {location.label}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {lead.property.locations.length > 0 && (
                                <div className="flex gap-2 flex-wrap mt-3">
                                    {lead.property.locations.map(locValue => (
                                        <Badge
                                            key={locValue}
                                            variant="secondary"
                                            className="px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-secondary/80"
                                            onClick={() => {
                                                setLead(prev => {
                                                    if (!prev) return null;
                                                    const newLocations = prev.property.locations.filter(l => l !== locValue);
                                                    return {...prev, property: {...prev.property, locations: newLocations}};
                                                });
                                            }}
                                        >
                                            {allLocations.find(l => l.value === locValue)?.label || locValue}
                                            <X className="h-3 w-3" />
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <InfoItem label="Property Type" value={lead.property.type} />
                        <InfoItem label="Budget" value={lead.property.budget_formatted} />
                        <InfoItem label="Bedrooms" value={lead.property.bedrooms} />
                        <InfoItem label="Locations" value={lead.property.locations.join(', ')} className="col-span-2" />
                    </div>
                )}
            </CardContent>
        </Card>
        </div>
      </main>

      {!isEditing && (
        <div className="fixed bottom-20 right-4 z-20 flex flex-col items-end gap-4">
          <ActionButton icon={FileText} label="Notes" onClick={handleOpenNotes} isLoading={isFetchingNotes} />
          <ActionButton icon={Send} label="Follow-up" onClick={() => setIsFollowUpOpen(true)} />
          <ActionButton icon={History} label="History" onClick={() => setIsHistoryOpen(true)} />
        </div>
      )}
      
      <LeadNotesSheet 
        open={isNotesOpen}
        onOpenChange={setIsNotesOpen}
        lead={lead}
        currentNote={currentNote}
        setCurrentNote={setCurrentNote}
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
              for {leadToDeleteName}.
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
       <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Crop Image</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center">
              {imgSrc && (
                 <ReactCrop
                    crop={crop}
                    onChange={c => setCrop(c)}
                    onComplete={c => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop
                  >
                    <img
                        ref={imgRef}
                        alt="Crop me"
                        src={imgSrc}
                        onLoad={onImageLoad}
                        style={{ maxHeight: '70vh' }}
                    />
                 </ReactCrop>
              )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsCropModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveCrop}>Save</Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>

       <Dialog open={isLeadStageDialogOpen} onOpenChange={setIsLeadStageDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Change Lead Status</DialogTitle>
                <DialogDescription>
                    Select the new status for this lead in the sales pipeline.
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
                {LEAD_STAGES.map((stage) => {
                    const isCurrent = currentLeadStage === stage.value;
                    return (
                        <button
                            key={stage.value}
                            onClick={() => handleStageSelect(stage.value)}
                            disabled={isCurrent}
                            className={cn(
                                "w-full text-left p-4 rounded-lg border-2 hover:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary relative",
                                isCurrent ? "border-primary bg-primary/5" : "border-gray-200 hover:bg-gray-50/50",
                                isCurrent && "cursor-default"
                            )}
                        >
                            {isCurrent && <Badge className="absolute -top-2 -right-2">Current</Badge>}
                            <div className="flex items-start gap-4">
                                <div className={cn("mt-1 flex h-8 w-8 items-center justify-center rounded-full shrink-0", stage.color)}>
                                    <stage.icon className="h-5 w-5" />
                                </div>
                                <div className='flex-1'>
                                    <p className="font-semibold">{stage.label}</p>
                                    <p className="text-sm text-gray-500">{stage.description}</p>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsLeadStageDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>

       <AlertDialog open={isStageConfirmDialogOpen} onOpenChange={setIsStageConfirmDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
                <AlertDialogDescription>
                    {currentStageInfo && selectedStageInfo
                        ? `Change status from "${currentStageInfo.label}" to "${selectedStageInfo.label}"`
                        : 'Are you sure you want to change the lead status?'}
                </AlertDialogDescription>
            </AlertDialogHeader>
            {currentStageInfo && selectedStageInfo && (
                <div className="flex items-center justify-center gap-4 my-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full shrink-0", currentStageInfo.color)}>
                            <currentStageInfo.icon className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-sm">{currentStageInfo.label}</span>
                    </div>
                    <ArrowRight className="h-6 w-6 text-gray-400 shrink-0" />
                    <div className="flex flex-col items-center gap-2">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full shrink-0", selectedStageInfo.color)}>
                            <selectedStageInfo.icon className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-sm">{selectedStageInfo.label}</span>
                    </div>
                </div>
            )}
             <div className="space-y-2">
              <Label htmlFor="stage-change-note">Note (Optional)</Label>
              <Textarea
                id="stage-change-note"
                placeholder="Add a note about this status change..."
                value={stageChangeNote}
                onChange={(e) => setStageChangeNote(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                    setIsStageConfirmDialogOpen(false);
                    setIsLeadStageDialogOpen(true);
                }}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmLeadStageChange}>
                  Confirm
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmSaveOpen} onOpenChange={setIsConfirmSaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to update the following fields:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-60 overflow-y-auto">
            {changeSummary.map((change, index) => (
              <div key={index} className="py-2 border-b last:border-b-0">
                <p className="font-semibold text-sm">{change.field}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">{String(change.oldValue)}</span>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                  <span className="text-primary font-medium">{String(change.newValue)}</span>
                </div>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmSaveOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveLeadChanges} disabled={isSaving}>
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
      <div className="font-medium break-all">{value}</div>
    </div>
  );
}

function EditableField({ label, value, onChange, className, type = 'text' }: { label: string; value: string | number | null | undefined; onChange: (value: string) => void; className?: string; type?: string }) {
  return (
    <div className={cn("grid gap-1", className)}>
      <p className="text-gray-500">{label}</p>
      <Input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="font-medium"
        type={type}
      />
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, isLoading }: { icon: React.ElementType; label: string, onClick?: () => void, isLoading?: boolean }) {
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
            disabled={isLoading}
        >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Icon className="h-6 w-6" />}
        </Button>
    </div>
  );
}

type LeadNotesSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadData;
  currentNote: CurrentNote;
  setCurrentNote: React.Dispatch<React.SetStateAction<CurrentNote>>;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
};

function LeadNotesSheet({ open, onOpenChange, lead, currentNote, setCurrentNote, notes, setNotes }: LeadNotesSheetProps) {
    const { toast } = useToast();
    const [noteContent, setNoteContent] = useState('');
    const [originalNoteContent, setOriginalNoteContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingNewNote, setIsAddingNewNote] = useState(false);
    const [movedNoteId, setMovedNoteId] = useState<string | null>(null);
    
    useEffect(() => {
        if (open && currentNote) {
            setNoteContent(currentNote.note || '');
            setOriginalNoteContent(currentNote.note || '');
            setIsAddingNewNote(false);
        } else if (open) {
            setNoteContent('');
            setOriginalNoteContent('');
        }
    }, [open, currentNote]);

    const handleSaveNote = async (operation: 'add_new_note' | 'edit_note') => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            const payload: any = {
                operation,
                lead_id: lead.lead_id,
                current_note: noteContent,
            };
    
            if (operation === 'edit_note' && currentNote) {
                payload.note_id = currentNote.note_id;
            }
    
            const response = await fetch('https://eurekagathr.app.n8n.cloud/webhook/domain/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
    
            const responseData = await response.json();
    
            if (!response.ok) {
                throw new Error(responseData.message || `Failed to ${operation === 'edit_note' ? 'update' : 'add'} note`);
            }
            
            toast({ title: 'Success', description: `Note ${operation === 'edit_note' ? 'updated' : 'added'} successfully!` });
            
            if (operation === 'add_new_note') {
                if (responseData && responseData.note_id) {
                    setCurrentNote(responseData);
                }
                setIsAddingNewNote(false);
            } else if (operation === 'edit_note' && currentNote) {
                const updatedNote = { ...currentNote, note: noteContent };
                setCurrentNote(updatedNote);
                setOriginalNoteContent(noteContent);
            }
            onOpenChange(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'An unexpected error occurred.' });
        } finally {
             setIsSaving(false);
        }
    };

    const handleNewNoteClick = () => {
        if (currentNote) {
            if (!notes.some(n => n.note_id === currentNote.note_id)) {
                setNotes(prev => [currentNote, ...prev]);
            }
            setMovedNoteId(currentNote.note_id);
            setCurrentNote(null);
        }
        setIsAddingNewNote(true);
        setNoteContent(''); 
    };

    const handleCancelNewNote = () => {
        setIsAddingNewNote(false);
        if (movedNoteId) {
            const movedNote = notes.find(n => n.note_id === movedNoteId);
            if (movedNote) {
                setCurrentNote(movedNote as CurrentNote);
                setNotes(notes.filter(n => n.note_id !== movedNoteId));
            }
            setMovedNoteId(null);
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
    
    const isNoteChanged = currentNote && noteContent.trim() !== originalNoteContent.trim();
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
          title: "Copied!",
          description: "Note copied to clipboard.",
        });
    };

    const formattedDate = (dateStr: string) => {
        if (!dateStr || isNaN(new Date(dateStr).getTime())) {
            return '';
        }
        return format(new Date(dateStr), "MMMM d, yyyy - h:mm a");
    }

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
                            <p className="text-sm text-gray-500">{String(lead.contact.phone || '')}</p>
                            <p className="text-sm text-gray-500">{lead.contact.email}</p>
                            <p className="text-xs text-gray-400 mt-1">Source: {lead.management.source} | Created: {lead.created_at_formatted}</p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                             <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Current Note</CardTitle>
                                {currentNote && (
                                    <div className="text-xs text-gray-500 text-right">
                                        <p>Last updated: {currentNote.created_at_formatted}</p>
                                        <p className="hidden">By: {currentNote.created_by}</p>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                             <Textarea
                                ref={textareaRef}
                                placeholder="Start typing your note..."
                                className="border-0 focus-visible:ring-0 min-h-[100px] p-0 resize-none overflow-hidden"
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                readOnly={!currentNote && !isAddingNewNote}
                            />
                             <div className="flex gap-2 justify-end mt-2">
                                {isAddingNewNote ? (
                                    <>
                                        <Button variant="outline" size="sm" onClick={handleCancelNewNote}>
                                            Cancel
                                        </Button>
                                        <Button size="sm" onClick={() => handleSaveNote('add_new_note')} disabled={isSaving || noteContent.trim() === ''}>
                                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Save Note
                                        </Button>
                                    </>
                                ) : isNoteChanged ? (
                                     <>
                                        <Button variant="outline" size="sm" onClick={() => currentNote && setNoteContent(originalNoteContent)}>
                                            Cancel
                                        </Button>
                                        <Button size="sm" onClick={() => handleSaveNote('edit_note')} disabled={isSaving}>
                                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Save Changes
                                        </Button>
                                    </>
                                ) : (
                                    <Button size="sm" onClick={handleNewNoteClick} disabled={!currentNote}>
                                        Add New Note
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Note History</h4>
                        <div className="space-y-4">
                            {notes.map((note, index) => {
                                const key = note.note_id || `history-${index}`;
                                const displayDate = note.created_at_formatted || formattedDate(note.date);
                                
                                return (
                                <Card key={key} className="bg-gray-50">
                                    <CardContent className="p-4 relative">
                                        <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{note.note || note.content}</p>
                                         <div className="flex justify-between items-center">
                                            <p className="text-xs text-gray-400">{displayDate}</p>
                                            <p className="text-xs text-gray-400 hidden">By: {note.created_by}</p>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="absolute bottom-2 right-2 h-8 w-8"
                                            onClick={() => handleCopy(note.note || note.content || '')}
                                        >
                                            <Copy className="h-4 w-4 text-gray-500" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            )})}
                             {notes.length === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    No past notes for this lead.
                                </div>
                            )}
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

    

    