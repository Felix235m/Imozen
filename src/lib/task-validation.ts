/**
 * Task Validation Utilities
 *
 * Provides comprehensive validation for task data and operations
 * to prevent duplicate IDs and maintain data integrity.
 */

import type { TaskItem, TaskGroup } from '@/types/app-data';
import { validateTaskId, generateTaskId } from './id-generator';

export interface TaskValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  fixes: string[];
}

export interface TaskDeduplicationResult {
  duplicatesFound: number;
  duplicatesResolved: number;
  resolvedTasks: { oldId: string; newId: string }[];
}

/**
 * Validate a single task item
 */
export function validateTask(task: TaskItem): TaskValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const fixes: string[] = [];

  // Validate task ID
  const idValidation = validateTaskId(task.id);
  if (!idValidation.isValid) {
    issues.push(`Invalid task ID: ${idValidation.issues.join(', ')}`);
    fixes.push('Generate new valid task ID');
  }

  // Validate required fields
  if (!task.name || task.name.trim().length === 0) {
    issues.push('Task name is required');
    fixes.push('Set default task name');
  }

  if (!task.type) {
    warnings.push('Task type is not specified');
    fixes.push('Set default task type');
  }

  // Validate date fields
  if (task.time && isNaN(Date.parse(task.time))) {
    issues.push('Invalid task time format');
    fixes.push('Set current time as fallback');
  }

  // Validate priority
  const validPriorities = ['High', 'Medium', 'Low'];
  if (task.priority && !validPriorities.includes(task.priority)) {
    warnings.push(`Invalid priority: ${task.priority}`);
    fixes.push('Normalize to valid priority value');
  }

  // Validate status
  const validStatuses = ['Pending', 'Completed', 'Cancelled'];
  if (task.status && !validStatuses.includes(task.status)) {
    warnings.push(`Invalid status: ${task.status}`);
    fixes.push('Normalize to valid status value');
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    fixes
  };
}

/**
 * Validate an entire task group
 */
export function validateTaskGroup(group: TaskGroup): TaskValidationResult {
  const allIssues: string[] = [];
  const allWarnings: string[] = [];
  const allFixes: string[] = [];

  // Validate group date
  if (!group.date || isNaN(Date.parse(group.date))) {
    allIssues.push('Invalid or missing group date');
    allFixes.push('Set current date as fallback');
  }

  // Check for empty task group
  if (!group.items || group.items.length === 0) {
    allWarnings.push('Task group is empty');
    allFixes.push('Consider removing empty task groups');
  }

  // Validate each task in the group
  group.items.forEach((task, index) => {
    const taskValidation = validateTask(task);
    taskValidation.issues.forEach(issue =>
      allIssues.push(`Task ${index + 1}: ${issue}`)
    );
    taskValidation.warnings.forEach(warning =>
      allWarnings.push(`Task ${index + 1}: ${warning}`)
    );
    taskValidation.fixes.forEach(fix =>
      allFixes.push(`Task ${index + 1}: ${fix}`)
    );
  });

  return {
    isValid: allIssues.length === 0,
    issues: allIssues,
    warnings: allWarnings,
    fixes: allFixes
  };
}

/**
 * Check for duplicate task IDs across multiple task groups
 */
export function findDuplicateTaskIds(groups: TaskGroup[]): string[] {
  const seenIds = new Set<string>();
  const duplicates: string[] = [];

  groups.forEach(group => {
    group.items.forEach(task => {
      if (seenIds.has(task.id)) {
        if (!duplicates.includes(task.id)) {
          duplicates.push(task.id);
        }
      } else {
        seenIds.add(task.id);
      }
    });
  });

  return duplicates;
}

/**
 * Deduplicate task IDs in task groups by generating new unique IDs
 */
export function deduplicateTaskIds(groups: TaskGroup[]): TaskDeduplicationResult {
  const duplicateIds = findDuplicateTaskIds(groups);
  let duplicatesResolved = 0;
  const resolvedTasks: { oldId: string; newId: string }[] = [];

  groups.forEach(group => {
    group.items.forEach(task => {
      if (duplicateIds.includes(task.id)) {
        const oldId = task.id;
        task.id = generateTaskId(task.leadId, {
          prefix: 'dedup',
          suffix: String(duplicatesResolved + 1)
        });

        duplicatesResolved++;
        resolvedTasks.push({ oldId, newId: task.id });

        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 Resolved duplicate task ID:', {
            old_id: oldId,
            new_id: task.id,
            lead_id: task.leadId,
            task_name: task.name
          });
        }
      }
    });
  });

  return {
    duplicatesFound: duplicateIds.length,
    duplicatesResolved,
    resolvedTasks
  };
}

