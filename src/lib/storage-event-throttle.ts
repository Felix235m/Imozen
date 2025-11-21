/**
 * Utility for throttling storage events to prevent render storms
 */

let storageEventTimeout: NodeJS.Timeout | null = null;
let pendingEventData: StorageEvent | null = null;

/**
 * Throttled storage event dispatcher to prevent render storms
 * Only the most recent event within a 100ms window will be dispatched
 */
export function dispatchThrottledStorageEvent(key: string, newValue: string): void {
  // Store the most recent event data
  pendingEventData = new StorageEvent('storage', {
    key,
    newValue,
  });

  // Clear any existing timeout
  if (storageEventTimeout) {
    clearTimeout(storageEventTimeout);
  }

  // Set a new timeout to dispatch the event
  storageEventTimeout = setTimeout(() => {
    if (pendingEventData) {
      window.dispatchEvent(pendingEventData);
      pendingEventData = null;
      storageEventTimeout = null;
    }
  }, 100); // Throttle to max 1 event per 100ms
}

/**
 * Immediately dispatch a storage event (bypasses throttling)
 * Use sparingly for critical UI updates that need immediate response
 */
export function dispatchImmediateStorageEvent(key: string, newValue: string): void {
  window.dispatchEvent(new StorageEvent('storage', {
    key,
    newValue,
  }));
}

/**
 * Clear any pending throttled storage events
 * Useful for cleanup when components unmount
 */
export function clearPendingStorageEvents(): void {
  if (storageEventTimeout) {
    clearTimeout(storageEventTimeout);
    storageEventTimeout = null;
  }
  pendingEventData = null;
}