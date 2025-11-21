
"use client";

import * as React from "react";
import { useState } from "react";
import {
  Mail,
  Phone,
  Calendar,
  Home,
  MessageSquare,
  Briefcase,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Edit,
  Copy,
  Save,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { cachedCallFollowUpApi, cachedCallTaskApi } from "@/lib/cached-api";
import { openWhatsApp, storeWhatsAppNotification, getWhatsAppNotifications, removeWhatsAppNotification } from "@/lib/whatsapp-utils";
import { localStorageManager } from "@/lib/local-storage-manager";
import { createCancellationEvent, createRescheduleEvent, getCurrentAgentName, formatDateConsistently } from "@/lib/communication-history-utils";
import { dispatchThrottledStorageEvent, dispatchImmediateStorageEvent, clearPendingStorageEvents } from "@/lib/storage-event-throttle";
import { openEmail, generateEmailSubject } from "@/lib/email-utils";
import { copyToClipboard } from "@/lib/task-utils";
import { RescheduleModal } from "./reschedule-modal";
import { CancelTaskDialog } from "./cancel-task-dialog";
import { CompleteTaskDialog } from "./complete-task-dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { LeadTypeBadge } from "@/components/leads/lead-badges";
import { startOfDay } from "date-fns";

const iconMap: { [key: string]: React.ElementType } = {
  email: Mail,
  phone: Phone,
  calendar: Calendar,
  home: Home,
  whatsapp: MessageSquare,
  briefcase: Briefcase,
  default: ClipboardList,
};

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

interface TaskCardProps {
  task: TaskItem;
  date: string;
  isExpanded: boolean;
  onExpand: () => void;
  onTaskComplete: () => void;
  onCancellationStart?: (taskId: string) => void;
  onCancellationRestore?: (taskId: string) => void;
  onCancellationComplete?: (taskId: string) => void;
}

export function TaskCard({
  task,
  date,
  isExpanded,
  onExpand,
  onTaskComplete,
  onCancellationStart,
  onCancellationRestore,
  onCancellationComplete
}: TaskCardProps) {
  const { t } = useLanguage();
  const [currentMessage, setCurrentMessage] = useState(task.followUpMessage);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMarkingDone, setIsMarkingDone] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const { toast } = useToast();
  const Icon = iconMap[task.type] || iconMap.default;

  // Get lead_type with fallback lookup from localStorage
  const getLeadType = (): 'Buyer' | 'Seller' => {
    if (task.leadType) {
      return task.leadType;
    }
    // Fallback: lookup from leadDetails if not included in task
    const leadDetail = localStorageManager.getLeadDetails(task.leadId);
    if (leadDetail?.lead_type) {
      console.log(`🔍 Task ${task.id} missing leadType, using fallback from leadDetails: ${leadDetail.lead_type}`);
      return leadDetail.lead_type;
    }
    // Last resort: check leads array
    const allLeads = localStorageManager.getLeads();
    const lead = allLeads.find(l => l.lead_id === task.leadId);
    if (lead?.lead_type) {
      console.log(`🔍 Task ${task.id} missing leadType, using fallback from leads[]: ${lead.lead_type}`);
      return lead.lead_type;
    }
    console.warn(`⚠️ Task ${task.id} has no lead_type and fallback lookup failed, defaulting to Buyer`);
    return 'Buyer';
  };

  // Get lead priority with fallback lookup from localStorage
  const getLeadPriority = (): 'Hot' | 'Warm' | 'Cold' => {
    if (task.leadPriority && ['Hot', 'Warm', 'Cold'].includes(task.leadPriority)) {
      return task.leadPriority;
    }
    // Fallback: lookup from leadDetails if not included in task
    const leadDetail = localStorageManager.getLeadDetails(task.leadId);
    if (leadDetail?.temperature) {
      console.log(`🔍 Task ${task.id} missing leadPriority, using fallback from leadDetails: ${leadDetail.temperature}`);
      return leadDetail.temperature;
    }
    // Last resort: check leads array
    const allLeads = localStorageManager.getLeads();
    const lead = allLeads.find(l => l.lead_id === task.leadId);
    if (lead?.temperature) {
      console.log(`🔍 Task ${task.id} missing leadPriority, using fallback from leads[]: ${lead.temperature}`);
      return lead.temperature;
    }
    console.warn(`⚠️ Task ${task.id} has no leadPriority and fallback lookup failed, defaulting to Cold`);
    return 'Cold';
  };

  const leadType = getLeadType();
  const leadPriority = getLeadPriority();
  const showsAIMessage = task.type === "whatsapp" || task.type === "email";

  // Check for WhatsApp return notification when component mounts and when visibility changes
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const checkWhatsAppNotification = () => {
      const notifications = getWhatsAppNotifications();
      const matchingNotification = notifications.find((n) => n.taskId === task.id);

      if (matchingNotification && !document.hidden) {
        // Show the mark done dialog automatically after 30 seconds
        timeoutId = setTimeout(() => {
          setShowComplete(true);
          // Remove the notification after showing dialog
          removeWhatsAppNotification(task.id);
        }, 30000); // 30 seconds delay
      }
    };

    // Check on mount
    checkWhatsAppNotification();

    // Listen for visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkWhatsAppNotification();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Clean up timeout on unmount
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [task.id]);

  const getPriorityTranslation = (priority: string) => {
    switch (priority) {
      case "Hot": return t.leads.priorityHot;
      case "Warm": return t.leads.priorityWarm;
      case "Cold": return t.leads.priorityCold;
      default: return priority;
    }
  };

  const getStageTranslation = (status: string) => {
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
  };

  const handleExpand = () => {
    onExpand();
  };

  const handleEditMessage = () => {
    setEditedMessage(currentMessage);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
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
  };

  const handleCancelEdit = () => {
    setEditedMessage("");
    setIsEditing(false);
  };

  const handleCopyMessage = async () => {
    const success = await copyToClipboard(currentMessage);
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
  };

  const handleSendWhatsApp = () => {
    if (task.leadContact?.phone) {
      // Store notification in localStorage before opening WhatsApp
      storeWhatsAppNotification(task.id, task.leadId, task.name);
      openWhatsApp(task.leadContact.phone, currentMessage);
    } else {
      toast({
        variant: "destructive",
        title: t.taskCard.noPhoneNumber,
        description: t.taskCard.noPhoneDescription,
      });
    }
  };

  const handleSendEmail = () => {
    if (task.leadContact?.email) {
      const subject = generateEmailSubject(task.name);
      openEmail(task.leadContact.email, subject, currentMessage);
    } else {
      toast({
        variant: "destructive",
        title: t.taskCard.noEmailAddress,
        description: t.taskCard.noEmailDescription,
      });
    }
  };

  
  // Optimistic update functions for reschedule operations
  const optimisticMoveTaskToNewDate = async (
    taskId: string,
    oldDate: string,
    newDate: string,
    newTime: string,
    note: string
  ): Promise<boolean> => {
    try {
      console.log(`🔄 [OPTIMISTIC] Moving task ${taskId} from ${oldDate} to ${newDate} at ${newTime}`);

      // Store original data for rollback
      const updatedTask = {
        time: newTime,
        originalDate: oldDate,
        originalTime: task.time,
        isOptimisticallyRescheduled: true
      };

      // Use localStorageManager to move the task
      const success = localStorageManager.moveTaskToDateGroup(taskId, oldDate, newDate, updatedTask);

      if (success) {
        // Dispatch immediate storage event for real-time UI updates
        dispatchThrottledStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));
        console.log(`✅ [OPTIMISTIC] Task ${taskId} moved successfully`);
        return true;
      } else {
        console.warn(`❌ [OPTIMISTIC] Failed to move task ${taskId}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ [OPTIMISTIC] Error moving task ${taskId}:`, error);
      return false;
    }
  };

  const optimisticUpdateDashboardCount = async (delta: number): Promise<boolean> => {
    try {
      console.log(`📊 [OPTIMISTIC] Updating dashboard follow-up count by ${delta}`);

      const success = localStorageManager.updateDashboardFollowUpCount(delta);

      if (success) {
        // Dispatch immediate storage event for real-time UI updates
        dispatchThrottledStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));
        console.log(`✅ [OPTIMISTIC] Dashboard count updated successfully`);
        return true;
      } else {
        console.warn(`❌ [OPTIMISTIC] Failed to update dashboard count`);
        return false;
      }
    } catch (error) {
      console.error(`❌ [OPTIMISTIC] Error updating dashboard count:`, error);
      return false;
    }
  };

  const rollbackReschedule = async (rollbackData: {
    task: any;
    originalDate: string;
    wasWithin7Days: boolean;
    shouldHideFromTasks: boolean;
  }): Promise<boolean> => {
    try {
      console.log(`↩️ [ROLLBACK] Starting rollback for task ${rollbackData.task.id}`);

      if (rollbackData.shouldHideFromTasks) {
        // Task was hidden, restore it to original position
        const restoreTask = {
          ...rollbackData.task,
          time: rollbackData.task.originalTime || rollbackData.task.time,
          originalDate: undefined,
          originalTime: undefined,
          isOptimisticallyRescheduled: undefined
        };

        localStorageManager.addTaskToGroup(restoreTask);
        console.log(`✅ [ROLLBACK] Task restored to original date group ${rollbackData.originalDate}`);
      } else {
        // Task was moved, restore it to original date group
        const currentData = localStorageManager.getAppData();
        const currentTaskGroup = currentData.tasks.find(group =>
          group.items.some(task => task.id === rollbackData.task.id)
        );

        if (currentTaskGroup) {
          const currentTask = currentTaskGroup.items.find(task => task.id === rollbackData.task.id);
          const currentTaskDate = currentTaskGroup.date;

          const restoreTask = {
            ...rollbackData.task,
            time: rollbackData.task.originalTime || rollbackData.task.time,
            originalDate: undefined,
            originalTime: undefined,
            isOptimisticallyRescheduled: undefined
          };

          const success = localStorageManager.moveTaskToDateGroup(
            rollbackData.task.id,
            currentTaskDate,
            rollbackData.originalDate,
            restoreTask
          );

          if (success) {
            console.log(`✅ [ROLLBACK] Task moved back to original date ${rollbackData.originalDate}`);
          } else {
            console.warn(`❌ [ROLLBACK] Failed to move task back to original date`);
            return false;
          }
        }
      }

      // Restore dashboard count if needed
      if (rollbackData.wasWithin7Days) {
        await optimisticUpdateDashboardCount(+1);
        console.log(`📊 [ROLLBACK] Dashboard count restored`);
      }

      // Dispatch final storage event
      dispatchThrottledStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));
      console.log(`✅ [ROLLBACK] Rollback completed successfully`);
      return true;

    } catch (error) {
      console.error(`❌ [ROLLBACK] Rollback failed:`, error);
      return false;
    }
  };

  // Validation function for reschedule data
  const validateReschedulePayload = (newDate: Date, newTime: string, note: string) => {
    const errors = [];

    // Validate date
    if (!newDate || isNaN(newDate.getTime())) {
      errors.push('Invalid date');
    }

    // Validate fixed time format (should always be "08:00")
    if (newTime !== "08:00") {
      errors.push('Invalid time format');
    }

    // Validate note length (optional but good practice)
    if (note && note.length > 500) {
      errors.push('Note is too long (max 500 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Reschedule notification functions
  const createRescheduleProgressNotification = (newDate: Date, newTime: string, note: string) => {
    const currentNotifications = localStorageManager.getNotifications();
    const agentName = getCurrentAgentName() || 'Agent';
    const formattedDate = formatDateConsistently(newDate, agentName);

    const newNotification = {
      id: `reschedule_progress_${task.id}_${Date.now()}`,
      type: 'task_rescheduled',
      title: 'Rescheduling Follow-up',
      message: `Rescheduling follow-up to ${formattedDate}${note ? `: ${note}` : ''}...`,
      priority: 'medium',
      read: false,
      lead_id: task.leadId,
      action_type: undefined, // Not clickable during progress
      action_target: undefined,
      metadata: {
        taskId: task.id,
        leadId: task.leadId,
        operation: 'reschedule_task',
        note: note,
        newDate: newDate.toISOString(),
        newTime: newTime,
        agent_name: agentName
      }
    };

    localStorageManager.updateNotifications([newNotification, ...currentNotifications]);
    dispatchThrottledStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));

    return newNotification.id;
  };

  const updateRescheduleNotificationToSuccess = (notificationId: string, newDate: Date, newTime: string) => {
    const currentNotifications = localStorageManager.getNotifications();
    const agentName = getCurrentAgentName() || 'Agent';
    const formattedDate = formatDateConsistently(newDate, agentName);

    const updatedNotifications = currentNotifications.map(notif => {
      if (notif.id === notificationId) {
        return {
          ...notif,
          type: 'task_rescheduled',
          title: 'Follow-up Rescheduled',
          message: `Follow-up successfully rescheduled to ${formattedDate}`,
          action_type: undefined, // Remove action_type for success notifications
          action_target: undefined,
          action_data: undefined
        };
      }
      return notif;
    });

    localStorageManager.updateNotifications(updatedNotifications);
    clearPendingStorageEvents();
    dispatchImmediateStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));
  };

  const updateRescheduleNotificationToError = (notificationId: string, errorMessage: string) => {
    const currentNotifications = localStorageManager.getNotifications();

    const updatedNotifications = currentNotifications.map(notif => {
      if (notif.id === notificationId) {
        return {
          ...notif,
          type: 'follow_up_cancellation_failed', // Reuse failed notification type for retry capability
          title: 'Reschedule Failed',
          message: `Failed to reschedule follow-up: ${errorMessage}`,
          action_type: 'retry_task_reschedule',
          action_target: `/leads/${task.leadId}`,
          action_data: {
            taskId: task.id,
            leadId: task.leadId,
            operation: 'reschedule_task',
            error: errorMessage,
            metadata: notif.metadata
          }
        };
      }
      return notif;
    });

    localStorageManager.updateNotifications(updatedNotifications);
    clearPendingStorageEvents();
    dispatchImmediateStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));
  };

  const handleReschedule = async (newDate: Date, note: string, newTime: string) => {
    console.log('🔄 [RESCHEDULE] Starting complex reschedule process');

    // Calculate date boundaries for 7-day logic
    const today = new Date();
    const todayStart = startOfDay(today);
    const sevenDaysFromNow = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Current task data
    const originalDate = date; // Current task group date
    const newDateKey = newDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Determine if task was/will be within 7-day window
    const wasWithin7Days = new Date(originalDate) <= sevenDaysFromNow;
    const willBeWithin7Days = newDate <= sevenDaysFromNow;
    const shouldHideFromTasks = newDate > sevenDaysFromNow;

    console.log(`📅 [RESCHEDULE] Date analysis:`, {
      originalDate,
      newDateKey,
      wasWithin7Days,
      willBeWithin7Days,
      shouldHideFromTasks,
      today: todayStart.toISOString().split('T')[0],
      sevenDaysFromNow: sevenDaysFromNow.toISOString().split('T')[0]
    });

    // Store rollback data before making any changes
    const rollbackData = {
      task: { ...task, time: task.time },
      originalDate,
      wasWithin7Days,
      shouldHideFromTasks,
      timestamp: Date.now()
    };

    localStorage.setItem('reschedule_rollback_data', JSON.stringify(rollbackData));
    console.log('💾 [RESCHEDULE] Rollback data stored:', rollbackData);

    try {
      // OPTIMISTIC PHASE: Update immediately
      console.log('⚡ [RESCHEDULE] Starting optimistic updates...');

      if (shouldHideFromTasks) {
        // Hide task immediately if it's beyond 7 days
        console.log('👁️ [RESCHEDULE] Hiding task from UI (beyond 7-day window)');
        onCancellationStart?.(task.id);
      } else {
        // Move task to new date group optimistically
        console.log('🔄 [RESCHEDULE] Moving task to new date group optimistically');
        const moveSuccess = await optimisticMoveTaskToNewDate(task.id, originalDate, newDateKey, newTime, note);
        if (!moveSuccess) {
          throw new Error('Failed to move task to new date group');
        }
      }

      // Update dashboard count optimistically based on 7-day movement
      let dashboardCountUpdated = false;
      if (wasWithin7Days && !willBeWithin7Days) {
        console.log('📉 [RESCHEDULE] Task moving OUT of 7-day window - decrementing dashboard count');
        dashboardCountUpdated = await optimisticUpdateDashboardCount(-1);
      } else if (!wasWithin7Days && willBeWithin7Days) {
        console.log('📈 [RESCHEDULE] Task moving INTO 7-day window - incrementing dashboard count');
        dashboardCountUpdated = await optimisticUpdateDashboardCount(+1);
      }

      console.log('✅ [RESCHEDULE] Optimistic updates completed');

      // Create reschedule notification immediately
      const notificationId = createRescheduleProgressNotification(newDate, newTime, note);
      console.log('📋 [RESCHEDULE] Created progress notification:', notificationId);

      // Close modal immediately and refresh dashboard
      setShowReschedule(false);
      if (!shouldHideFromTasks) {
        onTaskComplete(); // Refresh dashboard if task is still visible
      }
      console.log('🔒 [RESCHEDULE] Modal closed, UI refreshed');

      // VALIDATION PHASE: Validate data before API call
      console.log('🔍 [RESCHEDULE] Validating reschedule data...');
      const validation = validateReschedulePayload(newDate, newTime, note);
      if (!validation.isValid) {
        throw new Error(`Invalid reschedule data: ${validation.errors.join(', ')}`);
      }
      console.log('✅ [RESCHEDULE] Data validation passed');

      // API PHASE: Process in background
      console.log('🌐 [RESCHEDULE] Starting background API call');

      const apiPayload = {
        task_id: task.id,
        lead_id: task.leadId,
        date: newDate.toISOString(),
        time: newTime,
        note: note,
      };

      console.log('🌐 [RESCHEDULE] API Payload:', JSON.stringify(apiPayload, null, 2));
      console.log('🌐 [RESCHEDULE] Task ID:', task.id);
      console.log('🌐 [RESCHEDULE] Lead ID:', task.leadId);

      cachedCallTaskApi("reschedule_task", apiPayload).then(async (response: any) => {
        console.log('✅ [RESCHEDULE] API call successful:', response);

        // UPDATE LEAD'S NEXT FOLLOW-UP DATE
        console.log('🔄 [RESCHEDULE] Updating lead follow-up date');
        try {
          const leadUpdateData = {
            next_follow_up: {
              date: newDate.toISOString(),
              status: 'Scheduled'
            }
          };
          localStorageManager.updateSingleLead(task.leadId, leadUpdateData);
          console.log('✅ [RESCHEDULE] Lead follow-up date updated successfully');
        } catch (leadUpdateError) {
          console.error('❌ [RESCHEDULE] Failed to update lead follow-up date:', leadUpdateError);
          // Continue with other operations even if lead update fails
        }

        // ADD COMMUNICATION EVENT FOR SUCCESSFUL RESCHEDULE
        console.log('📞 [RESCHEDULE] Creating communication event');
        const agentName = getCurrentAgentName() || 'Agent';

        // Create a mock rescheduled task object for the utility function
        const rescheduledTask = {
          id: task.id,
          lead_id: task.leadId,
          follow_up_date: newDate.toISOString()
        };

        // Create localized reschedule event
        const rescheduleEvent = createRescheduleEvent(rescheduledTask, agentName);

        // Add note to metadata if provided
        if (note) {
          rescheduleEvent.metadata.reschedule_note = note;
          if (rescheduleEvent.description) {
            rescheduleEvent.description += ` with note: ${note}`;
          }
        }

        console.log('✅ [RESCHEDULE] Communication event created with language:', {
          isPortugueseUser,
          eventId: rescheduleEvent.id,
          eventType: rescheduleEvent.event_type,
          eventTitle: rescheduleEvent.title
        });

        // Validate and store communication event
        if (rescheduleEvent && rescheduleEvent.id && task.leadId) {
          try {
            localStorageManager.addCommunicationEvent(task.leadId, rescheduleEvent);
            console.log('✅ [RESCHEDULE] Communication event added successfully:', {
              eventId: rescheduleEvent.id,
              leadId: task.leadId,
              eventType: rescheduleEvent.event_type,
              timestamp: rescheduleEvent.timestamp,
              title: rescheduleEvent.title
            });

            // Trigger storage event to ensure UI updates
            dispatchThrottledStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));
          } catch (storageError) {
            console.error('❌ [RESCHEDULE] Failed to store communication event:', storageError);
          }
        } else {
          console.error('❌ [RESCHEDULE] Invalid communication event created:', {
            hasEvent: !!rescheduleEvent,
            hasId: !!(rescheduleEvent && rescheduleEvent.id),
            hasLeadId: !!task.leadId,
            eventDetails: rescheduleEvent
          });
        }

        // Update notification to success
        updateRescheduleNotificationToSuccess(notificationId, newDate, newTime);

        // Process any webhook response data if available
        if (response && response.data) {
          try {
            console.log('📝 [RESCHEDULE] Processing webhook response data');

            // Handle rescheduled task data from webhook
            if (response.data.rescheduled_task) {
              console.log('🔄 [RESCHEDULE] Processing rescheduled task from webhook');
              const webhookTask = response.data.rescheduled_task;

              // Extract date from webhook task and update lead if needed
              try {
                const webhookTaskDate = webhookTask.due_date || webhookTask.time || webhookTask.follow_up_date;
                if (webhookTaskDate) {
                  const extractedDate = new Date(webhookTaskDate);
                  if (!isNaN(extractedDate.getTime())) {
                    console.log('📅 [RESCHEDULE] Extracted date from webhook task:', webhookTaskDate);

                    // Update lead with webhook date as fallback/verification
                    const webhookLeadUpdate = {
                      next_follow_up: {
                        date: extractedDate.toISOString(),
                        status: 'Scheduled'
                      }
                    };
                    localStorageManager.updateSingleLead(task.leadId, webhookLeadUpdate);
                    console.log('✅ [RESCHEDULE] Lead follow-up date updated from webhook data');
                  }
                }
              } catch (dateExtractionError) {
                console.warn('⚠️ [RESCHEDULE] Could not extract date from webhook task:', dateExtractionError);
              }
            }

            // Process communication history events
            if (response.data.communication_history && response.data.communication_history.length > 0) {
              console.log('📞 [RESCHEDULE] Processing communication history events');
              response.data.communication_history.forEach((event: any, index: number) => {
                try {
                  const transformedEvent = {
                    id: `reschedule_${task.id}_${event.id || Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: event.timestamp || new Date().toISOString(),
                    event_type: event.event_type || 'reschedule_follow_up',
                    title: event.title || 'Follow-up Rescheduled',
                    description: event.description || note,
                    metadata: {
                      task_id: task.id,
                      lead_id: task.leadId,
                      old_date: originalDate,
                      new_date: newDateKey,
                      note: note,
                      webhook_source: true
                    }
                  };

                  // Validate webhook event before storing
                  if (transformedEvent.id && transformedEvent.event_type && task.leadId) {
                    localStorageManager.addCommunicationEvent(task.leadId, transformedEvent);
                    console.log(`✅ [RESCHEDULE] Webhook communication event ${index + 1} added:`, {
                      eventId: transformedEvent.id,
                      eventType: transformedEvent.event_type
                    });
                  } else {
                    console.warn(`⚠️ [RESCHEDULE] Invalid webhook communication event ${index + 1}:`, {
                      hasId: !!transformedEvent.id,
                      hasType: !!transformedEvent.event_type,
                      hasLeadId: !!task.leadId
                    });
                  }
                } catch (webhookEventError) {
                  console.error(`❌ [RESCHEDULE] Error processing webhook communication event ${index + 1}:`, webhookEventError);
                }
              });
            }

          } catch (error) {
            console.error('❌ [RESCHEDULE] Error processing webhook response:', error);
          }
        }

        // Process notes from webhook response if available
        if (response.data?.current_note || (response.data?.notes && response.data.notes.length > 0)) {
          try {
            console.log('📝 [RESCHEDULE] Processing notes from webhook response...');
            const { processNotesFromWebResponse, mergeNotes } = await import('@/lib/note-transformer');
            const existingNotes = localStorageManager.getNotes(task.leadId) || [];
            const { notes: processedNotes, processedCount, errors } = processNotesFromWebResponse(
              response.data,
              task.leadId
            );

            if (processedNotes.length > 0) {
              const mergedNotes = mergeNotes(processedNotes, existingNotes);
              localStorageManager.updateNotes(task.leadId, mergedNotes);
              console.log(`📝 [RESCHEDULE] Successfully processed ${processedCount} new notes for lead ${task.leadId}`);

              // Update reschedule event to include note information
              if (communicationEvents.length > 0) {
                const rescheduleEvent = communicationEvents.find(event => event.event_type === 'follow_up_rescheduled');
                if (rescheduleEvent && response.data.current_note) {
                  rescheduleEvent.metadata.reschedule_note = response.data.current_note.note;
                  rescheduleEvent.metadata.note_type = response.data.current_note.note_type || 'reschedule_note';
                  rescheduleEvent.metadata.note_id = response.data.current_note.note_id;

                  // Update description to mention note
                  if (rescheduleEvent.description && response.data.current_note.note) {
                    const noteDescription = ` (${response.data.current_note.note})`;
                    rescheduleEvent.description += noteDescription;
                  }

                  // Re-save the updated reschedule event to localStorage with note metadata
                  localStorageManager.addCommunicationEvent(task.leadId, rescheduleEvent);
                  console.log('📝 [RESCHEDULE] Updated reschedule event with note metadata');
                }
              }
            }

            if (errors.length > 0) {
              console.warn('⚠️ [RESCHEDULE] Notes processing completed with warnings:', errors);
            }
          } catch (error) {
            console.error('❌ [RESCHEDULE] Error processing webhook notes:', error);
          }
        }

        // Clean up rollback data on success
        localStorage.removeItem('reschedule_rollback_data');
        console.log('🧹 [RESCHEDULE] Rollback data cleaned up');

      }).catch(async (error: any) => {
        console.error('❌ [RESCHEDULE] API call failed:', error);
        console.error('❌ [RESCHEDULE] Error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: error.config ? {
            url: error.config.url,
            method: error.config.method,
            headers: error.config.headers
          } : 'No config available'
        });

        // ROLLBACK: Restore all changes
        console.log('↩️ [RESCHEDULE] Starting rollback process...');

        const rollbackSuccess = await rollbackReschedule(rollbackData);

        if (rollbackSuccess) {
          onCancellationRestore?.(task.id);
          console.log('✅ [RESCHEDULE] Rollback completed successfully');
        } else {
          console.error('❌ [RESCHEDULE] Rollback failed - UI may be inconsistent');
        }

        // More specific error message for user based on status code
        let userErrorMessage = error.message || t.taskCard.rescheduleError;

        if (error.response?.status === 400) {
          userErrorMessage = 'Invalid request data. Please check the date and time format and try again.';
        } else if (error.response?.status === 401) {
          userErrorMessage = 'Authentication failed. Please refresh the page and try again.';
        } else if (error.response?.status === 403) {
          userErrorMessage = 'You do not have permission to reschedule this follow-up.';
        } else if (error.response?.status === 404) {
          userErrorMessage = 'Follow-up not found. It may have been already rescheduled or cancelled.';
        } else if (error.response?.status >= 500) {
          userErrorMessage = 'Server error. Please try again in a few moments.';
        } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
          userErrorMessage = 'Network connection error. Please check your internet connection and try again.';
        }

        // Update notification to error with retry capability
        updateRescheduleNotificationToError(notificationId, userErrorMessage);

        // Show error toast for immediate feedback
        toast({
          variant: "destructive",
          title: t.newLead.messages.errorTitle,
          description: userErrorMessage,
        });
      });

      console.log('🏁 [RESCHEDULE] Reschedule process initiated - all optimistic changes applied, API running in background');

    } catch (error: any) {
      console.error('❌ [RESCHEDULE] Error during optimistic phase:', error);

      // ROLLBACK: If optimistic phase failed, rollback any partial changes
      try {
        await rollbackReschedule(rollbackData);
        onCancellationRestore?.(task.id);
      } catch (rollbackError) {
        console.error('❌ [RESCHEDULE] Critical error during rollback:', rollbackError);
      }

      // Show error immediately
      toast({
        variant: "destructive",
        title: t.newLead.messages.errorTitle,
        description: error.message || t.taskCard.rescheduleError,
      });
    }
  };

  // Helper functions for cancellation flow
  const createCancellationProgressNotification = (taskId: string, agentName: string, note: string, nextFollowUpDate?: Date) => {
    const currentNotifications = localStorageManager.getNotifications();
    const newNotification = {
      id: `cancel_progress_${taskId}_${Date.now()}`,
      type: 'follow_up_cancellation_in_progress',
      title: 'Processing Follow-up Cancellation',
      message: `Cancelling follow-up${note ? `: ${note}` : ''}${nextFollowUpDate ? ` (with reschedule)` : ''}...`,
      priority: 'medium',
      read: false,
      lead_id: task.leadId,
      // Store cancellation data for potential retry, but don't make notification clickable
      action_type: undefined,
      action_target: undefined,
      // Store cancellation data separately for error handling
      metadata: {
        taskId,
        leadId: task.leadId,
        operation: 'cancel_task',
        note: note,
        nextFollowUpDate: nextFollowUpDate?.toISOString(),
        agent_name: agentName
      }
    };

    localStorageManager.updateNotifications([newNotification, ...currentNotifications]);
    dispatchThrottledStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));
  };

  const handleCancellationSuccess = async (responseData: any, cancellationData: any) => {
    const agentName = getCurrentAgentName() || cancellationData.agent_name;

    // CONSOLIDATED APPROACH: Collect all operations and perform them atomically
    console.log('🔄 Consolidating all storage operations to prevent race conditions');

    // Get current app data for atomic update
    const appData = localStorageManager.getAppData();

    // 1. Prepare communication events to add
    const communicationEvents: any[] = [];

    // Add cancellation event
    const cancellationEvent = createCancellationEvent(cancellationData.task_id, agentName, cancellationData.note);
    communicationEvents.push(cancellationEvent);

    // Check for rescheduled task and prepare events
    let newTask: any = null;
    if (responseData.rescheduled_task) {
      createRescheduledNotification(responseData.rescheduled_task, agentName);

      // Add localized reschedule event
      const rescheduleEvent = createRescheduleEvent(responseData.rescheduled_task, agentName);
      communicationEvents.push(rescheduleEvent);

      // Prepare new task
      const { transformBackendTask } = await import('@/lib/task-transformer');
      newTask = transformBackendTask(responseData.rescheduled_task);
    }

    // Process webhook communication history events (avoiding duplicates)
    if (responseData.communication_history && responseData.communication_history.length > 0) {
      responseData.communication_history.forEach((event: any) => {
        // Normalize timestamp if it exists
        if (event.timestamp) {
          const { normalizeTimestamp } = require('@/lib/communication-history-utils');
          event.timestamp = normalizeTimestamp(event.timestamp);
        }

        // Avoid duplicates with our custom events
        const isDuplicateEvent =
          (event.event_type === 'follow_up_cancelled' && event.id?.startsWith('Event_')) ||
          (event.event_type === 'follow_up_scheduled' && event.id?.startsWith('Event_'));

        if (!isDuplicateEvent) {
          communicationEvents.push(event);
        }
      });
    }

    // 2. Prepare notes updates
    let updatedNotes: any[] = null;
    if (responseData.current_note || (responseData.notes && responseData.notes.length > 0)) {
      try {
        const { processNotesFromWebResponse, mergeNotes } = await import('@/lib/note-transformer');
        const existingNotes = localStorageManager.getNotes(cancellationData.lead_id) || [];
        const { notes: processedNotes, processedCount, errors } = processNotesFromWebResponse(
          responseData,
          cancellationData.lead_id
        );

        if (processedNotes.length > 0) {
          updatedNotes = mergeNotes(processedNotes, existingNotes);
          console.log(`📝 Successfully processed ${processedCount} new notes for lead ${cancellationData.lead_id}`);

          if (errors.length > 0) {
            console.warn('⚠️ Notes processing completed with warnings:', errors);
          }
        }
      } catch (error) {
        console.error('❌ Error processing webhook notes:', error);
      }
    }

    // 3. Update progress notification to "Follow-up cancelled"
    updateProgressNotificationToSuccess(cancellationData.notification_id, 'Follow-up cancelled', cancellationData.lead_id);

    // 4. ATOMIC UPDATE: Perform all localStorage operations in a single coordinated batch
    console.log('🔄 Performing atomic storage update');

    // Add all communication events at once
    if (communicationEvents.length > 0) {
      communicationEvents.forEach(event => {
        localStorageManager.addCommunicationEvent(cancellationData.lead_id, event);
      });
    }

    // Update tasks if we have a new rescheduled task
    if (newTask) {
      const currentTasks = localStorageManager.getTasks();
      localStorageManager.updateTasks([newTask, ...currentTasks]);
    }

    // Update notes if we processed any
    if (updatedNotes) {
      localStorageManager.updateNotes(cancellationData.lead_id, updatedNotes);
    }

    // Clean up pending cancellation data
    localStorage.removeItem('pending_cancellation');

    // 5. IMMEDIATE UI UPDATE: Use immediate dispatch to prevent race conditions
    console.log('🔄 Dispatching immediate storage event to finalize UI update');
    clearPendingStorageEvents();
    dispatchImmediateStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));
  };

  const handleCancellationFailure = async (error: any, taskId: string, notificationId: string) => {
    // Note: Task restoration is now handled by the rollback mechanism in handleCancel

    // Update notification to error state with retry - use immediate dispatch for faster UI update
    updateProgressNotificationToError(notificationId, error.message || 'Failed to cancel follow-up');

    // Clear any pending throttled events to prevent event storms
    clearPendingStorageEvents();
    // Force immediate UI update for error notification
    dispatchImmediateStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));
  };

  const updateProgressNotificationToSuccess = (notificationId: string, message: string, leadId: string) => {
    const currentNotifications = localStorageManager.getNotifications();
    const updatedNotifications = currentNotifications.map(notif => {
      if (notif.id === notificationId) {
        return {
          ...notif,
          type: 'follow_up_cancelled',
          title: t.notifications.followUpCancelled,
          message: message,
          // Remove action_type to prevent button display for successful notifications
          action_type: undefined,
          action_target: undefined,
          action_data: undefined
        };
      }
      return notif;
    });

    localStorageManager.updateNotifications(updatedNotifications);
    // Clear any pending throttled events to prevent event storms
    clearPendingStorageEvents();
    // Use immediate dispatch for success notifications to provide instant user feedback
    dispatchImmediateStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));
  };

  const updateProgressNotificationToError = (notificationId: string, errorMessage: string) => {
    const currentNotifications = localStorageManager.getNotifications();
    const updatedNotifications = currentNotifications.map(notif => {
      if (notif.id === notificationId) {
        return {
          ...notif,
          type: 'follow_up_cancellation_failed',
          title: t.notifications.cancellationFailed,
          message: `Failed to cancel follow-up: ${errorMessage}`,
          action_type: 'retry_task_cancellation',
          action_target: `/leads/${notif.lead_id}`,
          action_data: {
            taskId: notif.metadata?.taskId,
            leadId: notif.metadata?.leadId,
            operation: notif.metadata?.operation,
            note: notif.metadata?.note,
            nextFollowUpDate: notif.metadata?.nextFollowUpDate,
            agent_name: notif.metadata?.agent_name,
            error: errorMessage
          }
        };
      }
      return notif;
    });

    localStorageManager.updateNotifications(updatedNotifications);
    // Clear any pending throttled events to prevent event storms
    clearPendingStorageEvents();
    // Use immediate dispatch for error notifications to provide instant user feedback
    dispatchImmediateStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));
  };

  const createRescheduledNotification = (rescheduledTask: any, agentName: string) => {
    // Use consistent date formatting utility
    const { formatShortDate } = require('@/lib/communication-history-utils');
    const formattedDate = formatShortDate(rescheduledTask.follow_up_date, agentName);

    const newNotification = {
      id: `rescheduled_success_${rescheduledTask.id}_${Date.now()}`,
      type: 'follow_up_rescheduled',
      title: t.notifications.followUpRescheduled,
      message: `Follow-up rescheduled to ${formattedDate}`,
      priority: 'medium',
      read: false,
      lead_id: rescheduledTask.lead_id,
      action_type: 'navigate_to_task',
      action_target: rescheduledTask.follow_up_date && new Date(rescheduledTask.follow_up_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ? `/tasks?expand=task_${rescheduledTask.lead_id}_${new Date(rescheduledTask.follow_up_date).getTime()}`
        : `/leads/${rescheduledTask.lead_id}`,
      action_data: {
        leadId: rescheduledTask.lead_id,
        followUpDate: rescheduledTask.follow_up_date,
        taskId: `task_${rescheduledTask.lead_id}_${new Date(rescheduledTask.follow_up_date).getTime()}`,
        agentName: agentName
      }
    };

    const currentNotifications = localStorageManager.getNotifications();
    localStorageManager.updateNotifications([newNotification, ...currentNotifications]);
    dispatchThrottledStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));
  };

  // DIRECT NOTIFICATION FUNCTIONS: Create success/failed notifications directly
  const createCancellationSuccessNotification = async (responseData: any, leadId: string) => {
    const agentName = getCurrentAgentName() || 'Agent';
    const newNotification = {
      id: `cancel_success_${leadId}_${Date.now()}`,
      type: 'follow_up_cancelled',
      title: t.notifications.followUpCancelled,
      message: responseData.message || 'Follow-up has been cancelled successfully',
      priority: 'medium',
      read: false,
      lead_id: leadId,
      action_type: undefined, // No action for success notifications
      action_target: undefined,
      action_data: undefined,
      metadata: {
        agentName,
        cancelledAt: new Date().toISOString(),
        responseData
      }
    };

    const currentNotifications = localStorageManager.getNotifications();
    localStorageManager.updateNotifications([newNotification, ...currentNotifications]);

    // Use immediate dispatch for instant UI update
    clearPendingStorageEvents();
    dispatchImmediateStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));

    console.log('✅ Created direct success notification for cancellation');
  };

  const createCancellationFailedNotification = async (error: any, taskId: string) => {
    const agentName = getCurrentAgentName() || 'Agent';
    const newNotification = {
      id: `cancel_failed_${taskId}_${Date.now()}`,
      type: 'follow_up_cancellation_failed',
      title: t.notifications.cancellationFailed,
      message: error.message || 'Failed to cancel follow-up',
      priority: 'high',
      read: false,
      lead_id: task.leadId,
      action_type: 'retry_task_cancellation',
      action_target: `/tasks?expand=task_${taskId}`,
      action_data: {
        taskId,
        leadId: task.leadId,
        operation: 'cancel_task',
        note: error.note || '',
        agentName: agentName,
        error: error.message || 'Unknown error',
        timestamp: Date.now()
      }
    };

    const currentNotifications = localStorageManager.getNotifications();
    localStorageManager.updateNotifications([newNotification, ...currentNotifications]);

    // Use immediate dispatch for instant UI update
    clearPendingStorageEvents();
    dispatchImmediateStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));

    console.log('❌ Created direct failure notification for cancellation');
  };

  const handleCancel = async (note: string, nextFollowUpDate?: Date, scheduleNext?: boolean) => {
    setIsCancelling(true);

    const agentName = getCurrentAgentName();

    // Close dialog immediately - user gets immediate feedback via task hiding
    setShowCancel(false);

    // IMMEDIATE UI HIDING: Hide task immediately for optimistic UI
    console.log(`🔄 Hiding task ${task.id} immediately for optimistic UI`);
    onCancellationStart?.(task.id);

    try {
      // Store task data for potential restoration
      const taskDataForRestoration = { ...task };

      // REMOVED: Skip processing notification for cleaner UX
      // Task hiding provides immediate visual feedback, processing notification is redundant

      // Store cancellation request data for retry functionality
      const cancellationData = {
        task_id: task.id,
        lead_id: task.leadId,
        note: note,
        next_follow_up: scheduleNext ? "yes" : "no",
        follow_up_date: nextFollowUpDate ? nextFollowUpDate.toISOString() : undefined,
        agent_name: agentName,
        original_task: taskDataForRestoration,
        timestamp: Date.now()
      };

      localStorage.setItem('pending_cancellation', JSON.stringify(cancellationData));

      // Optimistic UI: Hide task immediately but store for potential rollback
      const taskDataForRollback = {
        task,
        date,
        wasHidden: false
      };

      // Store task data for potential rollback
      localStorage.setItem('cancellation_rollback_data', JSON.stringify(taskDataForRollback));

      // Store rollback data for potential restoration
      taskDataForRollback.wasHidden = false;

      // Note: Deferred UI updates to prevent hydration errors
      // Task removal will happen after successful webhook response

      const payload: any = {
        task_id: task.id,
        lead_id: task.leadId,
        note: note,
        next_follow_up: scheduleNext ? "yes" : "no",
      };

      // Only include follow_up_date if a date was selected
      if (nextFollowUpDate) {
        payload.follow_up_date = nextFollowUpDate.toISOString();
      }

      const response = await cachedCallTaskApi("cancel_task", payload);

      // Handle both array and object response formats
      let responseData;
      if (Array.isArray(response)) {
        // Find the main response object that contains current_note and notes
        const mainResponse = response.find(item => item.success && item.lead_id);

        // Extract rescheduled task and cancellation notes for backward compatibility
        const rescheduledTask = response.find(item => item.rescheduled_task)?.rescheduled_task;
        const cancellationNotes = response.filter(item => item.note_type === 'cancellation_note');

        responseData = {
          success: true,
          communication_history: response,
          rescheduled_task: rescheduledTask,
          notes: cancellationNotes,
          // Include all properties from main response object (current_note, notes, total_notes, etc.)
          ...(mainResponse || {})
        };
      } else {
        responseData = response;
      }

      if (responseData.success) {
        // Process notes from webhook response
        if (responseData.current_note || (responseData.notes && responseData.notes.length > 0)) {
          try {
            const { processNotesFromWebResponse, mergeNotes } = await import('@/lib/note-transformer');
            const existingNotes = localStorageManager.getNotes(task.leadId) || [];
            const { notes: processedNotes, processedCount, errors } = processNotesFromWebResponse(
              responseData,
              task.leadId
            );

            if (processedNotes.length > 0) {
              const mergedNotes = mergeNotes(processedNotes, existingNotes);
              localStorageManager.updateNotes(task.leadId, mergedNotes);
              console.log(`📝 Successfully processed ${processedCount} new notes for lead ${task.leadId}`);
            }
          } catch (error) {
            console.error('❌ Error processing webhook notes:', error);
          }
        }

        // Remove task from localStorage
        const taskRemoved = localStorageManager.removeTaskFromSpecificGroup(task.id, date);
        if (!taskRemoved) {
          console.warn('Task was not found in localStorage for removal, trying general removal');
          localStorageManager.removeTaskFromGroup(task.id);
        }

        // Create direct success notification
        await createCancellationSuccessNotification(responseData, task.leadId);

        // IMMEDIATE UI UPDATE: Complete cancellation immediately to prevent race conditions
        console.log(`✅ Task ${task.id} cancellation completed successfully`);
        onTaskComplete(); // Hide task from UI after storage is updated
        onCancellationComplete?.(task.id); // Mark cancellation as complete

        // Clear rollback data on success
        localStorage.removeItem('cancellation_rollback_data');
      } else {
        throw new Error(responseData.message || 'Cancellation failed');
      }
    } catch (error: any) {
      console.error('Task cancellation failed:', error);

      // IMMEDIATE UI RESTORATION: Restore task immediately on failure
      console.log(`↩️ Restoring task ${task.id} to UI immediately due to cancellation failure`);
      onCancellationRestore?.(task.id);

      // Rollback: Restore the hidden task if it was hidden
      const rollbackData = localStorage.getItem('cancellation_rollback_data');
      if (rollbackData) {
        try {
          const parsedData = JSON.parse(rollbackData);
          if (parsedData.wasHidden && parsedData.task) {
            // Restore the task to localStorage
            localStorageManager.addTaskToGroup(parsedData.task);
            console.log('Task restored to localStorage due to cancellation failure');

            // Force a UI refresh to show the restored task
            const currentData = localStorageManager.getAppData();
            dispatchThrottledStorageEvent('app_data', JSON.stringify(currentData));
          }
        } catch (rollbackError) {
          console.error('Failed to restore task:', rollbackError);
        }
        localStorage.removeItem('cancellation_rollback_data');
      }

      await handleCancellationFailure(error, task.id, notificationId);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleMarkDone = async (note: string, nextFollowUpDate?: Date) => {
    setIsMarkingDone(true);
    try {
      const payload: any = {
        task_id: task.id,
        lead_id: task.leadId,
        note: note,
      };

      // Only include next_follow_up_date if a date was selected
      if (nextFollowUpDate) {
        payload.next_follow_up_date = nextFollowUpDate.toISOString();
      }

      await cachedCallTaskApi("mark_done", payload);

      toast({
        title: t.taskCard.taskCompleted,
        description: t.taskCard.taskCompletedDescription,
      });

      setShowComplete(false);
      onTaskComplete(); // Refresh dashboard
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.newLead.messages.errorTitle,
        description: error.message || t.taskCard.completeError,
      });
    } finally {
      setIsMarkingDone(false);
    }
  };

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        try {
            const response = await cachedCallFollowUpApi('regenerate_follow-up_message', { 
                lead_id: task.leadId,
                task_id: task.id,
            });
            const responseData = Array.isArray(response) ? response[0] : null;

            if (responseData && responseData["AI-Generated Message"] && responseData.lead_id === task.leadId) {
                setCurrentMessage(responseData["AI-Generated Message"]);
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
    };

  const getPriorityColor = (priority: string) => {
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
  };

  return (
    <>
      <Card
        className={cn(
          "shadow-sm cursor-pointer transition-all duration-300 ease-in-out mb-3",
          "hover:shadow-md hover:-translate-y-0.5",
          "rounded-xl"
        )}
        onClick={handleExpand}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold text-gray-800 mb-1">
                {task.name}
              </h4>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <LeadTypeBadge leadType={leadType} />
                <Badge variant="outline" className={cn("text-sm", getPriorityColor(leadPriority))}>
                  {getPriorityTranslation(leadPriority)}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {getStageTranslation(task.leadStatus)}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {task.description}
              </p>
            </div>
            
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-2">
                <div className="space-y-1 text-sm text-gray-600">
                  {task.leadContact && task.leadContact.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {task.leadContact.email}
                    </p>
                  )}
                  {task.leadContact && task.leadContact.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {task.leadContact.phone}
                    </p>
                  )}
                  {task.propertyRequirements && (
                    <p className="flex items-start gap-2">
                      <Home className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {typeof task.propertyRequirements === 'object'
                          ? [
                              task.propertyRequirements.types?.join(', '),
                              task.propertyRequirements.locations?.join(', '),
                              task.propertyRequirements.budget
                            ].filter(Boolean).join(' • ')
                          : task.propertyRequirements
                        }
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {showsAIMessage && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      {t.taskCard.followUpMessage}
                    </h4>

                    {isEditing ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editedMessage}
                          onChange={(e) => setEditedMessage(e.target.value)}
                          className="bg-white min-h-[120px] text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={isSavingEdit || editedMessage === currentMessage}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            {isSavingEdit ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            {t.common.save}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isSavingEdit}
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-2" />
                            {t.common.cancel}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white rounded-md p-3 mb-3">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {currentMessage || t.taskCard.noMessageAvailable}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditMessage}
                            className="h-9 text-xs bg-white hover:bg-gray-50"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            {t.common.edit}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                            className="h-9 text-xs bg-white hover:bg-gray-50"
                          >
                            {isRegenerating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                            {t.taskCard.regenerate}
                          </Button>

                          {task.type === "whatsapp" ? (
                            <Button
                              size="sm"
                              onClick={handleSendWhatsApp}
                              className="h-9 text-xs bg-green-500 hover:bg-green-600 text-white"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {t.taskCard.whatsapp}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={handleSendEmail}
                              className="h-9 text-xs bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              {t.taskCard.email}
                            </Button>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCopyMessage}
                          className="w-full h-9 text-xs bg-white hover:bg-gray-50 mt-2"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {t.taskCard.copyMessage}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReschedule(true)}
                  className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:border-blue-500 hover:bg-blue-50"
                >
                  <Calendar className="h-7 w-7 text-blue-600" />
                  <span className="text-sm font-medium">{t.taskCard.reschedule}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowCancel(true)}
                  className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:border-red-500 hover:bg-red-50"
                >
                  <X className="h-7 w-7 text-red-600" />
                  <span className="text-sm font-medium">{t.common.cancel}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowComplete(true)}
                  disabled={isMarkingDone}
                  className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:border-green-500 hover:bg-green-50"
                >
                  {isMarkingDone ? (
                    <Loader2 className="h-7 w-7 text-green-600 animate-spin" />
                  ) : (
                    <>
                      <span className="text-2xl">✓</span>
                      <span className="text-sm font-medium">{t.taskCard.done}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <RescheduleModal
        open={showReschedule}
        onOpenChange={setShowReschedule}
        currentDate={new Date(date)}
        leadName={task.name}
        onConfirm={handleReschedule}
      />

      <CancelTaskDialog
        open={showCancel}
        onOpenChange={setShowCancel}
        leadName={task.name}
        onConfirm={handleCancel}
        isLoading={isCancelling}
      />

      <CompleteTaskDialog
        open={showComplete}
        onOpenChange={setShowComplete}
        leadName={task.name}
        onConfirm={handleMarkDone}
        isLoading={isMarkingDone}
      />
    </>
  );
}
