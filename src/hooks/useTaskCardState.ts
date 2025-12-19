"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { cachedCallFollowUpApi, cachedCallTaskApi } from "@/lib/cached-api";
import {
  lazyOpenWhatsApp,
  lazyStoreWhatsAppNotification,
  lazyGetWhatsAppNotifications,
  lazyRemoveWhatsAppNotification
} from "@/lib/lazy-WhatsApp-utils";
import { localStorageManager } from "@/lib/local-storage-manager";
import {
  createCancellationEvent,
  createRescheduleEvent,
  createFollowUpCompletedEvent,
  getCurrentAgentName,
  formatDateConsistently
} from "@/lib/communication-history-utils";
import {
  dispatchThrottledStorageEvent,
  dispatchImmediateStorageEvent,
  clearPendingStorageEvents
} from "@/lib/storage-event-throttle";
import { lazyOpenEmail, lazyGenerateEmailSubject } from "@/lib/lazy-email-utils";
import { lazyCopyToClipboard } from "@/lib/lazy-task-utils";
import { startOfDay } from "date-fns";

interface TaskItem {
  id: string;
  name: string;
  description: string;
  type: "email" | "phone" | "whatsapp" | "calendar" | "home" | "briefcase";
  leadId: string;
  leadType?: 'Buyer' | 'Seller';
  followUpMessage: string;
  time: string;
  leadContact?: {
    email: string;
    phone: string;
  };
  leadStatus: string;
  leadPriority: "Hot" | "Warm" | "Cold";
  propertyRequirements?: {
    locations?: string[];
    types?: string[];
    budget?: string;
  } | string;
}

interface TaskCardStateProps {
  task: TaskItem;
  date: string;
  onTaskComplete: () => void;
  onCancellationStart?: (taskId: string) => void;
  onCancellationRestore?: (taskId: string) => void;
  onCancellationComplete?: (taskId: string) => void;
}

