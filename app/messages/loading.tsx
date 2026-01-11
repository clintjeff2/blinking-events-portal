/**
 * Messages Loading State
 * Displays skeleton UI while messages page loads
 */

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Skeleton className="h-6 w-24" />
        </header>

        <div className="flex flex-1 flex-col p-6">
          {/* Page Header Skeleton */}
          <div className="mb-6 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>

          {/* Tabs Skeleton */}
          <div className="mb-4">
            <Skeleton className="h-10 w-[400px]" />
          </div>

          {/* Main Content */}
          <div
            className="grid flex-1 gap-6 lg:grid-cols-3"
            style={{ minHeight: "calc(100vh - 320px)" }}
          >
            {/* Conversations List Skeleton */}
            <Card className="lg:col-span-1 h-full">
              <CardContent className="p-4 space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Window Skeleton */}
            <Card className="lg:col-span-2 h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`flex gap-2 ${
                      i % 2 === 0 ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton
                      className={`h-16 rounded-2xl ${
                        i % 2 === 0 ? "w-48" : "w-64"
                      }`}
                    />
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
