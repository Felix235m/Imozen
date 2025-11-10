/**
 * Navigation Optimizer - Preloads data for instant navigation
 * 
 * This utility preloads data before navigation to ensure instant page transitions
 * It works with the existing localStorage and caching infrastructure
 */

import { localStorageManager } from './local-storage-manager';
import { fetchAgentDatabase } from './auth-api';
import { cachedCallLeadApi } from './cached-api';
import { transformNewBackendResponse } from './lead-transformer';

type NavigationTarget = {
  type: 'lead-detail' | 'leads-list' | 'dashboard';
  params?: { leadId?: string; filter?: string };
};

export class NavigationOptimizer {
  private static instance: NavigationOptimizer;
  private preloadQueue: Map<string, Promise<any>> = new Map();
  private readonly PRELOAD_TIMEOUT = 5000; // Increased to 5 seconds for slower networks
  private isPreloading = false; // Track if preloading is in progress

  private constructor() {}

  static getInstance(): NavigationOptimizer {
    if (!NavigationOptimizer.instance) {
      NavigationOptimizer.instance = new NavigationOptimizer();
    }
    return NavigationOptimizer.instance;
  }

  /**
   * Preload data for a navigation target
   * @param target - Navigation target with type and optional parameters
   * @returns Promise that resolves when preloading is complete
   */
  async preloadData(target: NavigationTarget): Promise<void> {
    const cacheKey = this.getCacheKey(target);
    
    // Skip if already preloading or recently loaded
    if (this.preloadQueue.has(cacheKey) || this.isPreloading) {
      return this.preloadQueue.get(cacheKey);
    }

    this.isPreloading = true;
    const preloadPromise = this.executePreload(target);
    this.preloadQueue.set(cacheKey, preloadPromise);

    // Clean up after timeout
    setTimeout(() => {
      this.preloadQueue.delete(cacheKey);
      this.isPreloading = false;
    }, this.PRELOAD_TIMEOUT);

    return preloadPromise;
  }

  private async executePreload(target: NavigationTarget): Promise<void> {
    try {
      switch (target.type) {
        case 'lead-detail':
          await this.preloadLeadDetail(target.params?.leadId);
          break;
        case 'leads-list':
          await this.preloadLeadsList();
          break;
        case 'dashboard':
          await this.preloadDashboard();
          break;
      }
    } catch (error) {
      console.warn('Preload failed:', error);
      // Don't throw - navigation should continue even if preload fails
    }
  }

  private async preloadLeadDetail(leadId?: string): Promise<void> {
    if (!leadId) return;

    // Check if already in localStorage
    const existingDetails = localStorageManager.getLeadDetails(leadId);
    if (existingDetails) {
      console.log(`📋 Lead ${leadId} already cached, skipping preload`);
      return;
    }

    // Lead details are no longer preloaded via API
    // They come from the main fetchAgentDatabase() call
    console.log(`⚠️ Lead ${leadId} details not found in localStorage - cannot preload via API`);
  }

  private async preloadLeadsList(): Promise<void> {
    // Check if leads are already fresh
    const leads = localStorageManager.getLeads();
    if (leads.length > 0 && !localStorageManager.isStale()) {
      console.log('📋 Leads list already fresh, skipping preload');
      return;
    }

    console.log('🚀 Preloading leads list');
    
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const response = await fetchAgentDatabase(token);
    if (response && response.success) {
      localStorageManager.initializeFromAgentDatabase(response);
      console.log('✅ Preloaded leads list');
    }
  }

  private async preloadDashboard(): Promise<void> {
    // Dashboard data is part of the main agent database
    await this.preloadLeadsList();
  }

  private getCacheKey(target: NavigationTarget): string {
    switch (target.type) {
      case 'lead-detail':
        return `lead-detail:${target.params?.leadId}`;
      case 'leads-list':
        return `leads-list:${target.params?.filter || 'all'}`;
      case 'dashboard':
        return 'dashboard';
      default:
        return 'unknown';
    }
  }

  /**
   * Smart preloading based on user behavior patterns
   * Call this when user hovers over navigation items or shows intent
   */
  smartPreload(currentPath: string): void {
    // Preload likely next destinations based on current path
    // Use setTimeout to avoid blocking the main thread
    setTimeout(() => {
      switch (currentPath) {
        case '/dashboard':
          // User might go to leads next
          this.preloadData({ type: 'leads-list' });
          break;
        case '/leads':
          // User might view lead details
          this.preloadData({ type: 'leads-list' });
          break;
        case '/tasks':
          // User might go to dashboard or leads
          this.preloadData({ type: 'dashboard' });
          this.preloadData({ type: 'leads-list' });
          break;
        // Add more patterns as needed
      }
    }, 100); // Small delay to not block UI
  }

  /**
   * Preload multiple leads (useful for list pages)
   */
  async preloadMultipleLeads(leadIds: string[]): Promise<void> {
    const preloadPromises = leadIds
      .filter(id => !localStorageManager.getLeadDetails(id))
      .slice(0, 5) // Limit to 5 concurrent preloads
      .map(id => this.preloadLeadDetail(id));

    if (preloadPromises.length > 0) {
      console.log(`🚀 Preloading ${preloadPromises.length} leads`);
      await Promise.allSettled(preloadPromises);
    }
  }
}

// Export singleton instance
export const navigationOptimizer = NavigationOptimizer.getInstance();