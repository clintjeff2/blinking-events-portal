"use client";

import React from "react";
import Link from "next/link";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Calendar,
  Star,
  ArrowUpRight,
  Briefcase,
  Camera,
  HelpCircle,
  ImageIcon,
  AlertTriangle,
  TrendingUp,
  Eye,
  Plus,
  CheckCircle,
  Clock,
  BarChart3,
  MessageSquare,
  Settings,
  RefreshCw,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import {
  useGetDashboardStatsQuery,
  useGetQuickActionsQuery,
} from "@/lib/redux/api/dashboardApi";
import { useAuth } from "../hooks/use-auth";

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useGetDashboardStatsQuery();

  const {
    data: quickActions,
    isLoading: actionsLoading,
    error: actionsError,
  } = useGetQuickActionsQuery();

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Helper function to get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Get user display name with fallback
  const getUserDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "Admin";
  };

  // Calculate activity score
  const getActivityScore = () => {
    if (!dashboardStats) return 0;
    const {
      totalEvents,
      activeServices,
      totalStaff,
      totalTestimonials,
      eventsThisMonth,
    } = dashboardStats;

    const score = Math.min(
      100,
      Math.round(
        (totalEvents * 2 +
          activeServices * 3 +
          totalStaff * 4 +
          totalTestimonials * 1.5 +
          eventsThisMonth * 5) /
          10
      )
    );
    return score;
  };

  if (statsError || actionsError) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex flex-1 items-center justify-between">
              <h2 className="text-lg font-semibold">Dashboard</h2>
              <Button size="sm" onClick={() => refetchStats()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-6 p-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load dashboard data. Please check your connection and
                try again.
              </AlertDescription>
            </Alert>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/events">
                  <Calendar className="mr-2 h-4 w-4" />
                  Events
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <PageHeader
                title={`${getGreeting()}, ${getUserDisplayName()}!`}
                description="Here's what's happening with your events business today."
              />
            </div>
            {!statsLoading && dashboardStats && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  Activity Score
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={getActivityScore()} className="w-20" />
                  <span className="text-2xl font-bold">
                    {getActivityScore()}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Statistics Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsLoading
              ? // Loading skeletons
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </CardContent>
                  </Card>
                ))
              : // Real data
                [
                  {
                    title: "Total Events",
                    value: dashboardStats?.totalEvents || 0,
                    change: `+${
                      dashboardStats?.eventsThisMonth || 0
                    } this month`,
                    icon: Calendar,
                    trend: "up",
                  },
                  {
                    title: "Active Services",
                    value: dashboardStats?.activeServices || 0,
                    change: "Available for booking",
                    icon: Briefcase,
                    trend: "neutral",
                  },
                  {
                    title: "Staff Members",
                    value: dashboardStats?.totalStaff || 0,
                    change: "Ready to serve",
                    icon: Users,
                    trend: "neutral",
                  },
                  {
                    title: "Client Reviews",
                    value: dashboardStats?.totalTestimonials || 0,
                    change: "Customer feedback",
                    icon: Star,
                    trend: "up",
                  },
                ].map((stat) => (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                        {stat.change}
                      </p>
                    </CardContent>
                  </Card>
                ))}
          </div>

          {/* Pending Tasks Alert */}
          {quickActions && quickActions.pendingTasks > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have {quickActions.pendingTasks} pending task
                {quickActions.pendingTasks > 1 ? "s" : ""} requiring attention.
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Events */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Events</CardTitle>
                    <CardDescription>
                      Latest published events and celebrations
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/events">
                      View All
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-b border-border pb-4"
                      >
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : dashboardStats?.recentEvents.length ? (
                  <div className="space-y-4">
                    {dashboardStats.recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{event.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.venue}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(event.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              event.isPublished ? "default" : "secondary"
                            }
                          >
                            {event.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No events yet. Create your first event!</p>
                    <Button className="mt-4" size="sm" asChild>
                      <Link href="/events">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Event
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Services */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Popular Services</CardTitle>
                    <CardDescription>
                      Most requested services this period
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/services">
                      Manage
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : dashboardStats?.topServices.length ? (
                  <div className="space-y-4">
                    {dashboardStats.topServices.map((service, index) => (
                      <div key={service.id} className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{service.name}</p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {service.category}
                            </Badge>
                            {service.featured && (
                              <Badge variant="secondary" className="text-xs">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {service.eventCount} events
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No services yet. Add your first service!</p>
                    <Button className="mt-4" size="sm" asChild>
                      <Link href="/services">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Service
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Testimonials */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Client Feedback</CardTitle>
                    <CardDescription>
                      Recent testimonials and reviews
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/testimonials">
                      View All
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ))}
                  </div>
                ) : dashboardStats?.recentTestimonials.length ? (
                  <div className="space-y-4">
                    {dashboardStats.recentTestimonials.map((testimonial) => (
                      <div
                        key={testimonial.id}
                        className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {testimonial.clientName}
                          </p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < testimonial.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground/50"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {testimonial.text}
                        </p>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            {formatDate(testimonial.createdAt)}
                          </p>
                          <Badge
                            variant={
                              testimonial.isPublished ? "default" : "secondary"
                            }
                          >
                            {testimonial.isPublished ? "Published" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>
                      No testimonials yet. Encourage clients to share feedback!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats & Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Content Overview</CardTitle>
                <CardDescription>Your content at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Media Items</span>
                      </div>
                      <Badge variant="outline">
                        {dashboardStats?.totalMedia || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">FAQs</span>
                      </div>
                      <Badge variant="outline">
                        {dashboardStats?.publishedFaqs || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Active Offers</span>
                      </div>
                      <Badge variant="outline">
                        {dashboardStats?.activeOffers || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Active Banners</span>
                      </div>
                      <Badge variant="outline">
                        {dashboardStats?.activeBanners || 0}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts to get things done faster
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                  asChild
                >
                  <Link href="/events">
                    <Calendar className="h-5 w-5" />
                    <span className="text-sm">New Event</span>
                    {quickActions && quickActions.draftEvents > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {quickActions.draftEvents} drafts
                      </Badge>
                    )}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                  asChild
                >
                  <Link href="/services">
                    <Briefcase className="h-5 w-5" />
                    <span className="text-sm">Manage Services</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                  asChild
                >
                  <Link href="/staff">
                    <Users className="h-5 w-5" />
                    <span className="text-sm">Staff Profiles</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                  asChild
                >
                  <Link href="/media">
                    <Camera className="h-5 w-5" />
                    <span className="text-sm">Media Gallery</span>
                    {quickActions && quickActions.unpublishedMedia > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {quickActions.unpublishedMedia} pending
                      </Badge>
                    )}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                  asChild
                >
                  <Link href="/testimonials">
                    <Star className="h-5 w-5" />
                    <span className="text-sm">Client Reviews</span>
                    {quickActions && quickActions.pendingTestimonials > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {quickActions.pendingTestimonials} pending
                      </Badge>
                    )}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                  asChild
                >
                  <Link href="/marketing">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm">Marketing</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                  asChild
                >
                  <Link href="/faqs">
                    <HelpCircle className="h-5 w-5" />
                    <span className="text-sm">Help & FAQs</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                  asChild
                >
                  <Link href="/settings">
                    <Settings className="h-5 w-5" />
                    <span className="text-sm">Settings</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
