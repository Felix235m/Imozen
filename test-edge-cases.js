// Test edge cases and error handling for the contact changes fix
console.log('🧪 Testing Edge Cases and Error Handling');
console.log('==========================================');

// Test the fixed findChanges function with edge cases
function findChanges(original, current, prefix = '') {
  let changes = [];
  
  for (const key in original) {
    if (['row_number', 'lead_id', 'created_at', 'created_at_formatted', 'next_follow_up', 'image_url', 'communication_history', 'management', 'purchase', 'stage'].includes(key)) continue;
    
    const originalValue = original[key];
    const currentValue = current[key];
    const fieldName = prefix ? `${prefix}.${key}` : key;
    
    // Special handling for contact object (our fix)
    if (key === 'contact' && typeof originalValue === 'object' && originalValue !== null) {
      // Handle case where current contact object is missing or null
      if (typeof currentValue !== 'object' || currentValue === null) {
        // All contact fields are "removed" - add changes for all original fields
        for (const contactField in originalValue) {
          const originalContactValue = originalValue[contactField];
          
          console.log(`✅ Contact ${contactField} change detected:`, {
            original: originalContactValue,
            current: null
          });
          
          const fieldLabel = contactField === 'phone' ? 'Contact Phone' :
                          contactField === 'email' ? 'Contact Email' :
                          contactField === 'language' ? 'Contact Language' :
                          `Contact ${contactField.charAt(0).toUpperCase() + contactField.slice(1)}`;
          
          changes.push({
              field: fieldLabel,
              oldValue: originalContactValue,
              newValue: null,
          });
        }
        continue;
      }
      
      // Handle case where original contact is empty but current has values
      if (Object.keys(originalValue).length === 0 && typeof currentValue === 'object' && currentValue !== null) {
        for (const contactField in currentValue) {
          const currentContactValue = currentValue[contactField];
          
          console.log(`✅ Contact ${contactField} change detected:`, {
            original: undefined,
            current: currentContactValue
          });
          
          const fieldLabel = contactField === 'phone' ? 'Contact Phone' :
                          contactField === 'email' ? 'Contact Email' :
                          contactField === 'language' ? 'Contact Language' :
                          `Contact ${contactField.charAt(0).toUpperCase() + contactField.slice(1)}`;
          
          changes.push({
              field: fieldLabel,
              oldValue: undefined,
              newValue: currentContactValue,
          });
        }
        continue;
      }
      
      // Compare each field in contact object
      for (const contactField in originalValue) {
        const originalContactValue = originalValue[contactField];
        const currentContactValue = currentValue[contactField];
        
        if (JSON.stringify(originalContactValue) !== JSON.stringify(currentContactValue)) {
          console.log(`✅ Contact ${contactField} change detected:`, {
            original: originalContactValue,
            current: currentContactValue
          });
          
          const fieldLabel = contactField === 'phone' ? 'Contact Phone' :
                          contactField === 'email' ? 'Contact Email' :
                          contactField === 'language' ? 'Contact Language' :
                          `Contact ${contactField.charAt(0).toUpperCase() + contactField.slice(1)}`;
          
          changes.push({
              field: fieldLabel,
              oldValue: originalContactValue,
              newValue: currentContactValue,
          });
        }
      }
      continue;
    }
    
    if (typeof originalValue === 'object' && originalValue !== null && !Array.isArray(originalValue)) {
        changes = changes.concat(findChanges(originalValue, currentValue, fieldName));
    } else if (JSON.stringify(originalValue) !== JSON.stringify(currentValue)) {
        changes.push({
            field: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            oldValue: Array.isArray(originalValue) ? originalValue.join(', ') : originalValue,
            newValue: Array.isArray(currentValue) ? currentValue.join(', ') : currentValue,
        });
    }
  }
  return changes;
}

// Edge Case 1: Empty contact object
console.log('\n🔍 Edge Case 1: Empty contact object');
const originalWithEmptyContact = {
  name: 'John Doe',
  contact: {},
  property: { type: 'Apartment' }
};

const currentWithFilledContact = {
  name: 'John Doe',
  contact: {
    phone: '(+351) 912345678',
    email: 'john@example.com',
    language: 'Portuguese'
  },
  property: { type: 'Apartment' }
};

const emptyContactChanges = findChanges(originalWithEmptyContact, currentWithFilledContact);
console.log('Changes detected:', emptyContactChanges.length > 0 ? '✅ YES' : '❌ NO');
console.log('Number of changes:', emptyContactChanges.length);

