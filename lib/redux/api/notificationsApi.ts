/**
 * Notifications API - RTK Query endpoints for push notification management
 *
 * Provides complete notification functionality:
 * - Send notifications to individual users
 * - Broadcast notifications to user groups
 * - Notification history and management
 * - FCM token management
 * - Notification analytics
 *
 * @created January 10, 2026
 * @version 1.0.0
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { firebaseApi } from "./firebaseApi";
import type {
  Notification,
  SerializedNotification,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  TargetAudience,
  NotificationChannel,
  NotificationReference,
  NotificationAction,
  NotificationStats,
  NotificationPreferences,
  FCMToken,
  CreateNotificationInput,
  CreateBroadcastNotificationInput,
  SendOrderNotificationInput,
  SendMessageNotificationInput,
  NotificationFilters,
  NotificationsQueryResult,
  NotificationAnalytics,
  RegisterFCMTokenInput,
  UpdateNotificationPreferencesInput,
  FCMMessagePayload,
} from "@/types/notifications";

// ============================================================================
// CONSTANTS
// ============================================================================

const NOTIFICATIONS_COLLECTION = "notifications";
const USERS_COLLECTION = "users";
const NOTIFICATION_PREFERENCES_COLLECTION = "notificationPreferences";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Serialize a Notification document for RTK Query
 */
function serializeNotification(
  notification: Notification
): SerializedNotification {
  return {
    ...notification,
    sentAt: notification.sentAt?.toDate().toISOString(),
    deliveredAt: notification.deliveredAt?.toDate().toISOString(),
    readAt: notification.readAt?.toDate().toISOString(),
    clickedAt: notification.clickedAt?.toDate().toISOString(),
    scheduledFor: notification.scheduledFor?.toDate().toISOString(),
    createdAt: notification.createdAt.toDate().toISOString(),
    updatedAt: notification.updatedAt.toDate().toISOString(),
  };
}

/**
 * Convert Firestore document to Notification object
 */
function docToNotification(docId: string, data: DocumentData): Notification {
  return {
    notificationId: docId,
    title: data.title || "",
    body: data.body || "",
    imageUrl: data.imageUrl,
    type: data.type || "info",
    priority: data.priority || "normal",
    recipientId: data.recipientId,
    recipientIds: data.recipientIds,
    targetAudience: data.targetAudience,
    reference: data.reference,
    actions: data.actions,
    channels: data.channels || ["push", "in_app"],
    status: data.status || "pending",
    sentAt: data.sentAt,
    deliveredAt: data.deliveredAt,
    failureReason: data.failureReason,
    isRead: data.isRead || false,
    readAt: data.readAt,
    clickedAt: data.clickedAt,
    scheduledFor: data.scheduledFor,
    senderId: data.senderId || "",
    senderName: data.senderName || "",
    createdAt: data.createdAt || Timestamp.now(),
    updatedAt: data.updatedAt || Timestamp.now(),
    stats: data.stats,
  };
}

/**
 * Get active FCM tokens for a user
 */
async function getUserTokens(userId: string): Promise<string[]> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data();
    const tokens: FCMToken[] = userData.fcmTokens || [];

    // Return only active tokens
    const activeTokens = tokens.filter((t) => t.isActive).map((t) => t.token);
    return activeTokens;
  } catch (error) {
    return [];
  }
}

/**
 * Re-activate all FCM tokens for a user
 * Use this to fix tokens that were incorrectly deactivated
 */
export async function reactivateUserTokens(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();
    const tokens: FCMToken[] = userData.fcmTokens || [];

    if (tokens.length === 0) {
      return false;
    }

    // Reactivate all tokens
    const reactivatedTokens = tokens.map((t) => ({
      ...t,
      isActive: true,
    }));

    await updateDoc(userRef, {
      fcmTokens: reactivatedTokens,
    });

    return true;
  } catch (error) {
    return false;
  }
}
/**
 * Get FCM tokens for multiple users
 */
async function getMultipleUserTokens(
  userIds: string[]
): Promise<Map<string, string[]>> {
  const tokenMap = new Map<string, string[]>();

  // Batch users into groups of 10 for efficient queries
  const batchSize = 10;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);

    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where("__name__", "in", batch));
    const snapshot = await getDocs(q);

    snapshot.docs.forEach((doc) => {
      const userData = doc.data();
      const tokens: FCMToken[] = userData.fcmTokens || [];
      const activeTokens = tokens.filter((t) => t.isActive).map((t) => t.token);
      if (activeTokens.length > 0) {
        tokenMap.set(doc.id, activeTokens);
      }
    });
  }

  return tokenMap;
}

/**
 * Get all user IDs matching a target audience
 */
