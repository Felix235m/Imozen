import React from "react";
import { CompleteTaskDialog } from "@/components/dashboard/complete-task-dialog";

interface TaskCardCompleteProps {
  show: boolean;
  leadName: string;
  isLoading: boolean;
  isOptimistic: boolean;
  onConfirm: (note: string, nextFollowUpDate?: Date) => void;
  onClose: () => void;
}

export function TaskCardComplete({
  show,
  leadName,
  isLoading,
  isOptimistic,
  onConfirm,
  onClose
}: TaskCardCompleteProps) {
  return (
    <CompleteTaskDialog
      open={show}
      onOpenChange={(open) => !open && onClose()}
      leadName={leadName}
      onConfirm={onConfirm}
      isLoading={isLoading}
      isOptimistic={isOptimistic}
    />
  );
}