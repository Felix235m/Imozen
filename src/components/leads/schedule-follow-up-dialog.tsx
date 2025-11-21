"use client";

import { useState, useEffect } from 'react';
import { format, addDays, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LeadBadgeGroup } from './lead-badges';
import { localStorageManager } from '@/lib/local-storage-manager';
import { dispatchThrottledStorageEvent } from '@/lib/storage-event-throttle';
import { transformBackendTask } from '@/lib/task-transformer';
import type { Notification } from '@/types/app-data';

interface ScheduleFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    lead_id: string;
    name: string;
    image_url?: string;
    lead_type?: 'Buyer' | 'Seller';
    temperature?: string;
    stage?: string;
    lead_stage?: string;
  };
  onSuccess?: () => void; // Callback to refresh leads list
}

/**
 * Generate a unique task ID in the format: task_{timestamp}_{randomString}
 * Example: task_1761224347322_sv0x9gx7k
 */
function generateTaskId(): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 11);
  return `task_${timestamp}_${randomStr}`;
}

export function ScheduleFollowUpDialog({
  open,
  onOpenChange,
  lead,
  onSuccess,
}: ScheduleFollowUpDialogProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [selectedShortcut, setSelectedShortcut] = useState<string>('next_week');
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [note, setNote] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate date from shortcut
  const getDateFromShortcut = (shortcut: string): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    switch (shortcut) {
      case 'next_week':
        return addDays(today, 7);

      case 'after_two_weeks':
        return addDays(today, 14);

      case 'next_month':
        return addMonths(today, 1);

      case 'after_two_months':
        return addMonths(today, 2);

      case 'after_six_months':
        return addMonths(today, 6);

      case 'custom':
        return customDate || today;

      default:
        return today;
    }
  };

  const selectedDate = selectedShortcut === 'custom' ? customDate : getDateFromShortcut(selectedShortcut);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedShortcut('next_week');
      setCustomDate(undefined);
      setNote('');
    }
  }, [open]);

  const handleSchedule = async () => {
    console.log('🔍 [DEBUG] handleSchedule called');
    
    if (!selectedDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a date'
      });
      return;
    }

    setIsLoading(true);
    console.log('🔍 [DEBUG] isLoading set to true');
    
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('sessionToken');
      if (!token) throw new Error('No authentication token found');

      const webhookUrl = 'https://eurekagathr.app.n8n.cloud/webhook/task-operation';

      // Format date to ISO string for API
      const followUpDate = selectedDate.toISOString();
      console.log('🔍 [DEBUG] Follow-up date:', followUpDate);

      // Generate unique task ID
      const taskId = generateTaskId();
      console.log('🔍 [DEBUG] Generated task ID:', taskId);

      const webhookPayload = {
        lead_id: lead.lead_id,
        task_id: taskId,
        operation: 'schedule_task',
        follow_up_date: followUpDate,
        ...(note.trim() && { note: note.trim() }), // Only include note if not empty
      };
      console.log('🔍 [DEBUG] Webhook payload:', webhookPayload);

      // Store request data in localStorage for retry functionality
      const followUpRequestData = {
        ...webhookPayload,
        lead_name: lead.name,
        timestamp: Date.now()
      };
      localStorage.setItem('pending_follow_up', JSON.stringify(followUpRequestData));
      console.log('🔍 [DEBUG] Stored pending follow-up data');

      // Show immediate progress notification
      createProgressNotification(lead.name, selectedDate);
      console.log('🔍 [DEBUG] Created progress notification');

      // Close dialog immediately after showing progress notification
      onOpenChange(false);
      console.log('🔍 [DEBUG] Dialog closed');

      // Call success callback to refresh leads list
      if (onSuccess) {
        onSuccess();
      }
      console.log('🔍 [DEBUG] Success callback called');

      // Process webhook in background
      console.log('🔍 [DEBUG] Starting webhook call in background');
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(webhookPayload)
      });
      console.log('🔍 [DEBUG] Webhook response received:', response.status);

      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error('Server error occurred. Please try again later.');
        }
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to schedule follow-up');
      }

      // Process successful response
      const responseData = await response.json();
      const data = Array.isArray(responseData) ? responseData[0] : responseData;
      console.log('🔍 [DEBUG] Webhook response data:', data);
      
      if (data.success) {
        // Update progress notification to success
        updateProgressNotificationToSuccess(lead.name, lead.lead_id, selectedDate);
        console.log('🔍 [DEBUG] Updated progress notification to success');
        
        await processFollowUpResponse(data, lead.lead_id, lead.name);
        console.log('🔍 [DEBUG] Processed follow-up response');
        
        // Clear pending request data
        localStorage.removeItem('pending_follow_up');
        console.log('🔍 [DEBUG] Cleared pending follow-up data');
      } else {
        throw new Error(data.message || 'Failed to schedule follow-up');
      }
    } catch (error: any) {
      console.error('🔍 [DEBUG] Error in handleSchedule:', error);
      
      // Update progress notification to error with retry
      updateProgressNotificationToError(lead.name, error.message);
      console.log('🔍 [DEBUG] Updated progress notification to error');
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || t.leads.messages.errorSchedulingFollowUp
      });
    } finally {
      setIsLoading(false);
      console.log('🔍 [DEBUG] isLoading set to false');
    }
  };

  // Process webhook response and update all relevant components
  const processFollowUpResponse = async (data: any, leadId: string, leadName: string) => {
    try {
      const leadData = data.data?.lead;
      if (!leadData) return;

      // Update lead details with new data
      if (leadData) {
        localStorageManager.updateLeadDetails(leadId, leadData);
      }

      // Update lead list item with next follow-up date
      if (leadData.management?.next_followUp_date) {
        localStorageManager.updateSingleLead(leadId, {
          next_follow_up: {
            status: 'Scheduled',
            date: leadData.management.next_followUp_date
          }
        });
      }

      // Add new task if due_date is within 10 days
      if (leadData.tasks && leadData.tasks.length > 0) {
        const newTask = leadData.tasks[0];
        const taskDueDate = new Date(newTask.due_date);
        const tenDaysFromNow = new Date();
        tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

        if (taskDueDate <= tenDaysFromNow) {
          const transformedTask = transformBackendTask(newTask);
          // Update AI-generated message in task for follow-up popup
          if (newTask.followUpMessage) {
            transformedTask.followUpMessage = newTask.followUpMessage;
          }
          localStorageManager.addTaskToGroup(transformedTask);
        }

        // Update dashboard counts for follow-ups within 7 days
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        
        if (taskDueDate <= sevenDaysFromNow) {
          const dashboard = localStorageManager.getDashboard();
          const updatedCounts = {
            ...dashboard.counts,
            leads_for_followup: (dashboard.counts.leads_for_followup || 0) + 1
          };
          localStorageManager.updateDashboard({
            ...dashboard,
            counts: updatedCounts
          });
        }
      }

      // Add new communication event to history
      if (leadData.communication_history && leadData.communication_history.length > 0) {
        const newEvent = leadData.communication_history.find(
          (event: any) => event.event_type === 'Follow-up Scheduled'
        );
        if (newEvent) {
          localStorageManager.addCommunicationEvent(leadId, newEvent);
        }
      }

      // Add new note to notes section
      if (leadData.notes && leadData.notes.length > 0) {
        const newNote = leadData.notes[0];
        localStorageManager.addNote(leadId, newNote);
      }

      // SUCCESS NOTIFICATION REMOVED: updateProgressNotificationToSuccess() already handles creating the success notification
      // This prevents duplicate notifications from appearing
    } catch (error) {
      console.error('Error processing follow-up response:', error);
    }
  };

  // Create progress notification
  const createProgressNotification = (leadName: string, followUpDate: Date) => {
    console.log('🔍 [DEBUG] Creating progress notification for:', leadName);
    const dateLocale = language === 'pt' ? ptBR : undefined;
    const formattedDate = format(followUpDate, 'MMM d, yyyy', { locale: dateLocale });
    
    const notification: Notification = {
      id: `follow_up_progress_${Date.now()}`,
      type: 'follow_up_in_progress',
      title: 'Scheduling Follow-up...',
      message: `Scheduling follow-up for ${leadName} on ${formattedDate}`,
      timestamp: Date.now(),
      priority: 'medium' as const,
      read: false,
      lead_id: lead.lead_id,
    };

    console.log('🔍 [DEBUG] Progress notification created:', notification);
    const currentNotifications = localStorageManager.getNotifications();
    console.log('🔍 [DEBUG] Current notifications count:', currentNotifications.length);
    const updatedNotifications = [notification, ...currentNotifications];
    console.log('🔍 [DEBUG] Updated notifications count:', updatedNotifications.length);
    localStorageManager.updateNotifications(updatedNotifications);
    
    // Store the notification ID for later updates
    sessionStorage.setItem('current_follow_up_notification_id', notification.id);
    console.log('🔍 [DEBUG] Stored notification ID in sessionStorage:', notification.id);
    
    // Force a throttled storage event to ensure UI updates without causing render storms
    dispatchThrottledStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));
  };

  // Update progress notification to success
  const updateProgressNotificationToSuccess = (leadName: string, leadId: string, followUpDate: Date) => {
    const notificationId = sessionStorage.getItem('current_follow_up_notification_id');
    if (!notificationId) return;
    
    const dateLocale = language === 'pt' ? ptBR : undefined;
    const formattedDate = format(followUpDate, 'MMM d, yyyy', { locale: dateLocale });
    
    // Check if follow-up is within 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const isWithin7Days = followUpDate <= sevenDaysFromNow;
    
    const currentNotifications = localStorageManager.getNotifications();
    const updatedNotifications = currentNotifications.map(notif => {
      if (notif.id === notificationId) {
        return {
          ...notif,
          id: `follow_up_success_${Date.now()}`, // New ID for success state
          type: 'follow_up_scheduled',
          title: 'Follow-up Scheduled',
          message: `Follow-up scheduled for ${leadName} on ${formattedDate}`,
          priority: 'medium',
          read: false,
          lead_id: leadId,
          action_type: 'navigate_to_task',
          action_target: `/tasks?expand=task_${leadId}_${followUpDate.getTime()}`,
          action_data: {
            leadId,
            followUpDate: followUpDate.toISOString(),
            taskId: `task_${leadId}_${followUpDate.getTime()}`,
            leadName: leadName
          }
        };
      }
      return notif;
    });
    
    localStorageManager.updateNotifications(updatedNotifications);
    sessionStorage.removeItem('current_follow_up_notification_id');
  };

  // Update progress notification to error
  const updateProgressNotificationToError = (leadName: string, errorMessage: string) => {
    const notificationId = sessionStorage.getItem('current_follow_up_notification_id');
    if (!notificationId) return;
    
    const pendingData = localStorage.getItem('pending_follow_up');
    const requestData = pendingData ? JSON.parse(pendingData) : null;
    
    const currentNotifications = localStorageManager.getNotifications();
    const updatedNotifications = currentNotifications.map(notif => {
      if (notif.id === notificationId) {
        return {
          ...notif,
          id: `follow_up_error_${Date.now()}`, // New ID for error state
          type: 'follow_up_failed',
          title: 'Failed to Schedule Follow-up',
          message: `Could not schedule follow-up for ${leadName}: ${errorMessage}`,
          priority: 'high',
          read: false,
          lead_id: lead.lead_id,
          action_type: 'retry_follow_up',
          action_data: requestData,
          action_target: `/leads/${lead.lead_id}`
        };
      }
      return notif;
    });
    
    localStorageManager.updateNotifications(updatedNotifications);
    sessionStorage.removeItem('current_follow_up_notification_id');
  };

  // Create success notification (legacy, kept for compatibility)
  const createSuccessNotification = (leadName: string) => {
    const notification: Notification = {
      id: `follow_up_success_${Date.now()}`,
      type: 'follow_up_scheduled',
      title: 'Follow-up Scheduled',
      message: `New follow-up scheduled for ${leadName}`,
      timestamp: Date.now(),
      priority: 'medium',
      read: false,
      lead_id: lead.lead_id,
    };

    const currentNotifications = localStorageManager.getNotifications();
    const updatedNotifications = [notification, ...currentNotifications];
    localStorageManager.updateNotifications(updatedNotifications);
  };

  // Create error notification with retry button
  const createErrorNotification = (leadName: string, errorMessage: string) => {
    const pendingData = localStorage.getItem('pending_follow_up');
    const requestData = pendingData ? JSON.parse(pendingData) : null;

    const notification: Notification = {
      id: `follow_up_error_${Date.now()}`,
      type: 'follow_up_failed',
      title: 'Failed to Schedule Follow-up',
      message: `Could not schedule follow-up for ${leadName}: ${errorMessage}`,
      timestamp: Date.now(),
      priority: 'high',
      read: false,
      lead_id: lead.lead_id,
      action_type: 'retry_follow_up',
      action_data: requestData,
      action_target: `/leads/${lead.lead_id}`
    };

    const currentNotifications = localStorageManager.getNotifications();
    const updatedNotifications = [notification, ...currentNotifications];
    localStorageManager.updateNotifications(updatedNotifications);
  };

  const getShortcutLabel = (shortcut: string): string => {
    if (shortcut === 'custom') {
      return t.leads.dateShortcuts.customDate;
    }

    const date = getDateFromShortcut(shortcut);
    const dateLocale = language === 'pt' ? ptBR : undefined;
    const formattedDate = format(date, 'EEEE, MMM d, yyyy', { locale: dateLocale });

    switch (shortcut) {
      case 'next_week':
        return `${t.leads.dateShortcuts.nextWeek} - ${formattedDate}`;
      case 'after_two_weeks':
        return `${t.leads.dateShortcuts.afterTwoWeeks} - ${formattedDate}`;
      case 'next_month':
        return `${t.leads.dateShortcuts.nextMonth} - ${formattedDate}`;
      case 'after_two_months':
        return `${t.leads.dateShortcuts.afterTwoMonths} - ${formattedDate}`;
      case 'after_six_months':
        return `${t.leads.dateShortcuts.afterSixMonths} - ${formattedDate}`;
      default:
        return formattedDate;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] sm:max-w-[480px] rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 text-center mb-3">
            {t.leads.scheduleFollowUpDialog.title.replace('{{name}}', lead.name)}
          </DialogTitle>
          <div className="flex flex-col items-center gap-3 py-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={lead.image_url} alt={lead.name} />
              <AvatarFallback className="text-lg font-semibold">
                {lead.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">{lead.name}</h3>
              <LeadBadgeGroup
                leadType={lead.lead_type}
                temperature={lead.temperature}
                stage={lead.lead_stage || lead.stage}
                className="justify-center"
              />
            </div>
          </div>
          <DialogDescription className="sr-only">
            {t.leads.scheduleFollowUpDialog.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Date Shortcuts Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="date-shortcut" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {t.leads.scheduleFollowUpDialog.followUpDate}
            </Label>
            <Select value={selectedShortcut} onValueChange={setSelectedShortcut}>
              <SelectTrigger id="date-shortcut" className="w-full bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="next_week">
                  {getShortcutLabel('next_week')}
                </SelectItem>
                <SelectItem value="after_two_weeks">
                  {getShortcutLabel('after_two_weeks')}
                </SelectItem>
                <SelectItem value="next_month">
                  {getShortcutLabel('next_month')}
                </SelectItem>
                <SelectItem value="after_two_months">
                  {getShortcutLabel('after_two_months')}
                </SelectItem>
                <SelectItem value="after_six_months">
                  {getShortcutLabel('after_six_months')}
                </SelectItem>
                <SelectItem value="custom">
                  {getShortcutLabel('custom')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Picker - Show when "custom" is selected */}
          {selectedShortcut === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="custom-date" className="text-sm font-medium text-gray-700">
                {t.leads.scheduleFollowUpDialog.selectDate}
              </Label>
              <DatePicker
                value={customDate}
                onChange={setCustomDate}
                disablePastDates={true}
              />
            </div>
          )}

          {/* Note Textarea */}
          <div className="space-y-2">
            <Label htmlFor="schedule-note" className="text-sm font-medium text-gray-700">
              {t.leads.scheduleFollowUpDialog.noteLabel}
            </Label>
            <Textarea
              id="schedule-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.leads.scheduleFollowUpDialog.notePlaceholder}
              rows={4}
              className="bg-gray-50 border-gray-200 resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-11 px-6 border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={isLoading || (selectedShortcut === 'custom' && !customDate)}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? t.leads.scheduleFollowUpDialog.scheduling : t.leads.scheduleFollowUpDialog.scheduleButton}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
