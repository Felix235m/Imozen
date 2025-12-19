import React from "react";
import { CancelTaskDialog } from "@/components/dashboard/cancel-task-dialog";

interface TaskCardCancelProps {
  show: boolean;
  leadName: string;
  isLoading: boolean;
  onConfirm: (note: string, nextFollowUpDate?: Date, scheduleNext?: boolean) => void;
  onClose: () => void;
}

export function TaskCardCancel({
  show,
  leadName,
  isLoading,
  onConfirm,
  onClose
}: TaskCardCancelProps) {
  return (
    <CancelTaskDialog
      open={show}
      onOpenChange={(open) => !open && onClose()}
      leadName={leadName}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}