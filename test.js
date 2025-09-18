// test.js
const { toggleListingStatus } = require('./lib/appwrite');

async function test() {
  try {
    console.log("Starting test...");
    
    // Use REAL IDs from your database - replace these!
    const result = await toggleListingStatus(
      "68929b09000585514bf0", // Document ID
      "687a45890022d7525cd0"  // Owner User ID
    );
    
    console.log("✅ Success:", result);
  } catch (error) {
    console.error("❌ Failed:", error.message);
  }
}

test();