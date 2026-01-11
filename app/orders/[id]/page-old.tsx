import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  MapPin,
  Users,
  FileText,
  MessageSquare,
  Send,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = {
    id: params.id,
    clientId: "client-1",
    clientName: "Sarah Johnson",
    clientEmail: "sarah.j@email.com",
    clientPhone: "+237 6XX XXX XXX",
    eventType: "Wedding",
    eventDate: "2025-02-15",
    eventTime: "14:00",
    venue: {
      name: "Grand Hotel Ballroom",
      address: "123 Main Street, Douala",
      guestCount: 250,
    },
    servicesRequested: [
      { serviceId: "1", serviceName: "Premium Wedding Package", packageId: "3", quantity: 1 },
      { serviceId: "2", serviceName: "Professional Photography", packageId: "1", quantity: 1 },
    ],
    staffRequested: ["Sarah M.", "John D.", "Emma W."],
    specialRequirements:
      "Need halal catering options. Prefer gold and white color scheme. Require wheelchair accessibility.",
    budgetRange: { min: 400000, max: 600000 },
    status: "Quoted",
    quote: {
      total: 520000,
      breakdown: [
        { item: "Premium Wedding Package", amount: 400000 },
        { item: "Professional Photography", amount: 80000 },
        { item: "Additional Decorations", amount: 40000 },
      ],
      sentAt: "2025-01-12",
    },
    timeline: [
      { milestone: "Order Received", date: "2025-01-10", status: "completed" },
      { milestone: "Quote Sent", date: "2025-01-12", status: "completed" },
      { milestone: "Awaiting Client Response", date: "2025-01-12", status: "in-progress" },
      { milestone: "Confirmation", date: "", status: "pending" },
      { milestone: "Event Day", date: "2025-02-15", status: "pending" },
    ],
    documents: ["/documents/event-brief.pdf", "/documents/venue-layout.pdf"],
    adminNotes: "Client is very detail-oriented. Prefers email communication.",
    createdAt: "2025-01-10",
    updatedAt: "2025-01-12",
  }

  const messages = [
    {
      id: "1",
      senderId: "admin-1",
      senderName: "Admin",
      text: "Hello Sarah! Thank you for your order. We've reviewed your requirements and will send you a detailed quote shortly.",
      createdAt: "2025-01-10 15:30",
    },
    {
      id: "2",
      senderId: "client-1",
      senderName: "Sarah Johnson",
      text: "Thank you! Looking forward to it. Can you confirm if you can accommodate halal catering?",
      createdAt: "2025-01-10 16:45",
    },
    {
      id: "3",
      senderId: "admin-1",
      senderName: "Admin",
      text: "Yes, we can definitely arrange halal catering. I've included this in your quote. Please review and let us know if you have any questions.",
      createdAt: "2025-01-12 10:00",
    },
  ]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Order Details</h2>
            <div className="flex items-center gap-2">
              <Select defaultValue={order.status.toLowerCase()}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm">Save Changes</Button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{order.id}</h1>
                <Badge variant="secondary">{order.status}</Badge>
              </div>
              <p className="mt-2 text-muted-foreground">Created on {order.createdAt}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-6 lg:col-span-2">
              <Tabs defaultValue="details" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="quote">Quote</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                  {/* Client Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Client Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label className="text-muted-foreground">Name</Label>
                          <p className="font-medium">{order.clientName}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Email</Label>
                          <p className="font-medium">{order.clientEmail}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Phone</Label>
                          <p className="font-medium">{order.clientPhone}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Event Type</Label>
                          <Badge variant="outline">{order.eventType}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Event Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <Label className="text-muted-foreground">Date & Time</Label>
                            <p className="font-medium">
                              {order.eventDate} at {order.eventTime}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <Label className="text-muted-foreground">Guest Count</Label>
                            <p className="font-medium">{order.venue.guestCount} guests</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-1 h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label className="text-muted-foreground">Venue</Label>
                          <p className="font-medium">{order.venue.name}</p>
                          <p className="text-sm text-muted-foreground">{order.venue.address}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Services Requested */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Services Requested</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {order.servicesRequested.map((service, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                          >
                            <div>
                              <p className="font-medium">{service.serviceName}</p>
                              <p className="text-sm text-muted-foreground">Quantity: {service.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Staff Requested */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Staff Requested</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {order.staffRequested.map((staff, index) => (
                          <Badge key={index} variant="secondary">
                            {staff}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Special Requirements */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Special Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{order.specialRequirements}</p>
                    </CardContent>
                  </Card>

                  {/* Admin Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Admin Notes</CardTitle>
                      <CardDescription>Internal notes (not visible to client)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea placeholder="Add internal notes..." defaultValue={order.adminNotes} rows={4} />
                      <Button className="mt-4" size="sm">
                        Save Notes
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="quote" className="space-y-6">
                  {order.quote ? (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>Quote Details</CardTitle>
                          <CardDescription>Sent on {order.quote.sentAt}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            {order.quote.breakdown.map((item, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm">{item.item}</span>
                                <span className="font-medium">{item.amount.toLocaleString()} XAF</span>
                              </div>
                            ))}
                            <Separator />
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-semibold">Total</span>
                              <span className="text-2xl font-bold text-primary">
                                {order.quote.total.toLocaleString()} XAF
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Update Quote</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Add Line Item</Label>
                            <div className="flex gap-2">
                              <Input placeholder="Item name" />
                              <Input placeholder="Amount" type="number" className="w-32" />
                              <Button>Add</Button>
                            </div>
                          </div>
                          <Button className="w-full">Send Updated Quote</Button>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Create Quote</CardTitle>
                        <CardDescription>Build a custom quote for this order</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Line Items</Label>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input placeholder="Item name" />
                              <Input placeholder="Amount" type="number" className="w-32" />
                              <Button variant="outline">Add</Button>
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold">Total</span>
                          <span className="text-2xl font-bold">0 XAF</span>
                        </div>
                        <Button className="w-full">Send Quote to Client</Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="timeline" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Timeline</CardTitle>
                      <CardDescription>Track the progress of this order</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {order.timeline.map((milestone, index) => (
                          <div key={index} className="flex items-start gap-4">
                            <div className="mt-1">
                              {milestone.status === "completed" ? (
                                <CheckCircle2 className="h-6 w-6 text-accent" />
                              ) : milestone.status === "in-progress" ? (
                                <Clock className="h-6 w-6 text-primary" />
                              ) : (
                                <XCircle className="h-6 w-6 text-muted" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{milestone.milestone}</p>
                              {milestone.date && <p className="text-sm text-muted-foreground">{milestone.date}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="messages" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Messages</CardTitle>
                      <CardDescription>Communication with {order.clientName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${message.senderId.startsWith("admin") ? "flex-row-reverse" : ""}`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {message.senderName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`flex-1 ${message.senderId.startsWith("admin") ? "text-right" : ""}`}>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{message.senderName}</p>
                                <p className="text-xs text-muted-foreground">{message.createdAt}</p>
                              </div>
                              <div
                                className={`mt-1 rounded-lg p-3 ${
                                  message.senderId.startsWith("admin")
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <p className="text-sm">{message.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex gap-2">
                        <Input placeholder="Type your message..." />
                        <Button size="icon">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full bg-transparent" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Contract
                  </Button>
                  <Button className="w-full bg-transparent" variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                  <Button className="w-full bg-transparent" variant="outline">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Request Payment
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Range</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {order.budgetRange.min.toLocaleString()} - {order.budgetRange.max.toLocaleString()} XAF
                  </p>
                </CardContent>
              </Card>

              {order.documents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {order.documents.map((doc, index) => (
                      <Button key={index} variant="outline" className="w-full justify-start bg-transparent" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        Document {index + 1}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
