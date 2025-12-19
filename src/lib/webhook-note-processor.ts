/**
 * Centralized utility for processing webhook note responses across all operations
 * Handles cancel, reschedule, and mark_done operations consistently
 */

import { localStorageManager } from '@/lib/local-storage-manager';
import { processNotesFromWebResponse, mergeNotes } from '@/lib/note-transformer';
import { dispatchThrottledStorageEvent, dispatchImmediateStorageEvent } from '@/lib/storage-event-throttle';

export interface WebhookNoteProcessorOptions {
  leadId: string;
  operationType?: 'cancel_task' | 'reschedule_task' | 'mark_done' | 'add_note';
  responseData: any;
  operationContext?: {
    taskId?: string;
    note?: string;
    nextFollowUpDate?: Date;
    agentName?: string;
  };
}

export interface WebhookNoteProcessorResult {
  success: boolean;
  notesProcessed: number;
  errors: string[];
  uiUpdateRequired: boolean;
}

/**
 * Process notes from webhook response with centralized logic
 */
export async function processWebhookNotes(
  options: WebhookNoteProcessorOptions
): Promise<WebhookNoteProcessorResult> {
  const { leadId, operationType, responseData, operationContext } = options;
  const result: WebhookNoteProcessorResult = {
    success: false,
    notesProcessed: 0,
    errors: [],
    uiUpdateRequired: false
  };

  try {
    const opType = operationType || 'UNKNOWN';
    console.log(`📝 [${opType.toUpperCase()}] Processing webhook notes for lead ${leadId}`);

    // Check if response contains notes data
    if (!responseData.current_note && (!responseData.notes || responseData.notes.length === 0)) {
      console.log(`📝 [${opType.toUpperCase()}] No notes data in response, skipping processing`);
      result.success = true;
      return result;
    }

    // Skip note processing for task operations (notes will be saved within task details)
    if (options.operationType && ['cancel_task', 'reschedule_task', 'mark_done'].includes(options.operationType)) {
      console.log(`📝 [${options.operationType.toUpperCase()}] Skipping note processing for task operation`);
      result.success = true;
      return result;
    }

    // Get existing notes for comparison
    const existingNotes = localStorageManager.getNotes(leadId) || [];

    // Process notes using existing transformer
    const { notes: processedNotes, processedCount, errors } = processNotesFromWebResponse(
      responseData,
      leadId
    );

    if (errors.length > 0) {
      result.errors.push(...errors);
      console.warn(`⚠️ [${opType.toUpperCase()}] Notes processing warnings:`, errors);
    }

    if (processedNotes.length > 0) {
      // Merge with existing notes (deduplication handled by mergeNotes)
      const mergedNotes = mergeNotes(processedNotes, existingNotes);

      // Update localStorage
      localStorageManager.updateNotes(leadId, mergedNotes);

      result.notesProcessed = processedCount;
      result.uiUpdateRequired = true;

      console.log(`✅ [${opType.toUpperCase()}] Successfully processed ${processedCount} notes for lead ${leadId}`);
    }

    result.success = true;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Processing error: ${errorMessage}`);
    console.error(`❌ [${opType.toUpperCase()}] Error processing webhook notes:`, error);
  }

  return result;
}

/**
 * Trigger UI updates after successful note processing
 */
export function triggerNoteProcessingUIUpdates(
  leadId: string,
  operationType: string,
  result: WebhookNoteProcessorResult
): void {
  if (!result.success || !result.uiUpdateRequired) {
    return;
  }

  console.log(`🔄 [${operationType.toUpperCase()}] Triggering UI updates for lead ${leadId}`);

  // Dispatch storage event for cross-tab synchronization
  dispatchThrottledStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));

  // Force immediate update for current tab
  dispatchImmediateStorageEvent('app_data', JSON.stringify(localStorageManager.getAppData()));
}

/**
 * Complete webhook note processing workflow
 */
export async function handleWebhookNoteProcessing(
  options: WebhookNoteProcessorOptions
): Promise<WebhookNoteProcessorResult> {
  const result = await processWebhookNotes(options);

  if (result.success) {
    triggerNoteProcessingUIUpdates(options.leadId, options.operationType || 'UNKNOWN', result);
  }

  return result;
}