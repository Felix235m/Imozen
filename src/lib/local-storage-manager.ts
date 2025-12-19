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
  TaskItem,
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
import { generateTaskId, validateTaskId } from './id-generator';
import { logDuplicateFound, logDuplicateResolution, logValidationError, logTaskCreation, logStorageOperation } from './task-logger';

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
    counts: {
      all: 0,
      new_this_week: 0,
      hot: 0,
      warm: 0,
      cold: 0,
      qualified: 0,
      viewing_scheduled: 0,
      converted: 0,
      leads_for_followup: 0,
    },
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
    console.time('localStorageManager-getAppData');
    console.log('🔍 [PERF] localStorageManager: Getting app data');
    
    if (typeof window === 'undefined' || !window.localStorage) {
      console.log('🔍 [PERF] localStorageManager: Server-side, returning default');
      console.timeEnd('localStorageManager-getAppData');
      return DEFAULT_APP_DATA;
    }

    // PERFORMANCE FIX: Use cache if it's fresh (within 100ms)
    const now = Date.now();
    if (this.cache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      console.log(`🔍 [PERF] localStorageManager: Cache hit (${now - this.cacheTimestamp}ms old)`);
      console.timeEnd('localStorageManager-getAppData');
      return this.cache;
    }

    console.log('🔍 [PERF] localStorageManager: Cache miss, parsing from storage');
    console.time('localStorageManager-JSONParse');
    
    try {
      const stored = localStorage.getItem(APP_DATA_KEY);
      if (!stored) {
        console.log('🔍 [PERF] localStorageManager: No data in storage, returning default');
        this.cache = DEFAULT_APP_DATA;
        this.cacheTimestamp = now;
        console.timeEnd('localStorageManager-JSONParse');
        console.timeEnd('localStorageManager-getAppData');
        return DEFAULT_APP_DATA;
      }

      const data: AppData = JSON.parse(stored);
      console.timeEnd('localStorageManager-JSONParse');
      console.log(`🔍 [PERF] localStorageManager: Parsed ${stored.length} characters`);

      // Check if data is expired
      if (this.isExpired(data)) {
        console.log('🔍 [PERF] localStorageManager: Data expired, clearing');
        this.clearAppData();
        this.cache = DEFAULT_APP_DATA;
        this.cacheTimestamp = now;
        console.timeEnd('localStorageManager-getAppData');
        return DEFAULT_APP_DATA;
      }

      // Check version compatibility
      if (data.version !== DATA_VERSION) {
        console.warn('Data version mismatch. Clearing old data.');
        this.clearAppData();
        this.cache = DEFAULT_APP_DATA;
        this.cacheTimestamp = now;
        console.timeEnd('localStorageManager-getAppData');
        return DEFAULT_APP_DATA;
      }

      // Update cache
      this.cache = data;
      this.cacheTimestamp = now;
      console.log(`🔍 [PERF] localStorageManager: Cached data with ${data.notifications.length} notifications`);
      console.timeEnd('localStorageManager-getAppData');
      return data;
    } catch (error) {
      console.error('Failed to get app data:', error);
      this.cache = DEFAULT_APP_DATA;
      this.cacheTimestamp = now;
      console.timeEnd('localStorageManager-getAppData');
      return DEFAULT_APP_DATA;
    }
  }

  /**
   * Set complete app data
   */
  setAppData(data: Partial<AppData>): void {
    console.log('🔍 DEBUG: setAppData called with:', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : 'none',
      timestamp: Date.now()
    });
    
    if (typeof window === 'undefined' || !window.localStorage) {
      console.log('🔍 DEBUG: setAppData early return - no window.localStorage');
      return;
    }

    try {
      const currentData = this.getAppData();
      console.log('🔍 DEBUG: setAppData - currentData retrieved');
      
      const newData: AppData = {
        ...currentData,
        ...data,
        lastFetch: Date.now(),
        version: DATA_VERSION,
      };

      // Validate task data before storing
      if (newData.tasks && newData.tasks.length > 0) {
        const duplicates = this.checkForDuplicateTaskIds();
        if (duplicates.length > 0) {
          duplicates.forEach(duplicateId => {
            const affectedTasks = this.findTasksById(duplicateId);
            logDuplicateFound(duplicateId, affectedTasks.length, affectedTasks);
          });
          this.resolveTaskIdConflicts(duplicates);
          // Get the updated data after conflict resolution
          const resolvedData = this.getAppData();
          newData.tasks = resolvedData.tasks;
        }
      }

      // Check data size before storing
      const dataSize = JSON.stringify(newData).length;
      console.log('🔍 DEBUG: setAppData - data size:', dataSize, 'bytes');

      console.log('🔍 DEBUG: setAppData - about to call localStorage.setItem');
      localStorage.setItem(APP_DATA_KEY, JSON.stringify(newData));
      console.log('🔍 DEBUG: setAppData - localStorage.setItem completed');

      // Update cache immediately
      this.cache = newData;
      this.cacheTimestamp = Date.now();
      console.log('🔍 DEBUG: setAppData - cache updated');

      console.log('🔍 DEBUG: setAppData - about to notify subscribers');
      this.notifySubscribers(newData);
      console.log('🔍 DEBUG: setAppData - subscribers notified');
    } catch (error) {
      console.error('❌ DEBUG: setAppData failed:', error);

      // If quota exceeded, try clearing old data
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('❌ DEBUG: localStorage quota exceeded. Clearing old data...');
        this.clearAppData();
        // Show user-friendly error instead of generic error
        throw new Error('Storage quota exceeded. Please clear browser data and try again.');
      } else if (error instanceof DOMException && error.name === 'SecurityError') {
        console.error('❌ DEBUG: localStorage security error:', error);
        throw new Error('Storage access denied. Please check browser settings.');
      } else {
        console.error('❌ DEBUG: Unexpected localStorage error:', error);
        throw new Error('Failed to save data. Please refresh the page and try again.');
      }
    }
  }

  /**
   * Initialize app data from agent database response
   */
  initializeFromAgentDatabase(response: AgentDatabaseResponse): void {
    console.log('🟠 Initializing from agent database:', response);
    console.log('🔍 DEBUG: initializeFromAgentDatabase called with:', {
      hasResponse: !!response,
      responseType: typeof response,
      responseKeys: response ? Object.keys(response) : 'none'
    });

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

    console.log('🔍 DEBUG: Processing response.data:', {
      hasTasks: !!(response.data.tasks),
      hasLeads: !!(response.data.leads),
      hasDashboard: !!(response.data.dashboard),
      hasLeadDetails: !!(response.data.leadDetails),
      hasNotes: !!(response.data.notes),
      hasNotifications: !!(response.data.notifications),
      hasCommunicationHistory: !!(response.data.communicationHistory),
      tasksType: typeof response.data.tasks,
      leadsType: typeof response.data.leads
    });

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
    console.log('🔍 DEBUG: About to call this.setAppData');

    this.setAppData(appData);
    console.log('🔍 DEBUG: this.setAppData completed');
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
    console.time('localStorageManager-getNotifications');
    console.log('🔍 [PERF] localStorageManager: Getting notifications');
    const result = this.getAppData().notifications;
    console.timeEnd('localStorageManager-getNotifications');
    console.log(`🔍 [PERF] localStorageManager: Retrieved ${result.length} notifications`);
    return result;
  }

  /**
   * Update notifications
   */
  updateNotifications(notifications: Notification[]): void {
    console.time('localStorageManager-updateNotifications');
    console.log(`🔍 [PERF] localStorageManager: Updating ${notifications.length} notifications`);
    this.setAppData({ notifications });
    console.timeEnd('localStorageManager-updateNotifications');
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
   * Find a task by its ID across all task groups
   */
  private findTaskById(taskId: string): TaskItem | null {
    const data = this.getAppData();

    for (const group of data.tasks) {
      const task = group.items.find(item => item.id === taskId);
      if (task) {
        return task;
      }
    }

    return null;
  }

  /**
   * Find all tasks with a specific ID across all task groups
   */
  private findTasksById(taskId: string): TaskItem[] {
    const data = this.getAppData();
    const foundTasks: TaskItem[] = [];

    for (const group of data.tasks) {
      const tasks = group.items.filter(item => item.id === taskId);
      foundTasks.push(...tasks);
    }

    return foundTasks;
  }

  /**
   * Check for duplicate task IDs across all task groups
   */
  private checkForDuplicateTaskIds(): string[] {
    const data = this.getAppData();
    const seenIds = new Set<string>();
    const duplicates: string[] = [];

    for (const group of data.tasks) {
      for (const task of group.items) {
        if (seenIds.has(task.id)) {
          if (!duplicates.includes(task.id)) {
            duplicates.push(task.id);
          }
        } else {
          seenIds.add(task.id);
        }
      }
    }

    return duplicates;
  }

  /**
   * Resolve task ID conflicts by generating new IDs for duplicates
   */
  private resolveTaskIdConflicts(duplicateIds: string[]): void {
    if (duplicateIds.length === 0) return;

    const data = this.getAppData();

    for (const duplicateId of duplicateIds) {
      let counter = 1;
      data.tasks.forEach(group => {
        group.items.forEach(task => {
          if (task.id === duplicateId) {
            const oldId = task.id;
            task.id = generateTaskId(task.leadId, {
              prefix: 'resolved',
              suffix: String(counter++)
            });

            logDuplicateResolution(oldId, task.id, task.id, task.leadId);
          }
        });
      });
    }

    this.setAppData({ tasks: data.tasks });
  }

  /**
   * Validate and resolve task ID conflicts before adding new tasks
   */
  private validateAndResolveTaskConflicts(task: TaskItem): TaskItem {
    // Check if the task ID is valid
    const validation = validateTaskId(task.id);
    if (!validation.isValid) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Invalid task ID detected, generating new one:', {
          invalid_id: task.id,
          issues: validation.issues,
          task: task
        });
      }

      // Generate a new valid ID
      const validatedTask = {
        ...task,
        id: generateTaskId(task.leadId)
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Generated new valid task ID:', {
          old_id: task.id,
          new_id: validatedTask.id
        });
      }

      return validatedTask;
    }

    // Check for existing task with same ID
    const existingTask = this.findTaskById(task.id);
    if (existingTask) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Duplicate task ID detected, generating new one:', {
          duplicate_id: task.id,
          existing_task: existingTask,
          new_task: task
        });
      }

      // Generate a new unique ID
      const deduplicatedTask = {
        ...task,
        id: generateTaskId(task.leadId)
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Generated new unique task ID:', {
          old_id: task.id,
          new_id: deduplicatedTask.id
        });
      }

      return deduplicatedTask;
    }

    return task;
  }

  /**
   * Add a task to the appropriate task group
   */
  addTaskToGroup(task: TaskItem): void {
    // Validate and resolve any task ID conflicts before adding
    const validatedTask = this.validateAndResolveTaskConflicts(task);

    const data = this.getAppData();
    const taskDate = new Date(validatedTask.time || Date.now());
    const dateKey = taskDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Find existing task group for this date
    const existingGroupIndex = data.tasks.findIndex(group => group.date === dateKey);

    if (existingGroupIndex >= 0) {
      // Add to existing group
      data.tasks[existingGroupIndex].items.push(validatedTask);
    } else {
      // Create new task group
      const newGroup: TaskGroup = {
        date: dateKey,
        items: [validatedTask]
      };
      data.tasks.push(newGroup);
      // Sort tasks by date
      data.tasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // Log successful task creation
    logTaskCreation(validatedTask.id, validatedTask.leadId, {
      taskName: validatedTask.name,
      taskType: validatedTask.type,
      scheduledDate: dateKey
    });

    this.setAppData({ tasks: data.tasks });
  }

  /**
   * Remove a task from its task group by task ID
   */
  removeTaskFromGroup(taskId: string): boolean {
    const data = this.getAppData();
    let taskRemoved = false;

    // Find and remove the task from all groups
    const updatedTasks = data.tasks.map(group => {
      const originalLength = group.items.length;
      const updatedItems = group.items.filter(task => task.id !== taskId);

      if (updatedItems.length !== originalLength) {
        taskRemoved = true;
      }

      return {
        ...group,
        items: updatedItems
      };
    }).filter(group => group.items.length > 0); // Remove empty groups

    if (taskRemoved) {
      this.setAppData({ tasks: updatedTasks });
      return true;
    }

    return false;
  }

  /**
   * Remove a task from a specific task group and date
   */
  removeTaskFromSpecificGroup(taskId: string, date: string): boolean {
    const data = this.getAppData();
    const groupIndex = data.tasks.findIndex(group => group.date === date);

    if (groupIndex >= 0) {
      const group = data.tasks[groupIndex];
      const originalLength = group.items.length;
      const updatedItems = group.items.filter(task => task.id !== taskId);

      if (updatedItems.length !== originalLength) {
        if (updatedItems.length === 0) {
          // Remove the entire group if it's empty
          data.tasks.splice(groupIndex, 1);
          console.log(`🗑️ Removed empty task group for date ${date}`);
        } else {
          // Update the group with remaining items
          data.tasks[groupIndex] = {
            ...group,
            items: updatedItems
          };
          console.log(`📝 Updated task group for date ${date}, removed task ${taskId}`);
        }

        // Update cache immediately and dispatch storage event for real-time UI sync
        this.cache = { ...data, tasks: data.tasks };
        this.cacheTimestamp = Date.now();
        this.notifySubscribers({ ...data, tasks: data.tasks });
        
        // Also persist to localStorage
        localStorage.setItem(APP_DATA_KEY, JSON.stringify({ ...data, tasks: data.tasks }));
        
        console.log(`✅ Task ${taskId} removed from group ${date}, updated tasks count: ${data.tasks.length}`);
        return true;
      }
    }

    console.warn(`⚠️ Task ${taskId} not found in group ${date}`);
    return false;
  }

  /**
   * Remove tasks by lead ID (useful for when leads are deleted)
   */
  removeTasksByLeadId(leadId: string): number {
    const data = this.getAppData();
    let removedCount = 0;

    const updatedTasks = data.tasks.map(group => {
      const originalLength = group.items.length;
      const updatedItems = group.items.filter(task => task.leadId !== leadId);
      const removedFromGroup = originalLength - updatedItems.length;

      removedCount += removedFromGroup;

      return {
        ...group,
        items: updatedItems
      };
    }).filter(group => group.items.length > 0); // Remove empty groups

    if (removedCount > 0) {
      this.setAppData({ tasks: updatedTasks });
    }

    return removedCount;
  }

  /**
   * Move a task from one date group to another with updated task data
   * Used for optimistic reschedule operations
   */
  moveTaskToDateGroup(taskId: string, oldDate: string, newDate: string, updatedTask: Partial<TaskItem>): boolean {
    const data = this.getAppData();
    let taskFound = false;
    let taskToMove: TaskItem | null = null;

    // Find and remove task from old group
    const updatedTasks = data.tasks.map(group => {
      if (group.date === oldDate) {
        const updatedItems = group.items.filter(task => {
          if (task.id === taskId) {
            taskFound = true;
            taskToMove = { ...task, ...updatedTask };
            return false; // Remove from old group
          }
          return true;
        });

        return {
          ...group,
          items: updatedItems
        };
      }
      return group;
    }).filter(group => group.items.length > 0); // Remove empty groups

    if (taskFound && taskToMove) {
      // Add to new group
      const newGroupIndex = updatedTasks.findIndex(g => g.date === newDate);

      if (newGroupIndex >= 0) {
        updatedTasks[newGroupIndex].items.push(taskToMove);
      } else {
        updatedTasks.push({ date: newDate, items: [taskToMove] });
      }

      // Sort by date
      updatedTasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      this.setAppData({ tasks: updatedTasks });
      console.log(`🔄 Task ${taskId} moved from ${oldDate} to ${newDate}`);
      return true;
    }

    console.warn(`⚠️ Task ${taskId} not found in group ${oldDate}`);
    return false;
  }

  /**
   * Update dashboard follow-up count by a delta amount
   * Used for optimistic dashboard updates during reschedule operations
   */
  updateDashboardFollowUpCount(delta: number): boolean {
    try {
      const data = this.getAppData();
      const currentCount = data.dashboard.counts.leads_for_followup || 0;
      const newCount = Math.max(0, currentCount + delta);

      const updatedDashboard = {
        ...data.dashboard,
        counts: {
          ...data.dashboard.counts,
          leads_for_followup: newCount
        }
      };

      this.setAppData({ dashboard: updatedDashboard });
      console.log(`📊 Dashboard follow-up count updated: ${currentCount} → ${newCount} (delta: ${delta})`);
      return true;
    } catch (error) {
      console.error('❌ Failed to update dashboard follow-up count:', error);
      return false;
    }
  }

  /**
   * Add a communication event to lead's communication history
   */
  addCommunicationEvent(leadId: string, event: CommunicationEvent): void {
    const data = this.getAppData();
    const currentHistory = data.communicationHistory[leadId] || [];
    const updatedHistory = [event, ...currentHistory];

    const newHistory = {
      ...data.communicationHistory,
      [leadId]: updatedHistory
    };

    this.setAppData({ communicationHistory: newHistory });
  }

  /**
   * Get communication events for a specific lead
   */
  getCommunicationEvents(leadId: string): CommunicationEvent[] {
    const data = this.getAppData();
    return data.communicationHistory[leadId] || [];
  }

  /**
   * Add a note to lead's notes
   */
  addNote(leadId: string, note: Note): void {
    const data = this.getAppData();
    const leadDetail = data.leadDetails[leadId];
    
    if (leadDetail) {
      const currentNotes = leadDetail.notes || [];
      const updatedNotes = [note, ...currentNotes];
      const updatedLeadDetail = { ...leadDetail, notes: updatedNotes };
      const newLeadDetails = { ...data.leadDetails, [leadId]: updatedLeadDetail };
      
      this.setAppData({ leadDetails: newLeadDetails });
    }
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
