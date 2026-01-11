/**
 * Firebase Cloud Messaging (FCM) Configuration
 * Handles push notification setup and token management for web
 *
 * @created January 10, 2026
 * @version 1.1.0
 */

import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
  MessagePayload,
} from "firebase/messaging";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";
import app, { db } from "./config";
import type { FCMToken } from "@/types/notifications";

// ============================================================================
// Constants
// ============================================================================

// VAPID key for web push (get from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates)
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// Device ID storage key
const DEVICE_ID_KEY = "blinking_events_device_id";

// Firebase config for service worker
const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ============================================================================
// Initialization
// ============================================================================

let messagingInstance: Messaging | null = null;
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

/**
 * Initialize Firebase Messaging (only in browser)
 */
export function initializeMessaging(): Messaging | null {
  if (typeof window === "undefined") {
    console.log("[FCM] Not in browser environment, skipping initialization");
    return null;
  }

  if (!("Notification" in window)) {
    console.log("[FCM] This browser does not support notifications");
    return null;
  }

  if (!messagingInstance) {
    try {
      messagingInstance = getMessaging(app);
      console.log("[FCM] Messaging initialized successfully");
    } catch (error) {
      console.error("[FCM] Failed to initialize messaging:", error);
      return null;
    }
  }

  return messagingInstance;
}

/**
 * Get or generate a unique device ID
 */
