import { formatPhoneNumber } from '@/lib/utils';

// Test cases for phone number formatting
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
    input: { countryCode: '+1', phoneNumber: '5551234567' },
    expected: '(+1) 5551234567',
    description: 'US country code'
  },
  {
    input: { countryCode: '+44', phoneNumber: '7912345678' },
    expected: '(+44) 7912345678',
    description: 'UK country code'
  },
  {
    input: { countryCode: '+351', phoneNumber: '  912345678  ' },
    expected: '(+351) 912345678',
    description: 'Phone number with extra spaces'
  },
  {
    input: { countryCode: '  +351  ', phoneNumber: '912345678' },
    expected: '(+351) 912345678',
    description: 'Country code with extra spaces'
  }
];

// Run tests
console.log('Running phone number formatting tests...\n');

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  const result = formatPhoneNumber(testCase.input.countryCode, testCase.input.phoneNumber);
  const passed = result === testCase.expected;
  
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`Input: countryCode="${testCase.input.countryCode}", phoneNumber="${testCase.input.phoneNumber}"`);
  console.log(`Expected: "${testCase.expected}"`);
  console.log(`Actual: "${result}"`);
  console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('---');
  
  if (passed) {
    passedTests++;
  }
});

console.log(`\nTest Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! The phone number formatting is working correctly.');
} else {
  console.log('⚠️ Some tests failed. Please check the implementation.');
}