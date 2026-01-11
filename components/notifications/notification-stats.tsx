/**
 * Notification Stats Component
 * Displays notification analytics and metrics
 *
 * @created January 10, 2026
 * @version 1.0.0
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send,
  CheckCircle,
  TrendingUp,
  Users,
  BarChart3,
  Eye,
  MousePointer,
  AlertCircle,
} from "lucide-react";
import { useGetNotificationAnalyticsQuery } from "@/lib/redux/api/notificationsApi";

interface NotificationStatsProps {
  days?: number;
}

export function NotificationStats({ days = 30 }: NotificationStatsProps) {
  const {
    data: analytics,
    isLoading,
    error,
  } = useGetNotificationAnalyticsQuery({ days });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Failed to load stats
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Sent",
      value: analytics.totalSent.toLocaleString(),
      icon: Send,
      description: `Last ${days} days`,
    },
    {
      label: "Delivered",
      value: analytics.totalDelivered.toLocaleString(),
      icon: CheckCircle,
      description: `${Math.round(
        (analytics.totalDelivered / (analytics.totalSent || 1)) * 100
      )}% delivery rate`,
    },
    {
      label: "Open Rate",
      value: `${analytics.openRate}%`,
      icon: Eye,
      description: "Users who opened",
    },
    {
      label: "Click Rate",
      value: `${analytics.clickRate}%`,
      icon: MousePointer,
      description: "Users who clicked",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Detailed Analytics Component (for expanded view)
 */
export function NotificationAnalyticsDetail({ days = 30 }: { days?: number }) {
  const { data: analytics, isLoading } = useGetNotificationAnalyticsQuery({
    days,
  });

  if (isLoading || !analytics) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* By Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analytics.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm capitalize">{type}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${Math.min(
                          100,
                          (count / analytics.totalSent) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* By Channel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications by Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analytics.byChannel).map(([channel, count]) => (
              <div key={channel} className="flex items-center justify-between">
                <span className="text-sm capitalize">
                  {channel.replace("_", " ")}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${Math.min(
                          100,
                          (count / analytics.totalSent) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Failed Notifications */}
      {analytics.totalFailed > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Failed Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {analytics.totalFailed}
            </div>
            <p className="text-sm text-muted-foreground">
              {Math.round(
                (analytics.totalFailed / (analytics.totalSent || 1)) * 100
              )}
              % failure rate
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
