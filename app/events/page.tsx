"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Calendar, MapPin, Users, Star, Eye } from "lucide-react"
import Link from "next/link"
import { AddEventModal } from "@/components/add-event-modal"

export default function EventsPage() {
  const [showAddModal, setShowAddModal] = useState(false)

  const events = [
    {
      id: "1",
      name: "Johnson-Williams Wedding",
      date: "2024-12-20",
      venue: "Grand Hotel Ballroom",
      category: "Wedding",
      servicesUsed: ["Premium Wedding Package", "Photography"],
      staffInvolved: ["Sarah M.", "John D.", "Emma W."],
      guestCount: 250,
      isPublished: true,
      testimonials: 2,
      mediaCount: 45,
      rating: 5.0,
    },
    {
      id: "2",
      name: "TechCorp Annual Conference",
      date: "2024-12-15",
      venue: "Conference Center",
      category: "Corporate",
      servicesUsed: ["Corporate Event Management"],
      staffInvolved: ["Michael C.", "Lisa K."],
      guestCount: 150,
      isPublished: true,
      testimonials: 1,
      mediaCount: 32,
      rating: 4.8,
    },
    {
      id: "3",
      name: "Traditional Naming Ceremony",
      date: "2024-12-10",
      venue: "Cultural Center",
      category: "Cultural",
      servicesUsed: ["Cultural Ceremony Services"],
      staffInvolved: ["Emma W.", "Sarah M."],
      guestCount: 180,
      isPublished: true,
      testimonials: 1,
      mediaCount: 28,
      rating: 4.9,
    },
    {
      id: "4",
      name: "Martinez 50th Birthday Celebration",
      date: "2024-12-05",
      venue: "Private Garden",
      category: "Social",
      servicesUsed: ["Birthday Party Planning"],
      staffInvolved: ["John D.", "Lisa K."],
      guestCount: 80,
      isPublished: false,
      testimonials: 0,
      mediaCount: 18,
      rating: 0,
    },
  ]

  const categories = ["All", "Wedding", "Corporate", "Cultural", "Social"]

  const handleAddEvent = (data: any) => {
    console.log("[v0] New event data:", data)
    // TODO: Integrate with Firebase
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Events</h2>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader title="Past Events" description="Showcase your portfolio and manage event testimonials" />

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search events..." className="pl-9" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={category === "All" ? "default" : "outline"}
                      size="sm"
                      className="bg-transparent"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="outline">{event.category}</Badge>
                      </CardDescription>
                    </div>
                    <Badge variant={event.isPublished ? "default" : "secondary"}>
                      {event.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm">
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
                    {event.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span>{event.rating}/5.0</span>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Services Used</p>
                    <p className="text-sm">{event.servicesUsed.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Staff Involved</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {event.staffInvolved.map((staff) => (
                        <Badge key={staff} variant="secondary" className="text-xs">
                          {staff}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{event.mediaCount} photos/videos</span>
                    <span className="text-muted-foreground">{event.testimonials} testimonials</span>
                  </div>
                  <Link href={`/events/${event.id}`}>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Eye className="mr-2 h-4 w-4" />
                      View Event
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SidebarInset>

      <AddEventModal open={showAddModal} onOpenChange={setShowAddModal} onSubmit={handleAddEvent} />
    </SidebarProvider>
  )
}
