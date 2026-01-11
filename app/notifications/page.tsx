/**
 * Notifications Page
 * Admin interface for managing push notifications
 *
 * @created January 10, 2026
 * @version 2.0.0
 */

"use client";

import { useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, RefreshCw } from "lucide-react";
import {
  SendNotificationForm,
  NotificationHistory,
  NotificationStats,
  NotificationPreview,
} from "@/components/notifications";
import { NotificationAnalyticsDetail } from "@/components/notifications/notification-stats";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("send");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewBody, setPreviewBody] = useState("");
  const [previewImage, setPreviewImage] = useState("");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <Button variant="outline" size="sm" asChild>
              <a href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </a>
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader
            title="Push Notifications"
            description="Send notifications and manage user engagement"
          />

          {/* Stats Overview */}
          <NotificationStats days={30} />

          {/* Main Content */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList>
              <TabsTrigger value="send">Send Notification</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Send Notification Tab */}
            <TabsContent value="send" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Form */}
                <SendNotificationForm
                  onSuccess={() => {
                    setPreviewTitle("");
                    setPreviewBody("");
                    setPreviewImage("");
                  }}
                />

                {/* Preview */}
                <div className="space-y-6">
                  <NotificationPreview
                    title={previewTitle}
                    body={previewBody}
                    imageUrl={previewImage}
                  />

                  {/* Tips Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Tips for Effective Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="shrink-0">
                          1
                        </Badge>
                        <p>
                          Keep titles under 50 characters for best visibility
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="shrink-0">
                          2
                        </Badge>
                        <p>Use action-oriented language to drive engagement</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="shrink-0">
                          3
                        </Badge>
                        <p>Include images for 2x higher click-through rates</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="shrink-0">
                          4
                        </Badge>
                        <p>
                          Time your notifications based on user activity
                          patterns
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="shrink-0">
                          5
                        </Badge>
                        <p>
                          Personalize messages when possible for better
                          engagement
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <NotificationHistory pageSize={15} />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Notification Analytics
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed insights into notification performance
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </Button>
              </div>

              {/* Extended Stats */}
              <NotificationStats days={30} />

              {/* Detailed Analytics */}
              <NotificationAnalyticsDetail days={30} />

              {/* Trend Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Notification Trend
                  </CardTitle>
                  <CardDescription>
                    Daily notification activity over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">
                      Chart visualization coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
