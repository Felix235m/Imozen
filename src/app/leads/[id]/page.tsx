
"use client";

import * as React from 'react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MoreVertical, Upload, History, FileText, Send, Edit, Save, X, Mic, Copy, RefreshCw, MessageSquare, Phone, Mail, Trash2, Zap, ChevronsUpDown, TrendingUp, Search, Handshake, Eye, Briefcase, DollarSign, FileSignature, CheckCircle2, XCircle, Ban, Target, BadgeHelp } from 'lucide-react';
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
  { value: 'New Lead', label: 'New Lead', color: 'bg-blue-100 text-blue-700', description: 'Just received, not yet contacted', icon: Target },
  { value: 'Contacted', label: 'Contacted', color: 'bg-purple-100 text-purple-700', description: 'Initial contact made', icon: Phone },
  { value: 'Qualified', label: 'Qualified', color: 'bg-indigo-100 text-indigo-700', description: 'Lead is qualified and interested', icon: BadgeHelp },
  { value: 'Property Viewing Scheduled', label: 'Viewing Scheduled', color: 'bg-cyan-100 text-cyan-700', description: 'Property viewing appointment set', icon: Eye },
  { value: 'Property Viewed', label: 'Property Viewed', color: 'bg-teal-100 text-teal-700', description: 'Lead has viewed property', icon: Briefcase },
  { value: 'Offer Made', label: 'Offer Made', color: 'bg-orange-100 text-orange-700', description: 'Lead made an offer', icon: DollarSign },
  { value: 'Negotiation', label: 'Negotiation', color: 'bg-yellow-100 text-yellow-700', description: 'In negotiation phase', icon: Handshake },
  { value: 'Under Contract', label: 'Under Contract', color: 'bg-lime-100 text-lime-700', description: 'Contract signed, pending closing', icon: FileSignature },
  { value: 'Converted', label: 'Converted', color: 'bg-green-100 text-green-700', description: 'Deal successfully closed', icon: CheckCircle2 },
  { value: 'Lost', label: 'Lost', color: 'bg-red-100 text-red-700', description: 'Deal lost', icon: XCircle },
  { value: 'Not Interested', label: 'Not Interested', color: 'bg-gray-100 text-gray-700', description: 'Lead no longer interested', icon: Ban },
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
  const [isLeadStageDialogOpen, setIsLeadStageDialogOpen] = useState(false);
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
    // Fallback for numbers without country code in brackets
    const codeMatch = phoneStr.match(/^\+(\d{1,3})/);
    if (codeMatch) {
        return { code: codeMatch[0], number: phoneStr.substring(codeMatch[0].length).trim() };
    }
    return { code: '+351', number: phoneStr };
  }, []);

  const fetchLeadDetails = useCallback(async () => {
    try {
      const response = await callLeadApi('get_lead_details', { lead_id: id });
      const currentLeadData = Array.isArray(response) && response.length > 0 ? response[0] : null;

      if (!currentLeadData) {
        throw new Error('Lead not found');
      }
      
      setLead(currentLeadData);
      setOriginalLead(JSON.parse(JSON.stringify(currentLeadData))); // Deep copy for reliable comparison
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


      if (isEditMode) {
        setIsEditing(true);
      }
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not load lead details.' });
       router.push('/leads');
    }
  }, [id, toast, router, isEditMode, parsePhoneNumber]);

  useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'phone_country_code') {
      setPhoneCountryCode(value);
      return;
    }
    if (name === 'phone_number') {
      setPhoneNumber(value);
      return;
    }

    if (lead) {
      const keys = name.split('.');
      setLead(prev => {
        if (!prev) return null;
        const newLead = JSON.parse(JSON.stringify(prev)); // Deep copy to ensure state updates
        let current: any = newLead;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = name.includes('budget') || name.includes('bedrooms') ? Number(value) : value;
        return newLead;
      });
    }
  };

  const handleSelectChange = (name: string, value: string | string[]) => {
     if (lead) {
        const keys = name.split('.');
        setLead(prev => {
            if (!prev) return null;
            const newLead = JSON.parse(JSON.stringify(prev)); // Deep copy
            let current: any = newLead;
            for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newLead;
        });
     }
  };

  const handleLocationRemove = (e: React.MouseEvent, locationValue: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (lead) {
          const newLocations = lead.property.locations.filter(loc => loc !== locationValue);
          handleSelectChange('property.locations', newLocations);
      }
  };

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
      setCrop(undefined) // Makes crop preview update between images.
      const reader = new FileReader()
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''))
      reader.readAsDataURL(e.target.files[0]);
      setIsCropModalOpen(true);
      e.target.value = ''; // Reset file input
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
        // Revert preview if upload fails
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
        1, // aspect ratio 1:1
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
    setCompletedCrop(crop);
  }


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

  const prepareSaveChanges = () => {
    if (!lead || !originalLead) {
        return;
    }

    const currentLeadWithPhone = {
        ...lead,
        contact: {
            ...lead.contact,
            phone: `(${phoneCountryCode}) ${phoneNumber}` as any,
        },
    };

    const changes: ChangeSummary[] = [];

    const excludedFields = [
        'budget_formatted',
        'created_at_formatted',
        'image_url',
        'notes',
        'communication_history',
        'created_at',
        'updated_at',
        'row_number',
        'lead_id',
        'next_follow_up',
        'management',
    ];

    const compareObjects = (newObj: any, oldObj: any, prefix = '') => {
        if (!newObj || !oldObj) return;
        const allKeys = new Set([...Object.keys(newObj), ...Object.keys(oldObj)]);

        for (const key of allKeys) {
            if (excludedFields.includes(key)) {
                continue;
            }

            const fullKey = prefix ? `${prefix}.${key}` : key;
            const newValue = newObj?.[key];
            const oldValue = oldObj?.[key];

            const areObjects = typeof newValue === 'object' && newValue !== null && typeof oldValue === 'object' && oldValue !== null;

            if (areObjects && !Array.isArray(newValue) && !Array.isArray(oldValue)) {
                compareObjects(newValue, oldValue, fullKey);
            } else if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
                const fieldName = fullKey
                    .split('.')
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, ' '))
                    .join(' → ');

                changes.push({
                    field: fieldName,
                    oldValue: oldValue,
                    newValue: newValue
                });
            }
        }
    };

    compareObjects(currentLeadWithPhone, originalLead);

    if (changes.length === 0) {
        toast({
            title: "No Changes",
            description: "No changes were made to the lead data.",
        });
        setIsEditing(false);
        return;
    }

    setChangeSummary(changes);

    const propertyRequirementsChanged = changes.some(c =>
        c.field.includes('Property') &&
        (c.field.includes('Type') || c.field.includes('Budget') || c.field.includes('Bedrooms') || c.field.includes('Locations'))
    );

    if (propertyRequirementsChanged) {
        const oldScore = getQualificationScore(originalLead);
        const newScore = getQualificationScore(currentLeadWithPhone);
        if (newScore !== oldScore) {
            const newStatus = getStatusFromScore(newScore);
            if(newStatus !== currentLeadWithPhone.temperature) {
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

  const confirmAndSaveChanges = async () => {
    if (!lead) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No lead data available'
        });
        return;
    }
    
    setIsSaving(true);
    setIsConfirmSaveOpen(false);
    
    const finalLead = suggestedStatus ? { ...lead, temperature: suggestedStatus } : lead;
    
    const reconstructedPhone = `(${phoneCountryCode}) ${phoneNumber}`;
    
    const payload = {
        ...finalLead,
        lead_id: finalLead.lead_id || id, 
        contact: {
            ...finalLead.contact,
            phone: reconstructedPhone as any,
        },
    };

    try {
        await callLeadApi('edit_lead', payload);
        
        toast({
            title: "Success",
            description: "Lead updated",
        });
        
        // After successful save, update the original state to match the saved state
        const updatedLeadData = { ...payload };
        setOriginalLead(JSON.parse(JSON.stringify(updatedLeadData)));
        setLead(updatedLeadData);
        setIsEditing(false);
        
    } catch (error: any) {
        console.error('Error saving lead:', error);
        toast({ 
            variant: 'destructive', 
            title: 'Error', 
            description: error.message || 'Could not save lead details.' 
        });
    } finally {
        setIsSaving(false);
        setChangeSummary([]);
        setSuggestedStatus(null);
    }
};


  const handleCancel = () => {
    if (originalLead) {
      setLead({ ...originalLead });
      const { code, number } = parsePhoneNumber(originalLead.contact.phone);
      setPhoneCountryCode(code);
      setPhoneNumber(number);
    }
    setIsEditing(false);
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

    console.log('🔥 handleStatusSave - Starting priority change');
    console.log('🔥 Current lead:', lead);
    console.log('🔥 New priority:', newStatus);

    // Send the FULL lead data with only the temperature changed
    const reconstructedPhone = `(${phoneCountryCode}) ${phoneNumber}`;

    const fullPayload = {
        ...lead,
        temperature: newStatus,
        note: note, // Add the note to the payload
        contact: {
            ...lead.contact,
            phone: reconstructedPhone as any,
        },
    };

    console.log('🔥 Sending full payload for priority change:', fullPayload);

    callLeadStatusApi(leadId, "change_priority", fullPayload).then((response) => {
        console.log('🔥 Webhook response:', response);

        // Process the response
        if (response && Array.isArray(response) && response.length > 0) {
            const updatedLeadFromServer = response[0];
            console.log('🔥 Updated lead from server:', updatedLeadFromServer);

            // Transform the response to match frontend structure - keep all existing data
            const transformedLead = {
                ...lead,
                temperature: newStatus,
                // Keep all existing data, just update the temperature
            };

            setLead(transformedLead);
            setOriginalLead(JSON.parse(JSON.stringify(transformedLead)));

            console.log('✅ Local state updated with new priority');
        } else {
            // Fallback: Just update locally
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

        console.log('✅ Priority change successful');
    }).catch((error) => {
        console.error('❌ Priority change failed:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update priority.' });
    });
  };
  
  const handleLeadStageChange = async (newStage: LeadStage) => {
    if (!lead) return;

    console.log('📊 handleLeadStageChange - Starting stage change');
    console.log('📊 Current lead:', lead);
    console.log('📊 New stage:', newStage);

    try {
        // Send the FULL lead data with only the stage changed
        const reconstructedPhone = `(${phoneCountryCode}) ${phoneNumber}`;

        const fullPayload = {
            ...lead,
            lead_stage: newStage, // Add the new stage field
            contact: {
                ...lead.contact,
                phone: reconstructedPhone as any,
            },
        };

        console.log('📊 Sending full payload for stage change:', fullPayload);

        // Call webhook via edit_lead operation
        const response = await callLeadApi('edit_lead', fullPayload);

        console.log('📊 Webhook response:', response);

        // Update local state
        setLead(prev => prev ? ({ ...prev, lead_stage: newStage } as any) : null);
        setOriginalLead(prev => prev ? JSON.parse(JSON.stringify({ ...prev, lead_stage: newStage })) : null);

        toast({
            title: "Status Updated",
            description: `Lead status changed to "${newStage}".`,
        });

        setIsLeadStageDialogOpen(false);

        console.log('✅ Stage change successful');
    } catch (error: any) {
        console.error('❌ Stage change failed:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Could not update lead status.'
        });
    }
  };

  const formatValue = (field: string, value: any) => {
    if (Array.isArray(value)) {
        return value.map(v => allLocations.find(l=>l.value === v)?.label || v).join(', ') || '(empty)';
    }
    if (value === null || value === undefined || value === '') {
        return '(empty)';
    }
    if (field.toLowerCase().includes('budget')) {
      return `€${Number(value).toLocaleString()}`;
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    return String(value);
  }

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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
            <Button size="sm" onClick={prepareSaveChanges} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
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
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-40">
        <section className="flex flex-col items-center py-6 text-center">
          <div className="relative mb-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview || undefined} alt={lead.name} />
              <AvatarFallback>{lead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
             {!isEditing && (
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
            {!isEditing && <Badge variant="outline" className={cn("text-sm", getStatusBadgeClass(lead.temperature))}>{lead.temperature}</Badge>}
          </div>
           {lead.status === 'Inactive' && (
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
                <EditableInfoItem label="Phone Number" name="contact.phone" value={String(lead.contact.phone || '')} isEditing={isEditing} onChange={handleInputChange} className="col-span-2" phoneCountryCode={phoneCountryCode} phoneNumber={phoneNumber} />
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
                <EditableInfoItem label="Property Type" name="property.type" value={lead.property.type} isEditing={isEditing} onSelectChange={handleSelectChange} selectOptions={['Apartment', 'House', 'Commercial', 'Land']} />
                <EditableInfoItem label="Budget" name="property.budget" value={lead.property.budget_formatted} isEditing={isEditing} onChange={handleInputChange} type="number" displayValue={String(lead.property.budget || '')} />
                <EditableInfoItem label="Bedrooms" name="property.bedrooms" value={lead.property.bedrooms} isEditing={isEditing} onChange={handleInputChange} type="number" />
                <EditableInfoItem label="Locations" name="property.locations" value={lead.property.locations} isEditing={isEditing} onSelectChange={handleSelectChange} onLocationRemove={handleLocationRemove} className="col-span-2" multiSelect />
              </div>
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
      <AlertDialog open={isConfirmSaveOpen} onOpenChange={setIsConfirmSaveOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the changes before saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 text-sm max-h-60 overflow-y-auto pr-2">
            <div>
                <h4 className="font-semibold mb-2">Changes:</h4>
                <ul className="list-disc list-inside space-y-1">
                    {changeSummary.map(change => (
                        <li key={change.field}>
                            <span className="font-medium">{change.field}:</span> {formatValue(change.field, change.oldValue)} &rarr; {formatValue(change.field, change.newValue)}
                        </li>
                    ))}
                </ul>
            </div>
            {suggestedStatus && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800">Based on the updated property requirements, we suggest changing the lead priority from 
                    <Badge variant="outline" className={cn("mx-1.5", getStatusBadgeClass(lead.temperature))}>{lead.temperature}</Badge> 
                    to 
                    <Badge variant="outline" className={cn("mx-1.5", getStatusBadgeClass(suggestedStatus))}>{suggestedStatus}</Badge>.</p>
                </div>
            )}
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setIsConfirmSaveOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndSaveChanges}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm & Save
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

       {/* Lead Stage Change Dialog */}
       <Dialog open={isLeadStageDialogOpen} onOpenChange={setIsLeadStageDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Change Lead Status</DialogTitle>
                <DialogDescription>
                    Select the new status for this lead in the sales pipeline.
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
                {LEAD_STAGES.map((stage) => (
                    <button
                        key={stage.value}
                        onClick={() => handleLeadStageChange(stage.value)}
                        className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-gray-50/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                    >
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
                ))}
            </div>
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsLeadStageDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>
    </div>
  );
}

function InfoItem({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-1", className)}>
      <p className="text-gray-500">{label}</p>
      <div className="font-medium break-all">{Array.isArray(value) ? value.map(v => allLocations.find(l=>l.value === v)?.label || v).join(', ') : value}</div>
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
  onLocationRemove,
  className, 
  type = 'text', 
  displayValue,
  selectOptions,
  multiSelect,
  phoneCountryCode,
  phoneNumber,
}: { 
  label: string; 
  name?: string; 
  value: string | number | string[] | null; 
  isEditing: boolean; 
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  onSelectChange?: (name: string, value: string | string[]) => void;
  onLocationRemove?: (e: React.MouseEvent, locationValue: string) => void;
  className?: string; 
  type?: string; 
  displayValue?: string;
  selectOptions?: string[];
  multiSelect?: boolean;
  phoneCountryCode?: string;
  phoneNumber?: string;
}) {
  if (isEditing && name) {
    if (label === 'Temperature') {
        return null
    }

    if (label === "Phone Number" && onChange && phoneCountryCode !== undefined && phoneNumber !== undefined) {
      return (
        <div className={cn("grid gap-1", className)}>
          <p className="text-gray-500">{label}</p>
          <div className="flex items-center gap-2">
            <Input 
              name="phone_country_code" 
              value={phoneCountryCode} 
              onChange={onChange} 
              className="h-8 text-sm w-20" 
              placeholder="+351"
            />
            <Input 
              name="phone_number" 
              type="tel"
              value={phoneNumber} 
              onChange={onChange} 
              className="h-8 text-sm" 
              placeholder="Phone Number"
            />
          </div>
        </div>
      )
    }

    if (multiSelect && onSelectChange && Array.isArray(value)) {
       const handleLocationSelect = (locationValue: string) => {
        if (!name) return;
        const newLocations = value.includes(locationValue)
            ? value.filter(loc => loc !== locationValue)
            : [...value, locationValue];
        onSelectChange(name, newLocations);
    }

    return (
        <div className={cn("grid gap-1", className)}>
            <p className="text-gray-500">{label}</p>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-between h-auto min-h-10 text-sm font-normal"
                    >
                        <div className="flex gap-1 flex-wrap items-center">
                        {value.length > 0 ? (
                            value.map(locValue => {
                                const location = allLocations.find(l => l.value === locValue);
                                return (
                                    <Badge
                                        key={locValue}
                                        variant="secondary"
                                        className="mr-1"
                                    >
                                        {location?.label || locValue}
                                        <span role="button" aria-label={`Remove ${location?.label}`} className="ml-1 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" onMouseDown={(e) => e.preventDefault()} onClick={(e) => onLocationRemove?.(e, locValue)}><X className="h-3 w-3" /></span>
                                    </Badge>
                                )
                            })
                        ) : (
                            <span className="text-muted-foreground">Select locations...</span>
                        )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                    {allLocations.map((location) => (
                        <DropdownMenuCheckboxItem
                            key={location.value}
                            checked={value.includes(location.value)}
                            onSelect={(e) => e.preventDefault()}
                            onClick={() => handleLocationSelect(location.value)}
                        >
                            {location.label}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
    }
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
            value={displayValue ?? String(value ?? '')} 
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
            // Check if the note is already in the history to avoid duplicates
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

    

    










    

    





      




    











    