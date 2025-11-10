/**
 * Cached API - Wrapper layer over existing API functions
 *
 * This module provides cached versions of callLeadApi and callTaskApi
 * that integrate caching, offline detection, and failed operation management
 * WITHOUT modifying the original API functions.
 *
 * Features:
 * - Transparent caching for read operations (get_*)
 * - Cache invalidation for write operations
 * - Offline detection before requests
 * - Failed operation tracking with retry
 * - Original API functions remain unchanged
 */

import { callLeadApi, callTaskApi, callFollowUpApi, callLeadStatusApi } from './auth-api';
import { cacheManager } from './cache-manager';
import { offlineDetector, OfflineError } from './offline-detector';
import { failedOperationsManager, FailedOperationsManager, OperationType } from './failed-operations-manager';
import { localStorageManager } from './local-storage-manager';

type LeadOperation = 'get_dashboard' | 'get_tasks' | 'get_all_leads' | 'edit_lead' | 'delete_lead' | 'upload_lead_image' | 'delete_lead_image' | 'add_new_note' | 'save_note' | 'get_notes';
type TaskOperation = 'reschedule_task' | 'cancel_task' | 'mark_task_done' | 'edit_follow_up_message';
type FollowUpOperation = 'regenerate_follow-up_message';

/**
 * Check if operation is a read operation (can be cached)
 */
function isReadOperation(operation: string): boolean {
  return operation.startsWith('get_');
}

/**
 * Generate cache key for an operation
 */
function generateCacheKey(operation: string, payload: any): string {
  const sortedPayload = JSON.stringify(payload, Object.keys(payload).sort());
  return `${operation}:${sortedPayload}`;
}

/**
 * Map task operation to OperationType
 */
function mapTaskOperationToType(operation: TaskOperation): OperationType {
  const map: Record<TaskOperation, OperationType> = {
    'reschedule_task': 'reschedule',
    'cancel_task': 'cancel',
    'mark_task_done': 'mark_done',
    'edit_follow_up_message': 'update_note',
  };
  return map[operation];
}

/**
 * Cached wrapper for callLeadApi
 *
 * Usage: Replace `callLeadApi` with `cachedCallLeadApi` in your components
 * Example:
 *   const data = await cachedCallLeadApi('get_all_leads', {});
 */
export async function cachedCallLeadApi(
  operation: LeadOperation,
  payload: any = {},
  options?: { forceRefetch?: boolean }
): Promise<any> {
  // Check offline status first
  try {
    offlineDetector.ensureOnline();
  } catch (error) {
    if (error instanceof OfflineError) {
      throw error;
    }
  }

  const cacheKey = generateCacheKey(operation, payload);

  // For read operations, use cache
  if (isReadOperation(operation)) {
    return cacheManager.getCached(
      cacheKey,
      () => callLeadApi(operation, payload),
      options
    );
  }

  // For write operations, invalidate cache and track failures
  try {
    const result = await callLeadApi(operation, payload);

    // Record mutation to trigger shorter cache staleness
    cacheManager.recordMutation();

    // Invalidate related caches
    if (operation === 'edit_lead' || operation === 'delete_lead') {
      cacheManager.invalidatePattern('get_all_leads:*');
      cacheManager.invalidatePattern('get_dashboard:*');
    } else if (operation === 'add_new_note' || operation === 'save_note') {
      cacheManager.invalidatePattern('get_notes:*');
    } else if (operation === 'upload_lead_image' || operation === 'upload_lead_profile_image' || operation === 'delete_lead_image') {
      cacheManager.invalidatePattern('get_all_leads:*');
    }

    return result;
  } catch (error: any) {
    // Store failed operation
    const failureReason = FailedOperationsManager.determineFailureReason(error);
    const operationType = operation === 'edit_lead' ? 'update_note' :
                          operation === 'delete_lead' ? 'cancel' :
                          'update_note' as OperationType;

    failedOperationsManager.store({
      operationType,
      endpoint: 'lead-operations',
      payload: { operation, ...payload },
      failureReason,
      errorMessage: error.message || 'Unknown error',
    });

    throw error;
  }
}

