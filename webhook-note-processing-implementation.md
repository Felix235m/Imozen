# Webhook Note Processing Implementation Plan

## Overview
This document outlines the implementation of centralized webhook note processing functionality for handling notes returned from webhook responses across all operations (cancel, reschedule, mark_done).

## Current State Analysis

### Existing Implementation
- Each operation (cancel, reschedule, mark_done) has duplicate code for processing notes
- All operations use the same pattern with `processNotesFromWebResponse` from note-transformer utility
- Webhook response structure contains:
  ```json
  {
    "success": true,
    "lead_id": "b934086e-9865-4712-bd83-bafbeb94d81e",
    "current_note": {
      "note_id": "f622bc4c-9441-4de4-9573-2178777ee3ae",
      "note": "Perguntar por visita",
      "note_type": "text",
      "created_at": "2025-11-20T18:27:46.035Z",
      "created_at_formatted": "20 Nov 2025, 18:27",
      "created_at_relative": "Just now",
      "created_by": "Agent"
    },
    "notes": [...],
    "total_notes": 7,
    "previous_notes_count": 6
  }
  ```

### Issues with Current Implementation
1. Code duplication across operations
2. Inconsistent error handling
3. Manual UI updates in each operation
4. No centralized rollback mechanism for note processing failures

## Implementation Plan

### 1. Create Centralized Webhook Note Processor

**File: `src/lib/webhook-note-processor.ts`**

```typescript
/**
 * Centralized utility for processing webhook note responses across all operations
 * Handles cancel, reschedule, and mark_done operations consistently
 */

import { localStorageManager } from '@/lib/local-storage-manager';
import { processNotesFromWebResponse, mergeNotes } from '@/lib/note-transformer';
import { dispatchThrottledStorageEvent, dispatchImmediateStorageEvent } from '@/lib/storage-event-throttle';

export interface WebhookNoteProcessorOptions {
  leadId: string;
  operationType: 'cancel_task' | 'reschedule_task' | 'mark_done';
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
    console.log(`📝 [${operationType.toUpperCase()}] Processing webhook notes for lead ${leadId}`);

    // Check if response contains notes data
    if (!responseData.current_note && (!responseData.notes || responseData.notes.length === 0)) {
      console.log(`📝 [${operationType.toUpperCase()}] No notes data in response, skipping processing`);
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
      console.warn(`⚠️ [${operationType.toUpperCase()}] Notes processing warnings:`, errors);
    }

    if (processedNotes.length > 0) {
      // Merge with existing notes (deduplication handled by mergeNotes)
      const mergedNotes = mergeNotes(processedNotes, existingNotes);
      
      // Update localStorage
      localStorageManager.updateNotes(leadId, mergedNotes);
      
      result.notesProcessed = processedCount;
      result.uiUpdateRequired = true;
      
      console.log(`✅ [${operationType.toUpperCase()}] Successfully processed ${processedCount} notes for lead ${leadId}`);
    }

    result.success = true;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Processing error: ${errorMessage}`);
    console.error(`❌ [${operationType.toUpperCase()}] Error processing webhook notes:`, error);
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
    triggerNoteProcessingUIUpdates(options.leadId, options.operationType, result);
  }
  
  return result;
}
```

### 2. Enhance Note Transformer Utility

**Update: `src/lib/note-transformer.ts`**

Add these enhancements to existing file:

```typescript
// Add to existing WebhookNoteResponse interface
export interface WebhookNoteResponse {
  current_note?: {
    note_id: string;
    note: string;
    note_type: string;
    created_at: string;
    created_at_formatted: string;
    created_at_relative: string;
    created_by: string;
  };
  notes?: Array<{
    note_id: string;
    note: string;
    note_type: string;
    created_at: string;
    created_at_formatted: string;
    created_at_relative: string;
    created_by: string;
    row_number?: number; // Add support for row_number field
  }>;
  total_notes?: number;
  previous_notes_count?: number;
  success?: boolean; // Add success flag
  lead_id?: string; // Add lead_id field
}

