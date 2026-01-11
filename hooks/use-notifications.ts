/**
 * useNotifications Hook
 * Real-time listener for user notifications
 *
 * @created January 10, 2026
 * @version 1.0.0
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  Timestamp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type {
  Notification,
  SerializedNotification,
} from "@/types/notifications";

interface UseNotificationsOptions {
  userId: string | null;
  unreadOnly?: boolean;
  maxCount?: number;
  enabled?: boolean;
}

interface UseNotificationsReturn {
  notifications: SerializedNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

/**
 * Serialize a notification for state management
 */
function serializeNotification(
  docId: string,
  data: any
): SerializedNotification {
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
    sentAt: data.sentAt?.toDate().toISOString(),
    deliveredAt: data.deliveredAt?.toDate().toISOString(),
    failureReason: data.failureReason,
    isRead: data.isRead || false,
    readAt: data.readAt?.toDate().toISOString(),
    clickedAt: data.clickedAt?.toDate().toISOString(),
    scheduledFor: data.scheduledFor?.toDate().toISOString(),
    senderId: data.senderId || "",
    senderName: data.senderName || "",
    createdAt:
      data.createdAt?.toDate().toISOString() || new Date().toISOString(),
    updatedAt:
      data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
    stats: data.stats,
  };
}

/**
 * Hook for real-time notification updates
 */
export function useNotifications({
  userId,
  unreadOnly = false,
  maxCount = 50,
  enabled = true,
}: UseNotificationsOptions): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<SerializedNotification[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[useNotifications] Effect running with:", {
      userId,
      unreadOnly,
      maxCount,
      enabled,
    });

    if (!enabled || !userId) {
      console.log("[useNotifications] Not enabled or no userId");
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    console.log("[useNotifications] Setting up listener for user:", userId);

    const notificationsRef = collection(db, "notifications");

    // Build query
    const constraints: QueryConstraint[] = [where("recipientId", "==", userId)];

    if (unreadOnly) {
      constraints.push(where("isRead", "==", false));
    }

    constraints.push(orderBy("createdAt", "desc"));
    constraints.push(limit(maxCount));

    const q = query(notificationsRef, ...constraints);

    console.log("[useNotifications] Query created, subscribing...");

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(
          "[useNotifications] Snapshot received, docs:",
          snapshot.size
        );

        const notifs: SerializedNotification[] = snapshot.docs.map((doc) =>
          serializeNotification(doc.id, doc.data())
        );

        setNotifications(notifs);

        // Count unread
        const unread = notifs.filter((n) => !n.isRead).length;
        setUnreadCount(unread);

        setLoading(false);
      },
      (err) => {
        console.error("[useNotifications] Error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log("[useNotifications] Unsubscribing");
      unsubscribe();
    };
  }, [userId, unreadOnly, maxCount, enabled]);

  return { notifications, unreadCount, loading, error };
}

/**
 * Hook for unread notification count only (lighter weight)
 */
export function useUnreadNotificationCount(userId: string | null): {
  count: number;
  loading: boolean;
} {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("recipientId", "==", userId),
      where("isRead", "==", false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCount(snapshot.size);
        setLoading(false);
      },
      (err) => {
        console.error("[useUnreadNotificationCount] Error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { count, loading };
}

export default useNotifications;
