/**
 * LocalStorage Data Manager - Central utility for managing app data in localStorage
 *
 * Features:
 * - Single source of truth for all app data
 * - Type-safe read/write operations
 * - Auto-cleanup of expired data
 * - Cross-tab synchronization
 * - Compression for large datasets
 */

import type {
  AppData,
  TaskGroup,
  Lead,
  LeadDetail,
  DashboardStats,
  Note,
  Notification,
  CommunicationEvent,
  AgentDatabaseResponse,
} from '@/types/app-data';
import { validateLeadData } from './lead-normalization';
import { transformBackendTasks } from './task-transformer';

const APP_DATA_KEY = 'app_data';
const DATA_VERSION = '1.0';
const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
const STALE_TIME = 30 * 60 * 1000; // 30 minutes

// Default empty app data
const DEFAULT_APP_DATA: AppData = {
  tasks: [],
  leads: [],
  dashboard: {
    success: false,
    counts: { all: 0, new_this_week: 0, hot: 0 },
    conversion_rate: 0,
  },
  leadDetails: {},
  notes: {},
  notifications: [],
  communicationHistory: {},
  lastFetch: 0,
  version: DATA_VERSION,
};

type StorageChangeCallback = (data: AppData) => void;

export class LocalStorageManager {
  private subscribers: Set<StorageChangeCallback> = new Set();
  private cache: AppData | null = null; // PERFORMANCE: Cache parsed data
  private cacheTimestamp: number = 0;
  private CACHE_TTL = 1000; // Increased to 1 second to reduce repeated parsing

