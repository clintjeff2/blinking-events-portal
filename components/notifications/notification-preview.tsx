/**
 * Notification Preview Component
 * Shows how the notification will appear to users
 *
 * @created January 10, 2026
 * @version 1.0.0
 */

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, Smartphone, Monitor, Mail } from "lucide-react";

interface NotificationPreviewProps {
  title: string;
  body: string;
  imageUrl?: string;
  type?: "push" | "in_app" | "email";
}

export function NotificationPreview({
  title = "Notification Title",
  body = "Your notification message will appear here...",
  imageUrl,
  type = "push",
}: NotificationPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preview</CardTitle>
        <CardDescription>How your notification will appear</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mobile Push Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4" />
            <span>Mobile Push Notification</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <Bell className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm truncate">
                    {title || "Notification Title"}
                  </p>
                  <span className="text-xs text-muted-foreground">now</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {body || "Your notification message will appear here..."}
                </p>
                {imageUrl && (
                  <div className="mt-2 rounded-md overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Notification"
                      className="w-full h-24 object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* In-App Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Monitor className="h-4 w-4" />
            <span>In-App Notification</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {title || "Notification Title"}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {body || "Your notification message will appear here..."}
                </p>
                <span className="text-xs text-muted-foreground">Just now</span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Preview (simplified) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Email Preview</span>
          </div>
          <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 p-4 shadow-sm">
            <div className="border-b pb-2 mb-3">
              <p className="font-semibold text-sm">
                {title || "Notification Title"}
              </p>
              <p className="text-xs text-muted-foreground">
                From: Blinking Events &lt;notifications@blinkingevents.com&gt;
              </p>
            </div>
            <p className="text-sm">
              {body || "Your notification message will appear here..."}
            </p>
            {imageUrl && (
              <div className="mt-3 rounded-md overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Notification"
                  className="w-full max-h-32 object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
