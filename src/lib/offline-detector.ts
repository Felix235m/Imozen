/**
 * OfflineDetector - Monitors network connectivity and blocks operations when offline
 *
 * Features:
 * - Listens to online/offline browser events
 * - Provides subscription mechanism for components
 * - Throws OfflineError when operations attempted offline
 */

type OfflineCallback = (isOffline: boolean) => void;

export class OfflineError extends Error {
  constructor(message: string = 'You are currently offline. Please check your internet connection.') {
    super(message);
    this.name = 'OfflineError';
  }
}

export class OfflineDetector {
  private subscribers: Set<OfflineCallback> = new Set();
  private _isOffline: boolean = false;

  constructor() {
    // Initialize with current online status (default to true/offline on server)
    this._isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : true;

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleOnline = () => {
    this._isOffline = false;
    this.notifySubscribers();
  };

  private handleOffline = () => {
    this._isOffline = true;
    this.notifySubscribers();
  };

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this._isOffline));
  }

  /**
   * Subscribe to offline status changes
   * @param callback - Function called when offline status changes
   * @returns Unsubscribe function
   */
  subscribe(callback: OfflineCallback): () => void {
    this.subscribers.add(callback);
    // Immediately call with current status
    callback(this._isOffline);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Check if currently offline
   */
  get isOffline(): boolean {
    return this._isOffline;
  }

  /**
   * Check if currently online
   */
  get isOnline(): boolean {
    return !this._isOffline;
  }

  /**
   * Throw error if offline
   * @throws {OfflineError} if offline
   */
  ensureOnline(): void {
    if (this._isOffline) {
      throw new OfflineError();
    }
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.subscribers.clear();
  }
}

// Global singleton instance
export const offlineDetector = new OfflineDetector();
