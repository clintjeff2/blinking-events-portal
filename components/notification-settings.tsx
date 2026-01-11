/**
 * Notification Settings Component
 *
 * Allows users to manage their push notification preferences
 * including enabling/disabling notifications and testing delivery.
 *
 * @created January 10, 2026
 * @version 1.0.0
 */

"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  BellOff,
  BellRing,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Smartphone,
  Monitor,
} from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function NotificationSettings() {
  const { user } = useAuth();
  const {
    isSupported,
    permissionState,
    isRegistered,
    isLoading,
    error,
    requestPermission,
    unregister,
  } = usePushNotifications();

  /**
   * Handle enabling notifications
   */
  const handleEnableNotifications = async () => {
    const success = await requestPermission();
    if (success) {
      toast.success("Push notifications enabled successfully!");
    } else {
      toast.error(
        "Failed to enable push notifications. Please check your browser settings."
      );
    }
  };

  /**
   * Handle disabling notifications
   */
  const handleDisableNotifications = async () => {
    await unregister();
    toast.info("Push notifications disabled for this device.");
  };

  /**
   * Send a test notification
   */
  const handleTestNotification = () => {
    if (!isRegistered) {
      toast.error("Please enable notifications first.");
      return;
    }

    // Show a local notification for testing
    if (Notification.permission === "granted") {
      new Notification("Test Notification 🔔", {
        body: "Push notifications are working correctly!",
        icon: "/placeholder-logo.png",
        tag: "test-notification",
      });
      toast.success("Test notification sent!");
    }
  };

  /**
   * Get status badge based on current state
   */
  const getStatusBadge = () => {
    if (!isSupported) {
      return <Badge variant="destructive">Not Supported</Badge>;
    }
    if (permissionState === "denied") {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    if (isRegistered) {
      return (
        <Badge variant="default" className="bg-green-500">
          Enabled
        </Badge>
      );
    }
    if (permissionState === "granted") {
      return <Badge variant="secondary">Permission Granted</Badge>;
    }
    return <Badge variant="outline">Disabled</Badge>;
  };

  /**
   * Get permission status text
   */
  const getPermissionText = () => {
    switch (permissionState) {
      case "granted":
        return "Browser permission granted";
      case "denied":
        return "Blocked by browser - check browser settings";
      case "default":
        return "Permission not requested yet";
      case "unsupported":
        return "Push notifications not supported in this browser";
      default:
        return "Unknown permission state";
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isRegistered ? (
                <BellRing className="h-5 w-5 text-green-500" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <CardTitle>Push Notifications</CardTitle>
                <CardDescription>
                  Receive real-time updates about orders, messages, and more
                </CardDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Browser Support Warning */}
          {!isSupported && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Push notifications are not supported in this browser. Try using
                Chrome, Firefox, or Edge for full notification support.
              </AlertDescription>
            </Alert>
          )}

          {/* Permission Denied Warning */}
          {isSupported && permissionState === "denied" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Notifications are blocked by your browser. To enable
                notifications:
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Click the lock icon in your browser's address bar</li>
                  <li>Find "Notifications" in the site settings</li>
                  <li>Change the permission to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Enable/Disable Toggle */}
          {isSupported &&
            permissionState !== "denied" &&
            permissionState !== "unsupported" && (
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">
                    Enable Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {getPermissionText()}
                  </p>
                </div>
                <Switch
                  checked={isRegistered}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleEnableNotifications();
                    } else {
                      handleDisableNotifications();
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
            )}

          {/* Success State */}
          {isRegistered && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Push notifications are enabled! You'll receive updates about new
                orders, messages, and important events.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {!isRegistered && isSupported && permissionState !== "denied" && (
              <Button onClick={handleEnableNotifications} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enabling...
                  </>
                ) : (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    Enable Notifications
                  </>
                )}
              </Button>
            )}

            {isRegistered && (
              <>
                <Button variant="outline" onClick={handleTestNotification}>
                  <BellRing className="mr-2 h-4 w-4" />
                  Send Test Notification
                </Button>
                <Button
                  variant="outline"
                  onClick={handleEnableNotifications}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                  Refresh Token
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Device</CardTitle>
          <CardDescription>Notification status for this device</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Monitor className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Web Browser</p>
              <p className="text-sm text-muted-foreground">
                {navigator.userAgent.includes("Chrome")
                  ? "Google Chrome"
                  : navigator.userAgent.includes("Firefox")
                  ? "Mozilla Firefox"
                  : navigator.userAgent.includes("Safari")
                  ? "Safari"
                  : navigator.userAgent.includes("Edge")
                  ? "Microsoft Edge"
                  : "Unknown Browser"}
              </p>
            </div>
            <Badge variant={isRegistered ? "default" : "secondary"}>
              {isRegistered ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Push Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Push notifications help you stay updated with important events in
            real-time:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>New order requests and updates</li>
            <li>Messages from clients</li>
            <li>Payment confirmations</li>
            <li>Staff schedule changes</li>
            <li>System alerts and announcements</li>
          </ul>
          <p className="text-xs mt-4">
            You can disable notifications at any time from this settings page or
            from your browser settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default NotificationSettings;
