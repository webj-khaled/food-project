const { toggleListingStatus } = require('../lib/appwrite'); // Adjust path as needed

async function runTest() {
  const testDocumentId = "68929b09000585514bf0"; // Use real ID
  const testUserId = "687a45890022d7525cd0";     // Use real owner ID

  try {
    console.log("Testing with document:", testDocumentId);
    const result = await toggleListingStatus(testDocumentId, testUserId);
    console.log("✅ Success:", result);
  } catch (error) {
    console.error("❌ Failed:", error.message);
  }
}

runTest();node components/test.js
runTest();node components/test.js