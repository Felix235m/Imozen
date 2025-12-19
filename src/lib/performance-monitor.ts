/**
 * Performance Monitoring Utilities
 *
 * This module provides utilities for monitoring bundle loading performance
 * and detecting ChunkLoadError instances.
 */

export interface PerformanceMetrics {
  chunkLoadTime: number;
  chunkSize: number;
  loadSuccess: boolean;
  error?: string;
  chunkName?: string;
  timestamp: number;
}

export interface ChunkLoadErrorEvent {
  chunkId: string;
  error: Error;
  retryCount: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];
  private chunkErrors: ChunkLoadErrorEvent[] = [];
  private retryAttempts: Map<string, number> = new Map();

  startMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor resource loading
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes('.js') || entry.name.includes('.chunk')) {
            const chunkName = this.extractChunkName(entry.name);
            this.recordMetric({
              chunkLoadTime: entry.duration,
              chunkSize: this.estimateChunkSize(entry),
              loadSuccess: true,
              chunkName,
              timestamp: Date.now(),
            });
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource', 'measure'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }

    // Monitor navigation timing
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            console.log('Page load time:', entry.duration);

            // Log performance metrics
            const paintEntries = performance.getEntriesByType('paint');
            paintEntries.forEach((paint) => {
              console.log(`${paint.name}: ${paint.startTime}ms`);
            });
          }
        });
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (error) {
      console.warn('Navigation observer not supported:', error);
    }

    // Monitor chunk loading errors
    this.setupChunkErrorMonitoring();
  }

  private setupChunkErrorMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message &&
          event.reason.message.includes('Loading chunk')) {
        this.handleChunkLoadError(event.reason);
      }
    });

    // Monitor script errors
    window.addEventListener('error', (event) => {
      if (event.message && event.message.includes('Loading chunk')) {
        this.handleChunkLoadError(new Error(event.message));
      }
    });
  }

  private extractChunkName(url: string): string {
    const match = url.match(/\/chunks\/(.+?)\.js/);
    return match ? match[1] : url;
  }

  private estimateChunkSize(entry: PerformanceResourceTiming): number {
    // Estimate size from transfer size if available
    return entry.transferSize || 0;
  }

  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // Alert on slow loading chunks
    if (metric.chunkLoadTime > 3000) {
      console.warn('🐌 Slow chunk detected:', {
        chunk: metric.chunkName,
        loadTime: `${metric.chunkLoadTime}ms`,
        size: `${(metric.chunkSize / 1024).toFixed(2)}KB`
      });
    }

    // Alert on large chunks
    if (metric.chunkSize > 500 * 1024) { // 500KB
      console.warn('📦 Large chunk detected:', {
        chunk: metric.chunkName,
        size: `${(metric.chunkSize / 1024).toFixed(2)}KB`
      });
    }

    // Store metrics for analytics
    this.persistMetrics();
  }

  private handleChunkLoadError(error: Error) {
    const chunkId = this.extractChunkIdFromError(error);
    const retryCount = this.retryAttempts.get(chunkId) || 0;

    const errorEvent: ChunkLoadErrorEvent = {
      chunkId,
      error,
      retryCount,
      timestamp: Date.now(),
    };

    this.chunkErrors.push(errorEvent);

    console.error('💥 ChunkLoadError detected:', {
      chunkId,
      retryCount,
      error: error.message,
    });

    // Dispatch event for UI components to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chunkLoadError', {
        detail: errorEvent
      }));
    }

    // Auto-retry logic
    if (retryCount < 3) {
      this.retryAttempts.set(chunkId, retryCount + 1);
      setTimeout(() => {
        window.location.reload();
      }, 2000 * retryCount); // Exponential backoff
    } else {
      console.error('❌ Max retry attempts reached for chunk:', chunkId);
      this.showFallbackUI();
    }
  }

  private extractChunkIdFromError(error: Error): string {
    const message = error.message;
    const match = message.match(/chunk (\d+)/);
    return match ? match[1] : 'unknown';
  }

  private showFallbackUI() {
    if (typeof document === 'undefined') return;

    // Create a simple fallback UI
    const fallback = document.createElement('div');
    fallback.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="text-align: center; padding: 2rem;">
          <h2>⚠️ Loading Issue</h2>
          <p>We're having trouble loading some parts of the application.</p>
          <button onclick="window.location.reload()" style="
            padding: 0.5rem 1rem;
            background: #0070f3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">
            Reload Page
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(fallback);
  }

  private persistMetrics() {
    if (typeof localStorage === 'undefined') return;

    try {
      const recentMetrics = this.metrics.slice(-100); // Keep last 100 metrics
      localStorage.setItem('performance-metrics', JSON.stringify(recentMetrics));
    } catch (error) {
      console.warn('Failed to persist performance metrics:', error);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }

  getChunkErrors(): ChunkLoadErrorEvent[] {
    return this.chunkErrors;
  }

  getAverageChunkLoadTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, metric) => sum + metric.chunkLoadTime, 0);
    return total / this.metrics.length;
  }

  getLoadSuccessRate(): number {
    if (this.metrics.length === 0) return 0;
    const successful = this.metrics.filter(metric => metric.loadSuccess).length;
    return (successful / this.metrics.length) * 100;
  }

  generateReport(): string {
    const avgLoadTime = this.getAverageChunkLoadTime();
    const successRate = this.getLoadSuccessRate();
    const totalChunks = this.metrics.length;
    const totalErrors = this.chunkErrors.length;

    return `
Performance Report
==================
Total chunks analyzed: ${totalChunks}
Average load time: ${avgLoadTime.toFixed(2)}ms
Success rate: ${successRate.toFixed(2)}%
Total errors: ${totalErrors}

Recommendations:
${avgLoadTime > 2000 ? '- Consider lazy loading heavy components' : ''}
${successRate < 95 ? '- Investigate chunk load failures' : ''}
${totalChunks > 50 ? '- Consider implementing more aggressive code splitting' : ''}
    `.trim();
  }

  stopMonitoring() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Generate final report
    console.log(this.generateReport());
  }

  // Reset metrics (useful for testing)
  reset() {
    this.metrics = [];
    this.chunkErrors = [];
    this.retryAttempts.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in development and production
if (typeof window !== 'undefined') {
  // Start monitoring immediately
  performanceMonitor.startMonitoring();

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.stopMonitoring();
  });

  // Expose monitor for debugging
  (window as any).performanceMonitor = performanceMonitor;
}

export default performanceMonitor;