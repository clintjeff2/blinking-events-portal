import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Send, Users, TrendingUp, CheckCircle } from "lucide-react"

export default function NotificationsPage() {
  const notifications = [
    {
      id: "1",
      title: "New Order Received",
      body: "Sarah Johnson has requested a quote for a wedding event",
      type: "order",
      sentAt: "2025-01-15 14:30",
      recipients: 1,
      status: "Sent",
    },
    {
      id: "2",
      title: "Valentine's Day Special",
      body: "Get 15% off on all wedding packages this February!",
      type: "promo",
      sentAt: "2025-01-14 10:00",
      recipients: 156,
      status: "Sent",
    },
    {
      id: "3",
      title: "Event Reminder",
      body: "Your event is scheduled for tomorrow at Grand Hotel",
      type: "reminder",
      sentAt: "2025-01-13 16:00",
      recipients: 1,
      status: "Sent",
    },
  ]

  const stats = [
    { label: "Total Sent", value: "1,234", icon: Send },
    { label: "Active Users", value: "156", icon: Users },
    { label: "Open Rate", value: "68%", icon: TrendingUp },
    { label: "Delivered", value: "98%", icon: CheckCircle },
  ]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader title="Push Notifications" description="Send notifications and manage engagement" />

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="send" className="space-y-6">
            <TabsList>
              <TabsTrigger value="send">Send Notification</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="send" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Push Notification</CardTitle>
                  <CardDescription>Send a notification to your app users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Notification Title</Label>
                    <Input placeholder="e.g., New Service Available" />
                  </div>
                  <div className="space-y-2">
                    <Label>Message Body</Label>
                    <Textarea placeholder="Enter your notification message..." rows={4} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Notification Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="order">Order Update</SelectItem>
                          <SelectItem value="promo">Promotion</SelectItem>
                          <SelectItem value="info">Information</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Audience</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="active">Active Clients</SelectItem>
                          <SelectItem value="vip">VIP Clients</SelectItem>
                          <SelectItem value="new">New Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Link (Optional)</Label>
                    <Input placeholder="e.g., /services/wedding" />
                  </div>
                  <div className="flex gap-2">
                    <Button>
                      <Send className="mr-2 h-4 w-4" />
                      Send Now
                    </Button>
                    <Button variant="outline">Schedule for Later</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>How your notification will appear</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                        <Bell className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Notification Title</p>
                        <p className="text-sm text-muted-foreground">Your notification message will appear here...</p>
                        <p className="mt-1 text-xs text-muted-foreground">Just now</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification History</CardTitle>
                  <CardDescription>Previously sent notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start justify-between rounded-lg border border-border p-4"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold">{notification.title}</p>
                            <Badge variant="outline">{notification.type}</Badge>
                            <Badge variant="secondary">{notification.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.body}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Sent: {notification.sentAt}</span>
                            <span>Recipients: {notification.recipients}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
