/**
 * Operation Deduplicator - Prevents duplicate webhook calls to n8n
 *
 * This module provides a robust deduplication system that identifies when the same
 * priority change operation is being attempted and prevents duplicate webhook calls.
 *
 * Features:
 * - In-memory lock management using Map/Set for O(1) operations
 * - 30-second timeout-based lock release
 * - Unique operation ID generation using timestamp + random
 * - Comprehensive error handling and logging
 * - Automatic cleanup of expired locks
 * - Cross-tab synchronization using storage events
 * - TypeScript support with full type definitions
 */

// Lock timeout duration in milliseconds (30 seconds)
const LOCK_TIMEOUT_MS = 30 * 1000;
// Cleanup interval for expired locks (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
// Storage event key for cross-tab synchronization
const STORAGE_EVENT_KEY = 'operation_lock_event';

/**
 * Represents different types of operations that can be deduplicated
 */
export type OperationType =
  | 'change_priority'
  | 'schedule_task'
  | 'mark_done'
  | 'reschedule'
  | 'cancel'
  | 'update_note'
  | 'change_stage'
  | 'create_lead'
  | 'update_lead';

/**
 * Lock status for operations
 */
export type LockStatus = 'locked' | 'available' | 'expired';

/**
 * Configuration for operation deduplication
 */
export interface OperationDeduplicatorConfig {
  /** Custom lock timeout in milliseconds (default: 30 seconds) */
  lockTimeout?: number;
  /** Enable automatic cleanup of expired locks (default: true) */
  enableAutoCleanup?: boolean;
  /** Custom cleanup interval in milliseconds (default: 5 minutes) */
  cleanupInterval?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Represents an active operation lock
 */
export interface OperationLock {
  /** Unique identifier for the operation */
  id: string;
  /** Type of operation */
  type: OperationType;
  /** Lock key that identifies similar operations */
  lockKey: string;
  /** When the lock was acquired */
  acquiredAt: number;
  /** When the lock expires */
  expiresAt: number;
  /** Payload/data associated with the operation */
  payload?: any;
  /** Indicates if lock was created from another tab */
  isShadow?: boolean;
  /** Optional metadata for debugging */
  metadata?: {
    source?: string;
    userId?: string;
    requestId?: string;
    crossTab?: boolean;
    [key: string]: any;
  };
}

/**
 * Result of lock acquisition attempt
 */
export interface LockResult {
  /** Whether the lock was successfully acquired */
  success: boolean;
  /** The operation ID if lock was acquired */
  operationId?: string;
  /** Current lock status */
  status: LockStatus;
  /** Message explaining the result */
  message: string;
  /** Existing operation that has the lock (if locked) */
  existingOperation?: OperationLock;
}

/**
 * Result of lock status check
 */
export interface LockStatusResult {
  /** Current lock status */
  status: LockStatus;
  /** Whether the operation is locked */
  isLocked: boolean;
  /** The operation that holds the lock (if any) */
  operation?: OperationLock;
  /** Time remaining until lock expires (in milliseconds) */
  timeRemaining?: number;
}

/**
 * Statistics about the deduplicator
 */
export interface DeduplicatorStats {
  /** Total number of active locks */
  activeLocks: number;
  /** Total number of expired locks (not yet cleaned up) */
  expiredLocks: number;
  /** Total operations processed */
  totalOperations: number;
  /** Total duplicates prevented */
  duplicatesPrevented: number;
  /** Memory usage estimate */
  memoryUsage: {
    locks: number;
    keySet: number;
  };
}

/**
 * Operation Deduplicator Class
 *
 * Provides methods to prevent duplicate operations by acquiring and managing locks.
 * Uses in-memory storage for optimal performance with O(1) lookup times.
 */
export class OperationDeduplicator {
  private locks = new Map<string, OperationLock>();
  private lockKeys = new Set<string>();
  private config: Required<OperationDeduplicatorConfig>;
  private cleanupTimer?: NodeJS.Timeout;
  private stats: DeduplicatorStats = {
    activeLocks: 0,
    expiredLocks: 0,
    totalOperations: 0,
    duplicatesPrevented: 0,
    memoryUsage: {
      locks: 0,
      keySet: 0
    }
  };

