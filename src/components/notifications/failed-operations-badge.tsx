"use client";

import * as React from "react";
import { AlertTriangle, X } from "lucide-react";
import { failedOperationsManager, FailedOperation } from "@/lib/failed-operations-manager";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FailedOperationsList } from "./failed-operations-list";

/**
 * FailedOperationsBadge - Shows a badge with count of failed operations
 *
 * Features:
 * - Shows count of failed operations
 * - Pulsing animation when there are failures
 * - Opens popover with list of failed operations
 * - Auto-updates when operations change
 */
export function FailedOperationsBadge() {
  const [operations, setOperations] = React.useState<FailedOperation[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    // Subscribe to failed operations changes
    const unsubscribe = failedOperationsManager.subscribe((ops) => {
      setOperations(ops);
    });

    return unsubscribe;
  }, []);

  // Don't show badge if no failed operations
  if (operations.length === 0) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0"
        >
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          {operations.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center animate-pulse">
              {operations.length > 9 ? '9+' : operations.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="font-semibold text-sm">Failed Operations</h3>
            <span className="text-xs text-muted-foreground">
              ({operations.length})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <FailedOperationsList
          operations={operations}
          onRetrySuccess={() => {
            // Operations list will automatically update via subscription
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
