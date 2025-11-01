
"use client";

import * as React from "react";
import { CheckCircle, CalendarIcon } from "lucide-react";
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
import { DatePicker } from '@/components/ui/date-picker';
import { useLanguage } from "@/hooks/useLanguage";

interface CompleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName?: string;
  onConfirm: (note: string, nextFollowUpDate?: Date) => void;
  isLoading?: boolean;
}

export function CompleteTaskDialog({
  open,
  onOpenChange,
  leadName,
  onConfirm,
  isLoading = false,
}: CompleteTaskDialogProps) {
  const [note, setNote] = React.useState<string>("");
  const [selectedShortcut, setSelectedShortcut] = React.useState<string>('none');
  const [customDate, setCustomDate] = React.useState<Date | undefined>(undefined);
  const { t, language } = useLanguage();

  // Calculate date from shortcut
  const getDateFromShortcut = (shortcut: string): Date | undefined => {
    if (shortcut === 'none') return undefined;

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
        return customDate;
      default:
        return undefined;
    }
  };

  const selectedDate = selectedShortcut === 'custom' ? customDate : getDateFromShortcut(selectedShortcut);

  const getShortcutLabel = (shortcut: string): string => {
    if (shortcut === 'none') {
      return t.taskDialogs.noFollowUp || "No follow-up";
    }
    if (shortcut === 'custom') {
      return t.leads.dateShortcuts.customDate;
    }

    const date = getDateFromShortcut(shortcut);
    if (!date) return '';

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
      setNote("");
      setSelectedShortcut('none');
      setCustomDate(undefined);
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm(note, selectedDate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] sm:max-w-[480px] rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 text-center">
            {t.taskDialogs.completeFollowUp}
          </DialogTitle>
          {leadName && (
            <DialogDescription className="text-base text-gray-600 text-center mt-1">
              {t.taskDialogs.leadLabel} {leadName}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-gray-700 leading-relaxed font-medium">
              {t.taskDialogs.haveYouFollowedUp}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-medium text-gray-700">
              {t.taskDialogs.outcomeNote}
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.taskDialogs.outcomeNotePlaceholder}
              className="bg-gray-50 border-gray-200 resize-none h-20 focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Schedule Next Follow-Up */}
          <div className="space-y-2">
            <Label htmlFor="next-follow-up" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {t.taskDialogs.scheduleNextFollowUpOptional}
            </Label>
            <Select value={selectedShortcut} onValueChange={setSelectedShortcut}>
              <SelectTrigger id="next-follow-up" className="w-full bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {getShortcutLabel('none')}
                </SelectItem>
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
        </div>

        <div className="flex gap-3 justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-11 px-6 border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            {t.taskDialogs.noCancel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || (selectedShortcut === 'custom' && !customDate)}
            className="h-11 px-6 bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? t.taskDialogs.completing : t.taskDialogs.yesComplete}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