  constructor(config: OperationDeduplicatorConfig = {}) {
    this.config = {
      lockTimeout: config.lockTimeout ?? LOCK_TIMEOUT_MS,
      enableAutoCleanup: config.enableAutoCleanup ?? true,
      cleanupInterval: config.cleanupInterval ?? CLEANUP_INTERVAL_MS,
      debug: config.debug ?? false
    };

    this.debug('OperationDeduplicator initialized', { config: this.config });

    // Start automatic cleanup if enabled
    if (this.config.enableAutoCleanup && typeof window !== 'undefined') {
      this.startAutoCleanup();
      this.setupCrossTabSynchronization();
    }
  }

  /**
   * Generate a unique operation ID
   *
   * @param type - Type of operation
   * @param payload - Optional payload for creating consistent lock keys
   * @returns Unique operation ID
   */
  public generateOperationId(type: OperationType, payload?: any): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${type}_${timestamp}_${random}`;
  }

  /**
   * Generate a lock key that identifies similar operations
   *
   * @param type - Type of operation
   * @param payload - Payload used to create unique lock key
   * @returns Lock key string
   */
  public generateLockKey(type: OperationType, payload?: any): string {
    if (!payload) {
      return `${type}_generic`;
    }

    // For priority changes, use entity ID and priority value
    if (type === 'change_priority' && payload.entityId) {
      return `${type}_${payload.entityId}_${payload.priority || payload.newPriority}`;
    }

    // For task operations, use task ID
    if (payload.taskId || payload.task_id) {
      const taskId = payload.taskId || payload.task_id;
      return `${type}_${taskId}`;
    }

    // For lead operations, use lead ID
    if (payload.leadId || payload.lead_id) {
      const leadId = payload.leadId || payload.lead_id;
      return `${type}_${leadId}`;
    }

    // Generic fallback - create hash from payload
    const payloadStr = JSON.stringify(payload);
    const hash = this.simpleHash(payloadStr);
    return `${type}_${hash}`;
  }

  /**
   * Check if an operation is currently locked
   *
   * @param type - Type of operation
   * @param payload - Payload for generating lock key
   * @returns Lock status information
   */
  public checkOperationLock(type: OperationType, payload?: any): LockStatusResult {
    this.stats.totalOperations++;
    const lockKey = this.generateLockKey(type, payload);

    this.debug('Checking operation lock', { type, lockKey });

    const lock = this.locks.get(lockKey);

    if (!lock) {
      this.debug('No lock found', { lockKey });
      return {
        status: 'available',
        isLocked: false
      };
    }

    const now = Date.now();

    // Check if lock has expired
    if (now > lock.expiresAt) {
      this.debug('Found expired lock', { lockKey, lock });
      return {
        status: 'expired',
        isLocked: false,
        operation: lock,
        timeRemaining: 0
      };
    }

    // Lock is active
    const timeRemaining = lock.expiresAt - now;
    this.debug('Found active lock', { lockKey, lock, timeRemaining });

    return {
      status: 'locked',
      isLocked: true,
      operation: lock,
      timeRemaining
    };
  }

  /**
   * Attempt to acquire a lock for an operation
   *
   * @param type - Type of operation
   * @param payload - Payload for the operation
   * @param metadata - Optional metadata for debugging
   * @returns Lock acquisition result
   */
  public acquireOperationLock(
    type: OperationType,
    payload?: any,
    metadata?: OperationLock['metadata']
  ): LockResult {
    this.stats.totalOperations++;
    const lockKey = this.generateLockKey(type, payload);
    const operationId = this.generateOperationId(type, payload);
    const now = Date.now();

    this.debug('Attempting to acquire lock', { type, lockKey, operationId, metadata });

    // Check if lock already exists
    const existingLock = this.locks.get(lockKey);

    if (existingLock) {
      // Check if existing lock has expired
      if (now > existingLock.expiresAt) {
        this.debug('Removing expired lock and acquiring new one', {
          existingLock: existingLock.id,
          newOperationId: operationId
        });

        // Remove expired lock
        this.releaseLock(lockKey);

        // Acquire new lock
        return this.createLock(lockKey, operationId, type, payload, metadata);
      }

      // Lock is still active
      this.stats.duplicatesPrevented++;
      this.debug('Lock acquisition failed - operation already locked', {
        existingLock: existingLock.id,
        attemptedId: operationId
      });

      return {
        success: false,
        status: 'locked',
        message: `Operation is locked by ${existingLock.id} until ${new Date(existingLock.expiresAt).toISOString()}`,
        existingOperation: existingLock
      };
    }

    // No existing lock - acquire new one
    return this.createLock(lockKey, operationId, type, payload, metadata);
  }

  /**
   * Release a lock by operation ID
   *
   * @param operationId - ID of the operation to release
   * @returns Whether the lock was found and released
   */
  public releaseOperationLock(operationId: string): boolean {
    this.debug('Releasing lock by operation ID', { operationId });

    // Find the lock with this operation ID
    for (const [lockKey, lock] of this.locks.entries()) {
      if (lock.id === operationId) {
        this.releaseLock(lockKey);
        this.debug('Lock released successfully', { operationId, lockKey });
        return true;
      }
    }

    this.debug('Lock not found for release', { operationId });
    return false;
  }

  /**
   * Release a lock by lock key
   *
   * @param lockKey - Lock key to release
   */
  private releaseLock(lockKey: string): void {
    const lock = this.locks.get(lockKey);
    if (lock) {
      // Don't broadcast release for shadow locks (they're managed by other tabs)
      if (!lock.isShadow) {
        this.broadcastLockEvent('release', lockKey, lock.id);
      }

      this.locks.delete(lockKey);
      this.lockKeys.delete(lockKey);
      this.updateStats();
      this.debug('Lock released', { lockKey, operationId: lock.id });
    }
  }

  /**
   * Create a new lock
   */
  private createLock(
    lockKey: string,
    operationId: string,
    type: OperationType,
    payload?: any,
    metadata?: OperationLock['metadata']
  ): LockResult {
    const now = Date.now();
    const lock: OperationLock = {
      id: operationId,
      type,
      lockKey,
      acquiredAt: now,
      expiresAt: now + this.config.lockTimeout,
      payload,
      isShadow: false,
      metadata
    };

    this.locks.set(lockKey, lock);
    this.lockKeys.add(lockKey);
    this.updateStats();

    // Broadcast lock acquisition to other tabs
    this.broadcastLockEvent('acquire', lockKey, operationId);

    this.debug('Lock acquired successfully', {
      operationId,
      lockKey,
      expiresAt: lock.expiresAt
    });

    return {
      success: true,
      operationId,
      status: 'locked',
      message: `Lock acquired until ${new Date(lock.expiresAt).toISOString()}`
    };
  }

  /**
   * Clean up expired locks
   *
   * @returns Number of locks cleaned up
   */
  public cleanupExpiredLocks(): number {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [lockKey, lock] of this.locks.entries()) {
      if (now > lock.expiresAt) {
        expiredKeys.push(lockKey);
      }
    }

    expiredKeys.forEach(key => {
      this.releaseLock(key);
      this.debug('Cleaned up expired lock', { lockKey: key });
    });

    if (expiredKeys.length > 0) {
      this.debug('Cleanup completed', {
        cleanedUp: expiredKeys.length,
        remaining: this.locks.size
      });
    }

    return expiredKeys.length;
  }

  /**
   * Get statistics about the deduplicator
   *
   * @returns Current statistics
   */
  public getStats(): DeduplicatorStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get all active locks
   *
   * @returns Array of active locks
   */
  public getActiveLocks(): OperationLock[] {
    return Array.from(this.locks.values());
  }

  /**
   * Get lock information for a specific operation
   *
   * @param operationId - Operation ID to look up
   * @returns Lock information if found
   */
  public getLockInfo(operationId: string): OperationLock | undefined {
    for (const lock of this.locks.values()) {
      if (lock.id === operationId) {
        return lock;
      }
    }
    return undefined;
  }

  /**
   * Force clear all locks (use with caution)
   */
  public clearAllLocks(): void {
    const count = this.locks.size;
    this.locks.clear();
    this.lockKeys.clear();
    this.updateStats();
    this.debug('All locks cleared', { count });
  }

  /**
   * Destroy the deduplicator and clean up resources
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clearAllLocks();
    this.debug('OperationDeduplicator destroyed');
  }

  /**
   * Start automatic cleanup timer
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredLocks();
    }, this.config.cleanupInterval);

    this.debug('Auto cleanup started', { interval: this.config.cleanupInterval });
  }

  /**
   * Update internal statistics
   */
  private updateStats(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const lock of this.locks.values()) {
      if (now > lock.expiresAt) {
        expiredCount++;
      }
    }

    this.stats = {
      activeLocks: this.locks.size - expiredCount,
      expiredLocks: expiredCount,
      totalOperations: this.stats.totalOperations,
      duplicatesPrevented: this.stats.duplicatesPrevented,
      memoryUsage: {
        locks: this.locks.size,
        keySet: this.lockKeys.size
      }
    };
  }

  /**
   * Simple hash function for creating lock keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Setup cross-tab synchronization using storage events
   */
  private setupCrossTabSynchronization(): void {
    // Listen for storage events from other tabs
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === STORAGE_EVENT_KEY && event.newValue) {
        try {
          const lockEvent = JSON.parse(event.newValue);
          this.handleCrossTabLockEvent(lockEvent);
        } catch (error) {
          this.debug('Error parsing storage event', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    this.debug('Cross-tab synchronization enabled');
  }

  /**
   * Handle lock events from other tabs
   */
  private handleCrossTabLockEvent(event: {
    type: 'acquire' | 'release';
    lockKey: string;
    operationId: string;
    timestamp: number;
  }): void {
    const { type, lockKey, operationId, timestamp } = event;

    // Ignore old events (more than 1 second old)
    if (Date.now() - timestamp > 1000) {
      return;
    }

    if (type === 'acquire') {
      // If this operation doesn't exist locally, create a shadow lock
      if (!this.locks.has(operationId) && !this.lockKeys.has(lockKey)) {
        const shadowLock: OperationLock = {
          operationId,
          lockKey,
          acquiredAt: timestamp,
          expiresAt: timestamp + this.config.lockTimeout,
          isShadow: true, // Mark as shadow lock (from other tab)
          metadata: {
            source: 'cross-tab',
            crossTab: true
          }
        };

        this.locks.set(operationId, shadowLock);
        this.lockKeys.add(lockKey);
        this.stats.activeLocks++;

        this.debug('Shadow lock created from cross-tab event', {
          operationId,
          lockKey
        });
      }
    } else if (type === 'release') {
      // Remove the local shadow lock if it exists
      const lock = this.locks.get(operationId);
      if (lock && lock.isShadow) {
        this.locks.delete(operationId);
        this.lockKeys.delete(lockKey);
        this.stats.activeLocks--;

        this.debug('Shadow lock released from cross-tab event', {
          operationId,
          lockKey
        });
      }
    }
  }

  /**
   * Broadcast lock event to other tabs
   */
  private broadcastLockEvent(
    type: 'acquire' | 'release',
    lockKey: string,
    operationId: string
  ): void {
    if (typeof window === 'undefined') return;

    const event = {
      type,
      lockKey,
      operationId,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(event));
      // Immediately remove to allow repeated events
      setTimeout(() => {
        localStorage.removeItem(STORAGE_EVENT_KEY);
      }, 100);
    } catch (error) {
      this.debug('Failed to broadcast lock event', error);
    }
  }

  /**
   * Debug logging helper
   */
  private debug(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[OperationDeduplicator] ${message}`, data);
    }
  }
}

