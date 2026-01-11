/**
 * Notification Bell Component
 * Bell icon with unread count badge for header
 *
 * @created January 10, 2026
 * @version 1.0.0
 */

"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";

interface NotificationBellProps {
  userId: string | null;
  onClick?: () => void;
  className?: string;
}

export function NotificationBell({
  userId,
  onClick,
  className,
}: NotificationBellProps) {
  const { count, loading } = useUnreadNotificationCount(userId);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      onClick={onClick}
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
        >
          {count > 99 ? "99+" : count}
        </Badge>
      )}
    </Button>
  );
}
