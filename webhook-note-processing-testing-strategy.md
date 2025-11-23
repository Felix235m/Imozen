# Webhook Note Processing Testing Strategy

## Overview
This document outlines the comprehensive testing strategy for the centralized webhook note processing functionality across all operations (cancel, reschedule, mark_done).

## Testing Objectives

1. **Functional Testing**: Verify that notes are correctly processed and displayed
2. **Integration Testing**: Ensure seamless integration with existing components
3. **Error Handling**: Validate error scenarios and recovery mechanisms
4. **Performance Testing**: Confirm no performance degradation
5. **Cross-Tab Testing**: Verify synchronization across browser tabs
6. **User Experience Testing**: Ensure smooth user workflows

## Test Environment Setup

### 1. Test Data Preparation

```typescript
// Mock webhook responses for testing
const mockWebhookResponses = {
  withNotes: {
    success: true,
    lead_id: "test-lead-123",
    current_note: {
      note_id: "f622bc4c-9441-4de4-9573-2178777ee3ae",
      note: "Test current note",
      note_type: "text",
      created_at: "2025-11-20T18:27:46.035Z",
      created_at_formatted: "20 Nov 2025, 18:27",
      created_at_relative: "Just now",
      created_by: "Test Agent"
    },
    notes: [
      {
        note_id: "7ee45835-6262-40be-ac62-3c15a4c31bad",
        note_type: "text",
        note: "Test historical note 1",
        created_at: "2025-11-20T18:19:54.147Z",
        created_at_formatted: "20 Nov 2025, 18:19",
        created_at_relative: "7 minutes ago",
        created_by: "Test Agent",
        row_number: 36
      }
    ],
    total_notes: 7,
    previous_notes_count: 6
  },
  withoutNotes: {
    success: true,
    lead_id: "test-lead-123"
    // No notes data
  },
  withErrors: {
    success: false,
    error: "Processing failed"
  }
};
```

### 2. Test Lead Setup

```typescript
// Create test lead with existing notes
const testLead = {
  lead_id: "test-lead-123",
  name: "Test User",
  existingNotes: [
    {
      note_id: "existing-note-1",
      content: "Existing note 1",
      created_at: "2025-11-19T10:00:00Z"
    }
  ]
};
```

## Unit Tests

### 1. Webhook Note Processor Tests

```typescript
// File: src/lib/__tests__/webhook-note-processor.test.ts

describe('Webhook Note Processor', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('should process notes from valid webhook response', async () => {
    const result = await processWebhookNotes({
      leadId: 'test-lead-123',
      operationType: 'mark_done',
      responseData: mockWebhookResponses.withNotes
    });

    expect(result.success).toBe(true);
    expect(result.notesProcessed).toBe(2); // current_note + 1 historical note
    expect(result.uiUpdateRequired).toBe(true);
  });

  test('should handle response without notes', async () => {
    const result = await processWebhookNotes({
      leadId: 'test-lead-123',
      operationType: 'cancel_task',
      responseData: mockWebhookResponses.withoutNotes
    });

    expect(result.success).toBe(true);
    expect(result.notesProcessed).toBe(0);
    expect(result.uiUpdateRequired).toBe(false);
  });

  test('should handle invalid response data', async () => {
    const result = await processWebhookNotes({
      leadId: 'test-lead-123',
      operationType: 'reschedule_task',
      responseData: mockWebhookResponses.withErrors
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should deduplicate notes correctly', async () => {
    // Setup existing notes
    localStorageManager.updateNotes('test-lead-123', [
      { note_id: 'existing-note-1', content: 'Existing note' }
    ]);

    const result = await processWebhookNotes({
      leadId: 'test-lead-123',
      operationType: 'mark_done',
      responseData: mockWebhookResponses.withNotes
    });

    expect(result.success).toBe(true);
    
    const finalNotes = localStorageManager.getNotes('test-lead-123');
    expect(finalNotes.length).toBe(3); // 1 existing + 2 new, no duplicates
  });
});
```

### 2. Note Transformer Tests