  constructor() {
    // Listen for storage changes from other tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange);
    }
  }

  private handleStorageChange = (event: StorageEvent) => {
    if (event.key === APP_DATA_KEY && event.newValue) {
      try {
        const data: AppData = JSON.parse(event.newValue);
        this.cache = data; // Update cache
        this.cacheTimestamp = Date.now();
        this.notifySubscribers(data);
      } catch (error) {
        console.error('Failed to parse storage change:', error);
      }
    }
  };

  /**
   * Subscribe to app data changes
   */
  subscribe(callback: StorageChangeCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(data: AppData): void {
    this.subscribers.forEach(callback => callback(data));
  }

  /**
   * Get all app data from localStorage
   * PERFORMANCE: Uses cache to avoid repeated JSON.parse calls
   */
  getAppData(): AppData {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_APP_DATA;
    }

    // PERFORMANCE FIX: Use cache if it's fresh (within 100ms)
    const now = Date.now();
    if (this.cache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.cache;
    }

    try {
      const stored = localStorage.getItem(APP_DATA_KEY);
      if (!stored) {
        this.cache = DEFAULT_APP_DATA;
        this.cacheTimestamp = now;
        return DEFAULT_APP_DATA;
      }

      const data: AppData = JSON.parse(stored);

      // Check if data is expired
      if (this.isExpired(data)) {
        this.clearAppData();
        this.cache = DEFAULT_APP_DATA;
        this.cacheTimestamp = now;
        return DEFAULT_APP_DATA;
      }

      // Check version compatibility
      if (data.version !== DATA_VERSION) {
        console.warn('Data version mismatch. Clearing old data.');
        this.clearAppData();
        this.cache = DEFAULT_APP_DATA;
        this.cacheTimestamp = now;
        return DEFAULT_APP_DATA;
      }

      // Update cache
      this.cache = data;
      this.cacheTimestamp = now;
      return data;
    } catch (error) {
      console.error('Failed to get app data:', error);
      this.cache = DEFAULT_APP_DATA;
      this.cacheTimestamp = now;
      return DEFAULT_APP_DATA;
    }
  }

  /**
   * Set complete app data
   */
  setAppData(data: Partial<AppData>): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const currentData = this.getAppData();
      const newData: AppData = {
        ...currentData,
        ...data,
        lastFetch: Date.now(),
        version: DATA_VERSION,
      };

      localStorage.setItem(APP_DATA_KEY, JSON.stringify(newData));

      // Update cache immediately
      this.cache = newData;
      this.cacheTimestamp = Date.now();

      this.notifySubscribers(newData);
    } catch (error) {
      console.error('Failed to set app data:', error);

      // If quota exceeded, try clearing old data
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Clearing old data...');
        this.clearAppData();
      }
    }
  }

  /**
   * Initialize app data from agent database response
   */
  initializeFromAgentDatabase(response: AgentDatabaseResponse): void {
    console.log('🟠 Initializing from agent database:', response);

    // Validate response structure
    if (!response || typeof response !== 'object') {
      console.error('❌ Invalid response structure:', response);
      throw new Error('Invalid response structure from agent database');
    }

    if (!response.success) {
      console.error('❌ Failed to initialize app data: Response indicates failure');
      throw new Error('Failed to fetch agent database');
    }

    if (!response.data) {
      console.error('❌ No data property in response:', response);
      throw new Error('Missing data in agent database response');
    }

    const appData: AppData = {
      tasks: transformBackendTasks(response.data.tasks || []),
      leads: response.data.leads || [],
      dashboard: response.data.dashboard || DEFAULT_APP_DATA.dashboard,
      leadDetails: response.data.leadDetails || {},
      notes: response.data.notes || {},
      notifications: response.data.notifications || [],
      communicationHistory: response.data.communicationHistory || {},
      lastFetch: response.timestamp || Date.now(),
      version: DATA_VERSION,
    };

    console.log('✅ App data initialized:', {
      tasksCount: appData.tasks.length,
      leadsCount: appData.leads.length,
      dashboardCounts: appData.dashboard.counts,
    });

    this.setAppData(appData);
  }

  /**
   * Get tasks
   */
  getTasks(): TaskGroup[] {
    return this.getAppData().tasks;
  }

  /**
   * Update tasks
   */
  updateTasks(tasks: TaskGroup[]): void {
    this.setAppData({ tasks });
  }

  /**
   * Get leads
   */
  getLeads(): Lead[] {
    return this.getAppData().leads;
  }

  /**
   * Update leads
   */
  updateLeads(leads: Lead[]): void {
    this.setAppData({ leads });
  }

  /**
   * Get dashboard stats
   */
  getDashboard(): DashboardStats {
    return this.getAppData().dashboard;
  }

  /**
   * Update dashboard stats
   */
  updateDashboard(dashboard: DashboardStats): void {
    this.setAppData({ dashboard });
  }

  /**
   * Get specific lead details
   */
  getLeadDetails(leadId: string): LeadDetail | null {
    const data = this.getAppData();
    return data.leadDetails[leadId] || null;
  }

  /**
   * Update specific lead details AND sync to leads array
   * CRITICAL: This ensures both storage structures stay in sync
   */
  updateLeadDetails(leadId: string, details: LeadDetail): void {
    const data = this.getAppData();

    // Validate lead detail data
    if (process.env.NODE_ENV === 'development') {
      validateLeadData(details);
    }

    const newLeadDetails = { ...data.leadDetails, [leadId]: details };

    // SYNC: Also update leads array if it exists
    const leads = data.leads.map(lead => {
      if (lead.lead_id === leadId) {
        const updated = {
          ...lead,
          lead_type: details.lead_type,
          temperature: details.temperature,
          stage: details.lead_stage || details.stage,
          lead_stage: details.lead_stage || details.stage,
          name: details.name,
          image_url: details.image_url,
          contact: details.contact,
          property: details.property,
          next_follow_up: details.next_follow_up,
        };
        // Validate synced data
        if (process.env.NODE_ENV === 'development') {
          validateLeadData(updated);
        }
        return updated;
      }
      return lead;
    });

    console.log(`🔄 Synced lead ${leadId} to both leadDetails{} and leads[] with lead_type: ${details.lead_type}`);
    this.setAppData({ leadDetails: newLeadDetails, leads });
  }

  /**
   * Get notes for a lead
   * Notes are now stored in leadDetails[leadId].notes instead of notes[leadId]
   */
  getNotes(leadId: string): Note[] {
    const data = this.getAppData();
    return data.leadDetails[leadId]?.notes || [];
  }

  /**
   * Update notes for a lead
   * Notes are now stored in leadDetails[leadId].notes instead of notes[leadId]
   */
  updateNotes(leadId: string, notes: Note[]): void {
    const data = this.getAppData();
    const leadDetail = data.leadDetails[leadId];
    if (leadDetail) {
      const updatedLeadDetail = { ...leadDetail, notes };
      const newLeadDetails = { ...data.leadDetails, [leadId]: updatedLeadDetail };
      this.setAppData({ leadDetails: newLeadDetails });
    }
  }

  /**
   * Get notifications
   */
  getNotifications(): Notification[] {
    return this.getAppData().notifications;
  }

  /**
   * Update notifications
   */
  updateNotifications(notifications: Notification[]): void {
    this.setAppData({ notifications });
  }

  /**
   * Get communication history for a lead
   */
  getCommunicationHistory(leadId: string): CommunicationEvent[] {
    const data = this.getAppData();
    return data.communicationHistory[leadId] || [];
  }

  /**
   * Update communication history for a lead
   */
  updateCommunicationHistory(leadId: string, history: CommunicationEvent[]): void {
    const data = this.getAppData();
    const newHistory = { ...data.communicationHistory, [leadId]: history };
    this.setAppData({ communicationHistory: newHistory });
  }

  /**
   * Delete a lead from all data structures
   */
  deleteLead(leadId: string): void {
    const data = this.getAppData();

    // Remove from leads array
    const leads = data.leads.filter(lead => lead.lead_id !== leadId);

    // Remove from leadDetails (notes are inside leadDetails, so they're removed automatically)
    const leadDetails = { ...data.leadDetails };
    delete leadDetails[leadId];

    // Remove from communication history
    const communicationHistory = { ...data.communicationHistory };
    delete communicationHistory[leadId];

    // Remove tasks/follow-ups associated with this lead
    const tasks = data.tasks.map(group => ({
      ...group,
      items: group.items.filter(task => task.leadId !== leadId)
    })).filter(group => group.items.length > 0);

    this.setAppData({ leads, leadDetails, communicationHistory, tasks });
  }

  /**
   * Update a single lead in the leads array AND sync to leadDetails
   * CRITICAL: This ensures both storage structures stay in sync
   */
  updateSingleLead(leadId: string, updates: Partial<Lead>): void {
    const data = this.getAppData();

    // Update leads array
    const leads = data.leads.map(lead => {
      if (lead.lead_id === leadId) {
        const updated = { ...lead, ...updates };
        // Validate updated lead data
        if (process.env.NODE_ENV === 'development') {
          validateLeadData(updated);
        }
        return updated;
      }
      return lead;
    });

    // SYNC: Also update leadDetails (create if doesn't exist)
    const leadDetails = { ...data.leadDetails };
    if (leadDetails[leadId]) {
      // Entry exists, update it
      leadDetails[leadId] = {
        ...leadDetails[leadId],
        ...updates,
        // Ensure contact.phone is always a string
        contact: {
          ...leadDetails[leadId]?.contact,
          ...updates.contact,
          phone: updates.contact?.phone || leadDetails[leadId]?.contact?.phone || ''
        }
      };
      console.log(`🔄 Synced lead ${leadId} to both leads[] and leadDetails{} with lead_type: ${updates.lead_type || leadDetails[leadId].lead_type}`);
    } else {
      // CRITICAL FIX: Entry doesn't exist, create it from updated lead
      const fullLead = leads.find(l => l.lead_id === leadId);
      if (fullLead) {
        leadDetails[leadId] = {
          ...fullLead,
          notes: [],
          communication_history: [],
          purchase: {},
          management: {},
        } as any;
        console.log(`✅ Created missing leadDetails entry for ${leadId} with lead_type: ${fullLead.lead_type}`);
      }
    }

    this.setAppData({ leads, leadDetails });
  }

  /**
   * Add a new lead (with deduplication)
   * CRITICAL: Populates BOTH leads[] and leadDetails{} to prevent API refetch
   */
  addLead(lead: Lead): void {
    const data = this.getAppData();

    // Check if lead already exists to prevent duplicates
    const leadExists = data.leads.some(l => l.lead_id === lead.lead_id);

    // Add to leads array if doesn't exist
    const leads = leadExists ? data.leads : [lead, ...data.leads];

    // CRITICAL FIX: Also add to leadDetails{} so details page doesn't need to fetch from API
    const leadDetails = { ...data.leadDetails };
    if (!leadDetails[lead.lead_id]) {
      // Convert Lead to LeadDetail format (they have similar structure)
      leadDetails[lead.lead_id] = {
        ...lead,
        notes: [],
        communication_history: [],
        purchase: {},
        management: {},
      } as any;
      console.log(`✅ Added new lead ${lead.lead_id} to both leads[] and leadDetails{} with lead_type: ${lead.lead_type}`);
    }

    this.setAppData({ leads, leadDetails });
  }

  /**
   * Process complete new lead data in a single atomic transaction
   * More efficient than multiple separate updates
   * CRITICAL: Ensures all data components are stored correctly
   */
  processNewLeadData(
    leadId: string,
    leadData: LeadDetail,
    notes: Note[],
    tasks: TaskGroup[],
    communicationHistory: CommunicationEvent[]
  ): void {
    const currentData = this.getAppData();

    // 1. Update lead in leads array
    const updatedLeads = currentData.leads.map((lead) =>
      lead.lead_id === leadId ? { ...lead, ...leadData } : lead
    );

    // 2. Update leadDetails with lead data AND notes
    const updatedLeadDetails = {
      ...currentData.leadDetails,
      [leadId]: {
        ...leadData,
        notes: notes.length > 0 ? notes : (leadData.notes || []),
      },
    };

    // 3. Merge tasks with existing (grouped by date, no duplicates)
    const mergedTasks = this.mergeTaskGroups(currentData.tasks, tasks);

    // 4. Add communication history
    const updatedHistory = {
      ...currentData.communicationHistory,
      [leadId]: communicationHistory,
    };

    console.log(`🔄 Batch processing new lead ${leadId}:`, {
      lead_type: leadData.lead_type,
      notes: notes.length,
      tasks_groups: tasks.length,
      history_events: communicationHistory.length,
    });

    // Single atomic update - more efficient than 4 separate updates
    this.setAppData({
      leads: updatedLeads,
      leadDetails: updatedLeadDetails,
      tasks: mergedTasks,
      communicationHistory: updatedHistory,
    });

    console.log(`✅ Successfully stored all data for lead ${leadId} with lead_type: ${leadData.lead_type}`);
  }

  /**
   * Helper: Merge task groups by date (prevents duplicates)
   */
  private mergeTaskGroups(existing: TaskGroup[], newGroups: TaskGroup[]): TaskGroup[] {
    const merged = new Map<string, any[]>();

    // Add existing tasks
    existing.forEach((group) => {
      merged.set(group.date, [...group.items]);
    });

    // Add new tasks (avoid duplicates by ID)
    newGroups.forEach((group) => {
      const existingItems = merged.get(group.date) || [];
      const existingIds = new Set(existingItems.map((t: any) => t.id));
      const newItems = group.items.filter((t) => !existingIds.has(t.id));

      if (newItems.length > 0) {
        merged.set(group.date, [...existingItems, ...newItems]);
      }
    });

    // Convert map to array and sort by date
    return Array.from(merged.entries())
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Check if data is stale (older than 30 minutes)
   */
  isStale(): boolean {
    const data = this.getAppData();
    return Date.now() - data.lastFetch > STALE_TIME;
  }

  /**
   * Check if data is expired (older than 24 hours)
   */
  isExpired(data: AppData): boolean {
    return Date.now() - data.lastFetch > EXPIRY_TIME;
  }

  /**
   * Clear all app data
   */
  clearAppData(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    localStorage.removeItem(APP_DATA_KEY);
    this.notifySubscribers(DEFAULT_APP_DATA);
  }

  /**
   * Get data size in localStorage (for debugging)
   */
  getDataSize(): number {
    if (typeof window === 'undefined' || !window.localStorage) return 0;

    const stored = localStorage.getItem(APP_DATA_KEY);
    if (!stored) return 0;

    return new Blob([stored]).size;
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange);
    }
    this.subscribers.clear();
  }
}

// Global singleton instance
export const localStorageManager = new LocalStorageManager();
