"use client";

import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { useGetDashboardStatsQuery, useGetQuickActionsQuery } from "@/lib/redux/api/dashboardApi";

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Revenue",
      value: "2,450,000 XAF",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Active Orders",
      value: "24",
      change: "+3",
      trend: "up",
      icon: ShoppingCart,
    },
    {
      title: "Total Clients",
      value: "156",
      change: "+8",
      trend: "up",
      icon: Users,
    },
    {
      title: "Events This Month",
      value: "12",
      change: "+2",
      trend: "up",
      icon: Calendar,
    },
  ]

  const recentOrders = [
    {
      id: "ORD-001",
      client: "Sarah Johnson",
      service: "Wedding Package",
      date: "2025-02-15",
      status: "Quoted",
      amount: "450,000 XAF",
    },
    {
      id: "ORD-002",
      client: "Michael Chen",
      service: "Corporate Event",
      date: "2025-02-20",
      status: "Confirmed",
      amount: "320,000 XAF",
    },
    {
      id: "ORD-003",
      client: "Emma Williams",
      service: "Cultural Ceremony",
      date: "2025-02-18",
      status: "Pending",
      amount: "280,000 XAF",
    },
  ]

  const topServices = [
    { name: "Wedding Services", bookings: 45, revenue: "1,200,000 XAF" },
    { name: "Corporate Events", bookings: 32, revenue: "980,000 XAF" },
    { name: "Cultural Ceremonies", bookings: 28, revenue: "750,000 XAF" },
  ]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <Button size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader title="Welcome back, Admin" description="Here's what's happening with your events today." />

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-accent">{stat.change}</span> from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Latest client requests and bookings</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{order.client}</p>
                        <p className="text-xs text-muted-foreground">{order.service}</p>
                        <p className="text-xs text-muted-foreground">{order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{order.amount}</p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            order.status === "Confirmed"
                              ? "bg-accent/10 text-accent"
                              : order.status === "Quoted"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Services */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Top Services</CardTitle>
                    <CardDescription>Most requested services this month</CardDescription>
                  </div>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topServices.map((service, index) => (
                    <div key={service.name} className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.bookings} bookings</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{service.revenue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-sm">New Order</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent">
                  <Briefcase className="h-5 w-5" />
                  <span className="text-sm">Add Service</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Add Staff</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent">
                  <Star className="h-5 w-5" />
                  <span className="text-sm">View Reviews</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
