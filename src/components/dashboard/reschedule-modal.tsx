"use client";

import * as React from "react";
import { X, Calendar as CalendarIcon, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate?: Date;
  currentTime?: string;
  onConfirm: (newDate: Date, newTime: string, note: string) => void;
  isLoading?: boolean;
}

export function RescheduleModal({
  open,
  onOpenChange,
  currentDate,
  currentTime = "03:00 PM",
  onConfirm,
  isLoading = false,
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    currentDate || new Date()
  );
  const [selectedTime, setSelectedTime] = React.useState<string>(currentTime);
  const [note, setNote] = React.useState<string>("");

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setSelectedDate(currentDate || new Date());
      setSelectedTime(currentTime);
      setNote("");
    }
  }, [open, currentDate, currentTime]);

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(selectedDate, selectedTime, note);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] sm:max-w-[480px] rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Reschedule Follow-up
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Select New Date
            </Label>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Select a date"
              disablePastDates={true}
            />
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <Label htmlFor="time" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Select Time
            </Label>
            <TimePicker value={selectedTime} onChange={setSelectedTime} />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              📝 Note (Optional)
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for rescheduling..."
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
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || isLoading}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? "Rescheduling..." : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
