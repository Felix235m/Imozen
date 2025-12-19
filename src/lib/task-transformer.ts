/**
 * Task Data Transformer
 *
 * Normalizes task data from backend API to frontend TaskItem structure.
 * Handles field name variations and type normalization.
 */

import type { TaskGroup, TaskItem } from '@/types/app-data';
import { generateFallbackTaskId } from '@/lib/id-generator';
import { logValidationError, logIdGeneration, logApiOperation } from '@/lib/task-logger';

/**
 * Normalize backend task type to frontend task type
 * Maps various backend type values to standard frontend types
 */
export function normalizeTaskType(backendType: any): TaskItem['type'] {
  if (!backendType) {
    return 'briefcase'; // Default type
  }

  const typeStr = String(backendType).toLowerCase().trim();

  // Map backend types to frontend types
  const typeMap: Record<string, TaskItem['type']> = {
    // WhatsApp variations
    'whatsapp': 'whatsapp',
    'whatsapp_followup': 'whatsapp',
    'whatsapp_follow_up': 'whatsapp',
    'wa': 'whatsapp',

    // Email variations
    'email': 'email',
    'email_followup': 'email',
    'email_follow_up': 'email',
    'mail': 'email',

    // Phone variations
    'phone': 'phone',
    'phone_call': 'phone',
    'call': 'phone',
    'telephone': 'phone',

    // Calendar variations
    'calendar': 'calendar',
    'appointment': 'calendar',
    'meeting': 'calendar',
    'schedule': 'calendar',

    // Home visit variations
    'home': 'home',
    'visit': 'home',
    'viewing': 'home',
    'property_viewing': 'home',

    // Generic task variations
    'task': 'briefcase',
    'follow_up': 'whatsapp', // Default follow-ups to whatsapp
    'followup': 'whatsapp',
    'briefcase': 'briefcase',
  };

  const normalized = typeMap[typeStr];

  if (!normalized) {
    console.warn(`⚠️ Unknown task type "${backendType}", defaulting to briefcase`);
    return 'briefcase';
  }

  console.log(`🔄 Normalized task type: "${backendType}" → "${normalized}"`);
  return normalized;
}

/**
 * Transform a single backend task to frontend TaskItem
 */
export function transformBackendTask(backendTask: any): TaskItem {
  // Normalize task type
  const taskType = normalizeTaskType(
    backendTask.task_type ||
    backendTask.type ||
    backendTask.taskType ||
    'briefcase'
  );

  // Extract follow-up message from various field names
  const followUpMessage =
    backendTask.followup_message ||
    backendTask.follow_up_message ||
    backendTask.followUpMessage ||
    backendTask.ai_message ||
    backendTask['AI-Generated Message'] ||
    backendTask.message ||
    '';

  // Extract lead type
  const leadType = backendTask.lead_type || backendTask.leadType;

  // Extract contact info
  const leadContact = {
    email: backendTask.email || backendTask.contact?.email || backendTask.leadContact?.email || '',
    phone: backendTask.phone || backendTask.contact?.phone || backendTask.leadContact?.phone || '',
  };

  // Extract property requirements
  let propertyRequirements: any = backendTask.property || backendTask.propertyRequirements;

  // If property requirements is a string, keep it as is
  if (typeof propertyRequirements === 'string') {
    // Keep as string
  } else if (propertyRequirements && typeof propertyRequirements === 'object') {
    // Normalize object structure
    propertyRequirements = {
      locations: propertyRequirements.locations || propertyRequirements.location_preference || [],
      types: propertyRequirements.types || propertyRequirements.property_type ? [propertyRequirements.property_type] : [],
      budget: propertyRequirements.budget || propertyRequirements.budget_formatted || '',
    };
  }

  const transformed: TaskItem = {
    // Use robust ID generation for backend tasks missing IDs
    id: backendTask.id || backendTask.task_id || generateFallbackTaskId(backendTask),
    name: backendTask.name || backendTask.lead_name || '',
    description: backendTask.description || backendTask.note || '',
    type: taskType,
    leadId: backendTask.lead_id || backendTask.leadId || '',
    leadType: leadType as 'Buyer' | 'Seller' | undefined,
    followUpMessage,
    time: backendTask.time || backendTask.scheduled_time || backendTask.due_date || '',
    leadContact,
    leadStatus: backendTask.lead_stage || backendTask.stage || backendTask.leadStatus || backendTask.status || '',
    leadPriority: (backendTask.temperature || backendTask.leadPriority || backendTask['Hot/Warm/Cold'] || 'Cold') as 'Hot' | 'Warm' | 'Cold',
    priority: (backendTask.priority || 'Medium') as 'High' | 'Medium' | 'Low',
    status: (backendTask.status || 'Pending') as 'Pending' | 'Completed' | 'Cancelled',
    reminder_date: backendTask.reminder_date || undefined,
    propertyRequirements,
  };

  // Enhanced logging for task transformation
  if (!backendTask.id && !backendTask.task_id) {
    logIdGeneration(transformed.id, transformed.leadId, 'Backend task missing ID');
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('📋 Transformed task:', {
      original_type: backendTask.task_type || backendTask.type,
      normalized_type: transformed.type,
      task_id: transformed.id,
      has_message: !!transformed.followUpMessage,
      lead_id: transformed.leadId,
      lead_type: transformed.leadType,
    });
  }

  return transformed;
}

/**
 * Transform backend task group to frontend TaskGroup
 */
export function transformBackendTaskGroup(backendGroup: any): TaskGroup {
  return {
    date: backendGroup.date || new Date().toISOString(),
    items: Array.isArray(backendGroup.items)
      ? backendGroup.items.map(transformBackendTask)
      : [],
  };
}

/**
 * Transform array of backend task groups to frontend TaskGroup[]
 */
export function transformBackendTasks(backendTasks: any[]): TaskGroup[] {
  if (!Array.isArray(backendTasks)) {
    console.warn('⚠️ transformBackendTasks received non-array:', backendTasks);
    return [];
  }

  const transformed = backendTasks.map(transformBackendTaskGroup);

  console.log(`✅ Transformed ${transformed.length} task groups`);

  return transformed;
}

/**
 * Validate TaskItem has all required fields
 */
export function validateTaskItem(task: TaskItem): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!task.id) issues.push('Missing id');
  if (!task.name) issues.push('Missing name');
  if (!task.leadId) issues.push('Missing leadId');
  if (!task.type) issues.push('Missing type');
  if (!['email', 'phone', 'whatsapp', 'calendar', 'home', 'briefcase'].includes(task.type)) {
    issues.push(`Invalid type: "${task.type}"`);
  }

  if (issues.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Task validation issues:', {
      task_id: task.id,
      task_name: task.name,
      issues,
    });
  }

  return { valid: issues.length === 0, issues };
}
