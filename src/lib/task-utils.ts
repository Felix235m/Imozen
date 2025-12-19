/**
 * Task Utilities
 * 
 * Utility functions for finding and working with tasks
 */

import type { TaskItem, TaskGroup } from '@/types/app-data';
import { localStorageManager } from './local-storage-manager';

/**
 * Find the current/upcoming task for a specific lead
 * Looks for tasks that are not completed and sorts by date (most recent first)
 */
export function findCurrentTaskForLead(leadId: string): TaskItem | null {
  try {
    const tasks = localStorageManager.getTasks();
    
    // Find all tasks for this lead
    const leadTasks: TaskItem[] = [];
    tasks.forEach(group => {
      const matchingTasks = group.items.filter(task => task.leadId === leadId);
      leadTasks.push(...matchingTasks);
    });

    if (leadTasks.length === 0) {
      console.warn(`⚠️ No tasks found for lead ${leadId}`);
      return null;
    }

    // Sort by date (newest first) and return the first non-completed task
    const sortedTasks = leadTasks.sort((a, b) => {
      const dateA = new Date(a.time || 0).getTime();
      const dateB = new Date(b.time || 0).getTime();
      return dateB - dateA; // Newest first
    });

    // Find first task that's not completed or cancelled
    const currentTask = sortedTasks.find(task => 
      task.status !== 'Completed' && 
      task.status !== 'Cancelled'
    );

    if (currentTask) {
      console.log(`✅ Found current task for lead ${leadId}:`, {
        taskId: currentTask.id,
        taskName: currentTask.name,
        taskType: currentTask.type,
        scheduledTime: currentTask.time
      });
      return currentTask;
    }

    // If no non-completed task found, return the most recent one
    const mostRecentTask = sortedTasks[0];
    console.log(`⚠️ No active task found for lead ${leadId}, returning most recent:`, {
      taskId: mostRecentTask.id,
      taskName: mostRecentTask.name,
      taskType: mostRecentTask.type,
      scheduledTime: mostRecentTask.time
    });
    
    return mostRecentTask;
  } catch (error) {
    console.error('❌ Error finding current task for lead:', error);
    return null;
  }
}

/**
 * Get task_id from lead's management data or find current task
 * First tries to use management.follow_up_task, then falls back to finding current task
 */
export function getTaskIdForLead(lead: any): string | null {
  // First try to get from management.follow_up_task
  if (lead?.management?.follow_up_task) {
    console.log(`📋 Using task_id from management.follow_up_task: ${lead.management.follow_up_task}`);
    return lead.management.follow_up_task;
  }

  // Fallback: find current task from localStorage
  if (lead?.lead_id) {
    const currentTask = findCurrentTaskForLead(lead.lead_id);
    if (currentTask?.id) {
      console.log(`📋 Using task_id from current task: ${currentTask.id}`);
      return currentTask.id;
    }
  }

  console.warn('⚠️ Could not determine task_id for lead');
  return null;
}

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Try using the modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('❌ Failed to copy text to clipboard:', error);
    return false;
  }
}
