/**
 * Performance Logger - Logs navigation performance metrics
 * 
 * This utility helps track and analyze navigation performance
 * to identify bottlenecks and measure improvements.
 */

interface NavigationMetric {
  from: string;
  to: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  cacheHit?: boolean;
  dataFetchTime?: number;
}

export class PerformanceLogger {
  private static instance: PerformanceLogger;
  private metrics: NavigationMetric[] = [];
  private currentNavigation: NavigationMetric | null = null;

  private constructor() {}

  static getInstance(): PerformanceLogger {
    if (!PerformanceLogger.instance) {
      PerformanceLogger.instance = new PerformanceLogger();
    }
    return PerformanceLogger.instance;
  }

  /**
   * Start tracking a navigation
   */
  startNavigation(from: string, to: string): void {
    this.currentNavigation = {
      from,
      to,
      startTime: performance.now(),
    };
  }

  /**
   * End tracking a navigation
   */
  endNavigation(cacheHit?: boolean, dataFetchTime?: number): void {
    if (!this.currentNavigation) return;

    const endTime = performance.now();
    const metric: NavigationMetric = {
      ...this.currentNavigation,
      endTime,
      duration: endTime - this.currentNavigation.startTime,
      cacheHit,
      dataFetchTime,
    };

    this.metrics.push(metric);
    console.log(`🚀 Navigation ${this.currentNavigation.from} → ${this.currentNavigation.to}: ${metric.duration?.toFixed(2)}ms`, metric);
    this.currentNavigation = null;
  }

  /**
   * Get all metrics
   */
  getMetrics(): NavigationMetric[] {
    return [...this.metrics];
  }

  /**
   * Get average navigation time
   */
  getAverageNavigationTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / this.metrics.length;
  }

  /**
   * Get slowest navigation
   */
  getSlowestNavigation(): NavigationMetric | null {
    if (this.metrics.length === 0) return null;
    return this.metrics.reduce((slowest, current) => 
      (current.duration || 0) > (slowest.duration || 0) ? current : slowest
    );
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    if (this.metrics.length === 0) {
      console.log('📊 No navigation metrics recorded');
      return;
    }

    const avgTime = this.getAverageNavigationTime();
    const slowest = this.getSlowestNavigation();
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    const cacheHitRate = (cacheHits / this.metrics.length) * 100;

    console.group('📊 Navigation Performance Summary');
    console.log(`Total navigations: ${this.metrics.length}`);
    console.log(`Average time: ${avgTime.toFixed(2)}ms`);
    console.log(`Slowest: ${slowest?.from} → ${slowest?.to} (${slowest?.duration?.toFixed(2)}ms)`);
    console.log(`Cache hit rate: ${cacheHitRate.toFixed(1)}%`);
    console.groupEnd();
  }
}

// Export singleton instance
export const performanceLogger = PerformanceLogger.getInstance();