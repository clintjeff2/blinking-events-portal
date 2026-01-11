/**
 * Send Push Notification API Route
 *
 * This API route handles sending push notifications via Firebase Cloud Messaging.
 * It supports both FCM tokens (web/Android) and Expo push tokens (Expo apps).
 *
 * POST /api/notifications/send
 */

import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

// ============================================================================
// DEBUG LOGGING HELPER
// ============================================================================
const DEBUG = true; // Set to false to disable verbose logging

function debugLog(category: string, message: string, data?: unknown) {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] 🔔 [${category}] ${message}`);
    if (data !== undefined) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

function errorLog(category: string, message: string, error?: unknown) {
  const timestamp = new Date().toISOString();
  console.error(`\n[${timestamp}] ❌ [${category}] ${message}`);
  if (error) {
    console.error(error);
  }
}

function successLog(category: string, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ✅ [${category}] ${message}`);
  if (data !== undefined) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Types
interface FCMToken {
  token: string;
  deviceId: string;
  platform: "web" | "ios" | "android";
  tokenType: "fcm" | "expo" | "apns";
  isActive: boolean;
}

interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

interface SendNotificationRequest {
  // Target options (one of these must be provided)
  userId?: string; // Send to specific user
  userIds?: string[]; // Send to multiple users
  tokens?: string[]; // Send to specific tokens directly

  // Notification content
  notification: NotificationPayload;

  // Optional settings
  priority?: "high" | "normal";
  android?: {
    channelId?: string;
    priority?: "high" | "normal";
  };
  apns?: {
    badge?: number;
    sound?: string;
  };
}

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================
let firebaseInitialized = false;

function getFirebaseAdmin() {
  debugLog("FIREBASE_INIT", "Checking Firebase Admin SDK initialization...");

  if (admin.apps.length > 0) {
    debugLog("FIREBASE_INIT", "Firebase Admin already initialized", {
      appsCount: admin.apps.length,
    });
    return admin;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  debugLog("FIREBASE_INIT", "Service account key present?", {
    hasKey: !!serviceAccountKey,
    keyLength: serviceAccountKey?.length || 0,
    keyPreview: serviceAccountKey
      ? serviceAccountKey.substring(0, 50) + "..."
      : "N/A",
  });

  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      debugLog("FIREBASE_INIT", "Parsed service account", {
        project_id: serviceAccount.project_id,
        client_email: serviceAccount.client_email,
        hasPrivateKey: !!serviceAccount.private_key,
      });

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      firebaseInitialized = true;
      successLog(
        "FIREBASE_INIT",
        "Firebase Admin SDK initialized successfully!"
      );
      return admin;
    } catch (error) {
      errorLog("FIREBASE_INIT", "Error parsing service account JSON", error);
    }
  }

  // Fallback - won't work for FCM
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  debugLog("FIREBASE_INIT", "Falling back to project ID only", { projectId });

  if (projectId) {
    admin.initializeApp({ projectId });
    errorLog(
      "FIREBASE_INIT",
      "WARNING: Initialized without credentials - FCM will NOT work!"
    );
    return admin;
  }

  throw new Error(
    "Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable."
  );
}

// ============================================================================
// GET USER TOKENS
// ============================================================================

/**
 * Get FCM tokens for a user from Firestore
 */
async function getUserTokens(userId: string): Promise<FCMToken[]> {
  debugLog("GET_TOKENS", `Fetching tokens for user: ${userId}`);

  try {
    const adminInstance = getFirebaseAdmin();
    const db = adminInstance.firestore();

    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      errorLog("GET_TOKENS", `User document NOT FOUND: ${userId}`);
      return [];
    }

    const userData = userDoc.data();
    debugLog("GET_TOKENS", `User document found for: ${userId}`, {
      hasUserData: !!userData,
      hasFcmTokens: !!userData?.fcmTokens,
      fcmTokensCount: userData?.fcmTokens?.length || 0,
      userEmail: userData?.email || "N/A",
      userRole: userData?.role || "N/A",
    });

    const allTokens: FCMToken[] = userData?.fcmTokens || [];
    const activeTokens = allTokens.filter((t) => t.isActive);

    debugLog("GET_TOKENS", `Token breakdown for user ${userId}:`, {
      totalTokens: allTokens.length,
      activeTokens: activeTokens.length,
      inactiveTokens: allTokens.length - activeTokens.length,
      tokenDetails: activeTokens.map((t) => ({
        platform: t.platform,
        tokenType: t.tokenType,
        tokenPreview: t.token.substring(0, 30) + "...",
        deviceId: t.deviceId,
      })),
    });

    return activeTokens;
  } catch (error) {
    errorLog("GET_TOKENS", `Error getting tokens for user ${userId}`, error);
    return [];
  }
}

