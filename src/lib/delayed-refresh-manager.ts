/**
 * DelayedRefreshManager - Manages scheduled background refreshes
 *
 * Features:
 * - Schedule delayed webhook calls (e.g., 1 minute after task operations)
 * - Debouncing to prevent duplicate timers
 * - Cancellation when user navigates away
 * - Tracks multiple refresh types independently
 */

type RefreshType = 'tasks' | 'dashboard' | 'lead_details';
type RefreshCallback = () => void | Promise<void>;

interface ScheduledRefresh {
  id: string;
  type: RefreshType;
  callback: RefreshCallback;
  timeoutId: NodeJS.Timeout;
  scheduledAt: number;
  executeAt: number;
}

export class DelayedRefreshManager {
  private scheduledRefreshes: Map<string, ScheduledRefresh> = new Map();

  /**
   * Schedule a delayed refresh
   * @param type - Type of refresh (tasks, dashboard, lead_details)
   * @param callback - Function to call when timer expires
   * @param delay - Delay in milliseconds (default 60000 = 1 minute)
   * @param debounce - If true, cancel existing refresh of same type (default true)
   * @returns Refresh ID
   */
  schedule(
    type: RefreshType,
    callback: RefreshCallback,
    delay: number = 60000,
    debounce: boolean = true
  ): string {
    const id = `${type}-${Date.now()}`;

    // Cancel existing refresh of same type if debouncing
    if (debounce) {
      this.cancelByType(type);
    }

    // Schedule the refresh
    const timeoutId = setTimeout(async () => {
      try {
        await callback();
        this.scheduledRefreshes.delete(id);
      } catch (error) {
        console.error(`Delayed refresh failed for ${type}:`, error);
        this.scheduledRefreshes.delete(id);
      }
    }, delay);

    const refresh: ScheduledRefresh = {
      id,
      type,
      callback,
      timeoutId,
      scheduledAt: Date.now(),
      executeAt: Date.now() + delay,
    };

    this.scheduledRefreshes.set(id, refresh);

    return id;
  }

  /**
   * Schedule tasks refresh (20 second delay by default)
   */
  scheduleTasksRefresh(callback: RefreshCallback): string {
    return this.schedule('tasks', callback, 20000, true);
  }

  /**
   * Schedule dashboard refresh (immediate by default)
   */
  scheduleDashboardRefresh(callback: RefreshCallback, delay: number = 0): string {
    return this.schedule('dashboard', callback, delay, true);
  }

  /**
   * Schedule lead details refresh
   */
  scheduleLeadDetailsRefresh(callback: RefreshCallback, delay: number = 0): string {
    return this.schedule('lead_details', callback, delay, false);
  }

  /**
   * Cancel a specific refresh by ID
   */
  cancel(id: string): boolean {
    const refresh = this.scheduledRefreshes.get(id);
    if (!refresh) return false;

    clearTimeout(refresh.timeoutId);
    this.scheduledRefreshes.delete(id);
    return true;
  }

  /**
   * Cancel all refreshes of a specific type
   */
  cancelByType(type: RefreshType): number {
    let cancelledCount = 0;

    this.scheduledRefreshes.forEach((refresh, id) => {
      if (refresh.type === type) {
        clearTimeout(refresh.timeoutId);
        this.scheduledRefreshes.delete(id);
        cancelledCount++;
      }
    });

    return cancelledCount;
  }

  /**
   * Cancel all pending refreshes
   */
  cancelAll(): void {
    this.scheduledRefreshes.forEach((refresh) => {
      clearTimeout(refresh.timeoutId);
    });
    this.scheduledRefreshes.clear();
  }

  /**
   * Get all pending refreshes
   */
  getPending(): ScheduledRefresh[] {
    return Array.from(this.scheduledRefreshes.values());
  }

  /**
   * Get pending refreshes by type
   */
  getPendingByType(type: RefreshType): ScheduledRefresh[] {
    return this.getPending().filter((refresh) => refresh.type === type);
  }

  /**
   * Check if a refresh of this type is pending
   */
  isPending(type: RefreshType): boolean {
    return this.getPendingByType(type).length > 0;
  }

  /**
   * Get time remaining for a refresh
   */
  getTimeRemaining(id: string): number | null {
    const refresh = this.scheduledRefreshes.get(id);
    if (!refresh) return null;

    const remaining = refresh.executeAt - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Get count of pending refreshes
   */
  get pendingCount(): number {
    return this.scheduledRefreshes.size;
  }
}

// Global singleton instance
export const delayedRefreshManager = new DelayedRefreshManager();
