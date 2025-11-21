"use client";

import * as React from "react";
import { X, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, addDays, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from "@/components/ui/date-picker";
import { useLanguage } from "@/hooks/useLanguage";
import { BalancedLeadHeader } from "@/components/leads/lead-headers";

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate?: Date;
  leadName?: string;
  leadImageUrl?: string;
  leadType?: 'Buyer' | 'Seller';
  leadTemperature?: string;
  leadStage?: string;
  onConfirm: (newDate: Date, note: string, newTime: string) => void;
  isLoading?: boolean;
}

export function RescheduleModal({
  open,
  onOpenChange,
  currentDate,
  leadName,
  leadImageUrl,
  leadType,
  leadTemperature,
  leadStage,
  onConfirm,
  isLoading = false,
}: RescheduleModalProps) {
  const [selectedShortcut, setSelectedShortcut] = React.useState<string>('next_week');
  const [customDate, setCustomDate] = React.useState<Date | undefined>(currentDate || new Date());
  const [note, setNote] = React.useState<string>("");
  const { t, language } = useLanguage();

  // Fixed 8:00 AM Portugal time creation
  const createFixedPortugalTime = (): string => {
    return "08:00"; // Always return 8:00 AM in 24-hour format
  };

  // Calculate date from shortcut
  const getDateFromShortcut = (shortcut: string): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setSelectedShortcut('next_week');
      setCustomDate(currentDate || new Date());
      setNote("");
    }
  }, [open, currentDate]);

  const handleConfirm = () => {
    if (selectedDate) {
      const fixedTime = createFixedPortugalTime();
      onConfirm(selectedDate, note, fixedTime);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] sm:max-w-[480px] rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 mb-3">
            {t.taskDialogs.rescheduleFollowUp}
          </DialogTitle>
          {leadName && (
            <BalancedLeadHeader
              name={leadName}
              imageUrl={leadImageUrl}
              leadType={leadType}
              temperature={leadTemperature}
              stage={leadStage}
            />
          )}
          <DialogDescription className="sr-only">
            {t.taskDialogs.leadLabel} {leadName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Date Shortcuts Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="date-shortcut" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {t.taskDialogs.selectNewDate}
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
                placeholder="Select a date"
                disablePastDates={true}
              />
            </div>
          )}

          {/* Fixed Time Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">8:00 AM Schedule Time</span>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              📝 {t.taskDialogs.noteOptional}
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.taskDialogs.rescheduleReasonPlaceholder}
              className="bg-gray-50 border-gray-200 resize-none h-20 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-11 px-6 border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || (selectedShortcut === 'custom' && !customDate) || isLoading}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? t.taskDialogs.rescheduling : t.taskDialogs.confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
