/**
 * Firebase Admin SDK Configuration
 * Used for server-side operations like sending FCM notifications
 *
 * This file should only be imported in server-side code (API routes, server components)
 */

import admin from "firebase-admin";

// Initialize Firebase Admin SDK (singleton pattern)
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // Check if we have service account credentials
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccount) {
    try {
      const parsedServiceAccount = JSON.parse(serviceAccount);
      return admin.initializeApp({
        credential: admin.credential.cert(parsedServiceAccount),
        projectId: parsedServiceAccount.project_id,
      });
    } catch (error) {
      console.error("[FirebaseAdmin] Error parsing service account:", error);
    }
  }

  // Fallback: Try to use default credentials (works in Google Cloud environments)
  // or initialize with just project ID for limited functionality
  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "blinking-events";

  console.warn(
    "[FirebaseAdmin] No service account found. FCM sending will use legacy HTTP API."
  );

  return admin.initializeApp({
    projectId,
  });
}

// Initialize the app
const firebaseAdmin = initializeFirebaseAdmin();

// Export admin services
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminMessaging = admin.messaging();

export default firebaseAdmin;
