/**
 * Notification System Debug Script
 *
 * Run this in your browser console (on the admin portal) to test notifications
 *
 * Usage:
 * 1. Open the admin portal in your browser
 * 2. Open Developer Tools (F12)
 * 3. Go to the Console tab
 * 4. Copy and paste the functions below
 * 5. Call testNotificationToUser('USER_ID_HERE') to test
 */

// Test sending a notification to a specific user
async function testNotificationToUser(userId) {
  console.log("🔔 Testing notification to user:", userId);

  const response = await fetch("/api/notifications/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: userId,
      notification: {
        title: "Test Notification 🎉",
        body: "This is a test notification from the debug script!",
        data: {
          type: "info",
          timestamp: new Date().toISOString(),
        },
      },
      priority: "high",
    }),
  });

  const result = await response.json();
  console.log("Response:", result);

  if (result.success) {
    console.log("✅ Notification sent successfully!");
    console.log("Stats:", result.stats);
  } else {
    console.log("❌ Notification failed!");
    console.log("Error:", result.error);
  }

  return result;
}

// Check if a user has push tokens
async function checkUserTokens(userId) {
  // This needs to be done from Firebase Console or backend
  console.log("To check user tokens:");
  console.log("1. Go to Firebase Console > Firestore");
  console.log("2. Navigate to users collection");
  console.log("3. Find user document:", userId);
  console.log('4. Check the "fcmTokens" array field');
  console.log("");
  console.log("The fcmTokens array should contain objects like:");
  console.log("{");
  console.log('  token: "ExponentPushToken[...]" or "dGVzdC10b2tlbi4uLg..."');
  console.log('  tokenType: "expo" or "fcm" or "apns"');
  console.log("  isActive: true");
  console.log('  platform: "ios" or "android"');
  console.log("}");
}

// Instructions
console.log("═".repeat(60));
console.log("🔔 Notification Debug Functions Loaded");
console.log("═".repeat(60));
console.log("");
console.log("Available functions:");
console.log('  testNotificationToUser("USER_ID") - Send test notification');
console.log('  checkUserTokens("USER_ID") - Instructions to check tokens');
console.log("");
console.log("Example:");
console.log('  testNotificationToUser("abc123")');
console.log("═".repeat(60));