async function getAudienceUserIds(audience: TargetAudience): Promise<string[]> {
  const usersRef = collection(db, USERS_COLLECTION);
  const constraints: QueryConstraint[] = [where("isActive", "==", true)];

  switch (audience) {
    case "all":
      // All active users with FCM tokens
      break;
    case "clients":
      constraints.push(where("role", "==", "client"));
      break;
    case "active_clients":
      // Clients with recent activity (last 30 days)
      const thirtyDaysAgo = Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
      constraints.push(where("role", "==", "client"));
      // Note: This would need a lastActiveAt field on users
      break;
    case "vip_clients":
      constraints.push(where("role", "==", "client"));
      constraints.push(where("isVip", "==", true));
      break;
    case "new_users":
      const sevenDaysAgo = Timestamp.fromDate(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      constraints.push(where("createdAt", ">=", sevenDaysAgo));
      break;
    case "staff":
      constraints.push(where("role", "==", "staff"));
      break;
    case "admins":
      constraints.push(where("role", "==", "admin"));
      break;
    default:
      break;
  }

  const q = query(usersRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs
    .filter((doc) => {
      const data = doc.data();
      const tokens = data.fcmTokens || [];
      return tokens.some((t: FCMToken) => t.isActive);
    })
    .map((doc) => doc.id);
}

/**
 * Send notification via the internal API route
 * This calls our Next.js API route which uses Firebase Admin SDK to send FCM messages
 */
async function triggerNotificationSend(
  notificationId: string,
  recipientId?: string,
  recipientIds?: string[]
): Promise<{
  success: boolean;
  stats?: { totalSuccess: number; totalFailure: number };
}> {
  try {
    // Get the notification data to send
    const notificationDoc = await getDoc(
      doc(db, NOTIFICATIONS_COLLECTION, notificationId)
    );

    if (!notificationDoc.exists()) {
      return { success: false };
    }

    const notificationData = notificationDoc.data();

    // Determine recipients
    const targetUserId = recipientId || notificationData.recipientId;
    const targetUserIds = recipientIds || notificationData.recipientIds;

    if (!targetUserId && (!targetUserIds || targetUserIds.length === 0)) {
      return { success: false };
    }

    // Build request body
    const requestBody: {
      userId?: string;
      userIds?: string[];
      notification: {
        title: string;
        body: string;
        imageUrl?: string;
        data: Record<string, string>;
      };
      priority: "high" | "normal";
    } = {
      userId: targetUserId,
      userIds: targetUserIds,
      notification: {
        title: notificationData.title,
        body: notificationData.body,
        // Only include imageUrl if it's a valid non-empty string
        ...(notificationData.imageUrl
          ? { imageUrl: notificationData.imageUrl }
          : {}),
        data: {
          notificationId,
          type: notificationData.type || "info",
          referenceType: notificationData.reference?.type || "",
          referenceId: notificationData.reference?.id || "",
        },
      },
      priority:
        notificationData.priority === "urgent" ||
        notificationData.priority === "high"
          ? "high"
          : "normal",
    };

    // Call our API route to send the notification
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      // Update notification status to failed
      await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
        status: "failed",
        failureReason: result.error || "Unknown error",
        updatedAt: serverTimestamp(),
      });

      return { success: false };
    }

    // Update notification status to delivered
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
      status: result.stats?.totalSuccess > 0 ? "delivered" : "failed",
      sentAt: serverTimestamp(),
      deliveredAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      stats: {
        totalRecipients:
          (result.stats?.totalSuccess || 0) + (result.stats?.totalFailure || 0),
        delivered: result.stats?.totalSuccess || 0,
        failed: result.stats?.totalFailure || 0,
      },
    });

    return { success: result.stats?.totalSuccess > 0, stats: result.stats };
  } catch (error) {
    // Update notification status to failed
    try {
      await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
        status: "failed",
        failureReason: String(error),
        updatedAt: serverTimestamp(),
      });
    } catch (updateError) {
      // Error updating notification status
    }

    return { success: false };
  }
}

// ============================================================================
// STANDALONE NOTIFICATION FUNCTIONS
// These can be imported and used directly by other modules
// ============================================================================

/**
 * Send a notification to a specific user
 * Can be used directly by other API modules (e.g., messaging)
 *
 * @param params - Notification parameters
 * @returns The created notification ID or null on failure
 */
export async function sendNotificationToUser(params: {
  recipientId: string;
  title: string;
  body: string;
  type: NotificationType;
  priority?: NotificationPriority;
  senderId: string;
  senderName: string;
  imageUrl?: string;
  reference?: NotificationReference;
  actions?: NotificationAction[];
  channels?: NotificationChannel[];
}): Promise<string | null> {
  try {
    const {
      recipientId,
      title,
      body,
      type,
      priority = "normal",
      senderId,
      senderName,
      imageUrl,
      reference,
      actions,
      channels = ["push", "in_app"],
    } = params;

    // Get user's FCM tokens
    const tokens = await getUserTokens(recipientId);

    // Still create the notification for in-app display even if no tokens

    // Create notification document
    const notificationData = {
      title,
      body,
      imageUrl: imageUrl || null,
      type,
      priority,
      recipientId,
      reference: reference || null,
      actions: actions || [],
      channels,
      status: tokens.length > 0 ? "pending" : "delivered", // If no tokens, it's only in-app
      isRead: false,
      senderId,
      senderName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, NOTIFICATIONS_COLLECTION),
      notificationData
    );

    // Trigger the actual push notification if tokens exist
    if (tokens.length > 0) {
      await triggerNotificationSend(docRef.id, recipientId);
    }

    return docRef.id;
  } catch (error) {
    return null;
  }
}

