"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { DraftInfo } from "@/lib/draft-detector";

interface DraftResumeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftInfo: DraftInfo;
  onContinue: () => void;
  onStartFresh: () => void;
}

export function DraftResumeDialog({
  open,
  onOpenChange,
  draftInfo,
  onContinue,
  onStartFresh,
}: DraftResumeDialogProps) {
  if (!draftInfo.exists) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <AlertDialogTitle className="text-left">Incomplete Lead Form Found</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-2">
            <p>
              You have an incomplete lead form that was last edited{' '}
              <span className="font-semibold">{draftInfo.timeAgo}</span>.
            </p>
            {draftInfo.preview && (
              <p className="text-sm bg-gray-50 p-3 rounded-md border border-gray-200">
                <span className="font-medium">Draft preview:</span> {draftInfo.preview}
              </p>
            )}
            <p className="pt-2">
              Would you like to continue working on this lead or start a new one?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onStartFresh();
            }}
            className="bg-gray-500 hover:bg-gray-600"
          >
            Start Fresh
          </AlertDialogAction>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onContinue();
            }}
            className="bg-primary hover:bg-primary/90"
          >
            Continue Draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
