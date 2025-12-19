import React from "react";
import { Calendar, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

interface TaskCardActionsProps {
  onReschedule: () => void;
  onCancel: () => void;
  onComplete: () => void;
  isMarkingDone: boolean;
}

export function TaskCardActions({
  onReschedule,
  onCancel,
  onComplete,
  isMarkingDone
}: TaskCardActionsProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-3 gap-3 pt-2">
      <Button
        variant="outline"
        onClick={onReschedule}
        className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:border-blue-500 hover:bg-blue-50"
      >
        <Calendar className="h-7 w-7 text-blue-600" />
        <span className="text-sm font-medium">{t.taskCard.reschedule}</span>
      </Button>

      <Button
        variant="outline"
        onClick={onCancel}
        className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:border-red-500 hover:bg-red-50"
      >
        <X className="h-7 w-7 text-red-600" />
        <span className="text-sm font-medium">{t.common.cancel}</span>
      </Button>

      <Button
        variant="outline"
        onClick={onComplete}
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
  );
}