/**
 * Send a message notification specifically
 * Convenience function for messaging module
 */
export async function sendMessageNotification(params: {
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  messagePreview: string;
  conversationId: string;
  messageId: string;
}): Promise<string | null> {
  return sendNotificationToUser({
    recipientId: params.recipientId,
    title: `New message from ${params.senderName}`,
    body:
      params.messagePreview.length > 100
        ? params.messagePreview.substring(0, 97) + "..."
        : params.messagePreview,
    type: "message",
    priority: "high",
    senderId: params.senderId,
    senderName: params.senderName,
    imageUrl: params.senderAvatar,
    reference: {
      type: "conversation",
      id: params.conversationId,
      metadata: { messageId: params.messageId },
    },
    actions: [
      {
        id: "view_message",
        title: "View Message",
        action: `/messages/${params.conversationId}`,
      },
    ],
    channels: ["push", "in_app"],
  });
}

/**
 * Send an order notification
 * Convenience function for orders module
 */
export async function sendOrderNotification(params: {
  recipientId: string;
  orderId: string;
  orderNumber: string;
  status: string;
  senderId: string;
  senderName: string;
}): Promise<string | null> {
  const statusMessages: Record<string, { title: string; body: string }> = {
    confirmed: {
      title: "Order Confirmed! 🎉",
      body: `Your order #${params.orderNumber} has been confirmed.`,
    },
    processing: {
      title: "Order Processing",
      body: `Your order #${params.orderNumber} is being processed.`,
    },
    completed: {
      title: "Order Completed! ✨",
      body: `Your order #${params.orderNumber} has been completed.`,
    },
    cancelled: {
      title: "Order Cancelled",
      body: `Your order #${params.orderNumber} has been cancelled.`,
    },
    shipped: {
      title: "Order Shipped! 📦",
      body: `Your order #${params.orderNumber} has been shipped.`,
    },
    default: {
      title: "Order Update",
      body: `Your order #${params.orderNumber} status has been updated.`,
    },
  };

  const message = statusMessages[params.status] || statusMessages.default;

  return sendNotificationToUser({
    recipientId: params.recipientId,
    title: message.title,
    body: message.body,
    type: "order",
    priority: params.status === "confirmed" ? "high" : "normal",
    senderId: params.senderId,
    senderName: params.senderName,
    reference: {
      type: "order",
      id: params.orderId,
      metadata: { orderNumber: params.orderNumber },
    },
    actions: [
      {
        id: "view_order",
        title: "View Order",
        action: `/orders/${params.orderId}`,
      },
    ],
    channels: ["push", "in_app"],
  });
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const notificationsApi = firebaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ========================================================================
    // QUERIES
    // ========================================================================

    /**
     * Get paginated list of notifications with filters
     */
    getNotifications: builder.query<
      NotificationsQueryResult,
      { filters?: NotificationFilters; pageSize?: number; lastDocId?: string }
    >({
      async queryFn({ filters = {}, pageSize = 20, lastDocId }) {
        try {
          const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
          const constraints: QueryConstraint[] = [];

          // Apply filters
          if (filters.type) {
            constraints.push(where("type", "==", filters.type));
          }
          if (filters.status) {
            constraints.push(where("status", "==", filters.status));
          }
          if (filters.priority) {
            constraints.push(where("priority", "==", filters.priority));
          }
          if (filters.targetAudience) {
            constraints.push(
              where("targetAudience", "==", filters.targetAudience)
            );
          }
          if (filters.senderId) {
            constraints.push(where("senderId", "==", filters.senderId));
          }
          if (filters.fromDate) {
            constraints.push(
              where("createdAt", ">=", Timestamp.fromDate(filters.fromDate))
            );
          }
          if (filters.toDate) {
            constraints.push(
              where("createdAt", "<=", Timestamp.fromDate(filters.toDate))
            );
          }

          // Order by creation date
          constraints.push(orderBy("createdAt", "desc"));

          // Handle pagination
          if (lastDocId) {
            const lastDocRef = doc(db, NOTIFICATIONS_COLLECTION, lastDocId);
            const lastDocSnap = await getDoc(lastDocRef);
            if (lastDocSnap.exists()) {
              constraints.push(startAfter(lastDocSnap));
            }
          }

          constraints.push(limit(pageSize + 1)); // +1 to check if there are more

          const q = query(notificationsRef, ...constraints);
          const snapshot = await getDocs(q);

          const hasMore = snapshot.docs.length > pageSize;
          const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

          let notifications = docs.map((doc) =>
            serializeNotification(docToNotification(doc.id, doc.data()))
          );

          // Client-side search filter
          if (filters.searchQuery) {
            const searchLower = filters.searchQuery.toLowerCase();
            notifications = notifications.filter(
              (n) =>
                n.title.toLowerCase().includes(searchLower) ||
                n.body.toLowerCase().includes(searchLower)
            );
          }

          // Get total count
          const countQuery = query(
            notificationsRef,
            ...constraints.filter(
              (c) => c.type !== "limit" && c.type !== "startAfter"
            )
          );
          const countSnapshot = await getCountFromServer(notificationsRef);

          return {
            data: {
              notifications,
              total: countSnapshot.data().count,
              hasMore,
              lastDoc: docs[docs.length - 1]?.id,
            },
          };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.notifications.map(({ notificationId }) => ({
                type: "Notifications" as const,
                id: notificationId,
              })),
              { type: "Notifications", id: "LIST" },
            ]
          : [{ type: "Notifications", id: "LIST" }],
    }),

    /**
     * Get a single notification by ID
     */
    getNotificationById: builder.query<SerializedNotification, string>({
      async queryFn(notificationId) {
        try {
          const notificationRef = doc(
            db,
            NOTIFICATIONS_COLLECTION,
            notificationId
          );
          const notificationDoc = await getDoc(notificationRef);

          if (!notificationDoc.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Notification not found",
              },
            };
          }

          const notification = serializeNotification(
            docToNotification(notificationDoc.id, notificationDoc.data())
          );

          return { data: notification };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: (result, error, id) => [{ type: "Notifications", id }],
    }),

    /**
     * Get notifications for a specific user (for in-app notification center)
     */
    getUserNotifications: builder.query<
      NotificationsQueryResult,
      {
        userId: string;
        unreadOnly?: boolean;
        pageSize?: number;
        lastDocId?: string;
      }
    >({
      async queryFn({ userId, unreadOnly = false, pageSize = 20, lastDocId }) {
        try {
          const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
          const constraints: QueryConstraint[] = [
            where("recipientId", "==", userId),
          ];

          if (unreadOnly) {
            constraints.push(where("isRead", "==", false));
          }

          constraints.push(orderBy("createdAt", "desc"));

          if (lastDocId) {
            const lastDocRef = doc(db, NOTIFICATIONS_COLLECTION, lastDocId);
            const lastDocSnap = await getDoc(lastDocRef);
            if (lastDocSnap.exists()) {
              constraints.push(startAfter(lastDocSnap));
            }
          }

          constraints.push(limit(pageSize + 1));

          const q = query(notificationsRef, ...constraints);
          const snapshot = await getDocs(q);

          const hasMore = snapshot.docs.length > pageSize;
          const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

          const notifications = docs.map((doc) =>
            serializeNotification(docToNotification(doc.id, doc.data()))
          );

          return {
            data: {
              notifications,
              total: snapshot.size,
              hasMore,
              lastDoc: docs[docs.length - 1]?.id,
            },
          };
        } catch (error: any) {
          console.error(
            "[NotificationsAPI] getUserNotifications error:",
            error
          );
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: (result, error, { userId }) => [
        { type: "Notifications", id: `USER_${userId}` },
      ],
    }),

    /**
     * Get unread notification count for a user
     */
    getUnreadCount: builder.query<number, string>({
      async queryFn(userId) {
        try {
          const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
          const q = query(
            notificationsRef,
            where("recipientId", "==", userId),
            where("isRead", "==", false)
          );

          const snapshot = await getCountFromServer(q);
          return { data: snapshot.data().count };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: (result, error, userId) => [
        { type: "Notifications", id: `UNREAD_${userId}` },
      ],
    }),

    /**
     * Get notification analytics
     */
    getNotificationAnalytics: builder.query<
      NotificationAnalytics,
      { days?: number }
    >({
      async queryFn({ days = 30 }) {
        try {
          const fromDate = Timestamp.fromDate(
            new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          );
          const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
          const q = query(notificationsRef, where("createdAt", ">=", fromDate));

          const snapshot = await getDocs(q);

          let totalSent = 0;
          let totalDelivered = 0;
          let totalFailed = 0;
          let totalOpened = 0;
          let totalClicked = 0;
          const byType: Record<string, number> = {};
          const byChannel: Record<string, number> = {};
          const trendMap: Map<
            string,
            { sent: number; delivered: number; opened: number }
          > = new Map();

          snapshot.docs.forEach((doc) => {
            const data = doc.data();

            // Count by status
            if (data.status === "sent" || data.status === "delivered") {
              totalSent++;
              if (data.stats?.totalRecipients) {
                totalSent += data.stats.totalRecipients - 1;
              }
            }
            if (data.status === "delivered") {
              totalDelivered++;
              if (data.stats?.delivered) {
                totalDelivered += data.stats.delivered - 1;
              }
            }
            if (data.status === "failed") {
              totalFailed++;
            }
            if (data.isRead) {
              totalOpened++;
              if (data.stats?.opened) {
                totalOpened += data.stats.opened - 1;
              }
            }
            if (data.clickedAt) {
              totalClicked++;
              if (data.stats?.clicked) {
                totalClicked += data.stats.clicked - 1;
              }
            }

            // Count by type
            const type = data.type || "info";
            byType[type] = (byType[type] || 0) + 1;

            // Count by channel
            const channels: string[] = data.channels || ["push"];
            channels.forEach((channel) => {
              byChannel[channel] = (byChannel[channel] || 0) + 1;
            });

            // Trend data
            if (data.createdAt) {
              const dateKey = data.createdAt
                .toDate()
                .toISOString()
                .split("T")[0];
              const existing = trendMap.get(dateKey) || {
                sent: 0,
                delivered: 0,
                opened: 0,
              };
              existing.sent++;
              if (data.status === "delivered") existing.delivered++;
              if (data.isRead) existing.opened++;
              trendMap.set(dateKey, existing);
            }
          });

          // Convert trend map to array
          const trend = Array.from(trendMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));

          const analytics: NotificationAnalytics = {
            totalSent,
            totalDelivered,
            totalFailed,
            openRate:
              totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
            clickRate:
              totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
            byType: byType as Record<NotificationType, number>,
            byChannel: byChannel as Record<NotificationChannel, number>,
            trend,
          };

          return { data: analytics };
        } catch (error: any) {
          console.error(
            "[NotificationsAPI] getNotificationAnalytics error:",
            error
          );
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: [{ type: "Notifications", id: "ANALYTICS" }],
    }),

    /**
     * Get notification preferences for a user
     */
    getNotificationPreferences: builder.query<
      NotificationPreferences | null,
      string
    >({
      async queryFn(userId) {
        try {
          const prefsRef = doc(db, NOTIFICATION_PREFERENCES_COLLECTION, userId);
          const prefsDoc = await getDoc(prefsRef);

          if (!prefsDoc.exists()) {
            return { data: null };
          }

          const data = prefsDoc.data();
          return {
            data: {
              userId,
              pushEnabled: data.pushEnabled ?? true,
              emailEnabled: data.emailEnabled ?? true,
              smsEnabled: data.smsEnabled ?? false,
              orderNotifications: data.orderNotifications ?? true,
              messageNotifications: data.messageNotifications ?? true,
              promoNotifications: data.promoNotifications ?? true,
              reminderNotifications: data.reminderNotifications ?? true,
              infoNotifications: data.infoNotifications ?? true,
              quietHoursEnabled: data.quietHoursEnabled ?? false,
              quietHoursStart: data.quietHoursStart,
              quietHoursEnd: data.quietHoursEnd,
              updatedAt: data.updatedAt || Timestamp.now(),
            },
          };
        } catch (error: any) {
          console.error(
            "[NotificationsAPI] getNotificationPreferences error:",
            error
          );
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: (result, error, userId) => [
        { type: "NotificationPreferences", id: userId },
      ],
    }),

    // ========================================================================
    // MUTATIONS
    // ========================================================================

    /**
     * Send notification to a single user
     */
    sendNotification: builder.mutation<
      SerializedNotification,
      CreateNotificationInput
    >({
      async queryFn(input) {
        try {
          // Create notification for single user

          const now = Timestamp.now();
          const scheduledFor = input.scheduledFor
            ? Timestamp.fromDate(input.scheduledFor)
            : undefined;

          // Get admin info (would come from auth context in real implementation)
          const senderId = "admin-001"; // TODO: Get from auth
          const senderName = "Admin";

          const notificationData: any = {
            title: input.title,
            body: input.body,
            type: input.type,
            priority: input.priority || "normal",
            recipientId: input.recipientId,
            channels: input.channels || ["push", "in_app"],
            // Set to "pending" so Cloud Function picks it up, or "scheduled" if scheduled for later
            status: scheduledFor ? "scheduled" : "pending",
            sentAt: null,
            isRead: false,
            senderId,
            senderName,
            createdAt: now,
            updatedAt: now,
          };

          // Only include optional fields if they have values
          if (input.imageUrl) notificationData.imageUrl = input.imageUrl;
          if (input.reference) notificationData.reference = input.reference;
          if (input.actions) notificationData.actions = input.actions;
          if (scheduledFor) notificationData.scheduledFor = scheduledFor;

          const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
          const docRef = await addDoc(notificationsRef, notificationData);

          // Trigger the notification send if not scheduled
          if (!scheduledFor) {
            await triggerNotificationSend(docRef.id, input.recipientId);
          }

          const notification = serializeNotification({
            ...notificationData,
            notificationId: docRef.id,
            sentAt: notificationData.sentAt || undefined,
            scheduledFor: scheduledFor || undefined,
          } as Notification);

          return { data: notification };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: [
        { type: "Notifications", id: "LIST" },
        { type: "Notifications", id: "ANALYTICS" },
      ],
    }),

    /**
     * Send broadcast notification to multiple users
     */
    sendBroadcastNotification: builder.mutation<
      SerializedNotification,
      CreateBroadcastNotificationInput
    >({
      async queryFn(input) {
        try {
          // Send broadcast notification to multiple users

          const now = Timestamp.now();
          const scheduledFor = input.scheduledFor
            ? Timestamp.fromDate(input.scheduledFor)
            : undefined;

          // Get recipient IDs based on audience
          let recipientIds: string[] = [];
          if (input.targetAudience === "custom" && input.customRecipientIds) {
            recipientIds = input.customRecipientIds;
          } else {
            recipientIds = await getAudienceUserIds(input.targetAudience);
          }

          // Get admin info
          const senderId = "admin-001"; // TODO: Get from auth
          const senderName = "Admin";

          const notificationData: any = {
            title: input.title,
            body: input.body,
            type: input.type,
            priority: input.priority || "normal",
            recipientIds,
            targetAudience: input.targetAudience,
            channels: input.channels || ["push", "in_app"],
            // Set to "pending" so Cloud Function picks it up, or "scheduled" if scheduled for later
            status: scheduledFor ? "scheduled" : "pending",
            sentAt: null,
            isRead: false,
            senderId,
            senderName,
            createdAt: now,
            updatedAt: now,
            stats: {
              totalRecipients: recipientIds.length,
              delivered: 0,
              failed: 0,
              opened: 0,
              clicked: 0,
            },
          };

          // Only include optional fields if they have values
          if (input.imageUrl) notificationData.imageUrl = input.imageUrl;
          if (input.reference) notificationData.reference = input.reference;
          if (input.actions) notificationData.actions = input.actions;
          if (scheduledFor) notificationData.scheduledFor = scheduledFor;

          const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
          const docRef = await addDoc(notificationsRef, notificationData);

          // Create individual notification records for each recipient (for in-app notifications)
          if (!scheduledFor && recipientIds.length > 0) {
            const batch = writeBatch(db);

            // Limit batch to 500 operations
            const batchRecipients = recipientIds.slice(0, 500);

            for (const recipientId of batchRecipients) {
              const individualRef = doc(
                collection(db, NOTIFICATIONS_COLLECTION)
              );
              // Create a clean individual notification object without broadcast-specific fields
              const individualNotification: any = {
                title: notificationData.title,
                body: notificationData.body,
                type: notificationData.type,
                priority: notificationData.priority,
                recipientId,
                channels: notificationData.channels,
                status: notificationData.status,
                sentAt: null,
                isRead: false,
                senderId: notificationData.senderId,
                senderName: notificationData.senderName,
                createdAt: notificationData.createdAt,
                updatedAt: notificationData.updatedAt,
                parentNotificationId: docRef.id,
              };
              // Only include optional fields if they exist
              if (notificationData.imageUrl)
                individualNotification.imageUrl = notificationData.imageUrl;
              if (notificationData.reference)
                individualNotification.reference = notificationData.reference;
              if (notificationData.actions)
                individualNotification.actions = notificationData.actions;

              batch.set(individualRef, individualNotification);
            }

            await batch.commit();

            // Trigger push notification send to all recipients
            await triggerNotificationSend(docRef.id, undefined, recipientIds);
          }

          const notification = serializeNotification({
            ...notificationData,
            notificationId: docRef.id,
            sentAt: notificationData.sentAt || undefined,
            scheduledFor: scheduledFor || undefined,
          } as Notification);

          return { data: notification };
        } catch (error: any) {
          console.error(
            "[NotificationsAPI] sendBroadcastNotification error:",
            error
          );
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: [
        { type: "Notifications", id: "LIST" },
        { type: "Notifications", id: "ANALYTICS" },
      ],
    }),

    /**
     * Send order-related notification
     */
    sendOrderNotification: builder.mutation<
      SerializedNotification,
      SendOrderNotificationInput
    >({
      async queryFn(input) {
        try {
          const now = Timestamp.now();

          // Generate title and body based on notification type
          let title = "";
          let body = "";

          switch (input.type) {
            case "new_order":
              title = "Order Received";
              body = `Your order ${input.orderNumber} has been received and is being processed.`;
              break;
            case "status_update":
              title = "Order Status Update";
              body = `Your order ${input.orderNumber} is now ${input.status}.`;
              break;
            case "quote_sent":
              title = "Quote Ready";
              body = `A quote for your order ${input.orderNumber} is ready for review.`;
              break;
            case "payment_received":
              title = "Payment Confirmed";
              body = `Payment for order ${input.orderNumber} has been received. Thank you!`;
              break;
            case "reminder":
              title = "Event Reminder";
              body = `Reminder: Your event (${input.orderNumber}) is coming up soon!`;
              break;
          }

          if (input.additionalMessage) {
            body += ` ${input.additionalMessage}`;
          }

          const senderId = "admin-001";
          const senderName = "Admin";

          const notificationData = {
            title,
            body,
            type: "order" as NotificationType,
            priority:
              input.type === "reminder"
                ? "high"
                : ("normal" as NotificationPriority),
            recipientId: input.clientId,
            reference: {
              type: "order" as const,
              id: input.orderId,
              metadata: {
                orderNumber: input.orderNumber,
                notificationType: input.type,
              },
            },
            channels: ["push", "in_app"] as NotificationChannel[],
            status: "pending" as NotificationStatus,
            isRead: false,
            senderId,
            senderName,
            createdAt: now,
            updatedAt: now,
          };

          const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
          const docRef = await addDoc(notificationsRef, notificationData);

          // Trigger push notification
          await triggerNotificationSend(docRef.id, input.clientId);

          const notification = serializeNotification({
            ...notificationData,
            notificationId: docRef.id,
            sentAt: undefined,
          } as Notification);

          return { data: notification };
        } catch (error: any) {
          console.error(
            "[NotificationsAPI] sendOrderNotification error:",
            error
          );
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: [
        { type: "Notifications", id: "LIST" },
        { type: "Notifications", id: "ANALYTICS" },
      ],
    }),

    /**
     * Send message notification (when new message is received)
     */
    sendMessageNotification: builder.mutation<
      SerializedNotification,
      SendMessageNotificationInput
    >({
      async queryFn(input) {
        try {
          const now = Timestamp.now();

          const title = `New message from ${input.senderName}`;
          const body =
            input.messagePreview.length > 100
              ? input.messagePreview.substring(0, 100) + "..."
              : input.messagePreview;

          const senderId = "admin-001";
          const senderName = "System";

          const notificationData = {
            title,
            body,
            type: "message" as NotificationType,
            priority: "normal" as NotificationPriority,
            recipientId: input.recipientId,
            reference: {
              type: "conversation" as const,
              id: input.conversationId,
              metadata: input.orderId
                ? {
                    orderId: input.orderId,
                    orderNumber: input.orderNumber || "",
                  }
                : undefined,
            },
            channels: ["push", "in_app"] as NotificationChannel[],
            status: "pending" as NotificationStatus,
            isRead: false,
            senderId,
            senderName,
            createdAt: now,
            updatedAt: now,
          };

          const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
          const docRef = await addDoc(notificationsRef, notificationData);

          // Trigger push notification
          await triggerNotificationSend(docRef.id, input.recipientId);

          const notification = serializeNotification({
            ...notificationData,
            notificationId: docRef.id,
            sentAt: undefined,
          } as Notification);

          return { data: notification };
        } catch (error: any) {
          console.error(
            "[NotificationsAPI] sendMessageNotification error:",
            error
          );
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: (result, error, { recipientId }) => [
        { type: "Notifications", id: "LIST" },
        { type: "Notifications", id: `USER_${recipientId}` },
      ],
    }),

    /**
     * Mark notification as read
     */
    markNotificationAsRead: builder.mutation<void, string>({
      async queryFn(notificationId) {
        try {
          console.log(
            "[NotificationsAPI] markNotificationAsRead:",
            notificationId
          );

          const notificationRef = doc(
            db,
            NOTIFICATIONS_COLLECTION,
            notificationId
          );
          await updateDoc(notificationRef, {
            isRead: true,
            readAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          return { data: undefined };
        } catch (error: any) {
          console.error(
            "[NotificationsAPI] markNotificationAsRead error:",
            error
          );
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: (result, error, notificationId) => [
        { type: "Notifications", id: notificationId },
      ],
    }),

    /**
     * Mark all notifications as read for a user
     */
    markAllNotificationsAsRead: builder.mutation<void, string>({
      async queryFn(userId) {
        try {
          const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
          const q = query(
            notificationsRef,
            where("recipientId", "==", userId),
            where("isRead", "==", false)
          );

          const snapshot = await getDocs(q);

          if (snapshot.empty) {
            return { data: undefined };
          }

          const batch = writeBatch(db);
          const now = Timestamp.now();

          snapshot.docs.forEach((doc) => {
            batch.update(doc.ref, {
              isRead: true,
              readAt: now,
              updatedAt: now,
            });
          });

          await batch.commit();

          return { data: undefined };
        } catch (error: any) {
          console.error(
            "[NotificationsAPI] markAllNotificationsAsRead error:",
            error
          );
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: (result, error, userId) => [
        { type: "Notifications", id: `USER_${userId}` },
        { type: "Notifications", id: `UNREAD_${userId}` },
      ],
    }),

    /**
     * Record notification click
     */
    recordNotificationClick: builder.mutation<void, string>({
      async queryFn(notificationId) {
        try {
          const notificationRef = doc(
            db,
            NOTIFICATIONS_COLLECTION,
            notificationId
          );
          await updateDoc(notificationRef, {
            clickedAt: Timestamp.now(),
            isRead: true,
            readAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          return { data: undefined };
        } catch (error: any) {
          console.error(
            "[NotificationsAPI] recordNotificationClick error:",
            error
          );
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: (result, error, notificationId) => [
        { type: "Notifications", id: notificationId },
        { type: "Notifications", id: "ANALYTICS" },
      ],
    }),

    /**
     * Delete a notification
     */
    deleteNotification: builder.mutation<void, string>({
      async queryFn(notificationId) {
        try {
          const notificationRef = doc(
            db,
            NOTIFICATIONS_COLLECTION,
            notificationId
          );
          await deleteDoc(notificationRef);

          return { data: undefined };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: [{ type: "Notifications", id: "LIST" }],
    }),

    /**
     * Cancel a scheduled notification
     */
    cancelScheduledNotification: builder.mutation<void, string>({
      async queryFn(notificationId) {
        try {
          console.log(
            "[NotificationsAPI] cancelScheduledNotification:",
            notificationId
          );

          const notificationRef = doc(
            db,
            NOTIFICATIONS_COLLECTION,
            notificationId
          );
          await updateDoc(notificationRef, {
            status: "cancelled",
            updatedAt: Timestamp.now(),
          });

          return { data: undefined };
        } catch (error: any) {
          console.error(
            "[NotificationsAPI] cancelScheduledNotification error:",
            error
          );
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: (result, error, notificationId) => [
        { type: "Notifications", id: notificationId },
        { type: "Notifications", id: "LIST" },
      ],
    }),

    /**
     * Register FCM token for a user
     */
    registerFCMToken: builder.mutation<void, RegisterFCMTokenInput>({
      async queryFn(input) {
        try {
          const userRef = doc(db, USERS_COLLECTION, input.userId);
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            return {
              error: { status: "CUSTOM_ERROR", error: "User not found" },
            };
          }

          const now = Timestamp.now();
          const userData = userDoc.data();
          const existingTokens: FCMToken[] = userData.fcmTokens || [];

          // Remove old token from same device
          const filteredTokens = existingTokens.filter(
            (t) => t.deviceId !== input.deviceId
          );

          // Add new token
          const newToken: FCMToken = {
            token: input.token,
            deviceId: input.deviceId,
            platform: input.platform,
            tokenType: "fcm", // Web tokens are always FCM
            createdAt: now,
            lastUsedAt: now,
            isActive: true,
          };

          filteredTokens.push(newToken);

          await updateDoc(userRef, {
            fcmTokens: filteredTokens,
            updatedAt: now,
          });

          return { data: undefined };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: "Users", id: userId },
      ],
    }),

    /**
     * Remove FCM token
     */
    removeFCMToken: builder.mutation<
      void,
      { userId: string; deviceId: string }
    >({
      async queryFn({ userId, deviceId }) {
        try {
          const userRef = doc(db, USERS_COLLECTION, userId);
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            return { data: undefined };
          }

          const userData = userDoc.data();
          const existingTokens: FCMToken[] = userData.fcmTokens || [];
          const filteredTokens = existingTokens.filter(
            (t) => t.deviceId !== deviceId
          );

          await updateDoc(userRef, {
            fcmTokens: filteredTokens,
            updatedAt: Timestamp.now(),
          });

          return { data: undefined };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: "Users", id: userId },
      ],
    }),

    /**
     * Update notification preferences
     */
    updateNotificationPreferences: builder.mutation<
      void,
      UpdateNotificationPreferencesInput
    >({
      async queryFn({ userId, preferences }) {
        try {
          const prefsRef = doc(db, NOTIFICATION_PREFERENCES_COLLECTION, userId);

          await updateDoc(prefsRef, {
            ...preferences,
            updatedAt: Timestamp.now(),
          }).catch(async () => {
            // If document doesn't exist, create it
            const { setDoc } = await import("firebase/firestore");
            await setDoc(prefsRef, {
              userId,
              pushEnabled: true,
              emailEnabled: true,
              smsEnabled: false,
              orderNotifications: true,
              messageNotifications: true,
              promoNotifications: true,
              reminderNotifications: true,
              infoNotifications: true,
              quietHoursEnabled: false,
              ...preferences,
              updatedAt: Timestamp.now(),
            });
          });

          return { data: undefined };
        } catch (error: any) {
          console.error(
            "[NotificationsAPI] updateNotificationPreferences error:",
            error
          );
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: "NotificationPreferences", id: userId },
      ],
    }),
  }),
});

// Export hooks
export const {
  // Queries
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useGetNotificationByIdQuery,
  useGetUserNotificationsQuery,
  useGetUnreadCountQuery,
  useGetNotificationAnalyticsQuery,
  useGetNotificationPreferencesQuery,
  // Mutations
  useSendNotificationMutation,
  useSendBroadcastNotificationMutation,
  useSendOrderNotificationMutation,
  useSendMessageNotificationMutation,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useRecordNotificationClickMutation,
  useDeleteNotificationMutation,
  useCancelScheduledNotificationMutation,
  useRegisterFCMTokenMutation,
  useRemoveFCMTokenMutation,
  useUpdateNotificationPreferencesMutation,
} = notificationsApi;