// Edge Case 2: Null/undefined values
console.log('\n🔍 Edge Case 2: Null/undefined values');
const originalWithNulls = {
  name: 'John Doe',
  contact: {
    phone: null,
    email: undefined,
    language: 'Portuguese'
  }
};

const currentWithValues = {
  name: 'John Doe',
  contact: {
    phone: '(+351) 912345678',
    email: 'john@example.com',
    language: 'English'
  }
};

const nullValueChanges = findChanges(originalWithNulls, currentWithValues);
console.log('Changes detected:', nullValueChanges.length > 0 ? '✅ YES' : '❌ NO');
console.log('Number of changes:', nullValueChanges.length);

// Edge Case 3: Missing fields in current object
console.log('\n🔍 Edge Case 3: Missing fields in current object');
const originalComplete = {
  name: 'John Doe',
  contact: {
    phone: '(+351) 912345678',
    email: 'john@example.com',
    language: 'Portuguese'
  }
};

const currentPartial = {
  name: 'John Doe',
  contact: {
    phone: '(+351) 912345678',
    // email field is missing
    language: 'English'
  }
};

const missingFieldChanges = findChanges(originalComplete, currentPartial);
console.log('Changes detected:', missingFieldChanges.length > 0 ? '✅ YES' : '❌ NO');
console.log('Number of changes:', missingFieldChanges.length);

// Edge Case 4: No contact object in current
console.log('\n🔍 Edge Case 4: No contact object in current');
const originalWithContact = {
  name: 'John Doe',
  contact: {
    phone: '(+351) 912345678',
    email: 'john@example.com'
  }
};

const currentWithoutContact = {
  name: 'John Doe',
  // contact object is completely missing
};

const noContactChanges = findChanges(originalWithContact, currentWithoutContact);
console.log('Changes detected:', noContactChanges.length > 0 ? '✅ YES' : '❌ NO');
console.log('Number of changes:', noContactChanges.length);

// Edge Case 5: Same values but different types
console.log('\n🔍 Edge Case 5: Same values but different types');
const originalWithString = {
  name: 'John Doe',
  contact: {
    phone: '123456789',
    email: 'john@example.com'
  }
};

const currentWithNumber = {
  name: 'John Doe',
  contact: {
    phone: 123456789, // number instead of string
    email: 'john@example.com'
  }
};

const typeChanges = findChanges(originalWithString, currentWithNumber);
console.log('Changes detected:', typeChanges.length > 0 ? '✅ YES' : '❌ NO');
console.log('Number of changes:', typeChanges.length);

// Edge Case 6: Array values
console.log('\n🔍 Edge Case 6: Array values comparison');
const originalWithArray = {
  name: 'John Doe',
  property: {
    locations: ['Lisbon', 'Porto']
  }
};

const currentWithDifferentArray = {
  name: 'John Doe',
  property: {
    locations: ['Lisbon', 'Faro', 'Porto'] // Different array
  }
};

const arrayChanges = findChanges(originalWithArray, currentWithDifferentArray);
console.log('Changes detected:', arrayChanges.length > 0 ? '✅ YES' : '❌ NO');
console.log('Number of changes:', arrayChanges.length);

console.log('\n🎯 Edge Case Summary');
console.log('======================');
const allEdgeCasesPass = 
  emptyContactChanges.length > 0 &&
  nullValueChanges.length > 0 &&
  missingFieldChanges.length > 0 &&
  noContactChanges.length > 0 &&
  typeChanges.length > 0 &&
  arrayChanges.length > 0;

console.log('Empty contact object:', emptyContactChanges.length > 0 ? '✅ HANDLED' : '❌ FAILED');
console.log('Null/undefined values:', nullValueChanges.length > 0 ? '✅ HANDLED' : '❌ FAILED');
console.log('Missing fields:', missingFieldChanges.length > 0 ? '✅ HANDLED' : '❌ FAILED');
console.log('No contact object:', noContactChanges.length > 0 ? '✅ HANDLED' : '❌ FAILED');
console.log('Type differences:', typeChanges.length > 0 ? '✅ HANDLED' : '❌ FAILED');
console.log('Array changes:', arrayChanges.length > 0 ? '✅ HANDLED' : '❌ FAILED');

console.log('\n🏆 Overall Edge Case Result:', allEdgeCasesPass ? '✅ ALL EDGE CASES HANDLED CORRECTLY!' : '❌ SOME EDGE CASES FAILED - Fix needs improvement');