/**
 * Get tokens for multiple users
 */
async function getMultipleUserTokens(
  userIds: string[]
): Promise<Map<string, FCMToken[]>> {
  debugLog(
    "GET_MULTIPLE_TOKENS",
    `Fetching tokens for ${userIds.length} users`,
    { userIds }
  );

  const tokenMap = new Map<string, FCMToken[]>();

  const adminInstance = getFirebaseAdmin();
  const db = adminInstance.firestore();

  // Batch fetch users in groups of 10 (Firestore limit for 'in' queries)
  const batchSize = 10;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    debugLog(
      "GET_MULTIPLE_TOKENS",
      `Processing batch ${Math.floor(i / batchSize) + 1}`,
      { batchUserIds: batch }
    );

    try {
      const snapshot = await db
        .collection("users")
        .where(admin.firestore.FieldPath.documentId(), "in", batch)
        .get();

      debugLog(
        "GET_MULTIPLE_TOKENS",
        `Batch query returned ${snapshot.docs.length} documents`
      );

      snapshot.docs.forEach((doc) => {
        const userData = doc.data();
        const allTokens: FCMToken[] = userData.fcmTokens || [];
        const activeTokens = allTokens.filter((t: FCMToken) => t.isActive);

        debugLog("GET_MULTIPLE_TOKENS", `User ${doc.id}:`, {
          totalTokens: allTokens.length,
          activeTokens: activeTokens.length,
        });

        if (activeTokens.length > 0) {
          tokenMap.set(doc.id, activeTokens);
        }
      });
    } catch (error) {
      errorLog("GET_MULTIPLE_TOKENS", `Error fetching batch`, error);
    }
  }

  successLog(
    "GET_MULTIPLE_TOKENS",
    `Completed. Found tokens for ${tokenMap.size} users`
  );
  return tokenMap;
}

// ============================================================================
// SEND FCM NOTIFICATION
// ============================================================================

/**
 * Send notification via FCM
 */
async function sendFCMNotification(
  tokens: string[],
  notification: NotificationPayload,
  options?: {
    priority?: "high" | "normal";
    android?: { channelId?: string };
    data?: Record<string, string>;
  }
): Promise<{ success: number; failure: number; failedTokens: string[] }> {
  debugLog(
    "FCM_SEND",
    `Attempting to send FCM notification to ${tokens.length} tokens`
  );

  if (tokens.length === 0) {
    debugLog("FCM_SEND", "No FCM tokens to send to - skipping");
    return { success: 0, failure: 0, failedTokens: [] };
  }

  debugLog("FCM_SEND", "Token details:", {
    count: tokens.length,
    tokens: tokens.map((t) => t.substring(0, 40) + "..."),
  });

  try {
    const adminInstance = getFirebaseAdmin();
    const messaging = adminInstance.messaging();

    debugLog("FCM_SEND", "Got Firebase Messaging instance");

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
        // Only include imageUrl if it's a valid non-empty string
        ...(notification.imageUrl ? { imageUrl: notification.imageUrl } : {}),
      },
      data: options?.data || {},
      android: {
        priority: options?.priority === "high" ? "high" : "normal",
        notification: {
          channelId: options?.android?.channelId || "default",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      webpush: {
        notification: {
          icon: "/logo.png",
          badge: "/logo.png",
        },
        fcmOptions: {
          link: "/",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    debugLog("FCM_SEND", "Sending FCM message:", {
      title: notification.title,
      body: notification.body,
      dataKeys: Object.keys(options?.data || {}),
      tokenCount: tokens.length,
    });

    const response = await messaging.sendEachForMulticast(message);

    debugLog("FCM_SEND", "FCM Response received:", {
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalResponses: response.responses.length,
    });

    // Only mark tokens as failed if the error indicates the TOKEN is invalid
    // Don't mark as failed for payload errors (those are our fault, not the token's)
    const TOKEN_INVALID_ERRORS = [
      "messaging/invalid-registration-token",
      "messaging/registration-token-not-registered",
      "messaging/invalid-recipient",
      "messaging/mismatched-credential",
    ];

    const failedTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code || "";
        const isTokenInvalid = TOKEN_INVALID_ERRORS.some((e) =>
          errorCode.includes(e)
        );

        if (isTokenInvalid) {
          // Only add to failed tokens if the token itself is invalid
          failedTokens.push(tokens[idx]);
          errorLog(
            "FCM_SEND",
            `Token ${idx + 1} is INVALID and will be deactivated:`,
            {
              token: tokens[idx].substring(0, 40) + "...",
              errorCode: resp.error?.code,
              errorMessage: resp.error?.message,
            }
          );
        } else {
          // Payload or other error - don't deactivate the token
          errorLog(
            "FCM_SEND",
            `Failed to send to token ${idx + 1} (NOT a token issue):`,
            {
              token: tokens[idx].substring(0, 40) + "...",
              errorCode: resp.error?.code,
              errorMessage: resp.error?.message,
            }
          );
        }
      } else {
        debugLog("FCM_SEND", `Successfully sent to token ${idx + 1}`, {
          messageId: resp.messageId,
        });
      }
    });

    const result = {
      success: response.successCount,
      failure: response.failureCount,
      failedTokens,
    };

    if (response.successCount > 0) {
      successLog("FCM_SEND", `FCM send completed`, result);
    } else {
      errorLog("FCM_SEND", `All FCM sends failed`, result);
    }

    return result;
  } catch (error) {
    errorLog("FCM_SEND", "FCM send error", error);
    return {
      success: 0,
      failure: tokens.length,
      failedTokens: tokens,
    };
  }
}

