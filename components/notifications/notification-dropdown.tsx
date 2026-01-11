/**
 * Notification Dropdown Component
 * Dropdown list of recent notifications
 *
 * @created January 10, 2026
 * @version 1.0.0
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  ShoppingBag,
  MessageSquare,
  Tag,
  Clock,
  Info,
  Settings,
  CreditCard,
  Users,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import {
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useRecordNotificationClickMutation,
} from "@/lib/redux/api/notificationsApi";
import type {
  NotificationType,
  SerializedNotification,
} from "@/types/notifications";

// Type icons
const typeIcons: Record<
  NotificationType,
  React.ComponentType<{ className?: string }>
> = {
  order: ShoppingBag,
  message: MessageSquare,
  promo: Tag,
  reminder: Clock,
  info: Info,
  system: Settings,
  payment: CreditCard,
  staff: Users,
};

// Type colors
const typeColors: Record<NotificationType, string> = {
  order: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
  message:
    "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
  promo:
    "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
  reminder:
    "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400",
  info: "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400",
  system: "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400",
  payment: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
  staff:
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400",
};

interface NotificationDropdownProps {
  userId: string | null;
  children: React.ReactNode;
}

export function NotificationDropdown({
  userId,
  children,
}: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);

  const { notifications, unreadCount, loading } = useNotifications({
    userId,
    maxCount: 10,
    enabled: !!userId,
  });

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] =
    useMarkAllNotificationsAsReadMutation();
  const [recordClick] = useRecordNotificationClickMutation();

  const handleNotificationClick = async (
    notification: SerializedNotification
  ) => {
    if (!notification.isRead) {
      await markAsRead(notification.notificationId);
    }
    await recordClick(notification.notificationId);
    setOpen(false);
  };

  const handleMarkAllRead = async () => {
    if (userId) {
      await markAllAsRead(userId);
    }
  };

  // Get link URL for notification
  const getNotificationLink = (
    notification: SerializedNotification
  ): string => {
    if (notification.reference?.url) {
      return notification.reference.url;
    }

    switch (notification.reference?.type) {
      case "order":
        return `/orders/${notification.reference.id}`;
      case "conversation":
        return `/messages?conversation=${notification.reference.id}`;
      case "service":
        return `/services/${notification.reference.id}`;
      case "event":
        return `/events/${notification.reference.id}`;
      case "staff":
        return `/staff/${notification.reference.id}`;
      default:
        return "/notifications";
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {/* Notifications List */}
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="space-y-2 p-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3 p-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                const link = getNotificationLink(notification);

                return (
                  <Link
                    key={notification.notificationId}
                    href={link}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div
                      className={cn(
                        "flex gap-3 rounded-md p-2 transition-colors hover:bg-muted",
                        !notification.isRead && "bg-muted/50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          typeColors[notification.type]
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm truncate",
                            !notification.isRead && "font-medium"
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {notification.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-2" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/notifications"
            className="flex items-center justify-center gap-2 text-sm"
          >
            View all notifications
            <ExternalLink className="h-3 w-3" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
