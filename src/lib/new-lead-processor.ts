/**
 * New Lead Response Processor
 *
 * Processes the rich response structure from new lead creation,
 * extracting and transforming ALL components:
 * - Lead details
 * - Notes
 * - Tasks/Follow-ups
 * - Communication history
 * - Metadata
 */

import type { LeadDetail, Note, TaskGroup, TaskItem, CommunicationEvent } from '@/types/app-data';
import { transformNewBackendResponse } from './lead-transformer';
import { normalizeTaskType } from './task-transformer';
import { extractLeadType } from './lead-normalization';

export interface ProcessedNewLeadResponse {
  lead: LeadDetail;
  notes: Note[];
  tasks: TaskGroup[];
  communicationHistory: CommunicationEvent[];
  metadata: {
    notesCount: number;
    tasksCount: number;
    historyCount: number;
  };
}

/**
 * Main processor - extracts and transforms ALL components from new lead response
 */
export function processNewLeadResponse(response: any): ProcessedNewLeadResponse {
  // Extract first element if array
  const serverResponse = Array.isArray(response) ? response[0] : response;

  if (!serverResponse?.data?.lead) {
    console.error('Invalid new lead response structure:', response);
    throw new Error('Invalid response structure - missing data.lead');
  }

  const leadData = serverResponse.data.lead;

  console.log('📥 Processing new lead response:', {
    lead_id: leadData.lead_id,
    lead_type: leadData.lead_type,
    has_notes: Array.isArray(leadData.notes),
    has_tasks: Array.isArray(leadData.tasks),
    has_history: Array.isArray(leadData.communication_history),
  });

  // 1. Transform lead data
  const lead = transformNewBackendResponse(leadData) as LeadDetail;

  // Ensure lead_type is set
  if (!lead.lead_type) {
    console.warn('⚠️ lead_type missing after transformation, attempting recovery');
    lead.lead_type = extractLeadType(leadData);
  }

  // 2. Transform notes
  const notes = (leadData.notes || []).map(transformNote);

  // 3. Transform tasks (from flat array to grouped by date)
  const flatTasks = leadData.tasks || [];
  const tasks = transformFlatTasksToGroups(flatTasks);

  // 4. Transform communication history
  const communicationHistory = transformCommunicationHistory(
    leadData.communication_history || []
  );

  // 5. Extract metadata
  const metadata = {
    notesCount: notes.length,
    tasksCount: flatTasks.length,
    historyCount: communicationHistory.length,
  };

  // Validate against server metadata if available
  if (serverResponse.meta?.data_counts) {
    const serverCounts = serverResponse.meta.data_counts;
    if (serverCounts.notes !== metadata.notesCount) {
      console.warn(
        `📊 Notes count mismatch: extracted ${metadata.notesCount}, server reports ${serverCounts.notes}`
      );
    }
    if (serverCounts.tasks !== metadata.tasksCount) {
      console.warn(
        `📊 Tasks count mismatch: extracted ${metadata.tasksCount}, server reports ${serverCounts.tasks}`
      );
    }
    if (serverCounts.communication_history !== metadata.historyCount) {
      console.warn(
        `📊 Communication history count mismatch: extracted ${metadata.historyCount}, server reports ${serverCounts.communication_history}`
      );
    }
  }

  // Validate processed data
  validateProcessedData({ lead, notes, tasks, communicationHistory, metadata });

  console.log(`✅ Successfully processed new lead ${lead.lead_id}:`, {
    lead_type: lead.lead_type,
    notes: metadata.notesCount,
    tasks: metadata.tasksCount,
    history: metadata.historyCount,
  });

  return { lead, notes, tasks, communicationHistory, metadata };
}

/**
 * Transform server note to app Note format
 */
function transformNote(serverNote: any): Note {
  const createdAt = serverNote.created_at || new Date().toISOString();
  const timestamp = createdAt ? new Date(createdAt).getTime() : Date.now();
  const createdAtFormatted = createdAt ? formatDate(createdAt) : '';

  return {
    id: serverNote.id || serverNote.note_id,
    note_id: serverNote.note_id,
    lead_id: serverNote.lead_id,
    content: serverNote.content || '',
    current_note: serverNote.current_note,
    timestamp,
    created_at: createdAt,
    created_at_formatted: createdAtFormatted,
    created_by: serverNote.created_by,
    updated_at: serverNote.updated_at,
  };
}

/**
 * Transform flat tasks array to TaskGroup[] structure (grouped by date)
 */