/**
 * Cached wrapper for callTaskApi
 *
 * Usage: Replace `callTaskApi` with `cachedCallTaskApi` in your components
 * Example:
 *   await cachedCallTaskApi('mark_task_done', { task_id: '123', lead_id: '456' });
 */
export async function cachedCallTaskApi(
  operation: TaskOperation,
  payload: any = {},
  options?: { forceRefetch?: boolean }
): Promise<any> {
  // Check offline status first
  try {
    offlineDetector.ensureOnline();
  } catch (error) {
    if (error instanceof OfflineError) {
      throw error;
    }
  }

  const cacheKey = generateCacheKey(operation, payload);

  // Task operations are typically write operations, but we still cache the results temporarily
  try {
    const result = await callTaskApi(operation, payload);

    // Record mutation
    cacheManager.recordMutation();

    // Invalidate related caches
    cacheManager.invalidatePattern('get_tasks:*');
    cacheManager.invalidatePattern('get_dashboard:*');

    return result;
  } catch (error: any) {
    // Store failed operation
    const failureReason = FailedOperationsManager.determineFailureReason(error);
    const operationType = mapTaskOperationToType(operation);

    failedOperationsManager.store({
      operationType,
      endpoint: 'task-operation',
      payload: { operation, ...payload },
      failureReason,
      errorMessage: error.message || 'Unknown error',
    });

    throw error;
  }
}

/**
 * Cached wrapper for callFollowUpApi
 */
export async function cachedCallFollowUpApi(
  operation: FollowUpOperation,
  payload: any = {}
): Promise<any> {
  // Check offline status first
  try {
    offlineDetector.ensureOnline();
  } catch (error) {
    if (error instanceof OfflineError) {
      throw error;
    }
  }

  try {
    const result = await callFollowUpApi(operation, payload);

    // Record mutation
    cacheManager.recordMutation();

    // Invalidate related caches
    cacheManager.invalidatePattern('get_tasks:*');

    return result;
  } catch (error: any) {
    // Store failed operation
    const failureReason = FailedOperationsManager.determineFailureReason(error);

    failedOperationsManager.store({
      operationType: 'update_note',
      endpoint: 'follow-up_message',
      payload: { operation, ...payload },
      failureReason,
      errorMessage: error.message || 'Unknown error',
    });

    throw error;
  }
}

/**
 * Cached wrapper for callLeadStatusApi
 */
export async function cachedCallLeadStatusApi(
  leadId: string,
  status: 'active' | 'inactive' | 'change_priority',
  detailsOrFullPayload?: any
): Promise<any> {
  // Check offline status first
  try {
    offlineDetector.ensureOnline();
  } catch (error) {
    if (error instanceof OfflineError) {
      throw error;
    }
  }

  try {
    const result = await callLeadStatusApi(leadId, status, detailsOrFullPayload);

    // Record mutation
    cacheManager.recordMutation();

    // Invalidate related caches
    cacheManager.invalidatePattern('get_all_leads:*');
    cacheManager.invalidatePattern('get_dashboard:*');

    return result;
  } catch (error: any) {
    // Store failed operation
    const failureReason = FailedOperationsManager.determineFailureReason(error);
    const operationType = status === 'change_priority' ? 'change_priority' : 'change_stage' as OperationType;

    failedOperationsManager.store({
      operationType,
      endpoint: 'lead-status',
      payload: { lead_id: leadId, status, ...detailsOrFullPayload },
      failureReason,
      errorMessage: error.message || 'Unknown error',
    });

    throw error;
  }
}

/**
 * Helper to manually invalidate cache for specific operations
 * Useful when you know data has changed externally
 */
export function invalidateCache(pattern: string | RegExp) {
  cacheManager.invalidatePattern(pattern);
}

/**
 * Helper to manually clear all caches
 */
export function clearAllCaches() {
  cacheManager.clear();
}

/**
 * Get cache statistics (useful for debugging)
 */
export function getCacheStats() {
  return cacheManager.getStats();
}
