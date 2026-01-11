import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Eye, FileText, MessageSquare, Calendar, MapPin } from "lucide-react"
import Link from "next/link"

export default function OrdersPage() {
  const orders = [
    {
      id: "ORD-001",
      clientName: "Sarah Johnson",
      clientEmail: "sarah.j@email.com",
      eventType: "Wedding",
      eventDate: "2025-02-15",
      venue: "Grand Hotel Ballroom",
      guestCount: 250,
      servicesRequested: ["Premium Wedding Package", "Photography"],
      status: "Quoted",
      budgetRange: { min: 400000, max: 600000 },
      quote: { total: 520000, sentAt: "2025-01-12" },
      createdAt: "2025-01-10",
    },
    {
      id: "ORD-002",
      clientName: "Michael Chen",
      clientEmail: "m.chen@company.com",
      eventType: "Corporate",
      eventDate: "2025-02-20",
      venue: "Conference Center",
      guestCount: 150,
      servicesRequested: ["Corporate Event Management"],
      status: "Confirmed",
      budgetRange: { min: 300000, max: 400000 },
      quote: { total: 350000, sentAt: "2025-01-08" },
      createdAt: "2025-01-05",
    },
    {
      id: "ORD-003",
      clientName: "Emma Williams",
      clientEmail: "emma.w@email.com",
      eventType: "Cultural",
      eventDate: "2025-02-18",
      venue: "Cultural Center",
      guestCount: 180,
      servicesRequested: ["Cultural Ceremony Services"],
      status: "Pending",
      budgetRange: { min: 250000, max: 350000 },
      createdAt: "2025-01-14",
    },
    {
      id: "ORD-004",
      clientName: "David Brown",
      clientEmail: "d.brown@email.com",
      eventType: "Wedding",
      eventDate: "2025-03-05",
      venue: "Garden Venue",
      guestCount: 200,
      servicesRequested: ["Premium Wedding Package"],
      status: "Completed",
      budgetRange: { min: 450000, max: 650000 },
      quote: { total: 580000, sentAt: "2024-12-20" },
      createdAt: "2024-12-15",
    },
    {
      id: "ORD-005",
      clientName: "Lisa Martinez",
      clientEmail: "lisa.m@email.com",
      eventType: "Social",
      eventDate: "2025-02-25",
      venue: "Private Residence",
      guestCount: 80,
      servicesRequested: ["Birthday Party Planning"],
      status: "Cancelled",
      budgetRange: { min: 150000, max: 250000 },
      createdAt: "2025-01-08",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "default"
      case "Quoted":
        return "secondary"
      case "Pending":
        return "outline"
      case "Completed":
        return "default"
      case "Cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const filterByStatus = (status: string) => {
    if (status === "all") return orders
    return orders.filter((order) => order.status.toLowerCase() === status)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Orders</h2>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader title="Order Management" description="Manage client requests, quotes, and bookings" />

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search orders by client name, order ID, or event type..." className="pl-9" />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({filterByStatus("pending").length})</TabsTrigger>
              <TabsTrigger value="quoted">Quoted ({filterByStatus("quoted").length})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({filterByStatus("confirmed").length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({filterByStatus("completed").length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold">{order.id}</h3>
                              <Badge variant={getStatusColor(order.status)}>{order.status}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {order.clientName} • {order.clientEmail}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{order.eventDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{order.venue}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Event Type: </span>
                            <Badge variant="outline">{order.eventType}</Badge>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Guests: </span>
                            <span className="font-medium">{order.guestCount}</span>
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Services: </span>
                          <span>{order.servicesRequested.join(", ")}</span>
                        </div>
                        {order.quote && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Quote: </span>
                            <span className="font-semibold">{order.quote.total.toLocaleString()} XAF</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 md:items-end">
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                        {order.status === "Pending" && (
                          <Button size="sm">
                            <FileText className="mr-2 h-4 w-4" />
                            Create Quote
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {["pending", "quoted", "confirmed", "completed"].map((status) => (
              <TabsContent key={status} value={status} className="space-y-4">
                {filterByStatus(status).map((order) => (
                  <Card key={order.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold">{order.id}</h3>
                                <Badge variant={getStatusColor(order.status)}>{order.status}</Badge>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {order.clientName} • {order.clientEmail}
                              </p>
                            </div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{order.eventDate}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{order.venue}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Event Type: </span>
                              <Badge variant="outline">{order.eventType}</Badge>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Guests: </span>
                              <span className="font-medium">{order.guestCount}</span>
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Services: </span>
                            <span>{order.servicesRequested.join(", ")}</span>
                          </div>
                          {order.quote && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Quote: </span>
                              <span className="font-semibold">{order.quote.total.toLocaleString()} XAF</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 md:items-end">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </Link>
                          {order.status === "Pending" && (
                            <Button size="sm">
                              <FileText className="mr-2 h-4 w-4" />
                              Create Quote
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
