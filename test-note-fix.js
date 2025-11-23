// Test script for noteContent.trim fix
// This can be run in the browser console to test the defensive programming fix

console.log('🧪 Testing noteContent.trim fix...');

// Test cases that would cause the original error
const testCases = [
  { name: 'String note', value: 'This is a string note' },
  { name: 'Numeric note', value: 1234 }, // This was causing the error
  { name: 'Null note', value: null },
  { name: 'Undefined note', value: undefined },
  { name: 'Object note', value: { note: 'object' } },
  { name: 'Empty string', value: '' },
  { name: 'Zero number', value: 0 },
  { name: 'Boolean true', value: true },
  { name: 'Boolean false', value: false }
];

// Original problematic code (would cause errors)
function originalCode(noteContent, originalNoteContent) {
  try {
    const isNoteChanged = noteContent && noteContent.trim() !== originalNoteContent.trim();
    return { success: true, result: isNoteChanged };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Fixed code with defensive programming
function fixedCode(noteContent, originalNoteContent) {
  try {
    const noteContentStr = String(noteContent || '');
    const originalNoteContentStr = String(originalNoteContent || '');
    const isNoteChanged = noteContentStr && noteContentStr.trim() !== originalNoteContentStr.trim();
    return { success: true, result: isNoteChanged };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Run tests
console.log('\n📋 Test Results:');
console.log('================');

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}: ${JSON.stringify(testCase.value)}`);
  
  // Test original code
  const originalResult = originalCode(testCase.value, testCase.value);
  console.log(`   Original code: ${originalResult.success ? '✅' : '❌'} ${originalResult.success ? `Result: ${originalResult.result}` : `Error: ${originalResult.error}`}`);
  
  // Test fixed code
  const fixedResult = fixedCode(testCase.value, testCase.value);
  console.log(`   Fixed code: ${fixedResult.success ? '✅' : '❌'} ${fixedResult.success ? `Result: ${fixedResult.result}` : `Error: ${fixedResult.error}`}`);
  
  // Compare results
  if (originalResult.success && fixedResult.success) {
    console.log(`   Comparison: ${originalResult.result === fixedResult.result ? '✅ Same result' : '⚠️ Different result'}`);
  } else if (!originalResult.success && fixedResult.success) {
    console.log(`   Comparison: ✅ Fixed code handles case that original code failed`);
  } else if (originalResult.success && !fixedResult.success) {
    console.log(`   Comparison: ❌ Fixed code failed where original succeeded`);
  } else {
    console.log(`   Comparison: ⚠️ Both failed`);
  }
});

// Test the specific case from the user's error
console.log('\n🎯 Testing the specific case from user error:');
console.log('===========================================');

const userCase = { noteContent: 1234, originalNoteContent: 'some note' };
console.log(`Note content: ${userCase.noteContent} (type: ${typeof userCase.noteContent})`);
console.log(`Original note content: ${userCase.originalNoteContent} (type: ${typeof userCase.originalNoteContent})`);

const userOriginalResult = originalCode(userCase.noteContent, userCase.originalNoteContent);
const userFixedResult = fixedCode(userCase.noteContent, userCase.originalNoteContent);

console.log(`\nOriginal code result: ${userOriginalResult.success ? '✅' : '❌'} ${userOriginalResult.success ? `Result: ${userOriginalResult.result}` : `Error: ${userOriginalResult.error}`}`);
console.log(`Fixed code result: ${userFixedResult.success ? '✅' : '❌'} ${userFixedResult.success ? `Result: ${userFixedResult.result}` : `Error: ${userFixedResult.error}`}`);

console.log('\n✅ Test completed! The fixed code should handle all cases without errors.');