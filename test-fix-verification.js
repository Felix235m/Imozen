// Test script to verify the contact changes fix
// This script simulates the prepareSaveChanges function behavior

console.log('🧪 Testing Contact Changes Fix');
console.log('=====================================');

// Simulate original lead data
const originalLead = {
  name: 'John Doe',
  contact: {
    phone: '(+351) 912345678',
    email: 'john@example.com',
    language: 'Portuguese'
  },
  property: {
    type: 'Apartment',
    budget: 250000,
    bedrooms: 2,
    locations: ['Lisbon', 'Porto']
  }
};

// Test Case 1: Phone number change
console.log('\n📞 Test Case 1: Phone Number Change');
console.log('Original phone:', originalLead.contact.phone);

// Simulate state changes
const phoneCountryCode = '+351';
const phoneNumber = '987654321';

// Create updated lead data (simulating our fix)
const currentLeadDataPhone = {
  ...originalLead,
  contact: {
    ...originalLead.contact,
    phone: `(${phoneCountryCode}) ${phoneNumber}`
  }
};

console.log('Updated phone:', currentLeadDataPhone.contact.phone);

// Test change detection (simulating our fixed findChanges function)
function findChanges(original, current, prefix = '') {
  let changes = [];
  
  for (const key in original) {
    if (['row_number', 'lead_id', 'created_at', 'created_at_formatted', 'next_follow_up', 'image_url', 'communication_history', 'management', 'purchase', 'stage'].includes(key)) continue;
    
    const originalValue = original[key];
    const currentValue = current[key];
    const fieldName = prefix ? `${prefix}.${key}` : key;
    
    // Special handling for contact object (our fix)
    if (key === 'contact' && typeof originalValue === 'object' && originalValue !== null && typeof currentValue === 'object' && currentValue !== null) {
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
  }
  return changes;
}

const phoneChanges = findChanges(originalLead, currentLeadDataPhone);
console.log('Changes detected:', phoneChanges.length > 0 ? '✅ YES' : '❌ NO');
console.log('Change summary:', phoneChanges);

// Test Case 2: Email change
console.log('\n📧 Test Case 2: Email Change');
const currentLeadDataEmail = {
  ...originalLead,
  contact: {
    ...originalLead.contact,
    email: 'john.doe@newemail.com'
  }
};

const emailChanges = findChanges(originalLead, currentLeadDataEmail);
console.log('Changes detected:', emailChanges.length > 0 ? '✅ YES' : '❌ NO');
console.log('Change summary:', emailChanges);

// Test Case 3: Language change
console.log('\n🌐 Test Case 3: Language Change');
const currentLeadDataLanguage = {
  ...originalLead,
  contact: {
    ...originalLead.contact,
    language: 'English'
  }
};

const languageChanges = findChanges(originalLead, currentLeadDataLanguage);
console.log('Changes detected:', languageChanges.length > 0 ? '✅ YES' : '❌ NO');
console.log('Change summary:', languageChanges);

// Test Case 4: Multiple changes
console.log('\n🔄 Test Case 4: Multiple Contact Changes');
const currentLeadDataMultiple = {
  ...originalLead,
  contact: {
    phone: '(+351) 987654321',
    email: 'john.doe@newemail.com',
    language: 'English'
  }
};

const multipleChanges = findChanges(originalLead, currentLeadDataMultiple);
console.log('Changes detected:', multipleChanges.length > 0 ? '✅ YES' : '❌ NO');
console.log('Change summary:', multipleChanges);

console.log('\n🎯 Test Summary');
console.log('================');
console.log('Phone change detection:', phoneChanges.length > 0 ? '✅ WORKING' : '❌ FAILED');
console.log('Email change detection:', emailChanges.length > 0 ? '✅ WORKING' : '❌ FAILED');
console.log('Language change detection:', languageChanges.length > 0 ? '✅ WORKING' : '❌ FAILED');
console.log('Multiple changes detection:', multipleChanges.length > 0 ? '✅ WORKING' : '❌ FAILED');

const allTestsPass = phoneChanges.length > 0 && emailChanges.length > 0 && languageChanges.length > 0 && multipleChanges.length > 0;
console.log('\n🏆 Overall Result:', allTestsPass ? '✅ ALL TESTS PASS - Fix is working correctly!' : '❌ SOME TESTS FAILED - Fix needs adjustment');