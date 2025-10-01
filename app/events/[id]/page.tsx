import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Users, Star, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function EventDetailPage({ params }: { params: { id: string } }) {
  // Mock data - replace with actual data fetching
  const event = {
    id: params.id,
    name: "Johnson-Williams Wedding",
    date: "2024-12-20",
    venue: "Grand Hotel Ballroom, Mumbai",
    category: "Wedding",
    description:
      "A beautiful wedding celebration bringing together two families in an elegant ceremony followed by a grand reception. The event featured traditional customs blended with modern elements, creating an unforgettable experience for all guests.",
    servicesUsed: [
      { id: "1", name: "Premium Wedding Package", price: 500000 },
      { id: "2", name: "Photography & Videography", price: 150000 },
      { id: "3", name: "Catering Services", price: 300000 },
    ],
    staffInvolved: [
      { id: "1", name: "Sarah Mitchell", role: "Event Coordinator", photo: "/placeholder.svg" },
      { id: "2", name: "John Davidson", role: "MC", photo: "/placeholder.svg" },
      { id: "3", name: "Emma Williams", role: "Hostess", photo: "/placeholder.svg" },
      { id: "4", name: "Lisa Kamara", role: "Photographer", photo: "/placeholder.svg" },
    ],
    guestCount: 250,
    isPublished: true,
    testimonials: [
      {
        id: "1",
        clientName: "Sarah Johnson",
        rating: 5,
        text: "Absolutely phenomenal service! The team at Blinking Events made our wedding day perfect.",
        createdAt: "2024-12-22",
      },
      {
        id: "2",
        clientName: "David Williams",
        rating: 5,
        text: "Professional, organized, and exceeded all expectations. Highly recommend!",
        createdAt: "2024-12-22",
      },
    ],
    media: [
      { id: "1", type: "image", url: "/elegant-wedding-decoration.png", description: "Ceremony setup" },
      { id: "2", type: "image", url: "/outdoor-wedding-ceremony.png", description: "Reception hall" },
      { id: "3", type: "image", url: "/elegant-wedding-reception.png", description: "Table decorations" },
      {
        id: "4",
        type: "video",
        url: "/videos/wedding.mp4",
        thumbnailUrl: "/wedding-video-thumbnail.png",
        description: "Highlight reel",
      },
    ],
  }

  const totalRevenue = event.servicesUsed.reduce((sum, service) => sum + service.price, 0)
  const avgRating = event.testimonials.reduce((sum, t) => sum + t.rating, 0) / event.testimonials.length

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/events">
                <Button variant="ghost" size="sm">
                  ← Back
                </Button>
              </Link>
              <h2 className="text-lg font-semibold">{event.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit Event
              </Button>
              <Button variant="outline" size="sm">
                {event.isPublished ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {event.isPublished ? "Unpublish" : "Publish"}
              </Button>
              <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Event Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-base">
                      {event.category}
                    </Badge>
                    <Badge variant={event.isPublished ? "default" : "secondary"}>
                      {event.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{event.guestCount} guests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span>
                        {avgRating.toFixed(1)}/5.0 ({event.testimonials.length} reviews)
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
                </div>
                <Card className="md:w-64">
                  <CardHeader>
                    <CardTitle className="text-sm">Event Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Revenue</span>
                      <span className="font-semibold">₹{totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Services</span>
                      <span className="font-semibold">{event.servicesUsed.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Staff</span>
                      <span className="font-semibold">{event.staffInvolved.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Media</span>
                      <span className="font-semibold">{event.media.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="services" className="space-y-6">
            <TabsList>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Services Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {event.servicesUsed.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">Service ID: {service.id}</p>
                        </div>
                        <p className="font-semibold">₹{service.price.toLocaleString()}</p>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between p-3">
                      <p className="font-semibold">Total</p>
                      <p className="text-lg font-bold">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {event.staffInvolved.map((staff) => (
                  <Card key={staff.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {staff.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{staff.name}</p>
                          <p className="text-sm text-muted-foreground">{staff.role}</p>
                        </div>
                        <Link href={`/staff/${staff.id}`}>
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {event.media.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="relative aspect-video">
                      <img
                        src={item.type === "video" ? item.thumbnailUrl : item.url}
                        alt={item.description}
                        className="h-full w-full object-cover"
                      />
                      {item.type === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="rounded-full bg-white/90 p-3">
                            <Eye className="h-6 w-6" />
                          </div>
                        </div>
                      )}
                    </div>
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium">{item.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs capitalize">
                        {item.type}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="testimonials" className="space-y-4">
              {event.testimonials.map((testimonial) => (
                <Card key={testimonial.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {testimonial.clientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{testimonial.clientName}</p>
                            <div className="mt-1 flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < testimonial.rating ? "fill-accent text-accent" : "text-muted"}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{testimonial.createdAt}</p>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{testimonial.text}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
