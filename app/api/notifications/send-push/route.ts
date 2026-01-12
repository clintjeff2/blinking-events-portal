/**
 * API Route: Send FCM Push Notification
 *
 * This server-side route handles sending FCM push notifications using Firebase Admin SDK.
 * It's called by the client-side admin-notifications.ts utility.
 *
 * @created January 11, 2026
 */

import { NextRequest, NextResponse } from "next/server";
import { adminMessaging } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, title, body: messageBody, data } = body;

    // Validate required fields
    if (!token || !title || !messageBody) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: token, title, body",
        },
        { status: 400 }
      );
    }

    console.log(
      `[API/send-push] 📱 Sending push notification to token: ${token.substring(
        0,
        20
      )}...`
    );
    console.log(`[API/send-push] 📝 Title: "${title}"`);
    console.log(
      `[API/send-push] 📝 Body: "${messageBody.substring(0, 50)}..."`
    );

    // Prepare FCM message
    const message = {
      notification: {
        title,
        body: messageBody,
      },
      data: data || {},
      token,
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

    // Send via Firebase Admin SDK
    const response = await adminMessaging.send(message);

    console.log(`[API/send-push] ✅ Push sent successfully: ${response}`);

    return NextResponse.json({
      success: true,
      messageId: response,
    });
  } catch (error: any) {
    console.error(`[API/send-push] ❌ Error sending push notification:`, error);

    // Handle specific FCM errors
    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "invalid_token",
          message: "Invalid or expired FCM token",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to send push notification",
      },
      { status: 500 }
    );
  }
}
