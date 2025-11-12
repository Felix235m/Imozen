/**
 * FailedOperationsManager - Manages failed API operations with retry capability
 *
 * Features:
 * - Stores failed operations in localStorage with 24-hour expiry
 * - Smart retry: auto-retry network errors (3 attempts), manual retry for validation errors
 * - Exponential backoff: 5s, 15s, 45s
 * - Individual notification for each failure
 */

const STORAGE_KEY = 'failed_operations';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_AUTO_RETRIES = 3;
const RETRY_DELAYS = [5000, 15000, 45000]; // 5s, 15s, 45s

export type OperationType =
  | 'schedule_task'
  | 'mark_done'
  | 'reschedule'
  | 'cancel'
  | 'update_note'
  | 'change_stage'
  | 'change_priority';

export type FailureReason = 'network' | 'validation' | 'server' | 'unknown';

export interface FailedOperation {
  id: string;
  operationType: OperationType;
  endpoint: string;
  payload: any;
  originalData?: any; // Data before the operation (for comparison)
  failureReason: FailureReason;
  errorMessage: string;
  timestamp: number;
  retryCount: number;
  lastRetryAt?: number;
  canAutoRetry: boolean;
}

type OperationCallback = (operations: FailedOperation[]) => void;

export class FailedOperationsManager {
  private subscribers: Set<OperationCallback> = new Set();

  /**
   * Store a failed operation
   */
  store(operation: Omit<FailedOperation, 'id' | 'timestamp' | 'retryCount' | 'canAutoRetry'>): FailedOperation {
    const failedOp: FailedOperation = {
      ...operation,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
      canAutoRetry: operation.failureReason === 'network',
    };

    const operations = this.getAll();
    operations.push(failedOp);
    this.save(operations);
    this.notifySubscribers();

    // Auto-retry if it's a network error
    if (failedOp.canAutoRetry) {
      this.scheduleAutoRetry(failedOp);
    }

    return failedOp;
  }

  /**
   * Get all failed operations (auto-cleanup expired ones)
   */
  getAll(): FailedOperation[] {
    console.time('FailedOperationsManager-getAll');
    console.log('🔍 [PERF] FailedOperationsManager: Getting all operations');
    
    // Return empty array on server
    if (typeof window === 'undefined' || !window.localStorage) {
      console.log('🔍 [PERF] FailedOperationsManager: Server-side, returning empty');
      console.timeEnd('FailedOperationsManager-getAll');
      return [];
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        console.log('🔍 [PERF] FailedOperationsManager: No operations in storage');
        console.timeEnd('FailedOperationsManager-getAll');
        return [];
      }

      console.time('FailedOperationsManager-JSONParse');
      const operations: FailedOperation[] = JSON.parse(stored);
      console.timeEnd('FailedOperationsManager-JSONParse');
      console.log(`🔍 [PERF] FailedOperationsManager: Parsed ${operations.length} operations`);
      
      const now = Date.now();

      // Filter out expired operations
      console.time('FailedOperationsManager-FilterExpired');
      const valid = operations.filter(op => now - op.timestamp < EXPIRY_MS);
      console.timeEnd('FailedOperationsManager-FilterExpired');
      console.log(`🔍 [PERF] FailedOperationsManager: Filtered to ${valid.length} valid operations`);

      // Save back if any were removed
      if (valid.length !== operations.length) {
        console.log(`🔍 [PERF] FailedOperationsManager: Removing ${operations.length - valid.length} expired operations`);
        this.save(valid);
      }

      console.timeEnd('FailedOperationsManager-getAll');
      return valid;
    } catch (error) {
      console.error('Failed to retrieve failed operations:', error);
      console.timeEnd('FailedOperationsManager-getAll');
      return [];
    }
  }

  /**
   * Get count of failed operations
   */
  getCount(): number {
    return this.getAll().length;
  }

  /**
   * Remove a failed operation by ID
   */
  remove(id: string): void {
    const operations = this.getAll().filter(op => op.id !== id);
    this.save(operations);
    this.notifySubscribers();
  }

  /**
   * Retry a failed operation
   * @param id - Operation ID
   * @param retryFn - Function to retry the operation
   * @returns Promise resolving to success status
   */
  async retry(id: string, retryFn: (operation: FailedOperation) => Promise<void>): Promise<boolean> {
    const operations = this.getAll();
    const operation = operations.find(op => op.id === id);

    if (!operation) {
      console.warn(`Operation ${id} not found`);
      return false;
    }

    try {
      await retryFn(operation);
      // Success - remove from failed operations
      this.remove(id);
      return true;
    } catch (error: any) {
      // Update retry count and last retry time
      operation.retryCount++;
      operation.lastRetryAt = Date.now();

      // Check if we should stop auto-retrying
      if (operation.retryCount >= MAX_AUTO_RETRIES) {
        operation.canAutoRetry = false;
      }

      this.save(operations);
      this.notifySubscribers();

      // Schedule next auto-retry if applicable
      if (operation.canAutoRetry) {
        this.scheduleAutoRetry(operation);
      }

      return false;
    }
  }

  /**
   * Schedule automatic retry with exponential backoff
   */
  private scheduleAutoRetry(operation: FailedOperation): void {
    if (!operation.canAutoRetry || operation.retryCount >= MAX_AUTO_RETRIES) {
      return;
    }

    const delay = RETRY_DELAYS[operation.retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];

    setTimeout(() => {
      // Check if operation still exists and can be retried
      const current = this.getAll().find(op => op.id === operation.id);
      if (current && current.canAutoRetry) {
        // The actual retry will be handled by the component that subscribed
        // We just update the timestamp to indicate it's time to retry
        current.lastRetryAt = Date.now();
        const operations = this.getAll();
        this.save(operations);
        this.notifySubscribers();
      }
    }, delay);
  }

  /**
   * Subscribe to failed operations changes
   */
  subscribe(callback: OperationCallback): () => void {
    console.time('FailedOperationsManager-Subscribe');
    console.log('🔍 [PERF] FailedOperationsManager: Setting up subscription');
    
    this.subscribers.add(callback);
    // Immediately call with current operations
    const operations = this.getAll();
    console.log(`🔍 [PERF] FailedOperationsManager: Calling callback with ${operations.length} operations`);
    callback(operations);
    
    console.timeEnd('FailedOperationsManager-Subscribe');

    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Clear all failed operations
   */
  clearAll(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.notifySubscribers();
  }

  /**
   * Determine failure reason from error
   */
  static determineFailureReason(error: any): FailureReason {
    if (error.name === 'OfflineError' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return 'network';
    }

    if (error.response?.status === 400 || error.response?.status === 422) {
      return 'validation';
    }

    if (error.response?.status >= 500) {
      return 'server';
    }

    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return 'network';
    }

    return 'unknown';
  }

  private save(operations: FailedOperation[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
    } catch (error) {
      console.error('Failed to save failed operations:', error);
    }
  }

  private notifySubscribers(): void {
    const operations = this.getAll();
    this.subscribers.forEach(callback => callback(operations));
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global singleton instance
export const failedOperationsManager = new FailedOperationsManager();
