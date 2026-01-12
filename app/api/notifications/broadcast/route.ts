/**
 * API Route: Send Broadcast FCM Push Notifications
 *
 * This server-side route handles sending FCM push notifications to multiple users.
 * It's more efficient for broadcast notifications.
 *
 * @created January 11, 2026
 */

import { NextRequest, NextResponse } from "next/server";
import { adminMessaging, adminDb } from "@/lib/firebase/admin";

interface FCMToken {
  token: string;
  deviceId: string;
  platform: string;
  isActive: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, body: messageBody, data, notificationType } = body;

    // Validate required fields
    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: title, body" },
        { status: 400 }
      );
    }

    console.log(`[API/broadcast] 🚀 Starting broadcast push notification...`);
    console.log(`[API/broadcast] 📝 Title: "${title}"`);
    console.log(
      `[API/broadcast] 📝 Body: "${messageBody.substring(0, 100)}..."`
    );
    console.log(`[API/broadcast] 📝 Type: ${notificationType || "general"}`);

    // Get all users with FCM tokens from Firestore
    const usersSnapshot = await adminDb.collection("users").get();

    const tokens: string[] = [];
    let totalUsers = 0;

    usersSnapshot.docs.forEach((doc: any) => {
      const userData = doc.data();
      const fcmTokens: FCMToken[] = userData.fcmTokens || [];

      // Get all active tokens
      fcmTokens.forEach((tokenData) => {
        if (tokenData.isActive !== false && tokenData.token) {
          tokens.push(tokenData.token);
        }
      });

      if (fcmTokens.length > 0) {
        totalUsers++;
      }
    });

    console.log(
      `[API/broadcast] 📱 Found ${tokens.length} FCM tokens from ${totalUsers} users`
    );

    if (tokens.length === 0) {
      console.log(`[API/broadcast] ⚠️ No FCM tokens found, skipping push`);
      return NextResponse.json({
        success: true,
        sent: 0,
        failed: 0,
        message: "No FCM tokens found",
      });
    }

    // Send notifications in batches (FCM limit is 500 per request)
    const batchSize = 500;
    let sent = 0;
    let failed = 0;
    const invalidTokens: string[] = [];

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);

      // Prepare multicast message
      const message = {
        notification: {
          title,
          body: messageBody,
        },
        data: data || {},
        tokens: batch,
        android: {
          priority: "high" as const,
          notification: {
            sound: "default",
            channelId: "blinking_events_notifications",
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

      try {
        const response = await adminMessaging.sendEachForMulticast(message);

        sent += response.successCount;
        failed += response.failureCount;

        // Track invalid tokens for cleanup
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            const error = resp.error;
            if (
              error?.code === "messaging/invalid-registration-token" ||
              error?.code === "messaging/registration-token-not-registered"
            ) {
              invalidTokens.push(batch[idx]);
            }
          }
        });

        console.log(
          `[API/broadcast] Batch ${Math.floor(i / batchSize) + 1}: ${
            response.successCount
          } sent, ${response.failureCount} failed`
        );
      } catch (batchError: any) {
        console.error(`[API/broadcast] ❌ Batch error:`, batchError.message);
        failed += batch.length;
      }
    }

    console.log(`[API/broadcast] 📊 Broadcast complete:`);
    console.log(`[API/broadcast]    ✅ Sent: ${sent}`);
    console.log(`[API/broadcast]    ❌ Failed: ${failed}`);
    if (invalidTokens.length > 0) {
      console.log(
        `[API/broadcast]    🧹 Invalid tokens: ${invalidTokens.length} (should be cleaned up)`
      );
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      invalidTokens: invalidTokens.length,
      message: `Broadcast sent: ${sent} success, ${failed} failed`,
    });
  } catch (error: any) {
    console.error(`[API/broadcast] ❌ Error sending broadcast:`, error);

    return NextResponse.json(
      { success: false, message: error.message || "Failed to send broadcast" },
      { status: 500 }
    );
  }
}
