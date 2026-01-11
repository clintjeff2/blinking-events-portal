/**
 * Reactivate FCM Tokens API Route
 *
 * This is a utility endpoint to reactivate FCM tokens that were incorrectly deactivated.
 * Use this when a user's tokens were deactivated due to payload errors (not token issues).
 *
 * POST /api/notifications/reactivate-tokens
 * Body: { userId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialize Firebase Admin if not already done
function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      return admin;
    } catch (error) {
      console.error("Error parsing service account JSON:", error);
    }
  }

  throw new Error("Firebase Admin SDK not configured");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    console.log(`[REACTIVATE_TOKENS] Reactivating tokens for user: ${userId}`);

    const adminInstance = getFirebaseAdmin();
    const db = adminInstance.firestore();

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const tokens = userData?.fcmTokens || [];

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No tokens to reactivate",
        tokensReactivated: 0,
      });
    }

    // Count inactive tokens
    const inactiveCount = tokens.filter(
      (t: { isActive: boolean }) => !t.isActive
    ).length;

    // Reactivate all tokens
    const reactivatedTokens = tokens.map(
      (t: { isActive: boolean; [key: string]: unknown }) => ({
        ...t,
        isActive: true,
      })
    );

    await userRef.update({
      fcmTokens: reactivatedTokens,
    });

    console.log(
      `[REACTIVATE_TOKENS] ✅ Reactivated ${inactiveCount} token(s) for user ${userId}`
    );

    return NextResponse.json({
      success: true,
      message: `Reactivated ${inactiveCount} inactive token(s)`,
      tokensReactivated: inactiveCount,
      totalTokens: tokens.length,
    });
  } catch (error) {
    console.error("[REACTIVATE_TOKENS] Error:", error);
    return NextResponse.json(
      { error: "Failed to reactivate tokens", details: String(error) },
      { status: 500 }
    );
  }
}
