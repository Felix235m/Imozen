/**
 * Transformation utilities for notes from webhook responses
 */

import { Note } from '@/types/app-data';

/**
 * Interface for webhook note response structure
 */
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
  }>;
  total_notes?: number;
  previous_notes_count?: number;
}

/**
 * Validate webhook note data structure
 */
export function validateWebhookNoteData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Invalid response data: not an object');
    return { isValid: false, errors };
  }

  // Validate current_note if present
  if (data.current_note) {
    if (!data.current_note.note_id) {
      errors.push('current_note missing note_id');
    }
    if (!data.current_note.note) {
      errors.push('current_note missing note content');
    }
    if (!data.current_note.created_at) {
      errors.push('current_note missing created_at timestamp');
    }
  }

  // Validate notes array if present
  if (data.notes && Array.isArray(data.notes)) {
    data.notes.forEach((note: any, index: number) => {
      if (!note.note_id) {
        errors.push(`notes[${index}] missing note_id`);
      }
      if (!note.note) {
        errors.push(`notes[${index}] missing note content`);
      }
      if (!note.created_at) {
        errors.push(`notes[${index}] missing created_at timestamp`);
      }
    });
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Format ISO date string to readable format (matching existing pattern)
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
 * Transform individual webhook note to storage format
 */
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
    const createdAtFormatted = createdAt ? formatDate(createdAt) : '';

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
    };
  } catch (error) {
    console.error('❌ Error transforming webhook note:', error, webhookNote);
    return null;
  }
}

/**
 * Process notes from webhook response, handling both current_note and notes array
 */
export function processNotesFromWebResponse(
  responseData: WebhookNoteResponse,
  leadId: string
): { notes: Note[]; processedCount: number; errors: string[] } {
  const notes: Note[] = [];
  const errors: string[] = [];
  let processedCount = 0;

  try {
    // Validation
    const validation = validateWebhookNoteData(responseData);
    if (!validation.isValid) {
      console.warn('⚠️ Webhook note data validation failed:', validation.errors);
      errors.push(...validation.errors);
    }

    // Process current_note (newest/most recent note)
    if (responseData.current_note) {
      const transformedNote = transformWebhookNoteToStorageFormat(
        responseData.current_note,
        leadId
      );
      if (transformedNote) {
        notes.push(transformedNote);
        processedCount++;
        console.log('✅ Processed current_note:', transformedNote.note_id);
      } else {
        errors.push('Failed to transform current_note');
      }
    }

    // Process notes array (historical notes)
    if (responseData.notes && Array.isArray(responseData.notes)) {
      responseData.notes.forEach((webhookNote, index) => {
        const transformedNote = transformWebhookNoteToStorageFormat(webhookNote, leadId);
        if (transformedNote) {
          notes.push(transformedNote);
          processedCount++;
          console.log(`✅ Processed notes[${index}]:`, transformedNote.note_id);
        } else {
          errors.push(`Failed to transform notes[${index}]`);
        }
      });
    }

    // Sort notes by timestamp (newest first) - matching existing pattern
    notes.sort((a, b) => {
      const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp;
      const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp;
      return timeB - timeA; // Newest first
    });

    console.log(`📝 Notes processing complete: ${processedCount} notes processed, ${errors.length} errors`);

  } catch (error) {
    console.error('❌ Error processing notes from webhook response:', error);
    errors.push(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { notes, processedCount, errors };
}

/**
 * Deduplicate notes based on note_id to prevent duplicates
 * Handles both duplicates within newNotes and against existingNotes
 */
export function deduplicateNotes(newNotes: Note[], existingNotes: Note[]): Note[] {
  const existingNoteIds = new Set(existingNotes.map(note => note.note_id || note.id));
  const seenNoteIds = new Set<string>();

  const uniqueNewNotes = newNotes.filter(note => {
    const noteId = note.note_id || note.id;

    // Check against existing notes
    if (existingNoteIds.has(noteId)) {
      console.log(`🔄 Skipping duplicate with existing notes: ${noteId}`);
      return false;
    }

    // Check within new notes (deduplicate current_note vs notes array)
    if (seenNoteIds.has(noteId)) {
      console.log(`🔄 Skipping duplicate within new notes: ${noteId}`);
      return false;
    }

    seenNoteIds.add(noteId);
    return true;
  });

  return uniqueNewNotes;
}

/**
 * Merge new notes with existing notes, maintaining sort order (newest first)
 */
export function mergeNotes(newNotes: Note[], existingNotes: Note[]): Note[] {
  // Deduplicate new notes against existing ones
  const uniqueNewNotes = deduplicateNotes(newNotes, existingNotes);

  // Combine and sort
  const allNotes = [...uniqueNewNotes, ...existingNotes];

  // Sort by timestamp (newest first)
  return allNotes.sort((a, b) => {
    const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp;
    const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp;
    return timeB - timeA;
  });
}