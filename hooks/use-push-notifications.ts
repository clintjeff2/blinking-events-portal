/**
 * Push Notifications Hook
 *
 * Custom hook for managing push notifications in the web admin portal.
 * Handles FCM token registration, foreground messages, and notification display.
 *
 * @created January 10, 2026
 * @version 1.0.0
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./use-auth";
import {
  requestNotificationPermission,
  removeToken,
  onForegroundMessage,
  showLocalNotification,
  isPushSupported,
  getNotificationPermission,
  registerServiceWorker,
} from "@/lib/firebase/fcm";
import { useToast } from "./use-toast";
import type { MessagePayload } from "firebase/messaging";

interface UsePushNotificationsReturn {
  /** Whether push notifications are supported in this browser */
  isSupported: boolean;
  /** Current permission state */
  permissionState: NotificationPermission | "unsupported";
  /** Whether FCM token is registered */
  isRegistered: boolean;
  /** Whether registration is in progress */
  isLoading: boolean;
  /** Any error during registration */
  error: string | null;
  /** FCM token if registered */
  token: string | null;
  /** Request notification permission and register token */
  requestPermission: () => Promise<boolean>;
  /** Unregister the current token */
  unregister: () => Promise<void>;
}

/**
 * Hook for managing push notifications
 * Automatically registers FCM token when user is authenticated
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [isSupported] = useState(() => isPushSupported());
  const [permissionState, setPermissionState] = useState<
    NotificationPermission | "unsupported"
  >(() => getNotificationPermission());
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Track if we've set up the foreground listener
  const foregroundListenerRef = useRef<(() => void) | null>(null);

  /**
   * Handle foreground messages - show toast notification
   */
  const handleForegroundMessage = useCallback(
    (payload: MessagePayload) => {
      console.log(
        "[usePushNotifications] Foreground message received:",
        payload
      );

      const { notification, data } = payload;

      if (notification) {
        // Show toast notification
        toast({
          title: notification.title || "New Notification",
          description: notification.body || "",
          duration: 5000,
        });

        // Also show browser notification
        showLocalNotification(
          notification.title || "New Notification",
          notification.body || "",
          {
            tag: data?.notificationId as string,
            data: data,
          }
        );
      }
    },
    [toast]
  );

  /**
   * Register service worker and set up foreground listener
   */
  useEffect(() => {
    if (!isSupported) return;

    // Register service worker
    registerServiceWorker().catch((error) => {
      console.error(
        "[usePushNotifications] Service worker registration failed:",
        error
      );
    });

    // Set up foreground message listener
    const unsubscribe = onForegroundMessage(handleForegroundMessage);
    foregroundListenerRef.current = unsubscribe;

    return () => {
      if (foregroundListenerRef.current) {
        foregroundListenerRef.current();
        foregroundListenerRef.current = null;
      }
    };
  }, [isSupported, handleForegroundMessage]);

  /**
   * Request notification permission and register FCM token
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push notifications are not supported in this browser");
      return false;
    }

    if (!user?.uid) {
      setError("User must be logged in to register for notifications");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fcmToken = await requestNotificationPermission(user.uid);

      // Update permission state after request
      setPermissionState(getNotificationPermission());

      if (fcmToken) {
        setToken(fcmToken);
        setIsRegistered(true);
        console.log(
          "[usePushNotifications] Successfully registered for push notifications"
        );
        return true;
      } else {
        setError("Failed to get notification permission or token");
        setIsRegistered(false);
        return false;
      }
    } catch (err: any) {
      console.error("[usePushNotifications] Error requesting permission:", err);
      setError(err.message || "Failed to register for notifications");
      setIsRegistered(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user?.uid]);

  /**
   * Unregister the current FCM token
   */
  const unregister = useCallback(async (): Promise<void> => {
    if (!user?.uid || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      await removeToken(user.uid, token);
      setToken(null);
      setIsRegistered(false);
      console.log(
        "[usePushNotifications] Successfully unregistered from push notifications"
      );
    } catch (err: any) {
      console.error("[usePushNotifications] Error unregistering:", err);
      setError(err.message || "Failed to unregister from notifications");
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, token]);

  /**
   * Auto-register when user is authenticated and permission was previously granted
   */
  useEffect(() => {
    if (
      isAuthenticated &&
      user?.uid &&
      isSupported &&
      permissionState === "granted" &&
      !isRegistered &&
      !isLoading
    ) {
      // Auto-register if permission was already granted
      requestPermission();
    }
  }, [
    isAuthenticated,
    user?.uid,
    isSupported,
    permissionState,
    isRegistered,
    isLoading,
    requestPermission,
  ]);

  return {
    isSupported,
    permissionState,
    isRegistered,
    isLoading,
    error,
    token,
    requestPermission,
    unregister,
  };
}

/**
 * Standalone function to check if notifications are enabled for the current user
 */
export function checkNotificationStatus(): {
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
  isEnabled: boolean;
} {
  const isSupported = isPushSupported();
  const permission = getNotificationPermission();

  return {
    isSupported,
    permission,
    isEnabled: permission === "granted",
  };
}
