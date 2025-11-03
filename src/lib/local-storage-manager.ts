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
   */
  getAppData(): AppData {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_APP_DATA;
    }

    try {
      const stored = localStorage.getItem(APP_DATA_KEY);
      if (!stored) return DEFAULT_APP_DATA;

      const data: AppData = JSON.parse(stored);

      // Check if data is expired
      if (this.isExpired(data)) {
        this.clearAppData();
        return DEFAULT_APP_DATA;
      }

      // Check version compatibility
      if (data.version !== DATA_VERSION) {
        console.warn('Data version mismatch. Clearing old data.');
        this.clearAppData();
        return DEFAULT_APP_DATA;
      }

      return data;
    } catch (error) {
      console.error('Failed to get app data:', error);
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
      tasks: response.data.tasks || [],
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
   * Update specific lead details
   */
  updateLeadDetails(leadId: string, details: LeadDetail): void {
    const data = this.getAppData();
    const newLeadDetails = { ...data.leadDetails, [leadId]: details };
    this.setAppData({ leadDetails: newLeadDetails });
  }

  /**
   * Get notes for a lead
   */
  getNotes(leadId: string): Note[] {
    const data = this.getAppData();
    return data.notes[leadId] || [];
  }

  /**
   * Update notes for a lead
   */
  updateNotes(leadId: string, notes: Note[]): void {
    const data = this.getAppData();
    const newNotes = { ...data.notes, [leadId]: notes };
    this.setAppData({ notes: newNotes });
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

    // Remove from leadDetails
    const leadDetails = { ...data.leadDetails };
    delete leadDetails[leadId];

    // Remove from notes
    const notes = { ...data.notes };
    delete notes[leadId];

    // Remove from communication history
    const communicationHistory = { ...data.communicationHistory };
    delete communicationHistory[leadId];

    // Remove tasks/follow-ups associated with this lead
    const tasks = data.tasks.filter(task => task.leadId !== leadId);

    this.setAppData({ leads, leadDetails, notes, communicationHistory, tasks });
  }

  /**
   * Update a single lead in the leads array
   */
  updateSingleLead(leadId: string, updates: Partial<Lead>): void {
    const data = this.getAppData();
    const leads = data.leads.map(lead =>
      lead.lead_id === leadId ? { ...lead, ...updates } : lead
    );
    this.setAppData({ leads });
  }

  /**
   * Add a new lead (with deduplication)
   */
  addLead(lead: Lead): void {
    const data = this.getAppData();

    // Check if lead already exists to prevent duplicates
    const leadExists = data.leads.some(l => l.lead_id === lead.lead_id);

    // Only add if it doesn't already exist
    const leads = leadExists ? data.leads : [lead, ...data.leads];
    this.setAppData({ leads });
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
