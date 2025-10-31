
"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
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
import { useLanguage } from "@/hooks/useLanguage";

interface CancelTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note: string) => void;
  isLoading?: boolean;
}

export function CancelTaskDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: CancelTaskDialogProps) {
  const [note, setNote] = React.useState<string>("");
  const { t } = useLanguage();

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setNote("");
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm(note);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] sm:max-w-[480px] rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 text-center">
            {t.taskDialogs.cancelTask}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Cancel this follow-up task permanently
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Warning Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-amber-100 p-3">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
            </div>
          </div>

          {/* Warning Message */}
          <div className="text-center space-y-3">
            <p className="text-gray-700 leading-relaxed">
              {t.taskDialogs.cancelTaskDescription}
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t.taskDialogs.cancelTaskWarning}
            </p>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-medium text-gray-700">
              {t.taskDialogs.noteOptional}
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.taskDialogs.addDetails}
              className="bg-gray-50 border-gray-200 resize-none h-20 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-11 px-6 border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            {t.taskDialogs.goBack}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="h-11 px-6 bg-red-500 hover:bg-red-600 text-white"
          >
            {isLoading ? t.taskDialogs.cancelling : t.taskDialogs.yesCancel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