// Enhance transformWebhookNoteToStorageFormat function
export function transformWebhookNoteToStorageFormat(
  webhookNote: any,
  leadId: string
): Note | null {
  try {
    if (!webhookNote || !webhookNote.note_id || !webhookNote.note) {
      console.warn('⚠️ Invalid webhook note data:', webhookNote);
      return null;
    }

    const createdAt = webhookNote.created_at || new Date().toISOString();
    const timestamp = createdAt ? new Date(createdAt).getTime() : Date.now();
    const createdAtFormatted = webhookNote.created_at_formatted || formatDate(createdAt);

    return {
      id: webhookNote.note_id,
      note_id: webhookNote.note_id,
      lead_id: leadId,
      content: webhookNote.note,
      current_note: webhookNote.note_type === 'current' ? webhookNote.note : undefined,
      timestamp,
      created_at: createdAt,
      created_at_formatted: createdAtFormatted,
      created_by: webhookNote.created_by || 'Agent',
      updated_at: webhookNote.updated_at,
      // Additional fields for potential future use
      note_type: webhookNote.note_type,
      created_at_relative: webhookNote.created_at_relative,
      row_number: webhookNote.row_number, // Preserve row_number if present
    };
  } catch (error) {
    console.error('❌ Error transforming webhook note:', error, webhookNote);
    return null;
  }
}
```

### 3. Update Task Card Operations

**Update: `src/components/dashboard/task-card.tsx`**

#### 3.1 Cancel Task Operation Updates

Replace existing note processing code in `handleCancel` function (lines 1324-1342):

```typescript
// Replace lines 1324-1342 with:
if (responseData.success) {
  // Process notes from webhook response using centralized processor
  try {
    const { handleWebhookNoteProcessing } = await import('@/lib/webhook-note-processor');
    const noteProcessingResult = await handleWebhookNoteProcessing({
      leadId: task.leadId,
      operationType: 'cancel_task',
      responseData: responseData,
      operationContext: {
        taskId: task.id,
        note: note,
        agentName: agentName
      }
    });

    if (!noteProcessingResult.success) {
      console.error('❌ [CANCEL] Note processing failed:', noteProcessingResult.errors);
      // Continue with other operations even if note processing fails
    }
  } catch (error) {
    console.error('❌ [CANCEL] Error in centralized note processing:', error);
    // Continue with other operations even if note processing fails
  }

  // Remove task from localStorage
  const taskRemoved = localStorageManager.removeTaskFromSpecificGroup(task.id, date);
  if (!taskRemoved) {
    console.warn('Task was not found in localStorage for removal, trying general removal');
    localStorageManager.removeTaskFromGroup(task.id);
  }

  // Create direct success notification
  await createCancellationSuccessNotification(responseData, task.leadId);

  // IMMEDIATE UI UPDATE: Complete cancellation immediately to prevent race conditions
  console.log(`✅ Task ${task.id} cancellation completed successfully`);
  onTaskComplete(); // Hide task from UI after storage is updated
  onCancellationComplete?.(task.id); // Mark cancellation as complete

  // Clear rollback data on success
  localStorage.removeItem('cancellation_rollback_data');
} else {
  throw new Error(responseData.message || 'Cancellation failed');
}
```

#### 3.2 Reschedule Task Operation Updates

Replace existing note processing code in `handleReschedule` function (lines 814-857):

```typescript
// Replace lines 814-857 with:
// Process notes from webhook response if available
if (response.data?.current_note || (response.data?.notes && response.data.notes.length > 0)) {
  try {
    const { handleWebhookNoteProcessing } = await import('@/lib/webhook-note-processor');
    const noteProcessingResult = await handleWebhookNoteProcessing({
      leadId: task.leadId,
      operationType: 'reschedule_task',
      responseData: response.data,
      operationContext: {
        taskId: task.id,
        note: note,
        nextFollowUpDate: newDate,
        agentName: getCurrentAgentName() || 'Agent'
      }
    });

    if (!noteProcessingResult.success) {
      console.error('❌ [RESCHEDULE] Note processing failed:', noteProcessingResult.errors);
      // Continue with other operations even if note processing fails
    } else {
      console.log(`📝 [RESCHEDULE] Successfully processed ${noteProcessingResult.notesProcessed} notes`);
    }
  } catch (error) {
    console.error('❌ [RESCHEDULE] Error in centralized note processing:', error);
    // Continue with other operations even if note processing fails
  }
}
```

#### 3.3 Mark Done Task Operation Updates

Replace existing note processing code in `handleMarkDone` function (lines 1558-1598):

```typescript
// Replace lines 1558-1598 with:
// Process notes from webhook response if available
if (response.data?.current_note || (response.data?.notes && response.data.notes.length > 0)) {
  try {
    const { handleWebhookNoteProcessing } = await import('@/lib/webhook-note-processor');
    const noteProcessingResult = await handleWebhookNoteProcessing({
      leadId: task.leadId,
      operationType: 'mark_done',
      responseData: response.data,
      operationContext: {
        taskId: task.id,
        note: note,
        nextFollowUpDate: nextFollowUpDate,
        agentName: getCurrentAgentName() || 'Agent'
      }
    });

    if (!noteProcessingResult.success) {
      console.error('❌ [MARK_DONE] Note processing failed:', noteProcessingResult.errors);
      // Continue with other operations even if note processing fails
    } else {
      console.log(`📝 [MARK_DONE] Successfully processed ${noteProcessingResult.notesProcessed} notes`);
    }
  } catch (error) {
    console.error('❌ [MARK_DONE] Error in centralized note processing:', error);
    // Continue with other operations even if note processing fails
  }
}
```

### 4. Update Lead Page Note Handling

**Update: `src/app/leads/[id]/page.tsx`**

Update the `handleSaveNote` function in `LeadNotesSheet` to use the centralized processor:

```typescript
// In handleSaveNote function (around line 1676), replace the existing notes processing with:
// STEP 4: Process notes array from response using centralized processor
if (result.notes && result.notes.length > 0) {
  try {
    const { handleWebhookNoteProcessing } = await import('@/lib/webhook-note-processor');
    const noteProcessingResult = await handleWebhookNoteProcessing({
      leadId: lead.lead_id,
      operationType: 'mark_done', // Use mark_done as it's a note operation
      responseData: result,
      operationContext: {
        agentName: agentName
      }
    });

    if (!noteProcessingResult.success) {
      console.error('❌ [NOTE_SAVE] Centralized note processing failed:', noteProcessingResult.errors);
      // Fallback to existing logic if centralized processing fails
      const formattedNotes = sortedNotes.map((n: any) => ({
        id: n.note_id,
        note_id: n.note_id,
        lead_id: lead.lead_id,
        content: n.content || n.current_note,
        current_note: n.content || n.current_note,
        created_at: n.created_at,
        created_at_formatted: formatDateWithTimezone(n.created_at || ''),
        created_by: n.created_by || agentName,
        note_type: n.note_type || 'text',
        date: n.created_at
      }));

      updateNotesInStorage(formattedNotes as any);
    } else {
      console.log(`📝 [NOTE_SAVE] Successfully processed ${noteProcessingResult.notesProcessed} notes`);
    }
  } catch (error) {
    console.error('❌ [NOTE_SAVE] Error in centralized note processing:', error);
    // Fallback to existing logic
    // ... existing fallback code
  }
}
```

## Implementation Benefits

1. **Centralized Logic**: Single source of truth for webhook note processing
2. **Consistency**: All operations handle notes the same way
3. **Error Handling**: Unified error handling and logging
4. **Maintainability**: Easier to update and debug note processing logic
5. **Performance**: Optimized UI updates with proper event dispatching
6. **Reliability**: Better rollback and error recovery mechanisms

## Testing Strategy

### Unit Tests
1. Test webhook note processor with various response structures
2. Test error handling in note processing
3. Test UI update triggers
4. Test deduplication logic

### Integration Tests
1. Test cancel operation with notes in response
2. Test reschedule operation with notes in response
3. Test mark_done operation with notes in response
4. Test operations without notes in response
5. Test error scenarios and rollbacks

### Manual Testing
1. Perform cancel operation and verify notes update in lead detail page
2. Perform reschedule operation and verify notes update
3. Perform mark_done operation and verify notes update
4. Test cross-tab synchronization
5. Test error scenarios

## Deployment Steps

1. Create the new webhook-note-processor.ts file
2. Update note-transformer.ts with enhancements
3. Update task-card.tsx with centralized processing calls
4. Update lead page note handling
5. Test all operations thoroughly
6. Deploy to production
7. Monitor for any issues in production

## Rollback Plan

If issues arise during deployment:
1. Revert task-card.tsx to original version
2. Remove webhook-note-processor.ts file
3. Revert note-transformer.ts changes
4. Revert lead page changes
5. Deploy reverted version

## Monitoring

After deployment, monitor:
1. Console logs for note processing errors
2. User reports of missing notes
3. Performance impact on operations
4. Cross-tab synchronization issues
5. Storage event throttling effectiveness

## Future Enhancements

1. **Real-time Note Updates**: Implement WebSocket for real-time note updates
2. **Note Attachments**: Support for file attachments in notes
3. **Note Search**: Implement search functionality within notes
4. **Note Categories**: Add categorization for different note types
5. **Offline Support**: Enhanced offline note handling capabilities