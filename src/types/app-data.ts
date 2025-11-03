/**
 * TypeScript interfaces for the app's localStorage-based data structure
 */

// Task-related types
export interface TaskItem {
  id: string;
  name: string;
  description: string;
  type: string;
  leadId: string;
  followUpMessage?: string;
  time?: string;
  leadContact?: {
    phone?: string;
    email?: string;
  };
  leadStatus?: string;
  leadPriority?: string;
  propertyRequirements?: any;
}

export interface TaskGroup {
  date: string;
  formattedDate?: string;
  items: TaskItem[];
}

// Lead-related types
export interface Lead {
  lead_id: string;
  name: string;
  temperature: string;
  stage: string;
  lead_stage?: string;
  image_url?: string;
  created_at?: string;
  next_follow_up?: {
    status: string;
    date?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
  };
}

export interface LeadDetail {
  lead_id: string;
  name: string;
  contact: {
    phone: string;
    email?: string;
  };
  image_url?: string;
  temperature: string;
  lead_stage: string;
  Stage?: string;
  property?: {
    locations?: string[];
    types?: string[];
    [key: string]: any;
  };
  management?: {
    agent_notes?: string;
    [key: string]: any;
  };
  communication_history?: CommunicationEvent[];
  notes?: Note[];
  [key: string]: any;
}

// Dashboard types
export interface DashboardStats {
  success: boolean;
  counts: {
    all: number;
    new_this_week: number;
    hot: number;
  };
  conversion_rate: number;
}

// Note types
export interface Note {
  id: string;
  note_id?: string;
  lead_id: string;
  content: string;
  current_note?: string;
  timestamp: number | string;
  created_at?: string;
  updated_at?: string;
}

// Communication history types
export interface CommunicationEvent {
  id: string;
  event_type: string;
  timestamp: number | string;
  title: string;
  description?: string;
  icon?: string;
  icon_color?: string;
  bg_color?: string;
  performed_by?: string | { agent_id: string; agent_name: string };
  metadata?: any;
  related_entities?: {
    lead_id?: string;
    task_id?: string;
    agent_id?: string;
  };
  source?: string;
  version?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  lead_id?: string;
  task_id?: string;
  action_type?: string;
  action_target?: string;
  action_data?: any;
  icon?: string;
  color?: string;
  metadata?: any;
}

// Main app data structure
export interface AppData {
  tasks: TaskGroup[];
  leads: Lead[];
  dashboard: DashboardStats;
  leadDetails: Record<string, LeadDetail>;
  notes: Record<string, Note[]>;
  notifications: Notification[];
  communicationHistory: Record<string, CommunicationEvent[]>;
  lastFetch: number;
  version: string;
}

// Agent database API response
export interface AgentDatabaseResponse {
  success: boolean;
  data: {
    tasks: TaskGroup[];
    leads: Lead[];
    dashboard: DashboardStats;
    leadDetails?: Record<string, LeadDetail>;
    notes?: Record<string, Note[]>;
    notifications?: Notification[];
    communicationHistory?: Record<string, CommunicationEvent[]>;
  };
  timestamp: number;
}

// Optimistic operation context
export interface OptimisticOperation {
  id: string;
  type: 'edit_lead' | 'delete_lead' | 'change_priority' | 'change_stage' | 'task_operation' | 'save_note';
  oldValue: any;
  newValue: any;
  timestamp: number;
  leadId?: string;
  taskId?: string;
}