```typescript
// File: src/lib/__tests__/note-transformer.test.ts

describe('Note Transformer', () => {
  test('should transform webhook note to storage format', () => {
    const webhookNote = {
      note_id: "test-note-123",
      note: "Test note content",
      note_type: "text",
      created_at: "2025-11-20T18:27:46.035Z",
      created_at_formatted: "20 Nov 2025, 18:27",
      created_by: "Test Agent"
    };

    const result = transformWebhookNoteToStorageFormat(webhookNote, 'test-lead-123');

    expect(result).toEqual({
      id: "test-note-123",
      note_id: "test-note-123",
      lead_id: "test-lead-123",
      content: "Test note content",
      timestamp: expect.any(Number),
      created_at: "2025-11-20T18:27:46.035Z",
      created_at_formatted: "20 Nov 2025, 18:27",
      created_by: "Test Agent",
      note_type: "text"
    });
  });

  test('should handle missing required fields', () => {
    const invalidNote = {
      note: "Test note",
      // Missing note_id
    };

    const result = transformWebhookNoteToStorageFormat(invalidNote, 'test-lead-123');

    expect(result).toBeNull();
  });
});
```

## Integration Tests

### 1. Task Card Integration Tests

```typescript
// File: src/components/dashboard/__tests__/task-card.integration.test.ts

describe('Task Card Note Processing Integration', () => {
  let mockTaskCard: HTMLElement;

  beforeEach(() => {
    // Setup mock task card component
    mockTaskCard = document.createElement('div');
    document.body.appendChild(mockTaskCard);
  });

  afterEach(() => {
    document.body.removeChild(mockTaskCard);
  });

  test('should process notes on cancel operation', async () => {
    // Mock the cancel operation
    const mockResponse = mockWebhookResponses.withNotes;
    
    // Trigger cancel operation
    await triggerCancelOperation(mockTaskCard, mockResponse);

    // Verify notes were processed
    const notes = localStorageManager.getNotes('test-lead-123');
    expect(notes.length).toBeGreaterThan(0);
    
    // Verify UI was updated
    expect(notesSectionUpdated()).toBe(true);
  });

  test('should process notes on reschedule operation', async () => {
    const mockResponse = mockWebhookResponses.withNotes;
    
    await triggerRescheduleOperation(mockTaskCard, mockResponse);

    const notes = localStorageManager.getNotes('test-lead-123');
    expect(notes.length).toBeGreaterThan(0);
    expect(notesSectionUpdated()).toBe(true);
  });

  test('should process notes on mark_done operation', async () => {
    const mockResponse = mockWebhookResponses.withNotes;
    
    await triggerMarkDoneOperation(mockTaskCard, mockResponse);

    const notes = localStorageManager.getNotes('test-lead-123');
    expect(notes.length).toBeGreaterThan(0);
    expect(notesSectionUpdated()).toBe(true);
  });
});
```

### 2. Lead Page Integration Tests

```typescript
// File: src/app/leads/[id]/__tests__/page.integration.test.ts

describe('Lead Page Note Processing Integration', () => {
  test('should update notes when saving note', async () => {
    // Navigate to lead page
    await navigateToLeadPage('test-lead-123');
    
    // Open notes sheet
    await openNotesSheet();
    
    // Save a new note
    await saveNote('Test new note');
    
    // Verify note was processed and displayed
    expect(currentNoteDisplayed()).toBe('Test new note');
    expect(notesHistoryUpdated()).toBe(true);
  });
});
```

## End-to-End Tests

### 1. User Workflow Tests

