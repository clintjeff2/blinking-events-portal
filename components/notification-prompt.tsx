/**
 * Notification Permission Prompt
 *
 * Shows a banner prompting users to enable push notifications.
 * This component handles the user interaction required by browsers
 * to request notification permissions.
 *
 * @created January 10, 2026
 * @version 1.0.0
 */

"use client";

import React, { useState, useEffect } from "react";
import { X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import {
  requestNotificationPermission,
  getNotificationPermission,
  isPushSupported,
  registerServiceWorker,
} from "@/lib/firebase/fcm";
import { toast } from "sonner";

const DISMISSED_KEY = "notification_prompt_dismissed";
const DISMISSED_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export function NotificationPrompt() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const checkShouldShow = async () => {
      if (!user?.uid) {
        setShow(false);
        return;
      }

      // Check if push is supported
      if (!isPushSupported()) {
        setShow(false);
        return;
      }

      // Check current permission state
      const permission = getNotificationPermission();

      // Don't show if already granted or denied
      if (permission === "granted" || permission === "denied") {
        setShow(false);
        return;
      }

      // Check if user dismissed recently
      const dismissedData = localStorage.getItem(DISMISSED_KEY);
      if (dismissedData) {
        const { timestamp } = JSON.parse(dismissedData);
        const elapsed = Date.now() - timestamp;
        if (elapsed < DISMISSED_EXPIRY) {
          setShow(false);
          return;
        }
      }

      // Register service worker first
      try {
        await registerServiceWorker();
        console.log("[NotificationPrompt] Service worker registered");
      } catch (error) {
        console.error(
          "[NotificationPrompt] Service worker registration failed:",
          error
        );
      }

      // Show the prompt only if still in 'default' state
      // (AuthProvider might have auto-registered already)
      const currentPermission = getNotificationPermission();
      if (currentPermission === "default") {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    // Delay showing the prompt to give AuthProvider time to auto-register
    // This prevents double prompts
    const timer = setTimeout(checkShouldShow, 3000);
    return () => clearTimeout(timer);
  }, [user?.uid]);

  const handleEnable = async () => {
    if (!user?.uid) {
      toast.error("Please log in to enable notifications");
      return;
    }

    setLoading(true);

    try {
      console.log("[NotificationPrompt] Requesting notification permission...");
      const token = await requestNotificationPermission(user.uid);

      if (token) {
        toast.success("Push notifications enabled! 🔔");
        console.log("[NotificationPrompt] FCM token registered:", token);
        setShow(false);
      } else {
        const permission = getNotificationPermission();
        if (permission === "denied") {
          toast.error(
            "Notification permission denied. Please enable it in your browser settings.",
            { duration: 5000 }
          );
        } else {
          toast.error("Failed to enable notifications. Please try again.");
        }
      }
    } catch (error: any) {
      console.error(
        "[NotificationPrompt] Error enabling notifications:",
        error
      );
      toast.error(error.message || "Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    // Save dismissal with timestamp
    localStorage.setItem(
      DISMISSED_KEY,
      JSON.stringify({ timestamp: Date.now() })
    );
    setShow(false);
  };

  if (!show) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Alert className="bg-card shadow-lg border-2">
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex items-start gap-3 pr-6">
          <Bell className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1 space-y-2">
            <AlertDescription className="text-sm">
              <strong className="font-semibold block mb-1">
                Enable Push Notifications
              </strong>
              Stay updated with new orders, messages, and important events in
              real-time.
            </AlertDescription>
            <div className="flex gap-2">
              <Button
                onClick={handleEnable}
                disabled={loading}
                size="sm"
                className="h-8"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-3 w-3 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    Enabling...
                  </>
                ) : (
                  "Enable Notifications"
                )}
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="h-8"
              >
                Not Now
              </Button>
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
}
