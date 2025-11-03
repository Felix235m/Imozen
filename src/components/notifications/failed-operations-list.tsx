"use client";

import * as React from "react";
import { RefreshCw, Trash2, Clock, AlertCircle, Wifi } from "lucide-react";
import { format } from "date-fns";
import { failedOperationsManager, FailedOperation } from "@/lib/failed-operations-manager";
import { cachedCallTaskApi, cachedCallLeadApi, cachedCallLeadStatusApi } from "@/lib/cached-api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface FailedOperationsListProps {
  operations: FailedOperation[];
  onRetrySuccess?: () => void;
}

/**
 * FailedOperationsList - Shows list of failed operations with retry buttons
 *
 * Features:
 * - Shows operation type, timestamp, and error
 * - Retry button for each operation
 * - Remove button to dismiss failures
 * - Clear all button
 * - Loading states during retry
 */
export function FailedOperationsList({
  operations,
  onRetrySuccess,
}: FailedOperationsListProps) {
  const [retryingIds, setRetryingIds] = React.useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleRetry = async (operation: FailedOperation) => {
    setRetryingIds(prev => new Set(prev).add(operation.id));

    try {
      await failedOperationsManager.retry(operation.id, async (op) => {
        // Reconstruct the API call based on the endpoint
        if (op.endpoint === 'task-operation') {
          await cachedCallTaskApi(
            op.payload.operation,
            op.payload
          );
        } else if (op.endpoint === 'lead-operations') {
          await cachedCallLeadApi(
            op.payload.operation,
            op.payload
          );
        } else if (op.endpoint === 'lead-status') {
          await cachedCallLeadStatusApi(
            op.payload.lead_id,
            op.payload.operation === 'change_priority' ? 'change_priority' : op.payload.status,
            op.payload
          );
        } else {
          throw new Error('Unknown endpoint');
        }
      });

      toast({
        title: "Operation completed",
        description: "The operation was retried successfully.",
      });

      onRetrySuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Retry failed",
        description: error.message || "The operation failed again. Please try again later.",
      });
    } finally {
      setRetryingIds(prev => {
        const next = new Set(prev);
        next.delete(operation.id);
        return next;
      });
    }
  };

  const handleRemove = (id: string) => {
    failedOperationsManager.remove(id);
    toast({
      title: "Operation dismissed",
      description: "The failed operation has been removed.",
    });
  };

  const handleClearAll = () => {
    failedOperationsManager.clearAll();
    toast({
      title: "All operations cleared",
      description: "All failed operations have been removed.",
    });
  };

  const getOperationLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'schedule_task': 'Schedule Task',
      'mark_done': 'Mark Done',
      'reschedule': 'Reschedule',
      'cancel': 'Cancel',
      'update_note': 'Update Note',
      'change_stage': 'Change Stage',
      'change_priority': 'Change Priority',
    };
    return labels[type] || type;
  };

  const getFailureReasonIcon = (reason: string) => {
    switch (reason) {
      case 'network':
        return <Wifi className="h-3 w-3" />;
      case 'validation':
        return <AlertCircle className="h-3 w-3" />;
      case 'server':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getFailureReasonColor = (reason: string) => {
    switch (reason) {
      case 'network':
        return 'bg-blue-500';
      case 'validation':
        return 'bg-amber-500';
      case 'server':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (operations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="rounded-full bg-green-100 p-3 mb-3">
          <RefreshCw className="h-6 w-6 text-green-600" />
        </div>
        <p className="text-sm text-muted-foreground">
          No failed operations
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <ScrollArea className="h-[300px]">
        <div className="space-y-2 p-4">
          {operations.map((operation) => {
            const isRetrying = retryingIds.has(operation.id);

            return (
              <div
                key={operation.id}
                className="rounded-lg border bg-card p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">
                        {getOperationLabel(operation.operationType)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`${getFailureReasonColor(operation.failureReason)} text-white border-0`}
                      >
                        <span className="flex items-center gap-1 text-xs">
                          {getFailureReasonIcon(operation.failureReason)}
                          {operation.failureReason}
                        </span>
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {operation.errorMessage}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(operation.timestamp, 'MMM d, h:mm a')}
                      {operation.retryCount > 0 && (
                        <span className="ml-2">
                          • Retried {operation.retryCount}x
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleRetry(operation)}
                      disabled={isRetrying}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() => handleRemove(operation.id)}
                      disabled={isRetrying}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t p-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleClearAll}
        >
          Clear All
        </Button>
      </div>
    </div>
  );
}
