

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
import { useLanguage } from '@/hooks/useLanguage';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { LeadStatusDialog } from '@/components/leads/lead-status-dialog';
import { LeadTypeBadge } from '@/components/leads/lead-badges';
import { FullLeadHeader, CompactLeadHeader } from '@/components/leads/lead-headers';
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
import { ScheduleFollowUpDialog } from '@/components/leads/schedule-follow-up-dialog';
import { cachedCallLeadApi, cachedCallLeadStatusApi } from '@/lib/cached-api';
import { transformWebhookResponseToLeadData, transformNewBackendResponse } from '@/lib/lead-transformer';
import { normalizeLeadDetail, extractLeadType } from '@/lib/lead-normalization';
import { Label } from '@/components/ui/label';
import { useLeadDetails, useNotes, useLeads } from '@/hooks/useAppData';
import { localStorageManager } from '@/lib/local-storage-manager';
import { CommunicationHistoryTimeline } from '@/components/leads/communication-history-timeline';
import { uploadToCloudinary, canvasToBlob } from '@/lib/cloudinary-upload';
import { navigationOptimizer } from '@/lib/navigation-optimizer';

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

  // Use localStorage-based lead data
  const { leadDetails: leadFromStorage, updateLeadDetails } = useLeadDetails(id);
  const { notes: notesFromStorage, updateNotes: updateNotesInStorage } = useNotes(id);
  const { deleteLead: deleteLeadFromStorage, addLead } = useLeads();

  const [lead, setLead] = useState<LeadData | null>(null);
  const [originalLead, setOriginalLead] = useState<LeadData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { t } = useLanguage();
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [isLeadStageDialogOpen, setIsLeadStageDialogOpen] = useState(false);
  const [isStageConfirmDialogOpen, setIsStageConfirmDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<LeadStage | null>(null);
  const [isScheduleFollowUpDialogOpen, setIsScheduleFollowUpDialogOpen] = useState(false);

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
  
  const communicationHistory = useMemo(() => {
    return (lead?.communication_history || []).map(event => ({
      ...event,
      type: event.event_type || event.type,  // Normalize to 'type' field
    }));
  }, [lead]);
  
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


  // Format ISO date to Portugal timezone
  const formatDateWithTimezone = useCallback((isoDate: string, timezone: string = 'Europe/Lisbon'): string => {
    if (!isoDate || isNaN(new Date(isoDate).getTime())) return '';

    try {
      const date = new Date(isoDate);
      // Use the current language locale for date formatting
      const locale = t.common.languages.portuguese === 'Português' ? 'pt-PT' : 'en-US';
      return date.toLocaleString(locale, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone
      });
    } catch {
      return '';
    }
  }, [t]);

    
  const prepareSaveChanges = useCallback(() => {
    if (!lead || !originalLead) return;
  
    const findChanges = (
      original: Record<string, any>,
      current: Record<string, any>,
      prefix = ''
    ): ChangeSummary[] => {
      let changes: ChangeSummary[] = [];
  
      for (const key in original) {
        if (['row_number', 'lead_id', 'created_at', 'created_at_formatted', 'next_follow_up', 'image_url', 'communication_history', 'management', 'purchase', 'stage'].includes(key)) continue;
  
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
    // Lead details are now managed entirely through useLeadDetails hook
    // No manual data loading needed

    // Get 3 random leads (excluding current) for potential navigation
    // const otherLeads = allLeads
    //   .filter(lead => lead.lead_id !== id)
    //   .sort(() => Math.random() - 0.5)
    //   .slice(0, 3)
    //   .map(lead => lead.lead_id);

    // if (otherLeads.length > 0) {
    //   navigationOptimizer.preloadMultipleLeads(otherLeads);
    // }
  }, [id]);

  useEffect(() => {
    const editMode = searchParams.get('edit') === 'true';
    if (editMode) {
      setIsEditing(true);
      // Remove the query parameter from URL without triggering a page reload
      router.replace(`/leads/${id}`, { scroll: false });
    }
  }, [searchParams, id, router]);

  // CRITICAL FIX: Sync localStorage data to component state
  useEffect(() => {
    if (leadFromStorage) {
      try {
        console.log('🔄 Syncing lead data from localStorage:', {
          leadId: id,
          localStorageLeadId: leadFromStorage.lead_id,
          name: leadFromStorage.name
        });

        // Transform localStorage data to LeadData format
        let transformedLead = transformNewBackendResponse(leadFromStorage);

        if (transformedLead) {
          // Ensure all required fields are present for LeadData type
          // Load communication history from localStorage
        const communicationHistory = localStorageManager.getCommunicationEvents(id) || [];

        const completeLead = {
            ...transformedLead,
            communication_history: communicationHistory, // Add communication history from localStorage
            next_follow_up: transformedLead.next_follow_up || {
              date: null,
              status: '',
              color: '',
              days_until: null
            },
            purchase: transformedLead.purchase || {
              timeframe: transformedLead.property?.purchase_timeframe || '',
              financing_type: transformedLead.property?.financing_type || '',
              credit_pre_approved: transformedLead.property?.credit_pre_approved || false,
              search_duration: transformedLead.property?.search_duration || '',
              has_seen_properties: transformedLead.property?.has_seen_properties || 'No'
            },
            row_number: transformedLead.row_number || 0,
            budget_formatted: transformedLead.budget_formatted || transformedLead.property?.budget || ''
          };

          setLead(completeLead);
          setOriginalLead(JSON.parse(JSON.stringify(completeLead)));
          setAvatarPreview(completeLead.image_url);

          console.log('✅ Lead data synced successfully for:', completeLead.name);
        }
      } catch (error) {
        console.error('❌ Failed to transform lead data:', error);
        // Fallback: use raw data as LeadData
        const fallbackLead = {
          ...leadFromStorage,
          next_follow_up: {
            date: null,
            status: '',
            color: '',
            days_until: null
          },
          purchase: {
            timeframe: leadFromStorage.property?.purchase_timeframe || '',
            financing_type: leadFromStorage.property?.financing_type || '',
            credit_pre_approved: leadFromStorage.property?.credit_pre_approved || false,
            search_duration: leadFromStorage.property?.search_duration || '',
            has_seen_properties: leadFromStorage.property?.has_seen_properties || 'No'
          },
          row_number: 0
        };

        setLead(fallbackLead as any);
        setOriginalLead(JSON.parse(JSON.stringify(fallbackLead)));
        setAvatarPreview(fallbackLead.image_url || null);

        console.log('⚠️ Used fallback data for:', fallbackLead.name);
      }
    } else {
      console.warn('⚠️ No lead data found in localStorage for ID:', id);
    }
  }, [leadFromStorage, id]);

  // Listen for communication history changes and update lead state
  useEffect(() => {
    const handleStorageChange = () => {
      if (lead && id) {
        try {
          const communicationHistory = localStorageManager.getCommunicationEvents(id) || [];
          setLead(prev => prev ? { ...prev, communication_history: communicationHistory } : null);
          console.log('📞 Communication history updated:', {
            leadId: id,
            eventCount: communicationHistory.length
          });
        } catch (error) {
          console.error('❌ Failed to update communication history:', error);
        }
      }
    };

    // Listen for storage events from other tabs
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'app_data' && e.newValue) {
        handleStorageChange();
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    // Also check periodically for local changes (in case of same-tab updates)
    const interval = setInterval(handleStorageChange, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(interval);
    };
  }, [lead, id]);

  // Phone number parsing when lead data loads
  useEffect(() => {
    if (lead?.contact?.phone) {
      try {
        const { code, number } = parsePhoneNumber(lead.contact.phone);
        setPhoneCountryCode(code);
        setPhoneNumber(number);
        console.log('📞 Phone number parsed:', { code, number, original: lead.contact.phone });
      } catch (error) {
        console.error('❌ Failed to parse phone number:', lead.contact.phone, error);
        // Set default values
        setPhoneCountryCode('');
        setPhoneNumber('');
      }
    }
  }, [lead, parsePhoneNumber]);

  useEffect(() => {
    if (isEditing && lead) {
        const isBedroomsDisabled = lead.property.type === 'Commercial' || lead.property.type === 'Land';
        if (isBedroomsDisabled && lead.property.bedrooms !== 0) {
            setLead(prev => prev ? {...prev, property: {...prev.property, bedrooms: 0}} : null);
        }
    }
  }, [isEditing, lead?.property.type]);

  // History state management for mobile swipe gesture fix
  useEffect(() => {
    const isAnySheetOpen = isNotesOpen || isFollowUpOpen || isHistoryOpen;

    if (isAnySheetOpen) {
      // Push a dummy history state when a sheet opens
      window.history.pushState({ sheetOpen: true }, '');

      const handlePopState = (event: PopStateEvent) => {
        // Close whichever sheet is open instead of navigating back
        if (isNotesOpen) setIsNotesOpen(false);
        if (isFollowUpOpen) setIsFollowUpOpen(false);
        if (isHistoryOpen) setIsHistoryOpen(false);

        // Prevent the default back navigation
        event.preventDefault();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isNotesOpen, isFollowUpOpen, isHistoryOpen]);


  if (!lead || !originalLead) {
      return (
          <div className="flex items-center justify-center h-screen">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  function getCroppedImg(image: HTMLImageElement, crop: Crop): Promise<HTMLCanvasElement> {
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
    return Promise.resolve(canvas);
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

    try {
      // Step 1: Get cropped canvas
      const canvas = await getCroppedImg(imgRef.current, completedCrop);

      // Step 2: Convert canvas to Blob
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.9);

      // Step 3: Upload to Cloudinary
      toast({ title: "Uploading image...", description: "Please wait" });
      const uploadResult = await uploadToCloudinary(blob, 'leads');

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Step 4: Update preview immediately (optimistic)
      setAvatarPreview(uploadResult.url);
      setIsCropModalOpen(false);
      setImgSrc('');

      // Step 5: Send Cloudinary URL to webhook
      await cachedCallLeadApi('upload_lead_profile_image' as any, {
        lead_id: id,
        image_url: uploadResult.url
      });

      toast({ title: "Avatar updated successfully" });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not upload avatar."
      });
      // Restore original avatar on error
      setAvatarPreview(originalLead?.image_url || null);
      setIsCropModalOpen(false);
      setImgSrc('');
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
    // STEP 1: Get complete lead data from localStorage for backup
    const { localStorageManager } = require('@/lib/local-storage-manager');
    const appData = localStorageManager.getAppData();
    const leadToBackup = appData.leads.find((l: any) => l.lead_id === id);
    const leadDetails = appData.leadDetails[id];
    const leadNotes = appData.notes[id];
    const leadCommunication = appData.communicationHistory[id];
    const leadTasks = appData.tasks.filter((task: any) => task.leadId === id);

    // Store backup in sessionStorage
    const backupData = {
      lead: leadToBackup,
      leadDetails: leadDetails,
      notes: leadNotes,
      communicationHistory: leadCommunication,
      tasks: leadTasks,
    };
    sessionStorage.setItem(`lead_delete_backup_${id}`, JSON.stringify(backupData));

    // STEP 2: OPTIMISTIC - Immediately remove from UI and navigate
    deleteLeadFromStorage(id);
    setIsDeleteDialogOpen(false);
    toast({
      title: "Lead Deleted",
      description: "Processing...",
    });
    router.push('/leads');

    // STEP 3: Send API request in background
    try {
      await cachedCallLeadApi('delete_lead', { lead_id: id });

      // SUCCESS: Clear backup from sessionStorage
      sessionStorage.removeItem(`lead_delete_backup_${id}`);

      toast({
        title: "Lead Deleted",
        description: `Lead permanently deleted.`,
      });
    } catch (error: any) {
      // ERROR: ROLLBACK - Restore from backup
      const backupJson = sessionStorage.getItem(`lead_delete_backup_${id}`);
      if (backupJson) {
        const backup = JSON.parse(backupJson);

        // Restore all data
        if (backup.lead) {
          addLead(backup.lead);
        }
        if (backup.leadDetails) {
          const currentData = localStorageManager.getAppData();
          localStorageManager.setAppData({
            ...currentData,
            leadDetails: { ...currentData.leadDetails, [id]: backup.leadDetails },
            notes: backup.notes ? { ...currentData.notes, [id]: backup.notes } : currentData.notes,
            communicationHistory: backup.communicationHistory
              ? { ...currentData.communicationHistory, [id]: backup.communicationHistory }
              : currentData.communicationHistory,
            tasks: backup.tasks ? [...currentData.tasks, ...backup.tasks] : currentData.tasks,
          });
        }

        // Clear backup
        sessionStorage.removeItem(`lead_delete_backup_${id}`);
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not delete lead."
      });

      // Navigate back to leads list even on error (since UI was already updated)
      router.push('/leads');
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

  const getPriorityLabel = (temperature: 'Hot' | 'Warm' | 'Cold' | null | undefined) => {
    if (!temperature) return '';
    switch (temperature) {
      case 'Hot': return t.leads.priorityHot;
      case 'Warm': return t.leads.priorityWarm;
      case 'Cold': return t.leads.priorityCold;
      default: return temperature;
    }
  };

  const getStageLabel = (stage: LeadStage | undefined) => {
    if (!stage) return '';
    const stageKey = stage.replace(/\s+/g, '').replace(/^./, str => str.toLowerCase());
    return t.leads.stages[stageKey as keyof typeof t.leads.stages] || stage;
  };

  const getStageDescription = (stage: LeadStage | undefined) => {
    if (!stage) return '';
    const stageKey = stage.replace(/\s+/g, '').replace(/^./, str => str.toLowerCase());
    return t.leads.stageDescriptions[stageKey as keyof typeof t.leads.stageDescriptions] || '';
  };

  const handleStatusSave = (leadId: string, newStatus: 'Hot' | 'Warm' | 'Cold', note: string) => {
    if (!lead || lead.lead_id !== leadId) return;

    console.log('🔍 DEBUG: Starting priority change:', {
      leadId,
      currentStatus: lead.temperature,
      newStatus,
      note: note.substring(0, 50) + '...'
    });

    // Show processing toast immediately
    toast({
      title: "Processing...",
      description: `Changing priority to ${newStatus}. Please wait.`,
    });

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

    console.log('🔍 DEBUG: Sending payload to API:', {
      leadId,
      temperature: fullPayload.temperature,
    });

    cachedCallLeadStatusApi(leadId, "change_priority", fullPayload).then((response) => {
        console.log('🔍 DEBUG: Webhook response received:', response);
        
        // Transform webhook response to frontend LeadData format
        const transformedLead = transformWebhookResponseToLeadData(response);
        console.log('🔍 DEBUG: Transformed lead data:', {
          leadId: transformedLead?.lead_id,
          temperature: transformedLead?.temperature,
        });

        if (transformedLead) {
            // Update lead with all server data
            setLead(transformedLead);
            setOriginalLead(JSON.parse(JSON.stringify(transformedLead)));
            
            // CRITICAL FIX: Update localStorage with the new priority
            console.log('🔍 DEBUG: Updating localStorage with new priority');
            updateLeadDetails(transformedLead as any);
            
            // Also update the leads array to ensure consistency
            const { localStorageManager } = require('@/lib/local-storage-manager');
            localStorageManager.updateSingleLead(leadId, {
              temperature: newStatus,
              'Hot/Warm/Cold': newStatus
            });
            console.log('🔍 DEBUG: Updated both leadDetails and leads array in localStorage');
        } else {
            // Fallback: update only temperature if transformation fails
            console.warn('⚠️ DEBUG: Transform failed, using fallback update');
            setLead(prev => prev ? ({ ...prev, temperature: newStatus }) : null);
            setOriginalLead(prev => prev ? JSON.parse(JSON.stringify({ ...prev, temperature: newStatus })) : null);
            
            // CRITICAL FIX: Still update localStorage even with fallback
            updateLeadDetails({ ...lead, temperature: newStatus } as any);
            const { localStorageManager } = require('@/lib/local-storage-manager');
            localStorageManager.updateSingleLead(leadId, {
              temperature: newStatus,
              'Hot/Warm/Cold': newStatus
            });
        }

        const newNote: Note = {
            id: `note-${Date.now()}`,
            content: note,
            date: new Date().toISOString(),
        };
        setNotes(prev => [newNote, ...prev]);

        // Add success notification to notifications page
        const { localStorageManager } = require('@/lib/local-storage-manager');
        const notificationId = `priority-change-${Date.now()}`;
        const newNotification = {
          id: notificationId,
          title: "Priority Changed",
          message: `Priority for ${lead.name} changed to ${newStatus}`,
          type: "priority_changed",
          timestamp: new Date().toISOString(),
          read: false,
          lead_id: leadId,
          action_target: `/leads/${leadId}`
        };
        
        // Add to notifications
        const currentNotifications = localStorageManager.getNotifications();
        const updatedNotifications = [newNotification, ...currentNotifications];
        localStorageManager.updateNotifications(updatedNotifications);
        
        // Force trigger throttled storage event for cross-tab synchronization
        const { dispatchThrottledStorageEvent } = require('@/lib/storage-event-throttle');
        dispatchThrottledStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));

        // Show success toast
        toast({
            title: "Priority updated",
            description: `Lead priority changed to ${newStatus} and note added.`,
        });
    }).catch((error) => {
        console.error('❌ DEBUG: Priority update error:', error);
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
  
    const currentStage = getLeadStage(lead);
  
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('sessionToken');
      if (!token) throw new Error('No authentication token found');
  
      const webhookUrl = 'https://eurekagathr.app.n8n.cloud/webhook/domain/lead-status';
      const webhookPayload = {
        lead_id: lead.lead_id,
        operation: 'stage_change',
        stage: selectedStage,
        note: stageChangeNote
      };
      
      console.log('🔍 DEBUG: Sending stage change webhook:', {
        lead_id: lead.lead_id,
        currentStage,
        selectedStage,
        payload: webhookPayload
      });
  
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(webhookPayload)
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ DEBUG: Webhook failed:', { status: response.status, errorText });
        throw new Error(errorText || 'Failed to update lead stage');
      }
      
      const responseData = await response.json();
      console.log('🔍 DEBUG: Webhook response received:', responseData);
      
      // Check if response contains the expected lead data
      if (Array.isArray(responseData) && responseData.length > 0) {
        const leadData = responseData[0];
        console.log('🔍 DEBUG: Processing lead data from webhook:', {
          lead_id: leadData.lead_id,
          stage: leadData.Stage,
          lead_stage: leadData.lead_stage,
          name: leadData.name
        });
        
        // Update localStorage with the webhook response data
        const { localStorageManager } = require('@/lib/local-storage-manager');
        
        // Update both leads array and leadDetails
        localStorageManager.updateSingleLead(lead.lead_id, {
          stage: selectedStage,
          lead_stage: selectedStage,
          Stage: selectedStage
        });
        
        console.log('✅ DEBUG: Updated localStorage with new stage');
      }
  
      setLead(prev => prev ? ({ ...prev, stage: selectedStage, lead_stage: selectedStage } as any) : null);
      setOriginalLead(prev => prev ? JSON.parse(JSON.stringify({ ...prev, stage: selectedStage, lead_stage: selectedStage })) : null);
  
      toast({ title: "Stage Updated", description: `Lead stage changed to "${selectedStage}".` });
      
      // Add success notification to notifications page
      const { localStorageManager } = require('@/lib/local-storage-manager');
      const stageNotificationId = `stage-change-${Date.now()}`;
      const newStageNotification = {
        id: stageNotificationId,
        title: "Stage Changed",
        message: `Stage for ${lead.name} changed to "${selectedStage}"`,
        type: "stage_changed",
        timestamp: new Date().toISOString(),
        read: false,
        lead_id: lead.lead_id,
        action_target: `/leads/${lead.lead_id}`
      };
      
      // Add to notifications
      const currentNotifications = localStorageManager.getNotifications();
      const updatedNotifications = [newStageNotification, ...currentNotifications];
      localStorageManager.updateNotifications(updatedNotifications);
      
      // Force trigger throttled storage event for cross-tab synchronization
      const { dispatchThrottledStorageEvent } = require('@/lib/storage-event-throttle');
      dispatchThrottledStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));
    } catch (error: any) {
      console.error('❌ DEBUG: Stage change error:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not update lead stage.' });
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

      await cachedCallLeadApi('edit_lead', updatedLeadData);

      // Update localStorage
      updateLeadDetails(updatedLeadData as any);

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
      // Read notes from useNotes hook which gets data from localStorage
      const notesArray: any[] = notesFromStorage || [];

      // Get agent name from localStorage
      const agentDataString = localStorage.getItem('agent_data');
      const agentName = agentDataString ? JSON.parse(agentDataString).agent_name : 'Agent';

      if (notesArray.length === 0) {
        // No notes exist - show empty state
        setCurrentNote(null);
        setNotes([]);
        setIsNotesOpen(true);
        setIsFetchingNotes(false);
        return;
      }

      // Sort by created_at descending (most recent first)
      const sortedNotes = [...notesArray].sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Most recent note is the current note
      const currentNoteData = sortedNotes[0];

      setCurrentNote({
        note_id: currentNoteData.note_id,
        note: currentNoteData.content || currentNoteData.current_note,
        created_at_formatted: formatDateWithTimezone(currentNoteData.created_at),
        created_by: currentNoteData.created_by || agentName
      } as CurrentNote);

      // Rest of notes become history
      const historyNotes = sortedNotes.slice(1).map((note: any) => ({
        id: note.note_id,
        note_id: note.note_id,
        content: note.content || note.current_note,
        created_at: note.created_at,
        created_at_formatted: formatDateWithTimezone(note.created_at),
        created_by: note.created_by || agentName,
        date: note.created_at
      }));

      setNotes(historyNotes);
      setIsNotesOpen(true);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load notes.' });
    } finally {
      setIsFetchingNotes(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  const isBedroomsDisabled = lead.property.type === 'Commercial' || lead.property.type === 'Land';

  // Map the 'stage' field from API to lead_stage for display
  const getLeadStage = (leadData: LeadData | null): LeadStage | undefined => {
    const stage = (leadData as any)?.stage || (leadData as any)?.lead_stage;
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
          <h1 className="ml-4 text-xl font-semibold">{isEditing ? t.leads.editLead : t.leads.leadDetails}</h1>
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
                {t.common.cancel}
              </Button>
              <Button onClick={prepareSaveChanges} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {t.common.save}
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
                    <span>{t.leads.editLead}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsStatusDialogOpen(true)}>
                  <Zap className="mr-2 h-4 w-4" />
                  <span>{t.leads.priority}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsLeadStageDialogOpen(true)}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>{t.leads.changeStage}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsScheduleFollowUpDialogOpen(true)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>{t.leads.scheduleFollowUp}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>{t.leads.deleteLead}</span>
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
            {!isEditing && (
              <Button
                variant="outline"
                size="icon"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white shadow-md"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
            )}
            <Input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>          <div className='flex flex-col items-center gap-1'>
          <div className='relative flex justify-center items-center gap-2'>
              <h2 className="text-2xl font-bold">{lead.name}</h2>
              {currentStageInfo && (
                <div className={cn("absolute left-full ml-4 flex h-8 w-8 items-center justify-center rounded-full shadow-md", currentStageInfo.color)}>
                  <currentStageInfo.icon className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <LeadTypeBadge leadType={lead.lead_type} />
              <Badge variant="outline" className={cn("text-xs", getStatusBadgeClass(lead.temperature))}>{getPriorityLabel(lead.temperature)}</Badge>
              {currentStageInfo && (
                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">{getStageLabel(currentStageInfo.value)}</Badge>
              )}
            </div>
          </div>
          <div className='w-full flex items-center justify-end text-xs text-gray-500 mt-1 px-4'>
            <span>{t.leads.created} {lead.created_at_formatted}</span>
          </div>
        </section>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.leads.personalInformation}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                 {isEditing ? (
                   <>
                     <EditableField
                       label={t.leads.name}
                       value={lead.name}
                       onChange={(value) => setLead(prev => prev ? {...prev, name: value} : null)}
                       className="col-span-2"
                     />
                     <EditableField
                       label={t.leads.email}
                       value={lead.contact.email}
                       onChange={(value) => setLead(prev => prev ? {...prev, contact: {...prev.contact, email: value}} : null)}
                       className="col-span-2"
                     />
                     <div className="col-span-2 grid gap-1">
                       <p className="text-gray-500">{t.leads.phoneNumber}</p>
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
                     <div>
                       <Label className="text-sm text-gray-500 mb-2 block">{t.leads.language}</Label>
                       <Select
                         value={lead.contact.language || 'Portuguese'}
                         onValueChange={(value) => setLead(prev => prev ? {...prev, contact: {...prev.contact, language: value}} : null)}
                       >
                         <SelectTrigger className="w-full">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="English">{t.common.languages.english}</SelectItem>
                           <SelectItem value="Portuguese">{t.common.languages.portuguese}</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </>
                 ) : (
                   <>
                     <InfoItem label={t.leads.name} value={lead.name} className="col-span-2" />
                     <InfoItem label={t.leads.email} value={lead.contact.email} className="col-span-2" />
                     <InfoItem label={t.leads.phoneNumber} value={String(lead.contact.phone || '')} className="col-span-2" />
                     <InfoItem label={t.leads.language} value={lead.contact.language || 'Portuguese'} />
                   </>
                 )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>{t.leads.propertyRequirements}</CardTitle>
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <div className="space-y-6">
                        <div>
                            <p className="text-gray-500 text-sm mb-2">{t.leads.propertyType}</p>
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
                            <p className="text-gray-500 text-sm mb-2">
                              {lead.lead_type === 'Seller' ? t.leads.askingPrice : t.leads.budget}
                            </p>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                                <Input
                                    type="number"
                                    value={lead.property.budget || ''}
                                    onChange={(e) => {
                                        const value = e.target.value === '' ? 0 : Number(e.target.value);
                                        setLead(prev => prev ? {...prev, property: {...prev.property, budget: value}} : null);
                                    }}
                                    className="pl-8"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div>
                            <p className="text-gray-500 text-sm mb-2">{t.leads.bedrooms}</p>
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
                            <p className="text-gray-500 text-sm mb-2">
                              {lead.lead_type === 'Seller' ? t.leads.propertyLocation : t.leads.desiredLocations}
                            </p>
                            <Textarea
                                value={lead.property.locations.join(', ')}
                                onChange={(e) => {
                                    const locationsArray = e.target.value.split(',');
                                    setLead(prev => prev ? {...prev, property: {...prev.property, locations: locationsArray}} : null);
                                }}
                                placeholder="Enter location(s). For multiple locations, separate with commas"
                                className="min-h-[80px]"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                You can enter multiple locations separated by commas
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <InfoItem label={t.leads.propertyType} value={lead.property.type || '-'} />
                        <InfoItem
                          label={lead.lead_type === 'Seller' ? t.leads.askingPrice : t.leads.budget}
                          value={lead.property.budget_formatted || '-'}
                        />
                        <InfoItem label={t.leads.bedrooms} value={lead.property.bedrooms || '-'} />
                        <InfoItem
                          label={lead.lead_type === 'Seller' ? t.leads.propertyLocation : t.leads.desiredLocations}
                          value={lead.property.locations.join(', ')}
                          className="col-span-2"
                        />
                    </div>
                )}
            </CardContent>
        </Card>
        </div>
      </main>

      {!isEditing && (
        <div className="fixed bottom-20 right-4 z-20 flex flex-col items-end gap-4">
          <ActionButton icon={FileText} label={t.leads.notes} onClick={handleOpenNotes} isLoading={isFetchingNotes} />
          <ActionButton icon={Send} label={t.leads.followUp} onClick={() => setIsFollowUpOpen(true)} />
          <ActionButton icon={History} label={t.leads.history} onClick={() => setIsHistoryOpen(true)} />
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
      <ScheduleFollowUpDialog
        open={isScheduleFollowUpDialogOpen}
        onOpenChange={setIsScheduleFollowUpDialogOpen}
        lead={{
          lead_id: lead.lead_id,
          name: lead.name,
          image_url: lead.image_url,
          lead_type: lead.lead_type,
          temperature: lead.temperature,
          stage: lead.stage,
          lead_stage: lead.lead_stage,
        }}
        onSuccess={() => {
          // Data will be updated via selective webhooks
          // localStorage subscription will handle UI updates
        }}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.leadDetails.areYouSure}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.leadDetails.deleteLeadWarning.replace('{{name}}', leadToDeleteName)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead} className="bg-destructive hover:bg-destructive/90">
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
       <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t.leads.cropImage}</DialogTitle>
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
                <Button variant="outline" onClick={() => setIsCropModalOpen(false)}>{t.common.cancel}</Button>
                <Button onClick={handleSaveCrop}>{t.common.save}</Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>

       <Dialog open={isLeadStageDialogOpen} onOpenChange={setIsLeadStageDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{t.leads.dialogs.changeStageTitle}</DialogTitle>
                <DialogDescription>
                    {t.leads.dialogs.changeStageDescription}
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
                                "w-full text-left p-4 rounded-lg border-2 transition-all focus:outline-none relative",
                                isCurrent
                                    ? "border-primary bg-primary/5 cursor-default"
                                    : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                            )}
                        >
                            {isCurrent && <Badge className="absolute -top-2 -right-2">{t.leads.dialogs.current}</Badge>}
                            <div className="flex items-start gap-4">
                                <div className={cn("mt-1 flex h-8 w-8 items-center justify-center rounded-full shrink-0", stage.color)}>
                                    <stage.icon className="h-5 w-5" />
                                </div>
                                <div className='flex-1'>
                                    <p className="font-semibold">{getStageLabel(stage.value)}</p>
                                    <p className="text-sm text-gray-500">{getStageDescription(stage.value)}</p>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsLeadStageDialogOpen(false)}>{t.common.cancel}</Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>

       <AlertDialog open={isStageConfirmDialogOpen} onOpenChange={setIsStageConfirmDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t.leads.dialogs.confirmStageChangeTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                    {currentStageInfo && selectedStageInfo
                        ? t.leads.dialogs.confirmStageChangeDescription.replace('{{from}}', getStageLabel(currentStageInfo.value)).replace('{{to}}', getStageLabel(selectedStageInfo.value))
                        : t.leads.dialogs.confirmStageChangeTitle}
                </AlertDialogDescription>
            </AlertDialogHeader>
            {currentStageInfo && selectedStageInfo && (
                <div className="flex items-center justify-center gap-4 my-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full shrink-0", currentStageInfo.color)}>
                            <currentStageInfo.icon className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-sm">{getStageLabel(currentStageInfo.value)}</span>
                    </div>
                    <ArrowRight className="h-6 w-6 text-gray-400 shrink-0" />
                    <div className="flex flex-col items-center gap-2">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full shrink-0", selectedStageInfo.color)}>
                            <selectedStageInfo.icon className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-sm">{getStageLabel(selectedStageInfo.value)}</span>
                    </div>
                </div>
            )}
             <div className="space-y-2">
              <Label htmlFor="stage-change-note">{t.leads.noteOptional}</Label>
              <Textarea
                id="stage-change-note"
                placeholder={t.leads.stageChangeNotePlaceholder}
                value={stageChangeNote}
                onChange={(e) => setStageChangeNote(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                    setIsStageConfirmDialogOpen(false);
                    setIsLeadStageDialogOpen(true);
                }}>{t.common.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmLeadStageChange}>
                  {t.common.confirm}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmSaveOpen} onOpenChange={setIsConfirmSaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.leads.confirmSaveDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.leads.reviewChangesDescription}
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
            <AlertDialogCancel onClick={() => setIsConfirmSaveOpen(false)}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveLeadChanges} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t.leads.confirmAndSave}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