function transformFlatTasksToGroups(flatTasks: any[]): TaskGroup[] {
  if (!Array.isArray(flatTasks) || flatTasks.length === 0) {
    return [];
  }

  const grouped: Map<string, TaskItem[]> = new Map();

  flatTasks.forEach((task) => {
    try {
      // Parse due_date: "11/24/2025" → ISO "2025-11-24T00:00:00.000Z"
      const isoDate = parseDueDate(task.due_date);

      // Parse due_time: "9:00:00" → "9:00 AM"
      const timeFormatted = formatTaskTime(task.due_time);

      // Transform task to TaskItem
      const taskItem: TaskItem = {
        id: task.id || task.task_id,
        name: task.name || '',
        description: task.description || '',
        type: normalizeTaskType(task.type || 'briefcase'),
        leadId: task.leadId || task.lead_id || '',
        leadType: task.lead_type as 'Buyer' | 'Seller' | undefined,
        followUpMessage: task.followUpMessage || task.follow_up_message || '',
        time: timeFormatted,
        leadContact: task.leadContact || {
          phone: task.phone,
          email: task.email,
        },
        leadStatus: task.leadStatus || task.status || '',
        leadPriority: (task.temperature || task.leadPriority || task['Hot/Warm/Cold'] || 'Cold') as 'Hot' | 'Warm' | 'Cold',
        propertyRequirements: task.propertyRequirements || task.property,
      };

      if (!grouped.has(isoDate)) {
        grouped.set(isoDate, []);
      }
      grouped.get(isoDate)!.push(taskItem);
    } catch (error) {
      console.error('Failed to transform task:', task, error);
    }
  });

  // Convert map to array and sort by date
  return Array.from(grouped.entries())
    .map(([date, items]) => ({
      date,
      items,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Parse due_date from MM/DD/YYYY to ISO date string
 */
function parseDueDate(dueDateStr: string): string {
  try {
    if (!dueDateStr) {
      throw new Error('Empty due_date');
    }

    // Handle MM/DD/YYYY format
    const parts = dueDateStr.split('/');
    if (parts.length !== 3) {
      throw new Error('Invalid date format');
    }

    const month = parseInt(parts[0]) - 1; // 0-indexed
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);

    const date = new Date(year, month, day);

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    // Return ISO date string (date only, no time)
    return date.toISOString().split('T')[0] + 'T00:00:00.000Z';
  } catch (error) {
    console.error('Failed to parse due_date:', dueDateStr, error);
    // Fallback to today
    return new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
  }
}

/**
 * Format time from "HH:mm:ss" to "H:mm AM/PM"
 */
function formatTaskTime(timeStr: string): string {
  try {
    if (!timeStr) return '';

    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr);
    const minutes = minutesStr;

    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    return `${displayHour}:${minutes} ${period}`;
  } catch (error) {
    console.error('Failed to format time:', timeStr, error);
    return timeStr; // Return as-is if parsing fails
  }
}

/**
 * Transform communication history (minimal transformation needed)
 */
function transformCommunicationHistory(history: any[]): CommunicationEvent[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.map((event) => ({
    id: event.id,
    event_type: event.event_type,
    timestamp: event.timestamp,
    title: event.title,
    description: event.description,
    icon: event.icon,
    icon_color: event.icon_color,
    bg_color: event.bg_color,
    performed_by: event.performed_by,
    metadata: event.metadata,
    related_entities: event.related_entities,
    source: event.source,
    version: event.version,
  }));
}

/**
 * Merge new tasks with existing tasks (prevents duplicates, groups by date)
 */
export function mergeTasks(existingGroups: TaskGroup[], newGroups: TaskGroup[]): TaskGroup[] {
  const merged = new Map<string, TaskItem[]>();

  // Add existing tasks
  existingGroups.forEach((group) => {
    merged.set(group.date, [...group.items]);
  });

  // Add new tasks (avoid duplicates by ID)
  newGroups.forEach((group) => {
    const existingItems = merged.get(group.date) || [];
    const existingIds = new Set(existingItems.map((t) => t.id));
    const newItems = group.items.filter((t) => !existingIds.has(t.id));

    if (newItems.length > 0) {
      merged.set(group.date, [...existingItems, ...newItems]);
    }
  });

  // Convert map to array and sort by date
  return Array.from(merged.entries())
    .map(([date, items]) => ({
      date,
      items,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Format ISO date string to readable format
 */
function formatDate(isoDate: string): string {
  try {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Validate processed data integrity
 */
function validateProcessedData(processed: ProcessedNewLeadResponse): void {
  // Validate lead
  if (!processed.lead.lead_id) {
    console.error('❌ Lead missing lead_id');
  }
  if (!processed.lead.lead_type) {
    console.error('❌ Lead missing lead_type - DATA CORRUPTION!');
  }

  // Validate notes have correct lead_id
  processed.notes.forEach((note, idx) => {
    if (!note.lead_id || note.lead_id !== processed.lead.lead_id) {
      console.error(`❌ Note ${idx} has incorrect lead_id:`, note.lead_id);
    }
  });

  // Validate tasks have correct leadId
  processed.tasks.forEach((group) => {
    group.items.forEach((task) => {
      if (!task.leadId || task.leadId !== processed.lead.lead_id) {
        console.error(`❌ Task ${task.id} has incorrect leadId:`, task.leadId);
      }
    });
  });

  // Validate communication history
  processed.communicationHistory.forEach((event) => {
    const eventLeadId = event.related_entities?.lead_id;
    if (eventLeadId && eventLeadId !== processed.lead.lead_id) {
      console.warn(`⚠️ Communication event ${event.id} has mismatched lead_id`);
    }
  });
}
