/**
 * OptimisticManager - Manages optimistic UI updates with rollback capability
 *
 * Features:
 * - Store pending operations with metadata
 * - Apply transformations to local state
 * - Rollback on API failure
 * - Confirm on API success
 * - Track old/new values for comparison UI
 * - localStorage integration
 */

import type { OptimisticOperation } from '@/types/app-data';

export type OptimisticTransform<T> = (data: T) => T;

interface PendingOperation<T> {
  id: string;
  transform: OptimisticTransform<T>;
  rollback: OptimisticTransform<T>;
  timestamp: number;
  metadata?: OptimisticOperation;
}

export class OptimisticManager<T = any> {
  private pendingOperations: Map<string, PendingOperation<T>> = new Map();

  /**
   * Apply an optimistic update
   * @param id - Unique operation ID
   * @param currentData - Current data state
   * @param transform - Function to transform data optimistically
   * @param rollback - Function to rollback the transformation
   * @param metadata - Optional metadata about the operation (for retry UI)
   * @returns Transformed data
   */
  apply(
    id: string,
    currentData: T,
    transform: OptimisticTransform<T>,
    rollback: OptimisticTransform<T>,
    metadata?: OptimisticOperation
  ): T {
    // Store the operation
    this.pendingOperations.set(id, {
      id,
      transform,
      rollback,
      timestamp: Date.now(),
      metadata,
    });

    // Apply transformation
    return transform(currentData);
  }

  /**
   * Get metadata for a pending operation
   */
  getMetadata(id: string): OptimisticOperation | undefined {
    return this.pendingOperations.get(id)?.metadata;
  }

  /**
   * Confirm an operation succeeded (remove from pending)
   * @param id - Operation ID
   */
  confirm(id: string): void {
    this.pendingOperations.delete(id);
  }

  /**
   * Rollback a failed operation
   * @param id - Operation ID
   * @param currentData - Current data state
   * @returns Rolled back data
   */
  rollback(id: string, currentData: T): T {
    const operation = this.pendingOperations.get(id);
    if (!operation) {
      console.warn(`No pending operation found with id: ${id}`);
      return currentData;
    }

    // Apply rollback transformation
    const rolledBackData = operation.rollback(currentData);

    // Remove from pending
    this.pendingOperations.delete(id);

    return rolledBackData;
  }

  /**
   * Check if an operation is pending
   */
  isPending(id: string): boolean {
    return this.pendingOperations.has(id);
  }

  /**
   * Get all pending operation IDs
   */
  getPendingIds(): string[] {
    return Array.from(this.pendingOperations.keys());
  }

  /**
   * Clear all pending operations
   */
  clear(): void {
    this.pendingOperations.clear();
  }

  /**
   * Get count of pending operations
   */
  get pendingCount(): number {
    return this.pendingOperations.size;
  }
}

/**
 * Helper function to create optimistic task operations
 */
export const createTaskOptimisticOps = () => {
  const manager = new OptimisticManager<any[]>();

  return {
    markDone: (tasks: any[], taskId: string) => {
      const id = `mark-done-${taskId}`;
      return {
        id,
        data: manager.apply(
          id,
          tasks,
          // Transform: remove task from list
          (data) => data.filter((t) => t.id !== taskId),
          // Rollback: add task back
          (data) => {
            const originalTask = tasks.find((t) => t.id === taskId);
            return originalTask ? [...data, originalTask] : data;
          }
        ),
        confirm: () => manager.confirm(id),
        rollback: (currentData: any[]) => manager.rollback(id, currentData),
      };
    },

    reschedule: (tasks: any[], taskId: string, newDate: Date, newTime: string) => {
      const id = `reschedule-${taskId}`;
      const originalTask = tasks.find((t) => t.id === taskId);

      return {
        id,
        data: manager.apply(
          id,
          tasks,
          // Transform: update task date and time
          (data) =>
            data.map((t) =>
              t.id === taskId
                ? { ...t, followUpDate: newDate, time: newTime }
                : t
            ),
          // Rollback: restore original values
          (data) =>
            data.map((t) =>
              t.id === taskId && originalTask
                ? { ...t, followUpDate: originalTask.followUpDate, time: originalTask.time }
                : t
            )
        ),
        confirm: () => manager.confirm(id),
        rollback: (currentData: any[]) => manager.rollback(id, currentData),
      };
    },

    cancel: (tasks: any[], taskId: string) => {
      const id = `cancel-${taskId}`;
      return {
        id,
        data: manager.apply(
          id,
          tasks,
          // Transform: remove task from list
          (data) => data.filter((t) => t.id !== taskId),
          // Rollback: add task back
          (data) => {
            const originalTask = tasks.find((t) => t.id === taskId);
            return originalTask ? [...data, originalTask] : data;
          }
        ),
        confirm: () => manager.confirm(id),
        rollback: (currentData: any[]) => manager.rollback(id, currentData),
      };
    },
  };
};

/**
 * Helper function to create optimistic lead operations
 */
export const createLeadOptimisticOps = () => {
  const manager = new OptimisticManager<any[]>();

  return {
    updateNote: (leads: any[], leadId: string, newNote: string) => {
      const id = `update-note-${leadId}`;
      const originalLead = leads.find((l) => l.lead_id === leadId);

      return {
        id,
        data: manager.apply(
          id,
          leads,
          // Transform: update note
          (data) =>
            data.map((l) =>
              l.lead_id === leadId ? { ...l, notes: newNote } : l
            ),
          // Rollback: restore original note
          (data) =>
            data.map((l) =>
              l.lead_id === leadId && originalLead
                ? { ...l, notes: originalLead.notes }
                : l
            )
        ),
        confirm: () => manager.confirm(id),
        rollback: (currentData: any[]) => manager.rollback(id, currentData),
      };
    },

    changeStage: (leads: any[], leadId: string, newStage: string) => {
      const id = `change-stage-${leadId}`;
      const originalLead = leads.find((l) => l.lead_id === leadId);

      return {
        id,
        data: manager.apply(
          id,
          leads,
          // Transform: update stage
          (data) =>
            data.map((l) =>
              l.lead_id === leadId ? { ...l, stage: newStage } : l
            ),
          // Rollback: restore original stage
          (data) =>
            data.map((l) =>
              l.lead_id === leadId && originalLead
                ? { ...l, stage: originalLead.stage }
                : l
            )
        ),
        confirm: () => manager.confirm(id),
        rollback: (currentData: any[]) => manager.rollback(id, currentData),
      };
    },

    changePriority: (leads: any[], leadId: string, newPriority: string) => {
      const id = `change-priority-${leadId}`;
      const originalLead = leads.find((l) => l.lead_id === leadId);

      return {
        id,
        data: manager.apply(
          id,
          leads,
          // Transform: update priority
          (data) =>
            data.map((l) =>
              l.lead_id === leadId ? { ...l, priority: newPriority } : l
            ),
          // Rollback: restore original priority
          (data) =>
            data.map((l) =>
              l.lead_id === leadId && originalLead
                ? { ...l, priority: originalLead.priority }
                : l
            )
        ),
        confirm: () => manager.confirm(id),
        rollback: (currentData: any[]) => manager.rollback(id, currentData),
      };
    },
  };
};
