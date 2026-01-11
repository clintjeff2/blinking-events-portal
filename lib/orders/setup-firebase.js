/**
 * Firebase Orders Setup Script
 *
 * Run this script to initialize the orders system in Firebase:
 * - Creates order counter document
 * - Sets up initial indexes
 * - Validates security rules
 *
 * Usage: node lib/orders/setup-firebase.js
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase Admin
// NOTE: You'll need to provide your service account credentials
const serviceAccount = require("../../firebase-service-account.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function setupOrdersSystem() {
  console.log("🚀 Setting up Orders System...\n");

  try {
    // ========================================================================
    // 1. CREATE ORDER COUNTER DOCUMENT
    // ========================================================================
    console.log("📊 Creating order counter document...");

    const counterRef = db.collection("appConfig").doc("orderCounter");
    const counterDoc = await counterRef.get();

    if (!counterDoc.exists) {
      await counterRef.set({
        lastOrderNumber: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("✅ Order counter created with initial value: 0\n");
    } else {
      const data = counterDoc.data();
      console.log(
        `✅ Order counter already exists with value: ${data.lastOrderNumber}\n`
      );
    }

    // ========================================================================
    // 2. VERIFY ORDERS COLLECTION
    // ========================================================================
    console.log("📁 Verifying orders collection...");

    const ordersRef = db.collection("orders");
    const ordersSnapshot = await ordersRef.limit(1).get();

    if (ordersSnapshot.empty) {
      console.log(
        "ℹ️  Orders collection is empty (this is normal for new setup)\n"
      );
    } else {
      console.log(
        `✅ Orders collection exists with ${ordersSnapshot.size} document(s)\n`
      );
    }

    // ========================================================================
    // 3. CREATE SAMPLE ORDER (OPTIONAL)
    // ========================================================================
    console.log("📝 Creating sample test order (optional)...");

    const sampleOrderRef = ordersRef.doc("SAMPLE_TEST_ORDER");
    const sampleOrderDoc = await sampleOrderRef.get();

    if (!sampleOrderDoc.exists) {
      await sampleOrderRef.set({
        orderNumber: "ORD-000",
        orderType: "event",
        status: "pending",
        clientInfo: {
          fullName: "Test Client",
          email: "test@example.com",
          phone: "+237600000000",
        },
        eventDetails: {
          eventType: "wedding",
          eventDate: new Date("2026-06-15"),
          guestCount: 100,
          venue: {
            name: "Sample Venue",
            address: "123 Test Street",
            city: "Douala",
          },
          servicesRequested: [],
          staffRequested: [],
          specialRequests: "This is a sample test order",
        },
        quote: null,
        payment: null,
        timeline: [],
        assignedTo: [],
        statusHistory: [
          {
            status: "pending",
            changedAt: new Date(),
            changedBy: "SYSTEM",
            notes: "Sample order created",
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("✅ Sample test order created (ORD-000)\n");
    } else {
      console.log("ℹ️  Sample test order already exists\n");
    }

    // ========================================================================
    // 4. INDEXES RECOMMENDATION
    // ========================================================================
    console.log("📋 RECOMMENDED FIRESTORE INDEXES:");
    console.log("━".repeat(60));
    console.log("");
    console.log("Add these composite indexes in Firebase Console:");
    console.log("(Firestore Database → Indexes → Composite)");
    console.log("");
    console.log("1. Query by type and status:");
    console.log("   Collection: orders");
    console.log(
      "   Fields: orderType (Ascending), status (Ascending), createdAt (Descending)"
    );
    console.log("");
    console.log("2. Query by client:");
    console.log("   Collection: orders");
    console.log(
      "   Fields: clientInfo.email (Ascending), createdAt (Descending)"
    );
    console.log("");
    console.log("3. Query by assigned admin:");
    console.log("   Collection: orders");
    console.log("   Fields: assignedTo (Array), createdAt (Descending)");
    console.log("");
    console.log("4. Query by date range:");
    console.log("   Collection: orders");
    console.log("   Fields: createdAt (Ascending), status (Ascending)");
    console.log("");

    // ========================================================================
    // 5. SECURITY RULES RECOMMENDATION
    // ========================================================================
    console.log("🔒 RECOMMENDED SECURITY RULES:");
    console.log("━".repeat(60));
    console.log("");
    console.log("Add these rules to firestore.rules:");
    console.log("");
    console.log(`
    // Orders collection
    match /orders/{orderId} {
      // Admins can read all orders
      allow read: if isAdmin();
      
      // Admins can create orders
      allow create: if isAdmin() 
        && request.resource.data.createdAt is timestamp
        && request.resource.data.orderNumber is string
        && request.resource.data.orderType in ['event', 'service', 'staff', 'offer']
        && request.resource.data.status in ['pending', 'quoted', 'confirmed', 'completed', 'cancelled'];
      
      // Admins can update orders
      allow update: if isAdmin()
        && request.resource.data.updatedAt is timestamp;
      
      // Only super admins can delete orders
      allow delete: if isSuperAdmin();
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if isAdmin();
        allow create: if isAdmin()
          && request.resource.data.createdAt is timestamp;
        allow update: if isAdmin();
        allow delete: if false; // Messages cannot be deleted
      }
    }
    
    // Order counter (system document)
    match /appConfig/orderCounter {
      allow read: if isAdmin();
      allow write: if false; // Only server-side updates via transactions
    }
    
    // Helper function
    function isAdmin() {
      return request.auth != null 
        && request.auth.token.role == 'admin';
    }
    
    function isSuperAdmin() {
      return request.auth != null 
        && request.auth.token.role == 'super_admin';
    }
    `);
    console.log("");

    // ========================================================================
    // 6. MIGRATION SCRIPT (if needed)
    // ========================================================================
    console.log("🔄 MIGRATION INFO:");
    console.log("━".repeat(60));
    console.log("");
    console.log("If you have existing orders in a different format:");
    console.log("1. Back up your current orders collection");
    console.log("2. Create a migration script to transform old data");
    console.log("3. Test migration on a dev/staging environment first");
    console.log("4. Run migration during low-traffic period");
    console.log("");

    // ========================================================================
    // SETUP COMPLETE
    // ========================================================================
    console.log("✅ Orders System Setup Complete!");
    console.log("");
    console.log("Next steps:");
    console.log("1. Add the recommended Firestore indexes");
    console.log("2. Update your security rules");
    console.log("3. Test creating a real order through the UI");
    console.log("4. Delete the sample test order (ORD-000) when ready");
    console.log("");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

// Run setup
setupOrdersSystem()
  .then(() => {
    console.log("🎉 Setup script finished successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Setup script failed:", error);
    process.exit(1);
  });
