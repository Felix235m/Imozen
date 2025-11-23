# Phone Number Edit Fix Test Plan

## Issue Description
When editing a lead's phone number in edit mode, the number resets to the current phone number immediately, before saving. This happens because a useEffect hook that parses phone numbers runs whenever the lead state changes, overwriting user's edits.

## Root Cause
The issue is caused by a race condition between:
1. User editing phone number fields (`phoneCountryCode` and `phoneNumber` state)
2. localStorage synchronization effect updating the `lead` state
3. Phone number parsing effect (lines 454-469) resetting the phone fields to original values

## Test Scenarios

### Test Case 1: Initial Load
**Steps:**
1. Navigate to a lead detail page
2. Verify phone number is correctly parsed and displayed in view mode
3. Click "Edit" button
4. Verify phone number fields are populated with correct values

**Expected Result:** Phone number should be correctly parsed into country code and number fields when entering edit mode

### Test Case 2: Edit Phone Number Without Interruption
**Steps:**
1. Navigate to a lead detail page
2. Click "Edit" button
3. Change the country code from "+351" to "+44"
4. Change the phone number from "912345678" to "987654321"
5. Click "Save" button
6. Confirm changes in dialog
7. Verify the phone number is saved correctly

**Expected Result:** Phone number changes should persist and be saved correctly

### Test Case 3: Edit Phone Number With Storage Update
**Steps:**
1. Navigate to a lead detail page
2. Click "Edit" button
3. Start changing the phone number (e.g., change country code to "+44")
4. Simulate a localStorage update (this can be done by opening the same lead in another tab and making changes)
5. Continue editing the phone number
6. Verify the phone number fields still contain the user's edits, not the original values

**Expected Result:** Phone number fields should not reset when localStorage updates occur during editing

### Test Case 4: Cancel Edit
**Steps:**
1. Navigate to a lead detail page
2. Click "Edit" button
3. Change the phone number fields
4. Click "Cancel" button
5. Verify the phone number reverts to original values

**Expected Result:** Phone number should revert to original values when canceling edit

### Test Case 5: Save and Re-edit
**Steps:**
1. Navigate to a lead detail page
2. Click "Edit" button
3. Change the phone number and save
4. Wait for save to complete
5. Click "Edit" again
6. Verify the new phone number is correctly parsed and displayed

**Expected Result:** Newly saved phone number should be correctly parsed when re-entering edit mode

## Implementation Details

### Fix Applied
Modified the phone number parsing useEffect (lines 454-469) to only update phone fields when:
- Not in edit mode, OR
- Phone number fields are empty (initial load)

```typescript
// Phone number parsing when lead data loads
useEffect(() => {
  if (lead?.contact?.phone) {
    try {
      const { code, number } = parsePhoneNumber(lead.contact.phone);
      
      // Only update phone fields if not in edit mode or if phone number actually changed
      if (!isEditing || phoneCountryCode === '' || phoneNumber === '') {
        setPhoneCountryCode(code);
        setPhoneNumber(number);
        console.log('📞 Phone number parsed:', { code, number, original: lead.contact.phone });
      }
    } catch (error) {
      console.error('❌ Failed to parse phone number:', lead.contact.phone, error);
      // Set default values only if not in edit mode
      if (!isEditing) {
        setPhoneCountryCode('');
        setPhoneNumber('');
      }
    }
  }
}, [lead, parsePhoneNumber, isEditing, phoneCountryCode, phoneNumber]);
```

### Key Changes
1. Added `isEditing` to the dependency array
2. Added condition to only update phone fields if not in edit mode or if fields are empty
3. Only set default values when not in edit mode

## Verification Steps

### Manual Testing
1. Run through all test cases above
2. Verify each scenario behaves as expected
3. Check browser console for any errors or unexpected behavior

### Automated Testing (if available)
1. Run existing test suite
2. Verify no regressions in phone number functionality
3. Check for any new test failures

## Rollback Plan

If issues are discovered with the fix:
1. Revert the phone number parsing useEffect to its original implementation
2. Investigate alternative solutions such as:
   - Using useRef to track editing state
   - Implementing a debounced update mechanism
   - Separating edit mode state from display state

## Success Criteria

The fix is successful when:
1. Users can edit phone numbers without them resetting
2. Phone numbers are still correctly parsed when loading leads
3. No other phone number functionality is broken
4. The fix works across all test scenarios