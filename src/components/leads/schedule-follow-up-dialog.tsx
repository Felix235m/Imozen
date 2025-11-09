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
    if (!selectedDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a date'
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('sessionToken');
      if (!token) throw new Error('No authentication token found');

      const webhookUrl = 'https://eurekagathr.app.n8n.cloud/webhook/task-operation';

      // Format date to ISO string for API
      const followUpDate = selectedDate.toISOString();

      // Generate unique task ID
      const taskId = generateTaskId();

      const webhookPayload = {
        lead_id: lead.lead_id,
        task_id: taskId,
        operation: 'schedule_task',
        follow_up_date: followUpDate,
        ...(note.trim() && { note: note.trim() }), // Only include note if not empty
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(webhookPayload)
      });

      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error('Server error occurred. Please try again later.');
        }
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to schedule follow-up');
      }

      // Success
      const dateLocale = language === 'pt' ? ptBR : undefined;
      const formattedDate = format(selectedDate, 'MMM d, yyyy', { locale: dateLocale });

      toast({
        title: t.leads.messages.followUpScheduled,
        description: t.leads.messages.followUpScheduledDescription.replace('{{date}}', formattedDate),
      });

      onOpenChange(false);

      // Call success callback to refresh leads list
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || t.leads.messages.errorSchedulingFollowUp
      });
    } finally {
      setIsLoading(false);
    }
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
