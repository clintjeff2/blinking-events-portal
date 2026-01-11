/**
 * Notification History Component
 * Displays list of sent notifications with filtering
 *
 * @created January 10, 2026
 * @version 1.0.0
 */

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Eye,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  useGetNotificationsQuery,
  useDeleteNotificationMutation,
  useCancelScheduledNotificationMutation,
} from "@/lib/redux/api/notificationsApi";
import type {
  NotificationType,
  NotificationStatus,
  SerializedNotification,
} from "@/types/notifications";

// Type badge colors
const typeBadgeColors: Record<NotificationType, string> = {
  order: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  message:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  promo:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  reminder:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  info: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  system: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  payment: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  staff:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
};

// Status badge colors
const statusBadgeColors: Record<NotificationStatus, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  delivered:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

// Status icons
function StatusIcon({ status }: { status: NotificationStatus }) {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "sent":
      return <Send className="h-4 w-4 text-blue-600" />;
    case "delivered":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "cancelled":
      return <XCircle className="h-4 w-4 text-gray-600" />;
    default:
      return null;
  }
}

interface NotificationHistoryProps {
  pageSize?: number;
}

export function NotificationHistory({
  pageSize = 10,
}: NotificationHistoryProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | "all">(
    "all"
  );
  const [lastDocId, setLastDocId] = useState<string | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetNotificationsQuery({
    filters: {
      type: typeFilter === "all" ? undefined : typeFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      searchQuery: searchQuery || undefined,
    },
    pageSize,
    lastDocId,
  });

  const [deleteNotification, { isLoading: isDeleting }] =
    useDeleteNotificationMutation();
  const [cancelNotification, { isLoading: isCancelling }] =
    useCancelScheduledNotificationMutation();

  const notifications = data?.notifications || [];
  const hasMore = data?.hasMore || false;

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id).unwrap();
      toast({
        title: "Notification Deleted",
        description: "The notification has been removed.",
      });
      setDeleteId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelNotification(id).unwrap();
      toast({
        title: "Notification Cancelled",
        description: "The scheduled notification has been cancelled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel notification",
        variant: "destructive",
      });
    }
  };

  const handleNextPage = () => {
    if (data?.lastDoc) {
      setLastDocId(data.lastDoc);
    }
  };

  const handlePrevPage = () => {
    setLastDocId(undefined); // Reset to first page (simple implementation)
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Notification History</CardTitle>
            <CardDescription>
              Previously sent and scheduled notifications
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 pt-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as NotificationType | "all")}
          >
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="order">Order</SelectItem>
              <SelectItem value="message">Message</SelectItem>
              <SelectItem value="promo">Promotion</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as NotificationStatus | "all")
            }
          >
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Send className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">
              No notifications found
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Start sending notifications to see them here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.notificationId}
                notification={notification}
                onDelete={() => setDeleteId(notification.notificationId)}
                onCancel={() => handleCancel(notification.notificationId)}
              />
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {notifications.length} of {data?.total || 0}{" "}
                notifications
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={!lastDocId}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The notification record will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// Individual notification item
function NotificationItem({
  notification,
  onDelete,
  onCancel,
}: {
  notification: SerializedNotification;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const isBroadcast =
    !!notification.targetAudience ||
    (notification.recipientIds?.length || 0) > 1;
  const recipientCount =
    notification.stats?.totalRecipients ||
    notification.recipientIds?.length ||
    1;

  return (
    <div className="flex items-start justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{notification.title}</p>
          <Badge
            variant="outline"
            className={typeBadgeColors[notification.type]}
          >
            {notification.type}
          </Badge>
          <Badge
            variant="outline"
            className={statusBadgeColors[notification.status]}
          >
            <StatusIcon status={notification.status} />
            <span className="ml-1">{notification.status}</span>
          </Badge>
          {notification.priority !== "normal" && (
            <Badge
              variant={
                notification.priority === "urgent" ? "destructive" : "secondary"
              }
            >
              {notification.priority}
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.body}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {/* Recipients */}
          <span className="flex items-center gap-1">
            {isBroadcast ? (
              <>
                <Users className="h-3 w-3" />
                {recipientCount} recipients
              </>
            ) : (
              <>
                <User className="h-3 w-3" />1 recipient
              </>
            )}
          </span>

          {/* Sent time */}
          {notification.sentAt && (
            <span>
              Sent:{" "}
              {format(new Date(notification.sentAt), "MMM d, yyyy h:mm a")}
            </span>
          )}

          {/* Scheduled time */}
          {notification.scheduledFor && notification.status === "pending" && (
            <span className="flex items-center gap-1 text-yellow-600">
              <Clock className="h-3 w-3" />
              Scheduled:{" "}
              {format(
                new Date(notification.scheduledFor),
                "MMM d, yyyy h:mm a"
              )}
            </span>
          )}

          {/* Stats for broadcasts */}
          {notification.stats && (
            <>
              <span>Delivered: {notification.stats.delivered}</span>
              <span>Opened: {notification.stats.opened}</span>
            </>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          {notification.status === "pending" && notification.scheduledFor && (
            <DropdownMenuItem onClick={onCancel}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Schedule
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
