"use client";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
  const revenueData = [
    { month: "Jan", revenue: 180000, bookings: 8 },
    { month: "Feb", revenue: 220000, bookings: 12 },
    { month: "Mar", revenue: 195000, bookings: 10 },
    { month: "Apr", revenue: 280000, bookings: 15 },
    { month: "May", revenue: 310000, bookings: 18 },
    { month: "Jun", revenue: 290000, bookings: 16 },
  ];

  const serviceDistribution = [
    { name: "Wedding", value: 45, color: "#E1262C" },
    { name: "Corporate", value: 32, color: "#C8A64B" },
    { name: "Cultural", value: 28, color: "#91959C" },
    { name: "Other", value: 15, color: "#F3E5AB" },
  ];

  const staffPerformance = [
    { name: "Sarah M.", events: 24, rating: 4.9, revenue: 450000 },
    { name: "John D.", events: 21, rating: 4.8, revenue: 420000 },
    { name: "Emma W.", events: 19, rating: 4.7, revenue: 380000 },
    { name: "Michael C.", events: 18, rating: 4.9, revenue: 360000 },
    { name: "Lisa K.", events: 16, rating: 4.6, revenue: 320000 },
  ];

  const clientDemographics = [
    { category: "New Clients", count: 45 },
    { category: "Returning", count: 78 },
    { category: "VIP", count: 33 },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Analytics</h2>
            <div className="flex items-center gap-2">
              <Select defaultValue="6months">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="3months">Last 3 months</SelectItem>
                  <SelectItem value="6months">Last 6 months</SelectItem>
                  <SelectItem value="1year">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader
            title="Business Analytics"
            description="Track performance, revenue, and engagement metrics"
          />

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="staff">Staff Performance</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,475,000 XAF</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-accent">+18.2%</span> from last
                      period
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Bookings
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">79</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-accent">+12</span> from last period
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Clients
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">156</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-accent">+8</span> new this month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Avg. Order Value
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">18,670 XAF</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-accent">+5.4%</span> from last
                      period
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue & Bookings Trend</CardTitle>
                  <CardDescription>
                    Monthly revenue and booking volume over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D2D30" />
                      <XAxis dataKey="month" stroke="#91959C" />
                      <YAxis stroke="#91959C" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          border: "1px solid #2D2D30",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#E1262C"
                        strokeWidth={2}
                        name="Revenue (XAF)"
                      />
                      <Line
                        type="monotone"
                        dataKey="bookings"
                        stroke="#C8A64B"
                        strokeWidth={2}
                        name="Bookings"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Service Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Service Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of bookings by service type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={serviceDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {serviceDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            border: "1px solid #2D2D30",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Client Demographics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Client Demographics</CardTitle>
                    <CardDescription>
                      Client segmentation and distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={clientDemographics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D2D30" />
                        <XAxis dataKey="category" stroke="#91959C" />
                        <YAxis stroke="#91959C" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            border: "1px solid #2D2D30",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="count" fill="#C8A64B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analysis</CardTitle>
                  <CardDescription>
                    Detailed revenue breakdown and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D2D30" />
                      <XAxis dataKey="month" stroke="#91959C" />
                      <YAxis stroke="#91959C" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          border: "1px solid #2D2D30",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="revenue"
                        fill="#E1262C"
                        name="Revenue (XAF)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Service Performance</CardTitle>
                  <CardDescription>
                    Most requested services and their revenue contribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {serviceDistribution.map((service) => (
                      <div
                        key={service.name}
                        className="flex items-center gap-4"
                      >
                        <div
                          className="h-10 w-10 rounded-lg"
                          style={{ backgroundColor: service.color }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {service.name} Services
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {service.value} bookings
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {((service.value / 120) * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            of total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Staff Performance</CardTitle>
                  <CardDescription>
                    Top performing staff members by events and revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {staffPerformance.map((staff, index) => (
                      <div
                        key={staff.name}
                        className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{staff.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {staff.events} events • {staff.rating} rating
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {staff.revenue.toLocaleString()} XAF
                          </p>
                          <p className="text-xs text-muted-foreground">
                            revenue generated
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clients" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Growth</CardTitle>
                    <CardDescription>
                      New vs returning clients over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={clientDemographics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D2D30" />
                        <XAxis dataKey="category" stroke="#91959C" />
                        <YAxis stroke="#91959C" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            border: "1px solid #2D2D30",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="count" fill="#C8A64B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Client Retention</CardTitle>
                    <CardDescription>
                      Client loyalty and repeat booking rate
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Repeat Booking Rate</span>
                        <span className="text-sm font-medium">62%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div className="h-2 w-[62%] rounded-full bg-accent" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Client Satisfaction</span>
                        <span className="text-sm font-medium">4.8/5.0</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div className="h-2 w-[96%] rounded-full bg-primary" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Referral Rate</span>
                        <span className="text-sm font-medium">34%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div className="h-2 w-[34%] rounded-full bg-accent" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