```typescript
// File: e2e/webhook-note-processing.e2e.test.ts

describe('Webhook Note Processing E2E', () => {
  test('complete cancel workflow with note processing', async () => {
    // Login as test user
    await login('test-user', 'test-password');
    
    // Navigate to tasks page
    await page.goto('/tasks');
    
    // Find and expand a task
    await expandTask('test-task-123');
    
    // Click cancel button
    await page.click('[data-testid="cancel-task-button"]');
    
    // Enter cancellation note
    await page.fill('[data-testid="cancellation-note"]', 'Test cancellation note');
    
    // Confirm cancellation
    await page.click('[data-testid="confirm-cancellation"]');
    
    // Wait for webhook response
    await page.waitForTimeout(2000);
    
    // Navigate to lead detail page
    await page.goto('/leads/test-lead-123');
    
    // Open notes sheet
    await page.click('[data-testid="notes-button"]');
    
    // Verify new note is displayed
    expect(await page.textContent('[data-testid="current-note"]')).toContain('Test cancellation note');
  });

  test('complete reschedule workflow with note processing', async () => {
    await login('test-user', 'test-password');
    await page.goto('/tasks');
    await expandTask('test-task-123');
    
    // Click reschedule button
    await page.click('[data-testid="reschedule-task-button"]');
    
    // Select new date
    await page.click('[data-testid="date-picker"]');
    await page.click('[data-testid="tomorrow-date"]');
    
    // Enter reschedule note
    await page.fill('[data-testid="reschedule-note"]', 'Test reschedule note');
    
    // Confirm reschedule
    await page.click('[data-testid="confirm-reschedule"]');
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Verify note in lead page
    await page.goto('/leads/test-lead-123');
    await page.click('[data-testid="notes-button"]');
    
    expect(await page.textContent('[data-testid="current-note"]')).toContain('Test reschedule note');
  });

  test('complete mark_done workflow with note processing', async () => {
    await login('test-user', 'test-password');
    await page.goto('/tasks');
    await expandTask('test-task-123');
    
    // Click mark done button
    await page.click('[data-testid="mark-done-button"]');
    
    // Enter completion note
    await page.fill('[data-testid="completion-note"]', 'Test completion note');
    
    // Confirm completion
    await page.click('[data-testid="confirm-completion"]');
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Verify note in lead page
    await page.goto('/leads/test-lead-123');
    await page.click('[data-testid="notes-button"]');
    
    expect(await page.textContent('[data-testid="current-note"]')).toContain('Test completion note');
  });
});
```

## Cross-Tab Synchronization Tests

### 1. Multi-Tab Testing

```typescript
// File: src/lib/__tests__/cross-tab-sync.test.ts

describe('Cross-Tab Synchronization', () => {
  test('should sync note updates across tabs', async () => {
    // Open two browser contexts (simulating two tabs)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Navigate both pages to same lead
    await page1.goto('/leads/test-lead-123');
    await page2.goto('/leads/test-lead-123');
    
    // Open notes sheet in first tab
    await page1.click('[data-testid="notes-button"]');
    
    // Save note in first tab
    await page1.fill('[data-testid="note-textarea"]', 'Cross-tab test note');
    await page1.click('[data-testid="save-note"]');
    
    // Wait for sync
    await page2.waitForTimeout(1000);
    
    // Verify note appears in second tab
    await page2.click('[data-testid="notes-button"]');
    expect(await page2.textContent('[data-testid="current-note"]')).toContain('Cross-tab test note');
    
    await context1.close();
    await context2.close();
  });
});
```

## Performance Tests

### 1. Processing Performance Tests

```typescript
// File: src/lib/__tests__/performance.test.ts

describe('Performance Tests', () => {
  test('should process large number of notes efficiently', async () => {
    // Create response with 100 notes
    const largeResponse = {
      ...mockWebhookResponses.withNotes,
      notes: Array.from({ length: 100 }, (_, i) => ({
        note_id: `note-${i}`,
        note: `Note ${i}`,
        note_type: "text",
        created_at: new Date(Date.now() - i * 1000).toISOString(),
        created_by: "Test Agent"
      }))
    };

    const startTime = performance.now();
    
    const result = await processWebhookNotes({
      leadId: 'test-lead-123',
      operationType: 'mark_done',
      responseData: largeResponse
    });

    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    expect(result.success).toBe(true);
    expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
  });

  test('should not cause UI blocking during processing', async () => {
    const largeResponse = createLargeResponse(100);
    
    // Start processing in background
    const processingPromise = processWebhookNotes({
      leadId: 'test-lead-123',
      operationType: 'mark_done',
      responseData: largeResponse
    });
    
    // UI should remain responsive
    expect(isUIResponsive()).toBe(true);
    
    await processingPromise;
  });
});
```

## Error Handling Tests

### 1. Network Error Tests