// Global singleton instance
export const operationDeduplicator = new OperationDeduplicator();

/**
 * Convenience functions for common operations
 */

/**
 * Check if a priority change operation is locked
 */
export function isPriorityChangeLocked(entityId: string, newPriority: any): boolean {
  return operationDeduplicator.checkOperationLock('change_priority', {
    entityId,
    priority: newPriority
  }).isLocked;
}

/**
 * Acquire lock for priority change operation
 */
export function acquirePriorityChangeLock(
  entityId: string,
  newPriority: any,
  metadata?: OperationLock['metadata']
): LockResult {
  return operationDeduplicator.acquireOperationLock('change_priority', {
    entityId,
    priority: newPriority
  }, metadata);
}

/**
 * Release lock for priority change operation
 */
export function releasePriorityChangeLock(operationId: string): boolean {
  return operationDeduplicator.releaseOperationLock(operationId);
}

/**
 * Check if a task operation is locked
 */
export function isTaskOperationLocked(taskId: string, operationType: 'schedule' | 'done' | 'reschedule' | 'cancel'): boolean {
  return operationDeduplicator.checkOperationLock(`mark_${operationType}`, {
    taskId
  }).isLocked;
}

/**
 * Acquire lock for task operation
 */
export function acquireTaskOperationLock(
  taskId: string,
  operationType: 'schedule' | 'done' | 'reschedule' | 'cancel',
  metadata?: OperationLock['metadata']
): LockResult {
  const typeMap = {
    schedule: 'schedule_task',
    done: 'mark_done',
    reschedule: 'reschedule',
    cancel: 'cancel'
  };

  return operationDeduplicator.acquireOperationLock(typeMap[operationType], {
    taskId
  }, metadata);
}