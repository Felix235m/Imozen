# Task ID Implementation for Regeneration Message Webhook

## Summary

Successfully implemented the inclusion of `task_id` in the regeneration message webhook call to provide complete context for backend processing.

## Changes Made

### 1. Created Utility Function (`src/lib/task-utils.ts`)

- **`getTaskIdForLead(lead)`**: Function to extract task_id for a lead
  - First tries to get `task_id` from `lead.management.follow_up_task`
  - Falls back to finding current/upcoming task from localStorage
  - Returns `null` if no task can be determined

- **`findCurrentTaskForLead(leadId)`**: Helper function to find current task from localStorage
  - Searches through all task groups for tasks matching the lead_id
  - Prioritizes non-completed tasks
  - Returns most recent task if no active tasks found

### 2. Updated Lead Follow-Up Sheet (`src/components/leads/lead-follow-up-sheet.tsx`)

- **Import**: Added import for `getTaskIdForLead` utility
- **Enhanced `handleRegenerate` function**: 
  - Now extracts `task_id` using the utility function
  - Includes `task_id` in webhook payload when available
  - Maintains backward compatibility (works without task_id)

### 3. Verified Existing Implementation (`src/components/dashboard/task-card.tsx`)

- **Already implemented**: Task card was already including `task_id` in regenerate call (line 1704)
- **No changes needed**: Implementation was already correct

## Webhook Payload Structure

The regeneration webhook now sends:

```json
{
  "operation": "regenerate_follow-up_message",
  "lead_id": "lead_456",
  "task_id": "task_123",  // ← NEW: Included when available
  "language": "English"
}
```

## Task ID Resolution Strategy

1. **Primary**: Use `lead.management.follow_up_task` field if available
2. **Fallback**: Search localStorage tasks for current/upcoming task for the lead
3. **Graceful degradation**: Works without `task_id` if neither source has it

## Testing Results

✅ **All tests passed**:
- Task ID extraction from management.follow_up_task: Working
- Fallback to finding task from localStorage: Working  
- Webhook payload generation with task_id: Working
- Integration with LeadFollowUpSheet component: Ready

## Benefits

1. **Complete Context**: Backend now receives both `lead_id` and `task_id` for precise task identification
2. **Backward Compatible**: Works with existing leads that don't have task_id in management data
3. **Robust**: Multiple fallback strategies ensure task_id is found when possible
4. **Future-Proof**: Utility functions can be reused for other task-related operations

## Files Modified

1. `Imozen/src/lib/task-utils.ts` - **Created**
2. `Imozen/src/components/leads/lead-follow-up-sheet.tsx` - **Modified**

## Implementation Status: ✅ COMPLETE

The regeneration message webhook now properly includes `task_id` along with `lead_id` as requested.