function getDeviceId(): string {
  if (typeof window === "undefined") return "server";

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `web_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

// ============================================================================
// Token Management
// ============================================================================

/**
 * Request notification permission and get FCM token
 * @param userId - The user ID to associate with the token
 * @returns The FCM token or null if permission denied/error
 */
export async function requestNotificationPermission(
  userId: string
): Promise<string | null> {
  console.log("[FCM] Requesting notification permission for user:", userId);

  if (typeof window === "undefined") {
    console.log("[FCM] Not in browser environment");
    return null;
  }

  // IMPORTANT: Register service worker FIRST before requesting permissions
  console.log(
    "[FCM] Registering service worker before requesting permissions..."
  );
  const registration = await registerServiceWorker();
  if (!registration) {
    console.error("[FCM] Service worker registration failed, cannot proceed");
    return null;
  }

  const messaging = initializeMessaging();
  if (!messaging) {
    console.log("[FCM] Messaging not available");
    return null;
  }

  try {
    // Request permission - this will show the browser dialog
    console.log("[FCM] Showing permission dialog...");
    const permission = await Notification.requestPermission();
    console.log("[FCM] Permission result:", permission);

    if (permission !== "granted") {
      console.log("[FCM] Notification permission denied");
      return null;
    }

    // Check VAPID key
    if (!VAPID_KEY) {
      console.error(
        "[FCM] VAPID key not configured. Add NEXT_PUBLIC_FIREBASE_VAPID_KEY to .env"
      );
      console.error(
        "[FCM] Get VAPID key from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates"
      );
      return null;
    }

    console.log("[FCM] Getting FCM token with service worker registration...");

    // Get FCM token using the service worker registration
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    console.log("[FCM] Token obtained:", token ? "Success" : "Failed");

    if (token) {
      // Store token in Firestore
      console.log("[FCM] Storing token in Firestore...");
      await storeToken(userId, token);
      console.log("[FCM] Token stored successfully");
    } else {
      console.error("[FCM] Failed to obtain FCM token");
    }

    return token;
  } catch (error: any) {
    console.error("[FCM] Error getting token:", error);
    console.error("[FCM] Error details:", error.message, error.code);
    return null;
  }
}

/**
 * Store FCM token in user's document
 */
async function storeToken(userId: string, token: string): Promise<void> {
  console.log("[FCM] Storing token for user:", userId);
  console.log("[FCM] Token length:", token.length);

  const deviceId = getDeviceId();
  const now = Timestamp.now();

  const tokenData: FCMToken = {
    token,
    deviceId,
    platform: "web",
    tokenType: "fcm", // Web always uses FCM tokens
    createdAt: now,
    lastUsedAt: now,
    isActive: true,
  };

  console.log("[FCM] Token data prepared:", { deviceId, platform: "web" });

  try {
    const userRef = doc(db, "users", userId);
    console.log("[FCM] Fetching user document...");
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error("[FCM] User document not found:", userId);
      console.error("[FCM] Make sure the user document exists in Firestore");
      return;
    }

    console.log("[FCM] User document found");
    const userData = userDoc.data();
    const existingTokens: FCMToken[] = userData.fcmTokens || [];

    console.log("[FCM] Existing tokens count:", existingTokens.length);

    // Remove old token from same device
    const filteredTokens = existingTokens.filter(
      (t) => t.deviceId !== deviceId
    );

    console.log(
      "[FCM] Tokens after filtering same device:",
      filteredTokens.length
    );

    // Add new token
    filteredTokens.push(tokenData);

    console.log("[FCM] Total tokens after adding new:", filteredTokens.length);

    // Update user document
    console.log("[FCM] Updating user document in Firestore...");
    await updateDoc(userRef, {
      fcmTokens: filteredTokens,
      updatedAt: now,
    });

    console.log("[FCM] ✅ Token stored successfully in Firestore!");
    console.log("[FCM] User now has", filteredTokens.length, "active token(s)");
  } catch (error: any) {
    console.error("[FCM] ❌ Error storing token:", error);
    console.error("[FCM] Error details:", error.message);
    throw error;
  }
}

/**
 * Remove FCM token from user's document (on logout or token refresh)
 */
export async function removeToken(
  userId: string,
  token?: string
): Promise<void> {
  console.log("[FCM] Removing token for user:", userId);

  const deviceId = getDeviceId();

  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log("[FCM] User document not found");
      return;
    }

    const userData = userDoc.data();
    const existingTokens: FCMToken[] = userData.fcmTokens || [];

    // Remove token by deviceId or specific token
    const filteredTokens = existingTokens.filter((t) => {
      if (token) {
        return t.token !== token;
      }
      return t.deviceId !== deviceId;
    });

    await updateDoc(userRef, {
      fcmTokens: filteredTokens,
      updatedAt: Timestamp.now(),
    });

    console.log("[FCM] Token removed successfully");
  } catch (error) {
    console.error("[FCM] Error removing token:", error);
    throw error;
  }
}

/**
 * Deactivate all tokens for a user (on account disable/delete)
 */
export async function deactivateAllTokens(userId: string): Promise<void> {
  console.log("[FCM] Deactivating all tokens for user:", userId);

  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return;
    }

    const userData = userDoc.data();
    const existingTokens: FCMToken[] = userData.fcmTokens || [];

    // Mark all tokens as inactive
    const deactivatedTokens = existingTokens.map((t) => ({
      ...t,
      isActive: false,
    }));

    await updateDoc(userRef, {
      fcmTokens: deactivatedTokens,
      updatedAt: Timestamp.now(),
    });

    console.log("[FCM] All tokens deactivated");
  } catch (error) {
    console.error("[FCM] Error deactivating tokens:", error);
    throw error;
  }
}

// ============================================================================
// Message Handling
// ============================================================================

/**
 * Callback type for foreground messages
 */
export type OnMessageCallback = (payload: MessagePayload) => void;

/**
 * Set up foreground message listener
 * @param callback - Function to call when a message is received in foreground
 * @returns Unsubscribe function
 */
export function onForegroundMessage(
  callback: OnMessageCallback
): (() => void) | null {
  const messaging = initializeMessaging();
  if (!messaging) {
    console.log("[FCM] Messaging not available for foreground listener");
    return null;
  }

  console.log("[FCM] Setting up foreground message listener");

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log("[FCM] Foreground message received:", payload);
    callback(payload);
  });

  return unsubscribe;
}

/**
 * Display a notification when app is in foreground
 */
export function showLocalNotification(
  title: string,
  body: string,
  options?: NotificationOptions
): void {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/placeholder-logo.png",
      badge: "/placeholder-logo.png",
      ...options,
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission():
  | NotificationPermission
  | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Check if user has granted notification permission
 */
export function hasNotificationPermission(): boolean {
  return getNotificationPermission() === "granted";
}

// ============================================================================
// Service Worker Registration (for background messages)
// ============================================================================

/**
 * Register the Firebase messaging service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.log("[FCM] Service workers not supported");
    return null;
  }

  // Return existing registration if available
  if (serviceWorkerRegistration) {
    return serviceWorkerRegistration;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );
    console.log("[FCM] Service worker registered:", registration.scope);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    // Send Firebase config to service worker
    if (registration.active) {
      registration.active.postMessage({
        type: "FIREBASE_CONFIG",
        config: FIREBASE_CONFIG,
      });
      console.log("[FCM] Firebase config sent to service worker");
    }

    serviceWorkerRegistration = registration;
    return registration;
  } catch (error) {
    console.error("[FCM] Service worker registration failed:", error);
    return null;
  }
}

/**
 * Get the current service worker registration
 */
export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return serviceWorkerRegistration;
}
