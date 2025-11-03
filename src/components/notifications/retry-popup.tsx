"use client";

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import type { OptimisticOperation } from '@/types/app-data';

interface RetryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void | Promise<void>;
  onDiscard: () => void;
  operation: OptimisticOperation;
  isRetrying?: boolean;
}

export function RetryPopup({
  isOpen,
  onClose,
  onRetry,
  onDiscard,
  operation,
  isRetrying = false,
}: RetryPopupProps) {
  const [localRetrying, setLocalRetrying] = React.useState(false);

  const handleRetry = async () => {
    setLocalRetrying(true);
    try {
      await onRetry();
    } finally {
      setLocalRetrying(false);
    }
  };

  const handleDiscard = () => {
    onDiscard();
    onClose();
  };

  const renderComparison = () => {
    if (!operation || !operation.oldValue || !operation.newValue) {
      return (
        <div className="text-sm text-gray-600">
          Operation failed. Would you like to retry?
        </div>
      );
    }

    // Handle different operation types
    switch (operation.type) {
      case 'change_priority':
        return (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-500 mb-1">Old Priority</div>
              <div className="font-semibold text-gray-800">{operation.oldValue}</div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-500 mb-1">New Priority</div>
              <div className="font-semibold text-primary">{operation.newValue}</div>
            </div>
          </div>
        );

      case 'change_stage':
        return (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-500 mb-1">Old Stage</div>
              <div className="font-semibold text-gray-800">{operation.oldValue}</div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-500 mb-1">New Stage</div>
              <div className="font-semibold text-primary">{operation.newValue}</div>
            </div>
          </div>
        );

      case 'edit_lead':
        return (
          <div className="space-y-3">
            {Object.keys(operation.newValue).map((key) => {
              if (operation.oldValue[key] !== operation.newValue[key]) {
                return (
                  <div key={key} className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 mb-2 capitalize">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-sm text-gray-800 line-through">
                        {String(operation.oldValue[key])}
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 text-sm text-primary font-medium">
                        {String(operation.newValue[key])}
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        );

      case 'delete_lead':
        return (
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-sm text-gray-700">
              Lead: <span className="font-semibold">{operation.oldValue?.name || 'Unknown'}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              This lead will be permanently deleted
            </div>
          </div>
        );

      case 'save_note':
        return (
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Old Note</div>
              <div className="text-sm text-gray-800 line-clamp-3">
                {operation.oldValue || '(empty)'}
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 mx-auto" />
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">New Note</div>
              <div className="text-sm text-gray-800 line-clamp-3">
                {operation.newValue || '(empty)'}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-600">
            Operation: {operation.type}
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <DialogTitle>Operation Failed</DialogTitle>
          </div>
          <DialogDescription>
            The operation could not be completed. Review the changes and retry.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderComparison()}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleDiscard}
            disabled={localRetrying || isRetrying}
          >
            Discard
          </Button>
          <Button
            onClick={handleRetry}
            disabled={localRetrying || isRetrying}
          >
            {(localRetrying || isRetrying) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Retry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
