
"use client";

import * as React from "react";
import { CheckCircle } from "lucide-react";
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

interface CompleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note: string) => void;
  isLoading?: boolean;
}

export function CompleteTaskDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: CompleteTaskDialogProps) {
  const [note, setNote] = React.useState<string>("");

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
            Complete Task?
          </DialogTitle>
          <DialogDescription className="sr-only">
            Mark this task as complete.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-gray-700 leading-relaxed">
              Are you sure you want to mark this task as complete?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-medium text-gray-700">
              Outcome Note (Optional)
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Confirmed appointment with client. They are excited."
              className="bg-gray-50 border-gray-200 resize-none h-20 focus:border-green-500 focus:ring-2 focus:ring-green-100"
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
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="h-11 px-6 bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? "Completing..." : "Yes, Complete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
