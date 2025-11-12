// Copy of the formatPhoneNumber function from utils.ts
function formatPhoneNumber(countryCode, phoneNumber) {
  // Clean up the country code - ensure it starts with +
  let cleanCountryCode = countryCode.trim();
  if (!cleanCountryCode.startsWith('+')) {
    cleanCountryCode = `+${cleanCountryCode}`;
  }
  
  // Clean up the phone number - remove any special characters except digits
  const cleanPhoneNumber = phoneNumber.trim();
  
  // Return in the required format "(+countrycode) phonenumber"
  return `(${cleanCountryCode}) ${cleanPhoneNumber}`;
}

// Test cases
const testCases = [
  {
    input: { countryCode: '+351', phoneNumber: '8072624362' },
    expected: '(+351) 8072624362',
    description: 'Standard case with + prefix'
  },
  {
    input: { countryCode: '351', phoneNumber: '8072624362' },
    expected: '(+351) 8072624362',
    description: 'Country code without + prefix'
  },
  {
    input: { countryCode: '+351', phoneNumber: '80726243620' },
    expected: '(+351) 80726243620',
    description: 'Case with longer phone number (as mentioned in feedback)'
  }
];

// Run tests
console.log('Running phone number formatting tests...\n');

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  const result = formatPhoneNumber(testCase.input.countryCode, testCase.input.phoneNumber);
  const passed = result === testCase.expected;
  
  if (passed) {
    passedTests++;
  }
  
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`Input: countryCode="${testCase.input.countryCode}", phoneNumber="${testCase.input.phoneNumber}"`);
  console.log(`Expected: "${testCase.expected}"`);
  console.log(`Actual: "${result}"`);
  console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('---');
});

console.log(`\nTest Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! The phone number formatting is working correctly.');
} else {
  console.log('⚠️ Some tests failed. Please check the implementation.');
}

// Test what would be sent in the webhook payload
console.log('\n=== Webhook Payload Test ===');
const profileData = {
  phoneCountryCode: '+351',
  phoneNumber: '80726243620'
};

const combinedPhone = formatPhoneNumber(profileData.phoneCountryCode, profileData.phoneNumber);
const updatePayload = {
  agent_id: 'test-agent-id',
  agent_name: 'Test Agent',
  agent_email: 'test@example.com',
  agent_phone: combinedPhone,
  agent_language: 'English',
  agent_image_url: '',
  login_username: 'testuser',
  sheet_url: ''
};

console.log('Profile data:', profileData);
console.log('Combined phone:', combinedPhone);
console.log('Full webhook payload:', JSON.stringify(updatePayload, null, 2));