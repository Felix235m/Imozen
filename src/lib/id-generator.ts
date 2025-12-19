/**
 * Enhanced ID Generator for Tasks and Other Entities
 *
 * This utility provides robust ID generation that guarantees uniqueness
 * even during rapid operations or when dealing with backend data that may
 * be missing proper IDs.
 */

interface IDGeneratorConfig {
  useHighResTimestamp?: boolean;
  prefix?: string;
  suffix?: string;
}

interface IDCollisionCounter {
  [key: string]: number;
}

// Global collision counter to handle timestamp collisions
const collisionCounters: IDCollisionCounter = {};

/**
 * Generate a unique task ID with multiple fallback strategies
 */
export function generateTaskId(leadId?: string, config?: IDGeneratorConfig): string {
  const {
    useHighResTimestamp = true,
    prefix = 'task',
    suffix = ''
  } = config || {};

  // Strategy 1: High-resolution timestamp for better uniqueness
  const timestamp = useHighResTimestamp
    ? Date.now() + Math.floor(Math.random() * 1000) // Add jitter to prevent exact collisions
    : Date.now();

  // Strategy 2: Random string for additional entropy
  const randomStr = Math.random().toString(36).substring(2, 11);

  // Strategy 3: Lead-specific prefix to group related tasks
  const leadPrefix = leadId ? `lead_${leadId.substring(0, 8)}_` : '';

  // Create base ID
  const baseId = `${prefix}_${leadPrefix}${timestamp}_${randomStr}${suffix ? `_${suffix}` : ''}`;

  // Strategy 4: Collision detection and resolution
  const collisionKey = `${prefix}_${timestamp}`;
  if (collisionCounters[collisionKey]) {
    collisionCounters[collisionKey]++;
    return `${baseId}_${collisionCounters[collisionKey]}`;
  } else {
    collisionCounters[collisionKey] = 1;
  }

  // Strategy 5: Final fallback using crypto if available (browser environment)
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    try {
      const uuidSuffix = window.crypto.randomUUID().substring(0, 8);
      return `${baseId}_${uuidSuffix}`;
    } catch (e) {
      // Fallback to current method if crypto API fails
      console.warn('Crypto API unavailable, using standard ID generation');
    }
  }

  return baseId;
}

/**
 * Generate a robust fallback ID for backend tasks missing IDs
 */
export function generateFallbackTaskId(backendTask: any): string {
  const leadId = backendTask.lead_id || backendTask.leadId || 'unknown';
  const taskType = backendTask.task_type || backendTask.type || 'generic';

  return generateTaskId(leadId, {
    prefix: 'fallback',
    suffix: taskType
  });
}

/**
 * Generate IDs for other entity types (leads, notes, etc.)
 */
export function generateEntityId(
  entityType: 'lead' | 'note' | 'comment' | 'activity',
  relatedId?: string
): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  const relatedSuffix = relatedId ? `_${relatedId.substring(0, 6)}` : '';

  return `${entityType}_${timestamp}_${randomStr}${relatedSuffix}`;
}

/**
 * Validate if an ID follows expected patterns and is likely unique
 */
export function validateTaskId(id: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!id || typeof id !== 'string') {
    issues.push('ID must be a non-empty string');
    return { isValid: false, issues };
  }

  if (id.length < 10) {
    issues.push('ID is too short, may not be unique');
  }

  if (!id.includes('task_') && !id.includes('fallback_')) {
    issues.push('ID does not follow expected task ID pattern');
  }

  // Check for simple timestamp-only patterns that are prone to collisions
  const timestampOnlyPattern = /^task_\d{13}$/;
  if (timestampOnlyPattern.test(id)) {
    issues.push('ID uses timestamp-only pattern, prone to collisions');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Generate a unique key for React components using multiple data points
 */
export function generateReactKey(
  entityType: 'task' | 'lead' | 'note',
  primaryId: string,
  secondaryId?: string,
  tertiaryData?: string
): string {
  const parts = [
    entityType,
    primaryId,
    secondaryId || 'no-secondary',
    tertiaryData || 'no-tertiary'
  ];

  return parts.join('-');
}

/**
 * Clean up old collision counters to prevent memory leaks
 */
export function cleanupCollisionCounters(maxAge: number = 60000): void {
  const now = Date.now();
  const keysToRemove: string[] = [];

  Object.keys(collisionCounters).forEach(key => {
    const [prefix, timestampStr] = key.split('_');
    const timestamp = parseInt(timestampStr);

    if (now - timestamp > maxAge) {
      keysToRemove.push(key);
    }
  });

  keysToRemove.forEach(key => delete collisionCounters[key]);

  if (keysToRemove.length > 0) {
    console.debug(`Cleaned up ${keysToRemove.length} old collision counters`);
  }
}

// Auto-cleanup collision counters every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => cleanupCollisionCounters(), 300000);
}