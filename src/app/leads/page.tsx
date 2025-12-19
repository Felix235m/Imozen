
"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { Search, Plus, MoreVertical, X, Edit, Zap, Trash2, Loader2, Users, UserPlus, PhoneCall, UserCheck, Calendar, Home, Tag, MessageCircle, FileSignature, PartyPopper, ThumbsDown, UserX, TrendingUp, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { LeadStatusDialog } from '@/components/leads/lead-status-dialog';
import { ScheduleFollowUpDialog } from '@/components/leads/schedule-follow-up-dialog';
import { LeadTypeBadge } from '@/components/leads/lead-badges';
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
import { callAuthApi, callApi } from '@/lib/auth-api';
import { cachedCallLeadApi, cachedCallLeadStatusApi } from '@/lib/cached-api';
import { transformWebhookResponseToLeadListItem } from '@/lib/lead-transformer';
import { format, isValid } from 'date-fns';
// @ts-ignore - TypeScript declaration issue with date-fns locales
import { ptBR } from 'date-fns/locale';
import { useLeads } from '@/hooks/useAppData';
import { refreshDashboard } from '@/lib/selective-webhooks';
import { RetryPopup } from '@/components/notifications/retry-popup';
import type { OptimisticOperation } from '@/types/app-data';
import { checkForDraft, clearDraft, type DraftInfo } from '@/lib/draft-detector';
import { DraftResumeDialog } from '@/components/leads/draft-resume-dialog';
import { navigationOptimizer } from '@/lib/navigation-optimizer';
import {
  acquirePriorityChangeLock,
  releasePriorityChangeLock,
  isPriorityChangeLocked
} from '@/lib/operation-deduplicator';


type LeadTemperature = 'Hot' | 'Warm' | 'Cold';

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

type Lead = {
  lead_id: string;
  name: string;
  temperature: LeadTemperature;
  stage: LeadStage;
  lead_stage?: LeadStage;
  lead_type?: 'Buyer' | 'Seller';
  next_follow_up: {
    status: string;
    date: string | null;
  };
};

