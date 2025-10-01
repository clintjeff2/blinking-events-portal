import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Trash2, Star, Calendar, Briefcase, Award, MessageSquare } from "lucide-react"

export default function StaffDetailPage({ params }: { params: { id: string } }) {
  const staff = {
    id: params.id,
    fullName: "Sarah Mitchell",
    photoUrl: "/placeholder.svg?height=200&width=200",
    bio: "Experienced event hostess and coordinator with over 5 years in the industry. Specializing in high-profile weddings and corporate events. Known for exceptional customer service and attention to detail.",
    categories: ["Hostess", "Event Coordinator", "Protocol Officer"],
    skills: ["Customer Service", "Event Planning", "Multilingual", "VIP Handling", "Crisis Management"],
    qualifications: ["Certified Event Planner", "Customer Service Excellence Certificate", "First Aid Certified"],
    languages: ["English", "French", "Spanish"],
    rating: 4.9,
    reviewCount: 45,
    eventsCompleted: 78,
    isActive: true,
    contact: {
      phone: "+237 6XX XXX XXX",
      email: "sarah.mitchell@blinking.com",
    },
    availability: [
      { from: "2025-01-15", to: "2025-01-20", status: "Booked" },
      { from: "2025-02-01", to: "2025-02-05", status: "Available" },
    ],
    portfolio: [
      {
        eventId: "1",
        description: "Grand Wedding Ceremony - Lead Hostess",
        media: ["/placeholder.svg?height=200&width=300"],
      },
      {
        eventId: "2",
        description: "Corporate Gala - Event Coordinator",
        media: ["/placeholder.svg?height=200&width=300"],
      },
    ],
    reviews: [
      {
        userId: "1",
        clientName: "John Doe",
        rating: 5,
        comment: "Sarah was absolutely amazing! Professional, friendly, and went above and beyond.",
        createdAt: "2025-01-10",
      },
      {
        userId: "2",
        clientName: "Jane Smith",
        rating: 5,
        comment: "Excellent service. Made our event run smoothly. Highly recommend!",
        createdAt: "2025-01-05",
      },
      {
        userId: "3",
        clientName: "Mike Johnson",
        rating: 4,
        comment: "Very professional and organized. Great communication throughout.",
        createdAt: "2024-12-28",
      },
    ],
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Staff Profile</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={staff.photoUrl || "/placeholder.svg"} alt={staff.fullName} />
                  <AvatarFallback className="text-2xl">
                    {staff.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold">{staff.fullName}</h1>
                      <Badge variant={staff.isActive ? "default" : "secondary"}>
                        {staff.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Star className="h-5 w-5 fill-accent text-accent" />
                      <span className="text-lg font-medium">{staff.rating}</span>
                      <span className="text-muted-foreground">({staff.reviewCount} reviews)</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {staff.categories.map((category) => (
                      <Badge key={category} variant="outline">
                        {category}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{staff.bio}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Events Completed</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staff.eventsCompleted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staff.rating}/5.0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staff.reviewCount}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills & Expertise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {staff.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Languages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {staff.languages.map((language) => (
                        <Badge key={language} variant="secondary">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Qualifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {staff.qualifications.map((qual, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Award className="mt-0.5 h-4 w-4 text-accent" />
                          <span className="text-sm">{qual}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{staff.contact.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{staff.contact.email}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {staff.portfolio.map((item, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{item.description}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {item.media.map((mediaUrl, mediaIndex) => (
                          <img
                            key={mediaIndex}
                            src={mediaUrl || "/placeholder.svg"}
                            alt={`Portfolio ${mediaIndex + 1}`}
                            className="h-48 w-full rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Reviews</CardTitle>
                  <CardDescription>Feedback from past clients</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {staff.reviews.map((review, index) => (
                      <div key={index} className="border-b border-border pb-6 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{review.clientName}</p>
                            <div className="mt-1 flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? "fill-accent text-accent" : "text-muted"}`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">{review.createdAt}</span>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="availability" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Availability Calendar</CardTitle>
                  <CardDescription>Upcoming bookings and available dates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {staff.availability.map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {slot.from} to {slot.to}
                            </p>
                            <p className="text-sm text-muted-foreground">5 days</p>
                          </div>
                        </div>
                        <Badge variant={slot.status === "Available" ? "default" : "secondary"}>{slot.status}</Badge>
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