/**
 * Validate and fix task data automatically
 */
export function validateAndFixTask(task: TaskItem): { task: TaskItem; result: TaskValidationResult } {
  const validation = validateTask(task);
  let fixedTask = { ...task };

  // Auto-fix issues where possible
  if (!fixedTask.id || !validateTaskId(fixedTask.id).isValid) {
    const oldId = fixedTask.id;
    fixedTask.id = generateTaskId(fixedTask.leadId);

    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Fixed invalid task ID:', { old_id: oldId, new_id: fixedTask.id });
    }
  }

  if (!fixedTask.name || fixedTask.name.trim().length === 0) {
    fixedTask.name = 'Untitled Task';

    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Fixed empty task name:', { task_id: fixedTask.id });
    }
  }

  if (fixedTask.time && isNaN(Date.parse(fixedTask.time))) {
    fixedTask.time = new Date().toISOString();

    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Fixed invalid task time:', {
        task_id: fixedTask.id,
        old_time: task.time,
        new_time: fixedTask.time
      });
    }
  }

  const validPriorities = ['High', 'Medium', 'Low'];
  if (fixedTask.priority && !validPriorities.includes(fixedTask.priority)) {
    const oldPriority = fixedTask.priority;
    fixedTask.priority = 'Medium'; // Default fallback

    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Fixed invalid priority:', {
        task_id: fixedTask.id,
        old_priority: oldPriority,
        new_priority: fixedTask.priority
      });
    }
  }

  const validStatuses = ['Pending', 'Completed', 'Cancelled'];
  if (fixedTask.status && !validStatuses.includes(fixedTask.status)) {
    const oldStatus = fixedTask.status;
    fixedTask.status = 'Pending'; // Default fallback

    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Fixed invalid status:', {
        task_id: fixedTask.id,
        old_status: oldStatus,
        new_status: fixedTask.status
      });
    }
  }

  return { task: fixedTask, result: validation };
}

/**
 * Comprehensive task data health check
 */
export function performTaskHealthCheck(groups: TaskGroup[]): {
  totalTasks: number;
  validTasks: number;
  invalidTasks: number;
  duplicatesFound: number;
  warnings: string[];
  errors: string[];
} {
  let totalTasks = 0;
  let validTasks = 0;
  let invalidTasks = 0;
  const allWarnings: string[] = [];
  const allErrors: string[] = [];

  // Count and validate tasks
  groups.forEach((group, groupIndex) => {
    const groupValidation = validateTaskGroup(group);
    totalTasks += group.items.length;

    groupValidation.issues.forEach(issue => {
      allErrors.push(`Group ${groupIndex + 1}: ${issue}`);
    });

    groupValidation.warnings.forEach(warning => {
      allWarnings.push(`Group ${groupIndex + 1}: ${warning}`);
    });

    group.items.forEach(task => {
      if (validateTask(task).isValid) {
        validTasks++;
      } else {
        invalidTasks++;
      }
    });
  });

  // Check for duplicates
  const duplicates = findDuplicateTaskIds(groups);

  return {
    totalTasks,
    validTasks,
    invalidTasks,
    duplicatesFound: duplicates.length,
    warnings: allWarnings,
    errors: allErrors
  };
}

/**
 * Log task validation results with appropriate severity levels
 */
export function logTaskValidationResults(
  result: TaskValidationResult,
  taskContext?: string
): void {
  const context = taskContext ? ` (${taskContext})` : '';

  if (result.isValid) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Task validation passed${context}`);
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ Task validation failed${context}:`, {
        issues: result.issues,
        warnings: result.warnings,
        suggested_fixes: result.fixes
      });
    }
  }

  // Log warnings even for valid tasks
  if (result.warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(`⚠️ Task validation warnings${context}:`, result.warnings);
  }
}