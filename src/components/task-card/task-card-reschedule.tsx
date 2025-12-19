import React from "react";
import { RescheduleModal } from "@/components/dashboard/reschedule-modal";

interface TaskCardRescheduleProps {
  show: boolean;
  currentDate: Date;
  leadName: string;
  onConfirm: (newDate: Date, note: string, newTime: string) => void;
  onClose: () => void;
}

export function TaskCardReschedule({
  show,
  currentDate,
  leadName,
  onConfirm,
  onClose
}: TaskCardRescheduleProps) {
  return (
    <RescheduleModal
      open={show}
      onOpenChange={(open) => !open && onClose()}
      currentDate={currentDate}
      leadName={leadName}
      onConfirm={onConfirm}
    />
  );
}