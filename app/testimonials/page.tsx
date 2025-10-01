"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Star, Eye, CheckCircle, XCircle } from "lucide-react"
import { Plus } from "lucide-react"
import { AddTestimonialModal } from "@/components/add-testimonial-modal"

export default function TestimonialsPage() {
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAddTestimonial = (data: any) => {
    console.log("[v0] New testimonial data:", data)
    // TODO: Integrate with Firebase
  }

  const testimonials = [
    {
      id: "1",
      clientName: "Sarah Johnson",
      eventName: "Johnson-Williams Wedding",
      rating: 5,
      text: "Absolutely phenomenal service! The team at Blinking Events made our wedding day perfect. Every detail was handled with care and professionalism. Highly recommend!",
      createdAt: "2024-12-22",
      isPublished: true,
      mediaCount: 3,
    },
    {
      id: "2",
      clientName: "Michael Chen",
      eventName: "TechCorp Annual Conference",
      rating: 5,
      text: "Professional, organized, and exceeded all expectations. Our corporate event ran smoothly thanks to their excellent coordination.",
      createdAt: "2024-12-17",
      isPublished: true,
      mediaCount: 0,
    },
    {
      id: "3",
      clientName: "Emma Williams",
      eventName: "Traditional Naming Ceremony",
      rating: 5,
      text: "They understood our cultural requirements perfectly and delivered an authentic, beautiful ceremony. Thank you!",
      createdAt: "2024-12-12",
      isPublished: true,
      mediaCount: 2,
    },
    {
      id: "4",
      clientName: "David Brown",
      eventName: "Brown Anniversary Celebration",
      rating: 4,
      text: "Great service overall. The team was responsive and accommodating. Would definitely use them again.",
      createdAt: "2024-12-08",
      isPublished: false,
      mediaCount: 1,
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
            <h2 className="text-lg font-semibold">Testimonials</h2>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Testimonial
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader title="Client Testimonials" description="Manage and showcase client feedback" />

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search testimonials..." className="pl-9" />
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Testimonials</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testimonials.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testimonials.filter((t) => t.isPublished).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1)}/5.0
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Testimonials List */}
          <div className="space-y-4">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {testimonial.clientName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{testimonial.clientName}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.eventName}</p>
                          <div className="mt-1 flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < testimonial.rating ? "fill-accent text-accent" : "text-muted"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={testimonial.isPublished ? "default" : "secondary"}>
                            {testimonial.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{testimonial.text}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{testimonial.createdAt}</p>
                        <div className="flex items-center gap-2">
                          {!testimonial.isPublished && (
                            <Button size="sm" variant="outline">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Publish
                            </Button>
                          )}
                          {testimonial.isPublished && (
                            <Button size="sm" variant="outline">
                              <XCircle className="mr-2 h-4 w-4" />
                              Unpublish
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SidebarInset>
      <AddTestimonialModal open={showAddModal} onOpenChange={setShowAddModal} onSubmit={handleAddTestimonial} />
    </SidebarProvider>
  )
}