export function useTaskCardState({
  task,
  date,
  onTaskComplete,
  onCancellationStart,
  onCancellationRestore,
  onCancellationComplete
}: TaskCardStateProps) {
  const { t, language } = useLanguage();
  const isPortugueseUser = language === 'pt';
  const { toast } = useToast();

  // Basic state
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(task.followUpMessage);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Dialog state
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  // Loading states
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMarkingDone, setIsMarkingDone] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Hydration check
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // WhatsApp notification check
  useEffect(() => {
    if (!isHydrated) return;

    let timeoutId: NodeJS.Timeout | null = null;

    const checkWhatsAppNotification = async () => {
      try {
        const notifications = await lazyGetWhatsAppNotifications();
        const matchingNotification = notifications.find((n) => n.taskId === task.id);

        if (matchingNotification && typeof document !== 'undefined' && !document.hidden) {
          timeoutId = setTimeout(async () => {
            setShowComplete(true);
            await lazyRemoveWhatsAppNotification(task.id);
          }, 30000);
        }
      } catch (error) {
        console.warn('Error checking WhatsApp notifications:', error);
      }
    };

    checkWhatsAppNotification();

    if (typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          checkWhatsAppNotification();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [task.id, isHydrated]);

  // Get lead type with fallback
  const getLeadType = useCallback((): 'Buyer' | 'Seller' => {
    if (!isHydrated) {
      return task.leadType || 'Buyer';
    }

    if (task.leadType) {
      return task.leadType;
    }

    try {
      const leadDetail = localStorageManager.getLeadDetails(task.leadId);
      if (leadDetail?.lead_type) {
        console.log(`🔍 Task ${task.id} missing leadType, using fallback from leadDetails: ${leadDetail.lead_type}`);
        return leadDetail.lead_type;
      }
    } catch (error) {
      console.warn(`Error accessing localStorage for leadDetails:`, error);
    }

    try {
      const allLeads = localStorageManager.getLeads();
      const lead = allLeads.find(l => l.lead_id === task.leadId);
      if (lead?.lead_type) {
        console.log(`🔍 Task ${task.id} missing leadType, using fallback from leads[]: ${lead.lead_type}`);
        return lead.lead_type;
      }
    } catch (error) {
      console.warn(`Error accessing localStorage for leads:`, error);
    }

    console.warn(`⚠️ Task ${task.id} has no lead_type and fallback lookup failed, defaulting to Buyer`);
    return 'Buyer';
  }, [task.leadId, task.leadType, isHydrated]);

  // Get lead priority with fallback
  const getLeadPriority = useCallback((): 'Hot' | 'Warm' | 'Cold' => {
    if (!isHydrated) {
      return (task.leadPriority && ['Hot', 'Warm', 'Cold'].includes(task.leadPriority))
        ? task.leadPriority
        : 'Cold';
    }

    if (task.leadPriority && ['Hot', 'Warm', 'Cold'].includes(task.leadPriority)) {
      return task.leadPriority;
    }

    try {
      const leadDetail = localStorageManager.getLeadDetails(task.leadId);
      if (leadDetail?.temperature) {
        const temp = leadDetail.temperature;
        console.log(`🔍 Task ${task.id} missing leadPriority, using fallback from leadDetails: ${temp}`);
        return temp as 'Hot' | 'Warm' | 'Cold';
      }
    } catch (error) {
      console.warn(`Error accessing localStorage for leadDetails:`, error);
    }

    try {
      const allLeads = localStorageManager.getLeads();
      const lead = allLeads.find(l => l.lead_id === task.leadId);
      if (lead?.temperature) {
        const temp = lead.temperature;
        console.log(`🔍 Task ${task.id} missing leadPriority, using fallback from leads[]: ${temp}`);
        return temp as 'Hot' | 'Warm' | 'Cold';
      }
    } catch (error) {
      console.warn(`Error accessing localStorage for leads:`, error);
    }

    console.warn(`⚠️ Task ${task.id} has no leadPriority and fallback lookup failed, defaulting to Cold`);
    return 'Cold';
  }, [task.leadId, task.leadPriority, isHydrated]);

  // Message handlers
  const handleEditMessage = useCallback(() => {
    setEditedMessage(currentMessage);
    setIsEditing(true);
  }, [currentMessage]);

  const handleSaveEdit = useCallback(async () => {
    setIsSavingEdit(true);
    try {
      await cachedCallTaskApi("edit_follow_up_message", {
        task_id: task.id,
        lead_id: task.leadId,
        edited_message: editedMessage,
      });

      setCurrentMessage(editedMessage);
      setIsEditing(false);

      toast({
        title: t.taskCard.messageUpdated,
        description: t.taskCard.messageSaved,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.newLead.messages.errorTitle,
        description: error.message || t.taskCard.messageUpdateError,
      });
    } finally {
      setIsSavingEdit(false);
    }
  }, [task.id, task.leadId, editedMessage, currentMessage, toast, t]);

  const handleCancelEdit = useCallback(() => {
    setEditedMessage("");
    setIsEditing(false);
  }, []);

  const handleCopyMessage = useCallback(async () => {
    const success = await lazyCopyToClipboard(currentMessage);
    if (success) {
      toast({
        title: t.taskCard.copiedToClipboard,
        description: t.taskCard.clipboardDescription,
      });
    } else {
      toast({
        variant: "destructive",
        title: t.taskCard.failedToCopy,
        description: t.taskCard.failedToCopyDescription,
      });
    }
  }, [currentMessage, toast, t]);

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true);
    try {
      const response = await cachedCallFollowUpApi('regenerate_follow-up_message', {
        lead_id: task.leadId,
        task_id: task.id,
      });
      const responseData = Array.isArray(response) ? response[0] : null;

      if (responseData && responseData.followUpMessage && responseData.lead_id === task.leadId) {
        setCurrentMessage(responseData.followUpMessage);
        toast({ title: t.taskCard.messageRegeneratedSuccess });
      } else {
        throw new Error('Invalid response from server.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t.newLead.messages.errorTitle,
        description: error.message || t.taskCard.messageRegenerateError,
      });
    } finally {
      setIsRegenerating(false);
    }
  }, [task.id, task.leadId, toast, t]);

  // Communication handlers
  const handleSendWhatsApp = useCallback(async () => {
    if (task.leadContact?.phone) {
      try {
        await lazyStoreWhatsAppNotification(task.id, task.leadId, task.name);
        await lazyOpenWhatsApp(task.leadContact.phone, currentMessage);
      } catch (error) {
        toast({
          variant: "destructive",
          title: t.taskCard.whatsappError || "WhatsApp Error",
          description: error instanceof Error ? error.message : t.taskCard.whatsappFailed,
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: t.taskCard.noPhoneNumber,
        description: t.taskCard.noPhoneDescription,
      });
    }
  }, [task.leadContact?.phone, task.id, task.leadId, task.name, currentMessage, toast, t]);

  const handleSendEmail = useCallback(async () => {
    if (task.leadContact?.email) {
      try {
        const subject = await lazyGenerateEmailSubject(task.name);
        await lazyOpenEmail(task.leadContact.email, subject, currentMessage);
      } catch (error) {
        toast({
          variant: "destructive",
          title: t.taskCard.emailError || "Email Error",
          description: error instanceof Error ? error.message : t.taskCard.emailFailed,
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: t.taskCard.noEmailAddress,
        description: t.taskCard.noEmailDescription,
      });
    }
  }, [task.leadContact?.email, task.name, currentMessage, toast, t]);

  // Translation helpers
  const getPriorityTranslation = useCallback((priority: string) => {
    switch (priority) {
      case "Hot": return t.leads.priorityHot;
      case "Warm": return t.leads.priorityWarm;
      case "Cold": return t.leads.priorityCold;
      default: return priority;
    }
  }, [t]);

  const getStageTranslation = useCallback((status: string) => {
    const stageMap: { [key: string]: string } = {
      "New Lead": t.leads.stages.newLead,
      "Contacted": t.leads.stages.contacted,
      "Qualified": t.leads.stages.qualified,
      "Viewing Scheduled": t.leads.stages.viewingScheduled,
      "Property Viewing Scheduled": t.leads.stages.viewingScheduled,
      "Property Viewed": t.leads.stages.propertyViewed,
      "Offer Made": t.leads.stages.offerMade,
      "Negotiation": t.leads.stages.negotiation,
      "Under Contract": t.leads.stages.underContract,
      "Converted": t.leads.stages.converted,
      "Lost": t.leads.stages.lost,
      "Not Interested": t.leads.stages.notInterested,
    };
    return stageMap[status] || status;
  }, [t]);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case "Hot":
        return "bg-red-100 text-red-700 border-red-200";
      case "Warm":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Cold":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }, []);

  // Complex operation handlers will be broken down into smaller hooks
  const handleReschedule = useCallback(async (newDate: Date, note: string, newTime: string) => {
    // This will be implemented in a separate hook for better organization
    console.log('Reschedule to be implemented in separate hook');
    // For now, just close the dialog
    setShowReschedule(false);
  }, []);

  const handleCancel = useCallback(async (note: string, nextFollowUpDate?: Date, scheduleNext?: boolean) => {
    // This will be implemented in a separate hook for better organization
    console.log('Cancel to be implemented in separate hook');
    // For now, just close the dialog
    setShowCancel(false);
  }, []);

  const handleMarkDone = useCallback(async (note: string, nextFollowUpDate?: Date) => {
    // This will be implemented in a separate hook for better organization
    console.log('Mark done to be implemented in separate hook');
    // For now, just close the dialog
    setShowComplete(false);
  }, []);

  return {
    // State
    isHydrated,
    currentMessage,
    isEditing,
    editedMessage,
    isSavingEdit,
    showReschedule,
    showCancel,
    showComplete,
    isRescheduling,
    isCancelling,
    isMarkingDone,
    isRegenerating,

    // Computed values
    leadType: getLeadType(),
    leadPriority: getLeadPriority(),
    showsAIMessage: task.type === "whatsapp" || task.type === "email",

    // Setters
    setShowReschedule,
    setShowCancel,
    setShowComplete,
    setEditedMessage,

    // Handlers
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleCopyMessage,
    handleRegenerate,
    handleSendWhatsApp,
    handleSendEmail,
    handleReschedule,
    handleCancel,
    handleMarkDone,

    // Translation helpers
    getPriorityTranslation,
    getStageTranslation,
    getPriorityColor,
  };
}