// Main content component that uses useSearchParams
function LeadsPageContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All Leads');
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  // Use localStorage-based leads data
  const { leads: leadsFromStorage, updateLeads, updateSingleLead, deleteLead: deleteLeadFromStorage, addLead } = useLeads();

  // Transform leads to ensure correct field mapping
  const leads = useMemo(() => {
    return leadsFromStorage.map((lead: any) => ({
      ...lead,
      lead_stage: lead.lead_stage || lead.Stage || 'New Lead'
    }));
  }, [leadsFromStorage]);
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : undefined;

  // Sort and filter state
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'followUp'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showOverdue, setShowOverdue] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showNoDate, setShowNoDate] = useState(false);
  const [showLast7Days, setShowLast7Days] = useState(false);

  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedLeadForStatus, setSelectedLeadForStatus] = useState<Lead | null>(null);

  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [leadsToDelete, setLeadsToDelete] = useState<string[] | null>(null);

  const [isLeadStageDialogOpen, setIsLeadStageDialogOpen] = useState(false);

  // Retry popup state
  const [showRetryPopup, setShowRetryPopup] = useState(false);
  const [retryOperation, setRetryOperation] = useState<OptimisticOperation | null>(null);
  const [isStageConfirmDialogOpen, setIsStageConfirmDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<LeadStage | null>(null);
  const [selectedLeadForStageChange, setSelectedLeadForStageChange] = useState<Lead | null>(null);

  const [isScheduleFollowUpDialogOpen, setIsScheduleFollowUpDialogOpen] = useState(false);
  const [selectedLeadForSchedule, setSelectedLeadForSchedule] = useState<Lead | null>(null);

  // Draft detection state
  const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
  const [draftInfo, setDraftInfo] = useState<DraftInfo>({ exists: false });

  // Helper function to safely format follow-up dates
  const formatFollowUpDate = (dateValue: string | null | undefined): string => {
    if (!dateValue || dateValue === '-' || dateValue.trim() === '') {
      return t.leads.notSet;
    }

    try {
      const parsedDate = new Date(dateValue);
      if (isValid(parsedDate)) {
        // @ts-ignore - TypeScript issue with date-fns locale parameter
        return format(parsedDate, 'MMM d, yyyy', { locale: dateLocale });
      } else {
        return t.leads.notSet;
      }
    } catch (error) {
      return t.leads.notSet;
    }
  };

  // Helper function to format created date with Portugal timezone
  const formatCreatedDate = (isoDate: string): string => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      // @ts-ignore - TypeScript issue with date-fns locale parameter
      return format(date, 'MMM d, yyyy', { locale: dateLocale });
    } catch {
      return '';
    }
  };

  const LEAD_STAGES: { value: LeadStage; label: string; color: string; description: string, icon: React.ElementType }[] = [
    { value: 'New Lead', label: t.leads.stages.newLead, color: 'bg-blue-100 text-blue-700', description: t.leads.stageDescriptions.newLead, icon: UserPlus },
    { value: 'Contacted', label: t.leads.stages.contacted, color: 'bg-purple-100 text-purple-700', description: t.leads.stageDescriptions.contacted, icon: PhoneCall },
    { value: 'Qualified', label: t.leads.stages.qualified, color: 'bg-indigo-100 text-indigo-700', description: t.leads.stageDescriptions.qualified, icon: UserCheck },
    { value: 'Property Viewing Scheduled', label: t.leads.stages.viewingScheduled, color: 'bg-cyan-100 text-cyan-700', description: t.leads.stageDescriptions.viewingScheduled, icon: Calendar },
    { value: 'Property Viewed', label: t.leads.stages.propertyViewed, color: 'bg-teal-100 text-teal-700', description: t.leads.stageDescriptions.propertyViewed, icon: Home },
    { value: 'Offer Made', label: t.leads.stages.offerMade, color: 'bg-orange-100 text-orange-700', description: t.leads.stageDescriptions.offerMade, icon: Tag },
    { value: 'Negotiation', label: t.leads.stages.negotiation, color: 'bg-yellow-100 text-yellow-700', description: t.leads.stageDescriptions.negotiation, icon: MessageCircle },
    { value: 'Under Contract', label: t.leads.stages.underContract, color: 'bg-lime-100 text-lime-700', description: t.leads.stageDescriptions.underContract, icon: FileSignature },
    { value: 'Converted', label: t.leads.stages.converted, color: 'bg-green-100 text-green-700', description: t.leads.stageDescriptions.converted, icon: PartyPopper },
    { value: 'Lost', label: t.leads.stages.lost, color: 'bg-red-100 text-red-700', description: t.leads.stageDescriptions.lost, icon: ThumbsDown },
    { value: 'Not Interested', label: t.leads.stages.notInterested, color: 'bg-gray-100 text-gray-700', description: t.leads.stageDescriptions.notInterested, icon: UserX },
  ];

  useEffect(() => {
    // Data is loaded from localStorage via useLeads hook
    setIsLoading(false);
    
    // PERFORMANCE FIX: Preload first few leads for instant navigation
    // Use setTimeout to not block the UI
    const timer = setTimeout(() => {
      const firstFewLeads = leads.slice(0, 5).map(lead => lead.lead_id);
      if (firstFewLeads.length > 0) {
        navigationOptimizer.preloadMultipleLeads(firstFewLeads);
      }
    }, 100); // Small delay to not block UI
    
    return () => clearTimeout(timer);
  }, [leads]);

  // Apply filters based on URL parameters from dashboard
  useEffect(() => {
    if (!filterParam) return;

    switch (filterParam) {
      case 'hot':
        setActiveTab('Hot Leads');
        setShowOverdue(false);
        setShowUpcoming(false);
        setShowNoDate(false);
        break;

      case 'upcoming':
        setActiveTab('All Leads');
        setShowUpcoming(true);
        setShowOverdue(false);
        setShowNoDate(false);
        break;

      case 'new_this_week':
        setActiveTab('All Leads');
        setShowOverdue(false);
        setShowUpcoming(false);
        setShowNoDate(false);
        setShowLast7Days(true);
        break;
    }
  }, [filterParam]);

  const handleAddNewLead = () => {
    // Check for existing draft
    const draft = checkForDraft();

    if (draft.exists) {
      // Show draft resume dialog
      setDraftInfo(draft);
      setIsDraftDialogOpen(true);
    } else {
      // No draft found, proceed with new lead creation
      startNewLead();
    }
  };

  const startNewLead = () => {
    // Generate lead_id immediately using crypto.randomUUID()
    const leadId = crypto.randomUUID();

    // Initialize sessionStorage with empty form data and lead_id
    sessionStorage.setItem('lead_id', leadId);
    sessionStorage.setItem('leadFormData', JSON.stringify({ _lastModified: Date.now() }));

    // Navigate instantly to the new lead form
    router.push('/leads/new');
  };

  const handleContinueDraft = () => {
    // Close dialog and navigate to form (will auto-load from sessionStorage)
    setIsDraftDialogOpen(false);
    router.push('/leads/new');
  };

  const handleStartFresh = () => {
    // Clear existing draft and start new
    clearDraft();
    setIsDraftDialogOpen(false);
    startNewLead();
  };


  const filteredLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];

    // 1. Search filter
    let results = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Temperature filter (existing tabs)
    if (activeTab !== 'All Leads') {
      const temperature = activeTab.replace(' Leads', '') as LeadTemperature;
      results = results.filter(lead => lead.temperature === temperature);
    }

    // 3. Follow-up date filters
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (showOverdue || showUpcoming || showNoDate) {
      results = results.filter(lead => {
        const followUpDate = lead.next_follow_up?.date;

        if (showNoDate && (!followUpDate || followUpDate === '-')) return true;

        if (followUpDate && followUpDate !== '-') {
          const date = new Date(followUpDate);
          if (isValid(date)) {
            if (showOverdue && date < now) return true;
            if (showUpcoming && date >= now && date <= sevenDaysFromNow) return true;
          }
        }

        return false;
      });
    }

    // 3b. Last 7 days filter (created date)
    if (showLast7Days) {
      // Calculate 7 days ago for rolling window
      // This matches the backend's rolling 7 days logic
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      results = results.filter(lead => {
        if (!lead.created_at) return false;
        const createdDate = new Date(lead.created_at);
        return createdDate >= sevenDaysAgo;
      });
    }

    // 4. Sorting
    results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;

        case 'created':
          // Sort by lead_id (assuming it contains creation timestamp)
          comparison = a.lead_id.localeCompare(b.lead_id);
          break;

        case 'followUp':
          const dateA = a.next_follow_up.date;
          const dateB = b.next_follow_up.date;

          // Handle null/empty dates (push to end)
          if (!dateA || dateA === '-') return 1;
          if (!dateB || dateB === '-') return -1;

          const parsedA = new Date(dateA);
          const parsedB = new Date(dateB);

          if (!isValid(parsedA)) return 1;
          if (!isValid(parsedB)) return -1;

          comparison = parsedA.getTime() - parsedB.getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return results;
  }, [searchTerm, activeTab, leads, sortBy, sortDirection, showOverdue, showUpcoming, showNoDate, showLast7Days]);

  const leadToDeleteName = useMemo(() => {
    if (!leadToDelete) return '';
    return leads.find(lead => lead.lead_id === leadToDelete)?.name || '';
  }, [leadToDelete, leads]);


  if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }
  const handleNavigateToLead = async (leadId: string) => {
    if (isBulkEditing) {
        handleSelectLead(leadId);
        return;
    }
    setIsNavigating(leadId);
    
    // Lead details are now managed entirely through localStorage
    // No API preloading needed - data comes from fetchAgentDatabase()
    
    // Use requestAnimationFrame to ensure smooth navigation
    requestAnimationFrame(() => {
      router.push(`/leads/${leadId}`);
    });
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prevSelected =>
      prevSelected.includes(leadId)
        ? prevSelected.filter(id => id !== leadId)
        : [...prevSelected, leadId]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.lead_id));
    }
  }
  
  const cancelSelection = () => {
      setSelectedLeads([]);
  }

  const confirmDeleteSingleLead = (leadId: string) => {
    setLeadToDelete(leadId);
  }

  const executeDeleteSingleLead = async () => {
    if (!leadToDelete) return;

    // STEP 1: Get complete lead data from localStorage for backup
    const { localStorageManager } = require('@/lib/local-storage-manager');
    const appData = localStorageManager.getAppData();
    const leadToBackup = appData.leads.find((l: any) => l.lead_id === leadToDelete);
    const leadDetails = appData.leadDetails[leadToDelete];
    const leadNotes = appData.notes[leadToDelete];
    const leadCommunication = appData.communicationHistory[leadToDelete];
    const leadTasks = appData.tasks.filter((task: any) => task.leadId === leadToDelete);

    // Store backup in sessionStorage
    const backupData = {
      lead: leadToBackup,
      leadDetails: leadDetails,
      notes: leadNotes,
      communicationHistory: leadCommunication,
      tasks: leadTasks,
    };
    sessionStorage.setItem(`lead_delete_backup_${leadToDelete}`, JSON.stringify(backupData));

    // STEP 2: OPTIMISTIC - Immediately remove from UI
    deleteLeadFromStorage(leadToDelete);
    toast({
      title: t.leads.messages.leadDeleted,
      description: "Processing...",
    });

    // STEP 3: Send API request in background
    try {
      await cachedCallLeadApi('delete_lead', { lead_id: leadToDelete });

      // SUCCESS: Clear backup from sessionStorage
      sessionStorage.removeItem(`lead_delete_backup_${leadToDelete}`);

      toast({
        title: t.leads.messages.leadDeleted,
        description: "Lead permanently deleted.",
      });
    } catch(error: any) {
      // ERROR: ROLLBACK - Restore from backup
      const backupJson = sessionStorage.getItem(`lead_delete_backup_${leadToDelete}`);
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
            leadDetails: { ...currentData.leadDetails, [leadToDelete]: backup.leadDetails },
            notes: backup.notes ? { ...currentData.notes, [leadToDelete]: backup.notes } : currentData.notes,
            communicationHistory: backup.communicationHistory
              ? { ...currentData.communicationHistory, [leadToDelete]: backup.communicationHistory }
              : currentData.communicationHistory,
            tasks: backup.tasks ? [...currentData.tasks, ...backup.tasks] : currentData.tasks,
          });
        }

        // Clear backup
        sessionStorage.removeItem(`lead_delete_backup_${leadToDelete}`);
      }

      toast({
        variant: "destructive",
        title: t.common.delete,
        description: error.message || t.leads.messages.errorDeletingLead
      });
    }

    setLeadToDelete(null);
  }

  const confirmDeleteBulkLeads = () => {
    setLeadsToDelete(selectedLeads);
  }

  const executeDeleteBulkLeads = async () => {
    if (!leadsToDelete) return;

    // STEP 1: Get complete data for all leads being deleted
    const { localStorageManager } = require('@/lib/local-storage-manager');
    const appData = localStorageManager.getAppData();

    const backupData = leadsToDelete.map(leadId => ({
      leadId,
      lead: appData.leads.find((l: any) => l.lead_id === leadId),
      leadDetails: appData.leadDetails[leadId],
      notes: appData.notes[leadId],
      communicationHistory: appData.communicationHistory[leadId],
      tasks: appData.tasks.filter((task: any) => task.leadId === leadId),
    }));

    // Store backup in sessionStorage
    sessionStorage.setItem('bulk_delete_backup', JSON.stringify(backupData));

    // STEP 2: OPTIMISTIC - Immediately remove all from UI
    leadsToDelete.forEach(id => deleteLeadFromStorage(id));
    toast({
      title: t.leads.messages.leadsDeleted.replace('{{count}}', leadsToDelete.length.toString()),
      description: "Processing...",
    });
    setSelectedLeads([]);

    // STEP 3: Send API requests in background
    try {
      await Promise.all(leadsToDelete.map(id => cachedCallLeadApi('delete_lead', { lead_id: id })));

      // SUCCESS: Clear backup from sessionStorage
      sessionStorage.removeItem('bulk_delete_backup');

      toast({
        title: t.leads.messages.leadsDeleted.replace('{{count}}', leadsToDelete.length.toString()),
        description: "Leads permanently deleted.",
      });
    } catch (error: any) {
      // ERROR: ROLLBACK - Restore all from backup
      const backupJson = sessionStorage.getItem('bulk_delete_backup');
      if (backupJson) {
        const backup = JSON.parse(backupJson);
        const currentData = localStorageManager.getAppData();

        // Restore all leads
        backup.forEach((item: any) => {
          if (item.lead) {
            addLead(item.lead);
          }
        });

        // Restore all details, notes, communication history, and tasks
        const restoredLeadDetails = { ...currentData.leadDetails };
        const restoredNotes = { ...currentData.notes };
        const restoredCommunication = { ...currentData.communicationHistory };
        const restoredTasks = [...currentData.tasks];

        backup.forEach((item: any) => {
          if (item.leadDetails) {
            restoredLeadDetails[item.leadId] = item.leadDetails;
          }
          if (item.notes) {
            restoredNotes[item.leadId] = item.notes;
          }
          if (item.communicationHistory) {
            restoredCommunication[item.leadId] = item.communicationHistory;
          }
          if (item.tasks && item.tasks.length > 0) {
            restoredTasks.push(...item.tasks);
          }
        });

        localStorageManager.setAppData({
          ...currentData,
          leadDetails: restoredLeadDetails,
          notes: restoredNotes,
          communicationHistory: restoredCommunication,
          tasks: restoredTasks,
        });

        // Clear backup
        sessionStorage.removeItem('bulk_delete_backup');
      }

      toast({
        variant: "destructive",
        title: t.common.delete,
        description: error.message || t.leads.messages.errorDeletingLeads
      });
    }

    setLeadsToDelete(null);
  }

  const openStatusDialog = (lead: Lead) => {
    setSelectedLeadForStatus(lead);
    setIsStatusDialogOpen(true);
  };

  const handleStatusSave = async (leadId: string, newStatus: LeadTemperature, note: string) => {
    // Get current lead for rollback
    const currentLead = leads.find(l => l.lead_id === leadId);
    if (!currentLead) return;

    const oldPriority = currentLead.temperature;
    const operationId = `priority-change-${leadId}-${Date.now()}`;

    // Optimistic update: Update localStorage immediately
    updateSingleLead(leadId, { temperature: newStatus } as any);

    // Close dialog immediately for instant feedback
    setIsStatusDialogOpen(false);

    // Show instant success feedback
    toast({
      title: 'Priority Updated',
      description: `Lead priority changed to ${newStatus}.`,
    });

    let lockResult: any;
    try {
        // Construct payload for the status change API
        // Check if priority change operation is already locked
        lockResult = acquirePriorityChangeLock(leadId, newStatus, {
          source: 'leads-list-page',
          requestId: operationId
        });

        if (!lockResult.success) {
          toast({
            title: "Operation in Progress",
            description: "Priority change is already being processed. Please wait...",
            variant: "destructive"
          });
          console.warn('Priority change operation locked:', lockResult.message);

          // Rollback: Revert to old priority
          updateSingleLead(leadId, { temperature: oldPriority } as any);
          return;
        }

        const payload = {
            lead_id: leadId,
            operation: 'change_priority',
            new_priority: newStatus,
            note: note,
        };

        // Call the status change API
        const response = await cachedCallLeadStatusApi(leadId, 'change_priority', { new_priority: newStatus, note });

        // Transform the webhook response to match the frontend lead list item format
        const transformedLead = transformWebhookResponseToLeadListItem(response);

        if (transformedLead) {
            // Update localStorage with the fresh data from the server
            updateSingleLead(leadId, transformedLead);
        }

        // Refresh dashboard immediately
        await refreshDashboard();

        // Release the operation lock
        releasePriorityChangeLock(lockResult.operationId!);

    } catch (error: any) {
         console.error('Priority update error:', error);

         // Release the operation lock on error (if it was acquired)
         if (lockResult?.operationId) {
           releasePriorityChangeLock(lockResult.operationId);
         }

         // Rollback: Revert to old priority
         updateSingleLead(leadId, { temperature: oldPriority } as any);

         // Show retry popup
         setRetryOperation({
           id: operationId,
           type: 'change_priority',
           oldValue: oldPriority,
           newValue: newStatus,
           timestamp: Date.now(),
           leadId: leadId
         });
         setShowRetryPopup(true);

         toast({
           variant: "destructive",
           title: "Priority Update Failed",
           description: "Changes have been reverted. Click retry to try again."
         });
    }
  };
  
  const handleStageSelect = (newStage: LeadStage) => {
    if (selectedLeadForStageChange && newStage !== selectedLeadForStageChange.lead_stage) {
      setSelectedStage(newStage);
      setIsStageConfirmDialogOpen(true);
      setIsLeadStageDialogOpen(false);
    }
  };

  const openLeadStageDialog = (lead: Lead) => {
    setSelectedLeadForStageChange(lead);
    setIsLeadStageDialogOpen(true);
  };

  const openScheduleFollowUpDialog = (lead: Lead) => {
    setSelectedLeadForSchedule(lead);
    setIsScheduleFollowUpDialogOpen(true);
  };

  const confirmLeadStageChange = async () => {
    if (!selectedLeadForStageChange || !selectedStage) return;

    try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('sessionToken');
        if (!token) throw new Error('No authentication token found');

        const webhookUrl = 'https://eurekagathr.app.n8n.cloud/webhook/domain/lead-status';
        const webhookPayload = {
            lead_id: selectedLeadForStageChange.lead_id,
            operation: 'stage_change',
            stage: selectedStage
        };

        let response;
        try {
            response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(webhookPayload)
            });
        } catch (fetchError: any) {
            // Network errors: connection refused, DNS failure, timeout, etc.
            if (fetchError.name === 'TypeError' || fetchError.message.includes('fetch')) {
                throw new Error('Server is busy or could not be reached. Please check your connection and try again.');
            }
            if (fetchError.name === 'AbortError') {
                throw new Error('Request timed out. The server is taking too long to respond.');
            }
            throw new Error('Network error occurred. Please check your connection and try again.');
        }

        if (!response.ok) {
            // Handle server errors (5xx)
            if (response.status >= 500) {
                throw new Error('Server error occurred. Please try again later.');
            }
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to update lead stage');
        }

        updateSingleLead(selectedLeadForStageChange.lead_id, {
            lead_stage: selectedStage,
            stage: selectedStage as any
        } as any);

        toast({
            title: "Stage Updated",
            description: `Lead stage changed to "${selectedStage}".`,
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Could not update lead stage.'
        });
    } finally {
        setIsStageConfirmDialogOpen(false);
        setSelectedStage(null);
        setSelectedLeadForStageChange(null);
    }
  };


  const getStatusBadgeClass = (status: LeadTemperature) => {
    switch (status) {
      case 'Hot': return 'bg-red-100 text-red-700 border-red-200';
      case 'Warm': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Cold': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityLabel = (temperature: LeadTemperature) => {
    switch (temperature) {
      case 'Hot': return t.leads.priorityHot;
      case 'Warm': return t.leads.priorityWarm;
      case 'Cold': return t.leads.priorityCold;
      default: return temperature;
    }
  };

  const isBulkEditing = selectedLeads.length > 0;
  const currentStageInfo = LEAD_STAGES.find(s => s.value === selectedLeadForStageChange?.lead_stage);
  const selectedStageInfo = LEAD_STAGES.find(s => s.value === selectedStage);
  
  const LeadCard = ({lead}: {lead: Lead }) => {
    // Map the 'stage' field from API to lead_stage for display
    const leadStage = (lead as any).stage || lead.lead_stage;
    const stageInfo = leadStage ? LEAD_STAGES.find(s => s.value === leadStage) : null;
    const StageIcon = stageInfo?.icon;

    return (
      <Card
        className={cn("shadow-sm cursor-pointer hover:shadow-md transition-shadow", selectedLeads.includes(lead.lead_id) && "bg-blue-50 border-primary")}
        onClick={() => handleNavigateToLead(lead.lead_id)}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Checkbox
                id={`lead-${lead.lead_id}`}
                checked={selectedLeads.includes(lead.lead_id)}
                onCheckedChange={() => handleSelectLead(lead.lead_id)}
                onClick={(e) => e.stopPropagation()}
            />
            {stageInfo && StageIcon && (
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-full shrink-0", stageInfo.color)}>
                <StageIcon className="h-5 w-5" />
              </div>
            )}
            <div className="grid gap-0.5">
              <div className='flex items-center gap-2 flex-wrap'>
                <span className={cn("font-semibold", isBulkEditing && 'cursor-pointer')}>{lead.name}</span>
                {stageInfo && (
                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">{stageInfo.label}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <LeadTypeBadge leadType={lead.lead_type} />
                <Badge variant="outline" className={cn("text-xs", getStatusBadgeClass(lead.temperature))}>{getPriorityLabel(lead.temperature)}</Badge>
                <span className="text-gray-400">•</span>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3 sm:hidden" />
                  <span className="hidden sm:inline">{t.leads.nextFollowUp}</span>
                  <span className="sm:ml-1">
                    {formatFollowUpDate(lead.next_follow_up?.date)}
                  </span>
                </p>
              </div>
              {(lead as any).created_at && (
                <p className="text-xs text-gray-400 mt-1">
                  {t.leads.created} {formatCreatedDate((lead as any).created_at || lead.lead_id)}
                </p>
              )}
            </div>
          </div>
          {isNavigating === lead.lead_id && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50 p-4 pb-20">
      {/* NEW INTEGRATED TOOLBAR */}
      <div className="flex gap-2 mb-4 items-center">
        {isBulkEditing ? (
          <>
            <Button variant="ghost" size="icon" onClick={cancelSelection}>
              <X className="h-5 w-5" />
            </Button>
            <h3 className="font-semibold text-lg">{selectedLeads.length} {t.leads.selected}</h3>
            <div className="flex-grow" />
            <Checkbox
              checked={selectedLeads.length > 0 && selectedLeads.length === filteredLeads.length}
              onCheckedChange={handleSelectAll}
              className="mr-2"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={confirmDeleteBulkLeads} className="text-red-500">
                  {t.common.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            {/* Search Bar */}
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t.leads.searchLeads}
                className="pl-10 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Sort & Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <ArrowUpDown className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">{t.leads.sortAndFilter}</span>
                  {(sortBy !== 'name' || sortDirection !== 'asc' || showOverdue || showUpcoming || showNoDate || showLast7Days) && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                      {[sortBy !== 'name', sortDirection !== 'asc', showOverdue, showUpcoming, showNoDate, showLast7Days].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t.leads.sortOrder}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sortDirection} onValueChange={(value) => setSortDirection(value as 'asc' | 'desc')}>
                  <DropdownMenuRadioItem value="asc">
                    <ArrowUp className="mr-2 h-4 w-4" />
                    {t.leads.ascending}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="desc">
                    <ArrowDown className="mr-2 h-4 w-4" />
                    {t.leads.descending}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>{t.leads.sortBy}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'created' | 'followUp')}>
                  <DropdownMenuRadioItem value="name">{t.leads.sortByName}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="created">{t.leads.sortByCreated}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="followUp">{t.leads.sortByFollowUp}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>{t.leads.filterByFollowUp}</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={showOverdue} onCheckedChange={setShowOverdue}>
                  {t.leads.overdue}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={showUpcoming} onCheckedChange={setShowUpcoming}>
                  {t.leads.upcoming}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={showNoDate} onCheckedChange={setShowNoDate}>
                  {t.leads.noDateSet}
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>{t.leads.filterByCreated}</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={showLast7Days} onCheckedChange={setShowLast7Days}>
                  {t.leads.last7Days}
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => {
                  setSortBy('name');
                  setSortDirection('asc');
                  setShowOverdue(false);
                  setShowUpcoming(false);
                  setShowNoDate(false);
                  setShowLast7Days(false);
                }}>
                  <X className="mr-2 h-4 w-4" />
                  {t.leads.reset}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add New Lead Button */}
            <Button
              variant="default"
              className="bg-primary shrink-0"
              onClick={handleAddNewLead}
            >
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">{t.leads.addNewLead}</span>
            </Button>
          </>
        )}
      </div>

      {!isBulkEditing && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-4 bg-gray-200">
            <TabsTrigger value="All Leads">{t.leads.allLeads}</TabsTrigger>
            <TabsTrigger value="Hot Leads">{t.leads.hotLeads}</TabsTrigger>
            <TabsTrigger value="Warm Leads">{t.leads.warmLeads}</TabsTrigger>
            <TabsTrigger value="Cold Leads">{t.leads.coldLeads}</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pb-16">
        {filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
            <div key={lead.lead_id} className="relative group">
              <LeadCard lead={lead} />
              {!isBulkEditing && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-5 w-5 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onSelect={() => router.push(`/leads/${lead.lead_id}?edit=true`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>{t.common.edit}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openStatusDialog(lead)}>
                          <Zap className="mr-2 h-4 w-4" />
                          <span>{t.leads.priority}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openLeadStageDialog(lead)}>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        <span>{t.leads.changeStage}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openScheduleFollowUpDialog(lead)}>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>{t.leads.scheduleFollowUp}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => confirmDeleteSingleLead(lead.lead_id)} className="text-red-500">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>{t.leads.deleteLead}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <Users className="w-16 h-16 mb-4" />
            <h2 className="text-xl font-semibold text-gray-500">{t.leads.noLeadsAvailable}</h2>
          </div>
        )}
      </div>
      {selectedLeadForStatus && (
        <LeadStatusDialog
          key={selectedLeadForStatus.lead_id}
          open={isStatusDialogOpen}
          onOpenChange={setIsStatusDialogOpen}
          lead={{id: selectedLeadForStatus.lead_id, name: selectedLeadForStatus.name, status: selectedLeadForStatus.temperature}}
          onSave={handleStatusSave as any}
        />
      )}

      {selectedLeadForSchedule && (
        <ScheduleFollowUpDialog
          open={isScheduleFollowUpDialogOpen}
          onOpenChange={setIsScheduleFollowUpDialogOpen}
          lead={{
            lead_id: selectedLeadForSchedule.lead_id,
            name: selectedLeadForSchedule.name,
          }}
          onSuccess={() => {
            // Data will be updated via selective webhooks
            // No need to manually refresh - localStorage subscription will handle it
          }}
        />
      )}

      <AlertDialog open={!!leadToDelete} onOpenChange={() => setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.leads.dialogs.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.leads.dialogs.deleteSingleDescription.replace('{{name}}', leadToDeleteName)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLeadToDelete(null)}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteSingleLead} className="bg-destructive hover:bg-destructive/90">
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!leadsToDelete} onOpenChange={() => setLeadsToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.leads.dialogs.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.leads.dialogs.deleteBulkDescription.replace('{{count}}', leadsToDelete?.length.toString() || '0')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLeadsToDelete(null)}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteBulkLeads} className="bg-destructive hover:bg-destructive/90">
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                    const isCurrent = selectedLeadForStageChange?.lead_stage === stage.value;
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
                            {isCurrent && <Badge className="absolute -top-2 -right-2">{t.leads.dialogs.current}</Badge>}
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
                        ? t.leads.dialogs.confirmStageChangeDescription
                            .replace('{{from}}', currentStageInfo.label)
                            .replace('{{to}}', selectedStageInfo.label)
                        : t.leads.dialogs.confirmStageChangeTitle}
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

      {/* Retry Popup */}
      {retryOperation && (
        <RetryPopup
          isOpen={showRetryPopup}
          onClose={() => setShowRetryPopup(false)}
          onRetry={async () => {
            if (!retryOperation) return;

            // Retry the operation based on type
            if (retryOperation.type === 'change_priority' && retryOperation.leadId) {
              await handleStatusSave(retryOperation.leadId, retryOperation.newValue, '');
            }
            setShowRetryPopup(false);
          }}
          onDiscard={() => {
            setShowRetryPopup(false);
            setRetryOperation(null);
          }}
          operation={retryOperation}
        />
      )}

      {/* Draft Resume Dialog */}
      <DraftResumeDialog
        open={isDraftDialogOpen}
        onOpenChange={setIsDraftDialogOpen}
        draftInfo={draftInfo}
        onContinue={handleContinueDraft}
        onStartFresh={handleStartFresh}
      />

    </div>
  );
}

// Loading fallback component
function LeadsPageSkeleton() {
  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}

// Wrapper component with Suspense boundary
export default function LeadsPage() {
  return (
    <Suspense fallback={<LeadsPageSkeleton />}>
      <LeadsPageContent />
    </Suspense>
  );
}