```typescript
describe('Error Handling', () => {
  test('should handle network errors gracefully', async () => {
    // Mock network failure
    mockNetworkFailure();
    
    const result = await processWebhookNotes({
      leadId: 'test-lead-123',
      operationType: 'mark_done',
      responseData: null
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    
    // Verify app continues to function
    expect(isAppStable()).toBe(true);
  });

  test('should handle malformed response data', async () => {
    const malformedResponse = {
      current_note: "invalid string instead of object",
      notes: "invalid string instead of array"
    };

    const result = await processWebhookNotes({
      leadId: 'test-lead-123',
      operationType: 'mark_done',
      responseData: malformedResponse
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
```

## Manual Testing Checklist

### 1. Pre-Deployment Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Performance benchmarks met
- [ ] Error scenarios tested
- [ ] Cross-tab sync verified
- [ ] Browser compatibility checked
- [ ] Mobile responsiveness verified
- [ ] Accessibility compliance checked

### 2. User Acceptance Testing

- [ ] Cancel operation with notes works correctly
- [ ] Reschedule operation with notes works correctly
- [ ] Mark done operation with notes works correctly
- [ ] Notes appear immediately in lead detail page
- [ ] Notes sync across browser tabs
- [ ] Error handling is user-friendly
- [ ] Performance is acceptable
- [ ] UI remains responsive during processing

### 3. Production Monitoring

- [ ] Error tracking implemented
- [ ] Performance monitoring active
- [ ] User feedback collection ready
- [ ] Rollback mechanism tested
- [ ] Feature flags configured

## Test Data Management

### 1. Test Environment Isolation

```typescript
// Use separate storage keys for testing
const TEST_STORAGE_PREFIX = 'test_';

function getTestStorageKey(key: string): string {
  return `${TEST_STORAGE_PREFIX}${key}`;
}

// Clear test data after each test
function clearTestData(): void {
  Object.keys(localStorage)
    .filter(key => key.startsWith(TEST_STORAGE_PREFIX))
    .forEach(key => localStorage.removeItem(key));
}
```

### 2. Mock Data Generation

```typescript
// Generate realistic test data
function generateTestNote(index: number): Note {
  return {
    note_id: `test-note-${index}`,
    content: `Test note content ${index}`,
    created_at: new Date(Date.now() - index * 3600000).toISOString(),
    created_by: 'Test Agent',
    note_type: 'text'
  };
}

function generateTestLead(): Lead {
  return {
    lead_id: 'test-lead-123',
    name: 'Test User',
    // ... other required fields
  };
}
```

## Continuous Integration

### 1. Automated Test Pipeline

```yaml
# .github/workflows/webhook-notes-testing.yml
name: Webhook Notes Testing

on:
  push:
    paths:
      - 'src/lib/webhook-note-processor.ts'
      - 'src/lib/note-transformer.ts'
      - 'src/components/dashboard/task-card.tsx'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit
      - name: Run integration tests
        run: npm run test:integration
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Run performance tests
        run: npm run test:performance
```

### 2. Test Coverage Requirements

- Unit tests: 95%+ coverage
- Integration tests: 80%+ coverage
- E2E tests: Cover all user workflows
- Performance tests: All critical paths tested

## Test Execution Timeline

### Phase 1: Unit Testing (Days 1-2)
- Webhook note processor tests
- Note transformer tests
- Utility function tests

### Phase 2: Integration Testing (Days 3-4)
- Task card integration tests
- Lead page integration tests
- Storage layer tests

### Phase 3: End-to-End Testing (Days 5-6)
- User workflow tests
- Cross-tab synchronization tests
- Error scenario tests

### Phase 4: Performance & Compatibility (Days 7-8)
- Performance benchmarking
- Browser compatibility testing
- Mobile device testing

### Phase 5: User Acceptance (Days 9-10)
- Manual testing by QA team
- User feedback collection
- Final bug fixes and adjustments

## Success Criteria

1. **Functional**: All operations correctly process and display notes
2. **Performance**: Processing completes within acceptable time limits
3. **Reliability**: Error handling works gracefully
4. **Compatibility**: Works across all supported browsers
5. **User Experience**: Seamless integration with existing workflows
6. **Maintainability**: Code is well-documented and testable

## Risk Mitigation

1. **Data Loss**: Implement proper backup and rollback mechanisms
2. **Performance**: Monitor and optimize processing bottlenecks
3. **Compatibility**: Test across different environments
4. **User Confusion**: Provide clear error messages and feedback
5. **Deployment Issues**: Use feature flags and gradual rollout