function InfoItem({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  const displayValue = value === null || value === undefined || value === '' ? '-' : value;
  return (
    <div className={cn("grid gap-1", className)}>
      <p className="text-gray-500">{label}</p>
      <div className="font-medium break-all">{displayValue}</div>
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
    const { t } = useLanguage();
    const [noteContent, setNoteContent] = useState('');
    const [originalNoteContent, setOriginalNoteContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingNewNote, setIsAddingNewNote] = useState(false);
    const [movedNoteId, setMovedNoteId] = useState<string | null>(null);

    const getPriorityLabel = (temperature: 'Hot' | 'Warm' | 'Cold' | null | undefined) => {
        if (!temperature) return '';
        switch (temperature) {
            case 'Hot': return t.leads.priorityHot;
            case 'Warm': return t.leads.priorityWarm;
            case 'Cold': return t.leads.priorityCold;
            default: return temperature;
        }
    };
    
    useEffect(() => {
        if (open) {
            if (currentNote) {
                setNoteContent(currentNote.note || '');
                setOriginalNoteContent(currentNote.note || '');
                setIsAddingNewNote(false);
            } else {
                setNoteContent('');
                setOriginalNoteContent('');
                setIsAddingNewNote(true);
            }
        }
    }, [open, currentNote]);

    const handleSaveNote = async (operation: 'add_new_note' | 'edit_note') => {
        if (!noteContent.trim()) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please enter a note'
            });
            return;
        }

        setIsSaving(true);

        // STEP 1: Backup current state for rollback
        const backup = {
            currentNote: currentNote,
            notes: notes,
            originalContent: originalNoteContent
        };

        try {
            // STEP 2: Optimistic update - Update UI immediately
            const now = new Date();
            const agentDataString = localStorage.getItem('agent_data');
            const agentName = agentDataString ? JSON.parse(agentDataString).agent_name : 'Agent';
    
            const tempNote = {
                note_id: operation === 'add_new_note' ? 'temp_' + Date.now() : currentNote?.note_id || '',
                note: noteContent.trim(),
                created_at: now.toISOString(),
                created_at_formatted: new Date().toLocaleString(),
                created_by: agentName,
                date: now.toISOString()
            };

            // For edit: move old note to history
            if (operation === 'edit_note' && currentNote && currentNote.note) {
                const oldNote = {
                    id: currentNote.note_id || 'history_' + Date.now(),
                    note_id: currentNote.note_id,
                    lead_id: lead.lead_id,
                    content: originalNoteContent,
                    current_note: originalNoteContent,
                    created_at_formatted: currentNote.created_at_formatted || new Date().toLocaleString(),
                    created_by: currentNote.created_by || agentName
                };
                const updatedHistory = [oldNote, ...notes];
                setNotes(updatedHistory as any);
            }

            setCurrentNote(tempNote);
            setOriginalNoteContent(noteContent.trim());

            // STEP 3: Call API
            const token = localStorage.getItem('auth_token');
            const payload: any = {
                operation,
                lead_id: lead.lead_id,
                current_note: noteContent.trim(),
            };

            if (operation === 'edit_note' && backup.currentNote) {
                payload.note_id = backup.currentNote.note_id;
            }

            const response = await fetch('https://eurekagathr.app.n8n.cloud/webhook/domain/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Failed to ${operation === 'edit_note' ? 'update' : 'add'} note`);
            }

            const data = await response.json();
            const result = Array.isArray(data) ? data[0] : data;

            // STEP 4: Process notes array from response
            const responseNotes = result.notes || [];

            if (responseNotes.length > 0) {
                // Sort by created_at descending
                const sortedNotes = [...responseNotes].sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                // Most recent note is current
                const latestNote = sortedNotes[0];

                setCurrentNote({
                    note_id: latestNote.note_id,
                    note: latestNote.content || latestNote.current_note,
                    created_at_formatted: new Date(latestNote.created_at || '').toLocaleString(),
                    created_by: latestNote.created_by || agentName
                } as CurrentNote);

                setNoteContent(latestNote.content || latestNote.current_note);
                setOriginalNoteContent(latestNote.content || latestNote.current_note);

                // Rest are history
                const history = sortedNotes.slice(1).map((n: any) => ({
                    id: n.note_id,
                    note_id: n.note_id,
                    content: n.content || n.current_note,
                    created_at: n.created_at,
                    created_at_formatted: new Date(n.created_at || '').toLocaleString(),
                    created_by: n.created_by || agentName,
                    date: n.created_at
                }));

                setNotes(history);

                // Update localStorage - store ALL notes
                const formattedNotes = sortedNotes.map((n: any) => ({
                    id: n.note_id,
                    note_id: n.note_id,
                    lead_id: lead.lead_id,
                    content: n.content || n.current_note,
                    current_note: n.content || n.current_note,
                    created_at: n.created_at,
                    created_at_formatted: formatDateWithTimezone(n.created_at || ''),
                    created_by: n.created_by || agentName,
                    note_type: n.note_type || 'text',
                    date: n.created_at
                }));

                updateNotesInStorage(formattedNotes as any);
            }

            // STEP 6: Success message
            toast({
                title: operation === 'add_new_note' ? 'New note added successfully' : 'Note updated successfully',
                description: operation === 'add_new_note' ? 'Your note has been saved' : 'Your changes have been saved'
            });

            if (operation === 'add_new_note') {
                setIsAddingNewNote(false);
            }

        } catch (error: any) {
            // ROLLBACK on error
            setCurrentNote(backup.currentNote);
            setNotes(backup.notes);
            setOriginalNoteContent(backup.originalContent);
            setNoteContent(backup.originalContent || '');

            toast({
                variant: 'destructive',
                title: t.common.error,
                description: error.message || 'Failed to save note'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleNewNoteClick = () => {
        if (currentNote && currentNote.note) {
            // Create properly formatted history note with ALL date fields
            const historyNote = {
                id: currentNote.note_id,
                note_id: currentNote.note_id,
                content: currentNote.note,
                current_note: currentNote.note,
                created_at_formatted: currentNote.created_at_formatted || formatDateWithTimezone(new Date().toISOString()),
                created_by: currentNote.created_by || 'Agent',
                date: new Date().toISOString(),
                timestamp: new Date().toISOString()
            };

            // Only add if not already in history
            if (!notes.some(n => n.note_id === currentNote.note_id)) {
                setNotes(prev => [historyNote, ...prev]);
            }

            setMovedNoteId(currentNote.note_id);
        }

        setCurrentNote(null);
        setIsAddingNewNote(true);
        setNoteContent('');
    };

    const handleCancelNewNote = () => {
        if (movedNoteId) {
            const movedNote = notes.find(n => n.note_id === movedNoteId);
            if (movedNote) {
                // Restore the previous note to current
                const restoredCurrentNote = {
                    note_id: movedNote.note_id || movedNote.id || '',
                    note: movedNote.content || movedNote.note || '',
                    created_at_formatted: movedNote.created_at_formatted || '',
                    created_by: movedNote.created_by || 'Agent'
                };
                setCurrentNote(restoredCurrentNote);
                // Restore the content to the textarea
                setNoteContent(restoredCurrentNote.note);
                setOriginalNoteContent(restoredCurrentNote.note);
                // Remove from history
                setNotes(notes.filter(n => n.note_id !== movedNoteId));
            }
            setMovedNoteId(null);
        }
        setIsAddingNewNote(false);
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
        const date = new Date(dateStr);
        // Use current language locale for date formatting
        const locale = t.common.languages.portuguese === 'Português' ? 'pt-PT' : 'en-US';
        return date.toLocaleString(locale, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
                <SheetHeader className="flex flex-row items-center gap-3 border-b px-4 py-3 shrink-0">
                     <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="shrink-0">
                       <ArrowLeft className="h-6 w-6" />
                     </Button>
                     <SheetTitle className="text-lg font-semibold">{t.leads.leadNotes}</SheetTitle>
                     <SheetDescription className="sr-only">
                       Manage notes for {lead.name}.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    <CompactLeadHeader
                      name={lead.name}
                      imageUrl={lead.image_url}
                      leadType={lead.lead_type}
                      temperature={lead.temperature}
                      stage={lead.lead_stage}
                    />
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-base font-semibold">{t.leads.currentNote}</h4>
                            {currentNote && (
                                <div className="text-xs text-gray-500 text-right">
                                    <p>{currentNote.created_at_formatted}</p>
                                    <p className="hidden">By: {currentNote.created_by}</p>
                                </div>
                            )}
                        </div>
                        <div className="border rounded-lg p-3">
                             <Textarea
                                ref={textareaRef}
                                placeholder={t.leads.notePlaceholder}
                                className="border-0 focus-visible:ring-0 min-h-[100px] max-h-[300px] p-0 resize-none overflow-y-auto"
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                            />
                             <div className="flex gap-2 justify-end mt-2">
                                {isAddingNewNote && (
                                    <>
                                        <Button variant="outline" size="sm" onClick={handleCancelNewNote}>
                                            {t.common.cancel}
                                        </Button>
                                        {noteContent.trim() && (
                                            <Button size="sm" onClick={() => handleSaveNote('add_new_note')} disabled={isSaving}>
                                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                {t.leads.saveNote}
                                            </Button>
                                        )}
                                    </>
                                )}
                                {!isAddingNewNote && isNoteChanged && (
                                     <>
                                        <Button variant="outline" size="sm" onClick={() => currentNote && setNoteContent(originalNoteContent)}>
                                            {t.common.cancel}
                                        </Button>
                                        <Button size="sm" onClick={() => handleSaveNote('edit_note')} disabled={isSaving}>
                                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            {'Save Changes'}
                                        </Button>
                                    </>
                                )}
                                {!isAddingNewNote && !isNoteChanged && (
                                    <Button size="sm" onClick={handleNewNoteClick} disabled={!currentNote && isAddingNewNote}>
                                         {t.leads.addNewNote}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-base font-semibold mb-2">{t.leads.noteHistory}</h4>
                        <div className="space-y-2">
                            {notes.map((note, index) => {
                                const key = note.note_id || `history-${index}`;
                                const displayDate = note.created_at_formatted || formattedDate(note.date);

                                return (
                                <div key={key} className="bg-gray-50 rounded-lg p-3 relative">
                                    <p className="text-sm text-gray-700 mb-1.5 whitespace-pre-wrap pr-8">{note.note || note.content}</p>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-gray-400">{displayDate}</p>
                                        <p className="text-xs text-gray-400 hidden">By: {note.created_by}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-7 w-7"
                                        onClick={() => handleCopy(note.note || note.content || '')}
                                    >
                                        <Copy className="h-3.5 w-3.5 text-gray-500" />
                                    </Button>
                                </div>
                            )})}
                             {notes.length === 0 && (
                                <div className="text-center text-gray-500 py-6 text-sm">
                                    {t.leads.noPastNotes}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

type LeadHistorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadData;
  history: any[];
};

function LeadHistorySheet({ open, onOpenChange, lead, history }: LeadHistorySheetProps) {
    const { t } = useLanguage();
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
                <SheetHeader className="flex flex-row items-center gap-3 border-b px-4 py-3 shrink-0">
                     <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="shrink-0">
                       <ArrowLeft className="h-6 w-6" />
                     </Button>
                     <SheetTitle className="text-lg font-semibold">{t.leads.communicationHistory}</SheetTitle>
                     <SheetDescription className="sr-only">
                       View the communication history for {lead.name}.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-3">
                    <CompactLeadHeader
                      name={lead.name}
                      imageUrl={lead.image_url}
                      leadType={lead.lead_type}
                      temperature={lead.temperature}
                      stage={lead.lead_stage}
                      className="mb-3"
                    />
                    <CommunicationHistoryTimeline events={history} />
                </div>
            </SheetContent>
        </Sheet>
    );
}

    

    

    
