/**
 * CacheManager - Core caching infrastructure with dynamic staleness
 *
 * Features:
 * - In-memory caching with Map for fast access
 * - Dynamic staleness: 5 min default, 30s after changes
 * - Offline detection before API calls
 * - Cache invalidation on mutations
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

interface CacheOptions {
  /** Override default staleness time in milliseconds */
  staleTime?: number;
  /** Force refetch even if cached */
  forceRefetch?: boolean;
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private lastMutationTime: number = 0;
  private readonly DEFAULT_STALE_TIME = 2 * 60 * 1000; // 2 minutes (reduced from 5)
  private readonly RECENT_CHANGE_STALE_TIME = 10 * 1000; // 10 seconds (reduced from 30)
  private readonly RECENT_CHANGE_WINDOW = 1 * 60 * 1000; // 1 minute (reduced from 2)

  /**
   * Get cached data or fetch from API
   * @param key - Unique cache key
   * @param fetcher - Function that fetches data from API
   * @param options - Cache options
   */
  async getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Check if we should force refetch
    if (options.forceRefetch) {
      const data = await fetcher();
      this.set(key, data);
      return data;
    }

    // Check cache
    const cached = this.cache.get(key);
    if (cached && !this.isStale(cached, options.staleTime)) {
      return cached.data as T;
    }

    // Cache miss or stale - fetch new data
    const data = await fetcher();
    this.set(key, data);
    return data;
  }

  /**
   * Set cache entry
   */
  private set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key,
    });
  }

  /**
   * Check if cache entry is stale
   */
  private isStale(entry: CacheEntry<any>, customStaleTime?: number): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;

    // Use custom stale time if provided
    if (customStaleTime !== undefined) {
      return age > customStaleTime;
    }

    // Dynamic staleness based on recent mutations
    const timeSinceLastMutation = now - this.lastMutationTime;
    const isRecentChange = timeSinceLastMutation < this.RECENT_CHANGE_WINDOW;

    const staleTime = isRecentChange
      ? this.RECENT_CHANGE_STALE_TIME
      : this.DEFAULT_STALE_TIME;

    return age > staleTime;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string'
      ? new RegExp(pattern.replace(/\*/g, '.*'))
      : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Mark that a mutation occurred (triggers shorter stale time)
   */
  recordMutation(): void {
    this.lastMutationTime = Date.now();
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      lastMutationTime: this.lastMutationTime,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global singleton instance
export const cacheManager = new CacheManager();
