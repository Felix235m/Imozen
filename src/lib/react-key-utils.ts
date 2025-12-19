/**
 * React Key Utilities
 *
 * Provides utilities for generating robust React keys that prevent duplicate key errors
 * and maintain component identity across updates and re-renders.
 */

import type { TaskItem } from '@/types/app-data';

/**
 * Generate a composite React key for tasks using multiple data points
 * This prevents duplicate key errors even if task IDs are duplicated
 */
export function generateTaskReactKey(task: TaskItem): string {
  const parts = [
    'task',
    task.id || 'no-id',
    task.leadId || 'no-lead',
    task.createdAt || task.time || 'no-timestamp',
    task.type || 'no-type'
  ];

  // Filter out empty/undefined parts and join with hyphens
  return parts.filter(Boolean).join('-');
}

/**
 * Generate a React key for any entity with fallback strategies
 */
export function generateEntityReactKey(
  entityType: string,
  primaryId: string,
  secondaryData?: {
    leadId?: string;
    timestamp?: string;
    type?: string;
    [key: string]: any;
  }
): string {
  const baseParts = [entityType, primaryId || 'no-id'];

  // Add secondary data for uniqueness if available
  if (secondaryData) {
    const secondaryParts = [
      secondaryData.leadId || 'no-lead',
      secondaryData.timestamp || 'no-timestamp',
      secondaryData.type || 'no-type'
    ];
    baseParts.push(...secondaryParts);
  }

  return baseParts.join('-');
}

/**
 * Generate a unique key for list items when rendering arrays
 */
export function generateListKey(index: number, item: any, keyPrefix: string = 'item'): string {
  // Try to use item.id first, then fall back to index
  if (item && item.id) {
    return `${keyPrefix}-${item.id}`;
  }

  // If item has other identifying properties, use them
  if (item) {
    const identifiers = [
      item.name,
      item.leadId,
      item.title,
      item.type,
      item.createdAt
    ].filter(Boolean);

    if (identifiers.length > 0) {
      const identifierStr = identifiers.join('_').replace(/\s+/g, '-');
      return `${keyPrefix}-${identifierStr}`;
    }
  }

  // Last resort: use index with prefix
  return `${keyPrefix}-index-${index}`;
}

/**
 * Generate a unique key for nested components to prevent conflicts
 */
export function generateNestedKey(parentKey: string, childKey: string, childIndex?: number): string {
  const parts = [parentKey, childKey];

  if (typeof childIndex === 'number') {
    parts.push(String(childIndex));
  }

  return parts.join('-');
}

/**
 * Create a memoized key generator for performance-critical lists
 */
export function createKeyGenerator(prefix: string) {
  const seenKeys = new Set<string>();
  const keyCounter: { [key: string]: number } = {};

  return (item: any, index?: number): string => {
    let baseKey = '';

    if (item && item.id) {
      baseKey = `${prefix}-${item.id}`;
    } else if (item) {
      // Create a hash-like key from item properties
      const itemStr = JSON.stringify({
        id: item.id,
        name: item.name,
        leadId: item.leadId,
        type: item.type
      });
      baseKey = `${prefix}-${btoa(itemStr).substring(0, 16)}`;
    } else {
      baseKey = `${prefix}-index-${index}`;
    }

    // Handle collisions by adding counter
    if (seenKeys.has(baseKey)) {
      keyCounter[baseKey] = (keyCounter[baseKey] || 1) + 1;
      return `${baseKey}-${keyCounter[baseKey]}`;
    }

    seenKeys.add(baseKey);
    return baseKey;
  };
}

/**
 * Validate if a React key is likely to be unique
 */
export function validateReactKey(key: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!key || typeof key !== 'string') {
    issues.push('Key must be a non-empty string');
    return { isValid: false, issues };
  }

  if (key.length < 3) {
    issues.push('Key is very short, may not be unique');
  }

  if (key === 'null' || key === 'undefined' || key === 'NaN') {
    issues.push('Key contains invalid literal values');
  }

  // Check for simple index-only keys
  const indexOnlyPattern = /^\w+-\d+$/;
  if (indexOnlyPattern.test(key) && !key.includes('id')) {
    issues.push('Key appears to be index-only, may cause issues with list reordering');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Generate keys for grouped items (like task groups with tasks)
 */
export function generateGroupedKeys(
  groupType: string,
  groupId: string,
  items: any[]
): { groupKey: string; itemKeys: string[] } {
  const groupKey = `${groupType}-group-${groupId}`;
  const itemKeys = items.map((item, index) =>
    generateNestedKey(groupKey, generateListKey(index, item, groupType))
  );

  return { groupKey, itemKeys };
}

/**
 * Common key patterns used throughout the application
 */
export const KeyPatterns = {
  TASK: 'task',
  LEAD: 'lead',
  NOTE: 'note',
  COMMENT: 'comment',
  ACTIVITY: 'activity',
  NOTIFICATION: 'notification',
  TASK_GROUP: 'task-group',
  SCHEDULED_DATE: 'scheduled-date'
} as const;

/**
 * Helper functions for common entity types
 */
export const EntityKeys = {
  task: (task: TaskItem) => generateTaskReactKey(task),
  lead: (lead: any) => generateEntityReactKey(KeyPatterns.LEAD, lead.id, {
    leadId: lead.lead_id,
    timestamp: lead.created_at
  }),
  note: (note: any) => generateEntityReactKey(KeyPatterns.NOTE, note.id, {
    leadId: note.leadId,
    timestamp: note.createdAt
  }),
  notification: (notification: any) => generateEntityReactKey(
    KeyPatterns.NOTIFICATION,
    notification.id || `${Date.now()}-${Math.random()}`
  )
} as const;