// ============================================================================
// SEND EXPO PUSH NOTIFICATION
// ============================================================================

/**
 * Send notification via Expo Push Service
 */
async function sendExpoPushNotification(
  tokens: string[],
  notification: NotificationPayload,
  data?: Record<string, string>
): Promise<{ success: number; failure: number; failedTokens: string[] }> {
  debugLog(
    "EXPO_SEND",
    `Attempting to send Expo notification to ${tokens.length} tokens`
  );

  if (tokens.length === 0) {
    debugLog("EXPO_SEND", "No Expo tokens to send to - skipping");
    return { success: 0, failure: 0, failedTokens: [] };
  }

  // Filter valid Expo tokens
  const validTokens = tokens.filter((token) =>
    token.startsWith("ExponentPushToken[")
  );
  const invalidTokens = tokens.filter(
    (token) => !token.startsWith("ExponentPushToken[")
  );

  debugLog("EXPO_SEND", "Token validation:", {
    totalTokens: tokens.length,
    validExpoTokens: validTokens.length,
    invalidTokens: invalidTokens.length,
    validTokenPreviews: validTokens.map((t) => t.substring(0, 40) + "..."),
  });

  if (validTokens.length === 0) {
    errorLog("EXPO_SEND", "No valid Expo tokens found");
    return {
      success: 0,
      failure: tokens.length,
      failedTokens: tokens,
    };
  }

  try {
    // Prepare messages for Expo Push API
    const messages = validTokens.map((token) => ({
      to: token,
      sound: "default" as const,
      title: notification.title,
      body: notification.body,
      data: data || {},
      priority: "high" as const,
      channelId: "default",
    }));

    debugLog("EXPO_SEND", "Prepared Expo messages:", {
      messageCount: messages.length,
      sampleMessage: messages[0],
    });

    // Send to Expo Push API
    debugLog("EXPO_SEND", "Calling Expo Push API...");
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    debugLog("EXPO_SEND", "Expo API response status:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorText = await response.text();
      errorLog(
        "EXPO_SEND",
        `Expo Push API error: ${response.status}`,
        errorText
      );
      throw new Error(`Expo Push API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    debugLog("EXPO_SEND", "Expo API response body:", result);

    // Count successes and failures
    let success = 0;
    let failure = invalidTokens.length;
    const failedTokens = [...invalidTokens];

    if (result.data) {
      result.data.forEach(
        (
          ticket: {
            status: string;
            message?: string;
            id?: string;
            details?: { error?: string };
          },
          idx: number
        ) => {
          if (ticket.status === "ok") {
            success++;
            debugLog("EXPO_SEND", `Ticket ${idx + 1} succeeded:`, {
              ticketId: ticket.id,
            });
          } else {
            failure++;
            failedTokens.push(validTokens[idx]);
            errorLog("EXPO_SEND", `Ticket ${idx + 1} failed:`, {
              status: ticket.status,
              message: ticket.message,
              error: ticket.details?.error,
            });
          }
        }
      );
    }

    const finalResult = { success, failure, failedTokens };

    if (success > 0) {
      successLog("EXPO_SEND", "Expo send completed", finalResult);
    } else {
      errorLog("EXPO_SEND", "All Expo sends failed", finalResult);
    }

    return finalResult;
  } catch (error) {
    errorLog("EXPO_SEND", "Expo Push error", error);
    return {
      success: 0,
      failure: tokens.length,
      failedTokens: tokens,
    };
  }
}

/**
 * Deactivate failed tokens in Firestore
 */
async function deactivateFailedTokens(
  userTokenMap: Map<string, string[]>
): Promise<void> {
  debugLog(
    "DEACTIVATE_TOKENS",
    `Deactivating tokens for ${userTokenMap.size} users`
  );

  try {
    const adminInstance = getFirebaseAdmin();
    const db = adminInstance.firestore();
    const batch = db.batch();

    for (const [userId, failedTokenStrings] of userTokenMap) {
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        debugLog("DEACTIVATE_TOKENS", `User ${userId} not found, skipping`);
        continue;
      }

      const userData = userDoc.data();
      const tokens: FCMToken[] = userData?.fcmTokens || [];

      const updatedTokens = tokens.map((t) =>
        failedTokenStrings.includes(t.token) ? { ...t, isActive: false } : t
      );

      batch.update(userRef, { fcmTokens: updatedTokens });
      debugLog(
        "DEACTIVATE_TOKENS",
        `Marked ${failedTokenStrings.length} tokens as inactive for user ${userId}`
      );
    }

    await batch.commit();
    successLog("DEACTIVATE_TOKENS", "Failed tokens deactivated successfully");
  } catch (error) {
    errorLog("DEACTIVATE_TOKENS", "Error deactivating tokens", error);
  }
}

// ============================================================================
// POST HANDLER
// ============================================================================

/**
 * POST handler for sending notifications
 */
export async function POST(request: NextRequest) {
  console.log("\n");
  console.log("═".repeat(80));
  console.log("🔔 NOTIFICATION API CALLED - " + new Date().toISOString());
  console.log("═".repeat(80));

  try {
    // Parse request body
    const body: SendNotificationRequest = await request.json();

    debugLog("REQUEST", "Incoming notification request:", {
      hasUserId: !!body.userId,
      userId: body.userId,
      hasUserIds: !!body.userIds?.length,
      userIdsCount: body.userIds?.length || 0,
      hasTokens: !!body.tokens?.length,
      tokensCount: body.tokens?.length || 0,
      notificationTitle: body.notification?.title,
      notificationBody: body.notification?.body,
      hasData: !!body.notification?.data,
      dataKeys: Object.keys(body.notification?.data || {}),
    });

    // Validate request
    if (!body.notification?.title || !body.notification?.body) {
      errorLog("VALIDATION", "Missing notification title or body");
      return NextResponse.json(
        { error: "Missing notification title or body" },
        { status: 400 }
      );
    }

    if (!body.userId && !body.userIds?.length && !body.tokens?.length) {
      errorLog(
        "VALIDATION",
        "No target specified - must provide userId, userIds, or tokens"
      );
      return NextResponse.json(
        { error: "Must provide userId, userIds, or tokens" },
        { status: 400 }
      );
    }

    successLog("VALIDATION", "Request validation passed");

    // Collect all tokens
    let allFcmTokens: string[] = [];
    let allExpoTokens: string[] = [];
    const userToTokensMap = new Map<string, string[]>();

    // If direct tokens provided
    if (body.tokens?.length) {
      debugLog(
        "TOKEN_COLLECTION",
        `Processing ${body.tokens.length} direct tokens`
      );
      body.tokens.forEach((token) => {
        if (token.startsWith("ExponentPushToken[")) {
          allExpoTokens.push(token);
        } else {
          allFcmTokens.push(token);
        }
      });
    }

    // If user ID(s) provided, fetch their tokens
    if (body.userId) {
      debugLog(
        "TOKEN_COLLECTION",
        `Fetching tokens for single user: ${body.userId}`
      );
      const tokens = await getUserTokens(body.userId);

      if (tokens.length === 0) {
        errorLog(
          "TOKEN_COLLECTION",
          `⚠️ NO TOKENS FOUND for user ${body.userId}!`
        );
        errorLog(
          "TOKEN_COLLECTION",
          "This user has no registered push tokens - they won't receive notifications"
        );
      }

      tokens.forEach((t) => {
        if (
          t.tokenType === "expo" ||
          t.token.startsWith("ExponentPushToken[")
        ) {
          allExpoTokens.push(t.token);
        } else {
          allFcmTokens.push(t.token);
        }

        const existing = userToTokensMap.get(body.userId!) || [];
        existing.push(t.token);
        userToTokensMap.set(body.userId!, existing);
      });
    }

    if (body.userIds?.length) {
      debugLog(
        "TOKEN_COLLECTION",
        `Fetching tokens for ${body.userIds.length} users`
      );
      const userTokens = await getMultipleUserTokens(body.userIds);

      if (userTokens.size === 0) {
        errorLog(
          "TOKEN_COLLECTION",
          "⚠️ NO TOKENS FOUND for any of the specified users!"
        );
      }

      userTokens.forEach((tokens, userId) => {
        tokens.forEach((t) => {
          if (
            t.tokenType === "expo" ||
            t.token.startsWith("ExponentPushToken[")
          ) {
            allExpoTokens.push(t.token);
          } else {
            allFcmTokens.push(t.token);
          }

          const existing = userToTokensMap.get(userId) || [];
          existing.push(t.token);
          userToTokensMap.set(userId, existing);
        });
      });
    }

    // Remove duplicates
    allFcmTokens = [...new Set(allFcmTokens)];
    allExpoTokens = [...new Set(allExpoTokens)];

    debugLog("TOKEN_SUMMARY", "Final token counts:", {
      fcmTokens: allFcmTokens.length,
      expoTokens: allExpoTokens.length,
      totalTokens: allFcmTokens.length + allExpoTokens.length,
      usersWithTokens: userToTokensMap.size,
    });

    // Check if we have any tokens at all
    if (allFcmTokens.length === 0 && allExpoTokens.length === 0) {
      errorLog(
        "TOKEN_SUMMARY",
        "❌ NO TOKENS TO SEND TO! The notification will not be delivered."
      );
      return NextResponse.json({
        success: false,
        error: "No push tokens found for the specified user(s)",
        stats: {
          totalSuccess: 0,
          totalFailure: 0,
          fcmSuccess: 0,
          fcmFailure: 0,
          expoSuccess: 0,
          expoFailure: 0,
        },
      });
    }

    // Send notifications
    debugLog("SEND", "Starting notification delivery...");

    const [fcmResult, expoResult] = await Promise.all([
      sendFCMNotification(allFcmTokens, body.notification, {
        priority: body.priority,
        android: body.android,
        data: body.notification.data,
      }),
      sendExpoPushNotification(
        allExpoTokens,
        body.notification,
        body.notification.data
      ),
    ]);

    // Combine results
    const totalSuccess = fcmResult.success + expoResult.success;
    const totalFailure = fcmResult.failure + expoResult.failure;
    const allFailedTokens = [
      ...fcmResult.failedTokens,
      ...expoResult.failedTokens,
    ];

    debugLog("RESULTS", "Send results:", {
      totalSuccess,
      totalFailure,
      fcmSuccess: fcmResult.success,
      fcmFailure: fcmResult.failure,
      expoSuccess: expoResult.success,
      expoFailure: expoResult.failure,
      failedTokensCount: allFailedTokens.length,
    });

    // Deactivate failed tokens
    if (allFailedTokens.length > 0) {
      debugLog(
        "CLEANUP",
        `${allFailedTokens.length} tokens failed - will deactivate`
      );
      const failedTokensByUser = new Map<string, string[]>();
      userToTokensMap.forEach((tokens, userId) => {
        const failed = tokens.filter((t) => allFailedTokens.includes(t));
        if (failed.length > 0) {
          failedTokensByUser.set(userId, failed);
        }
      });

      if (failedTokensByUser.size > 0) {
        await deactivateFailedTokens(failedTokensByUser);
      }
    }

    const finalResponse = {
      success: totalSuccess > 0,
      stats: {
        totalSuccess,
        totalFailure,
        fcmSuccess: fcmResult.success,
        fcmFailure: fcmResult.failure,
        expoSuccess: expoResult.success,
        expoFailure: expoResult.failure,
      },
    };

    if (totalSuccess > 0) {
      successLog(
        "FINAL",
        "✅ Notification API completed successfully",
        finalResponse
      );
    } else {
      errorLog(
        "FINAL",
        "❌ Notification API completed with NO successful deliveries",
        finalResponse
      );
    }

    console.log("═".repeat(80));
    console.log("\n");

    return NextResponse.json(finalResponse);
  } catch (error) {
    errorLog("FATAL", "Notification API fatal error", error);
    console.log("═".repeat(80));
    console.log("\n");

    return NextResponse.json(
      { error: "Failed to send notification", details: String(error) },
      { status: 500 }
    );
  }
}
